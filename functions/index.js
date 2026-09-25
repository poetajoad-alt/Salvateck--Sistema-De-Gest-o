/* eslint-disable max-len */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();

const authAdmin = getAuth();
const db = getFirestore();
const messagingAdmin = getMessaging();

const salvateckApiToken = defineSecret("SALVATECK_API_TOKEN");

const APPS_SCRIPT_URL = [
  "https://script.google.com/macros/s",
  "AKfycbwfV2TyiEDppeHdlJ3-fqJHJRS4PsqRah6UYO2hUrV3lVy5R2xFQ1mAm-axjulFoXb7",
  "exec",
].join("/");

const ACOES_PERMITIDAS = new Set(["criar", "atualizar", "excluir"]);

const AGENDA_INICIO_MINUTOS = 8 * 60;
const AGENDA_FIM_MINUTOS = 18 * 60;
const INTERVALO_AGENDA_MINUTOS = 30;
const LIMITE_VISTORIAS_DIA = 4;

const DURACOES_ATENDIMENTO = Object.freeze({
  manutencao: 120,
  vistoria: 60,
});

const STATUS_QUE_OCUPAM_AGENDA = new Set([
  "agendada",
  "em-deslocamento",
  "em-atendimento",
  "aguardando-validacao",
]);

function texto(valor) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim();
}

async function validarAdministrador(uid) {
  const usuarioSnapshot = await db.collection("usuarios").doc(uid).get();

  if (!usuarioSnapshot.exists) {
    throw new HttpsError("permission-denied", "Usuário não autorizado.");
  }

  const usuario = usuarioSnapshot.data();

  if (usuario.ativo !== true || usuario.role !== "admin") {
    throw new HttpsError(
        "permission-denied",
        "Apenas administradores podem realizar esta operação.",
    );
  }
}

function montarPayload(data, token) {
  return {
    acao: texto(data.acao).toLowerCase(),
    eventId: texto(data.eventId),
    codigo: texto(data.codigo),
    servico: texto(data.servico),
    condominio: texto(data.condominio),
    cliente: texto(data.cliente),
    telefone: texto(data.telefone),
    descricao: texto(data.descricao),
    endereco: texto(data.endereco),
    data: texto(data.data),
    horario: texto(data.horario),
    horarioFinal: texto(data.horarioFinal),
    duracaoMinutos: Number(data.duracaoMinutos || 0),
    token,
  };
}

function validarPayload(payload) {
  if (!ACOES_PERMITIDAS.has(payload.acao)) {
    throw new HttpsError("invalid-argument", "Ação de agenda inválida.");
  }

  if (payload.acao === "criar" || payload.acao === "atualizar") {
    if (!payload.codigo) {
      throw new HttpsError("invalid-argument", "O código da OS é obrigatório.");
    }

    if (!payload.data) {
      throw new HttpsError(
          "invalid-argument",
          "A data do agendamento é obrigatória.",
      );
    }

    if (!payload.horario) {
      throw new HttpsError(
          "invalid-argument",
          "O horário do agendamento é obrigatório.",
      );
    }
  }

  if (payload.acao === "atualizar" || payload.acao === "excluir") {
    if (!payload.eventId) {
      throw new HttpsError("invalid-argument", "O ID do evento é obrigatório.");
    }
  }
}

async function chamarAppsScript(payload) {
  let response;

  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "manual",
    });
  } catch (error) {
    logger.error("Falha de comunicação com o Apps Script.", {
      message: error.message,
    });

    throw new HttpsError(
        "unavailable",
        "Não foi possível acessar a Google Agenda.",
    );
  }

  if (response.status >= 300 && response.status < 400) {
    const redirectUrl = response.headers.get("location");

    if (!redirectUrl) {
      logger.error("Apps Script redirecionou sem informar a URL.");

      throw new HttpsError(
          "unavailable",
          "A integração com a Google Agenda não retornou uma URL válida.",
      );
    }

    response = await fetch(redirectUrl, {
      method: "GET",
      redirect: "follow",
    });
  }

  const respostaTexto = await response.text();

  if (!response.ok) {
    logger.error("Apps Script retornou erro HTTP.", {
      status: response.status,
      resposta: respostaTexto,
    });

    throw new HttpsError(
        "unavailable",
        "A integração com a Google Agenda falhou.",
    );
  }

  let resultado;

  try {
    resultado = JSON.parse(respostaTexto);
  } catch (error) {
    logger.error("Resposta inválida do Apps Script.", {
      resposta: respostaTexto,
    });

    throw new HttpsError(
        "internal",
        "A Google Agenda retornou uma resposta inválida.",
    );
  }

  if (!resultado || resultado.sucesso !== true) {
    const erroAgenda =
      resultado && resultado.erro ? resultado.erro : "ERRO_DESCONHECIDO";

    logger.error("Operação recusada pelo Apps Script.", {
      erro: erroAgenda,
    });

    throw new HttpsError(
        "internal",
        "Não foi possível concluir a operação na Google Agenda.",
        {
          erro: erroAgenda,
        },
    );
  }

  return resultado;
}

/* =========================================
   BLINDAGEM DA AGENDA OPERACIONAL
========================================= */

function validarDataAgenda(valor) {
  const data = texto(valor);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new HttpsError("invalid-argument", "A data informada é inválida.");
  }

  const [ano, mes, dia] = data.split("-").map(Number);

  const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataValidada.getUTCFullYear() !== ano ||
    dataValidada.getUTCMonth() !== mes - 1 ||
    dataValidada.getUTCDate() !== dia
  ) {
    throw new HttpsError("invalid-argument", "A data informada é inválida.");
  }

  return data;
}

function validarMesAgenda(anoValor, mesValor) {
  const ano = Number(anoValor);
  const mes = Number(mesValor);

  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) {
    throw new HttpsError("invalid-argument", "O ano informado é inválido.");
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new HttpsError("invalid-argument", "O mês informado é inválido.");
  }

  return {ano, mes};
}

function normalizarTipoAtendimento(valor) {
  const tipo = texto(valor).toLowerCase();

  if (tipo === "vistoria") {
    return "vistoria";
  }

  if (tipo === "manutencao" || tipo === "manutenção" || tipo === "servico") {
    return "manutencao";
  }

  throw new HttpsError(
      "invalid-argument",
      "O tipo de atendimento informado é inválido.",
  );
}

function obterDuracaoAtendimento(tipoAtendimento) {
  return DURACOES_ATENDIMENTO[normalizarTipoAtendimento(tipoAtendimento)];
}

function obterIntervaloAgenda(valor, duracaoMinutos) {
  const horario = texto(valor);

  const correspondencia = horario.match(/^(\d{1,2}):(\d{2})$/);

  if (!correspondencia) {
    throw new HttpsError("invalid-argument", "O horário informado é inválido.");
  }

  const horas = Number(correspondencia[1]);
  const minutos = Number(correspondencia[2]);

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    throw new HttpsError("invalid-argument", "O horário informado é inválido.");
  }

  const inicioMinutos = horas * 60 + minutos;

  if (inicioMinutos % INTERVALO_AGENDA_MINUTOS !== 0) {
    throw new HttpsError(
        "invalid-argument",
        "O horário deve respeitar intervalos de 30 minutos.",
    );
  }

  const duracao = Number(duracaoMinutos);

  if (!Object.values(DURACOES_ATENDIMENTO).includes(duracao)) {
    throw new HttpsError(
        "invalid-argument",
        "A duração do atendimento é inválida.",
    );
  }

  const fimMinutos = inicioMinutos + duracao;

  if (
    inicioMinutos < AGENDA_INICIO_MINUTOS ||
    fimMinutos > AGENDA_FIM_MINUTOS
  ) {
    throw new HttpsError(
        "invalid-argument",
        "O atendimento deve ocorrer entre 08h e 18h.",
    );
  }

  return {
    inicioMinutos,
    fimMinutos,
  };
}

function minutosParaHorario(valor) {
  const horas = Math.floor(valor / 60);

  const minutos = valor % 60;

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
  ].join(":");
}

function obterDataHoraSaoPaulo() {
  const agora = new Date();

  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
      .formatToParts(agora)
      .reduce((resultado, parte) => {
        if (parte.type !== "literal") {
          resultado[parte.type] = parte.value;
        }

        return resultado;
      }, {});

  const horaNumero = Number(partes.hour);

  const periodo =
    horaNumero < 12 ? "manha" : horaNumero < 18 ? "tarde" : "noite";

  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    horario: `${partes.hour}:${partes.minute}`,
    minutos: horaNumero * 60 + Number(partes.minute),
    periodo,
  };
}

function validarDiaUtil(data) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();

  if (diaSemana === 0 || diaSemana === 6) {
    throw new HttpsError(
        "failed-precondition",
        "Os atendimentos ocorrem somente de segunda a sexta-feira.",
    );
  }
}

function validarAgendamentoFuturo(data, inicioMinutos) {
  const agora = obterDataHoraSaoPaulo();

  if (data < agora.data) {
    throw new HttpsError(
        "failed-precondition",
        "Não é possível agendar em uma data anterior à atual.",
    );
  }

  if (data === agora.data && inicioMinutos <= agora.minutos) {
    throw new HttpsError(
        "failed-precondition",
        "Escolha um horário posterior ao horário atual.",
    );
  }
}

function validarAgendamento({data, horario, tipoAtendimento}) {
  const dataValidada = validarDataAgenda(data);
  const tipo = normalizarTipoAtendimento(tipoAtendimento);
  const duracaoMinutos = obterDuracaoAtendimento(tipo);
  const intervalo = obterIntervaloAgenda(horario, duracaoMinutos);

  validarDiaUtil(dataValidada);
  validarAgendamentoFuturo(dataValidada, intervalo.inicioMinutos);

  return {
    data: dataValidada,
    horario: minutosParaHorario(intervalo.inicioMinutos),
    horarioFinal: minutosParaHorario(intervalo.fimMinutos),
    tipoAtendimento: tipo,
    duracaoMinutos,
    ...intervalo,
  };
}

function intervalosConflitam(
    inicioNovo,
    fimNovo,
    inicioExistente,
    fimExistente,
) {
  return inicioNovo < fimExistente && fimNovo > inicioExistente;
}

function obterTipoDaOrdem(ordem = {}) {
  return texto(ordem.tipoAtendimento).toLowerCase() === "vistoria" ?
    "vistoria" :
    "manutencao";
}

function obterDuracaoDaOrdem(ordem = {}) {
  const duracaoRegistrada = Number(ordem.atendimento?.duracaoMinutos || 0);

  if (Object.values(DURACOES_ATENDIMENTO).includes(duracaoRegistrada)) {
    return duracaoRegistrada;
  }

  return obterDuracaoAtendimento(obterTipoDaOrdem(ordem));
}

function montarDadosDoConflito(ordemId, ordem, intervaloExistente) {
  return {
    ordemId,
    codigo: texto(ordem.codigo) || ordemId,
    tipoAtendimento: texto(ordem.tipoAtendimento) || "servico",
    servico:
      texto(ordem.titulo) || texto(ordem.servicoPrincipal) || "Atendimento",
    condominio: texto(ordem.condominio?.nome),
    horarioInicio: minutosParaHorario(intervaloExistente.inicioMinutos),
    horarioFim: minutosParaHorario(intervaloExistente.fimMinutos),
  };
}

async function buscarOrdensDaData(data, transaction = null) {
  const consulta = db
      .collection("ordens")
      .where("atendimento.dataConfirmada", "==", data);

  return transaction ? transaction.get(consulta) : consulta.get();
}

function mapearOcupacaoDaAgenda(snapshot, ordemIgnoradaId = "") {
  const ocupacoes = [];

  let totalVistorias = 0;

  for (const ordemSnapshot of snapshot.docs) {
    if (ordemSnapshot.id === ordemIgnoradaId) {
      continue;
    }

    const ordem = ordemSnapshot.data() || {};

    const modoAtendimento = texto(ordem.atendimento?.modo).toLowerCase();

    if (modoAtendimento === "imediato") {
      continue;
    }

    const status = texto(ordem.status).toLowerCase();

    if (!STATUS_QUE_OCUPAM_AGENDA.has(status)) {
      continue;
    }

    const horarioExistente = texto(ordem.atendimento?.horarioConfirmado);

    if (!horarioExistente) {
      continue;
    }

    const tipoAtendimento = obterTipoDaOrdem(ordem);

    const duracaoMinutos = obterDuracaoDaOrdem(ordem);

    let intervalo;

    try {
      intervalo = obterIntervaloAgenda(horarioExistente, duracaoMinutos);
    } catch (error) {
      logger.warn("OS com horário confirmado inválido ignorada na checagem.", {
        ordemId: ordemSnapshot.id,
        horario: horarioExistente,
      });

      continue;
    }

    if (tipoAtendimento === "vistoria") {
      totalVistorias += 1;
    }

    ocupacoes.push({
      ordemId: ordemSnapshot.id,
      ordem,
      tipoAtendimento,
      duracaoMinutos,
      ...intervalo,
    });
  }

  return {
    ocupacoes,
    totalVistorias,
  };
}

function encontrarConflito(intervaloNovo, ocupacoes) {
  for (const ocupacao of ocupacoes) {
    if (
      intervalosConflitam(
          intervaloNovo.inicioMinutos,
          intervaloNovo.fimMinutos,
          ocupacao.inicioMinutos,
          ocupacao.fimMinutos,
      )
    ) {
      return montarDadosDoConflito(ocupacao.ordemId, ocupacao.ordem, ocupacao);
    }
  }

  return null;
}

async function consultarOcupacaoAgenda({
  data,
  ordemId = "",
  transaction = null,
}) {
  const snapshot = await buscarOrdensDaData(data, transaction);

  return mapearOcupacaoDaAgenda(snapshot, ordemId);
}

async function obterUsuarioAtivo(uid, rolesPermitidas = []) {
  const snapshot = await db.collection("usuarios").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "Usuário não autorizado.");
  }

  const usuario = snapshot.data() || {};

  if (usuario.ativo !== true) {
    throw new HttpsError("permission-denied", "Usuário inativo.");
  }

  if (
    rolesPermitidas.length > 0 &&
    !rolesPermitidas.includes(texto(usuario.role).toLowerCase())
  ) {
    throw new HttpsError(
        "permission-denied",
        "O usuário não possui permissão para esta operação.",
    );
  }

  return {
    ...usuario,
    uid,
  };
}

function criarListaDeHorarios({data, tipoAtendimento, ocupacoes}) {
  const duracaoMinutos = obterDuracaoAtendimento(tipoAtendimento);
  const agora = obterDataHoraSaoPaulo();
  const horarios = [];

  for (
    let inicioMinutos = AGENDA_INICIO_MINUTOS;
    inicioMinutos + duracaoMinutos <= AGENDA_FIM_MINUTOS;
    inicioMinutos += INTERVALO_AGENDA_MINUTOS
  ) {
    if (data === agora.data && inicioMinutos <= agora.minutos) {
      continue;
    }

    const intervalo = {
      inicioMinutos,
      fimMinutos: inicioMinutos + duracaoMinutos,
    };

    if (encontrarConflito(intervalo, ocupacoes)) {
      continue;
    }

    horarios.push({
      inicio: minutosParaHorario(intervalo.inicioMinutos),
      fim: minutosParaHorario(intervalo.fimMinutos),
    });
  }

  return horarios;
}

exports.listarDisponibilidadeAgenda = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 20,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      await obterUsuarioAtivo(request.auth.uid, [
        "admin",
        "cliente",
        "funcionario",
      ]);

      const {ano, mes} = validarMesAgenda(request.data?.ano, request.data?.mes);

      const tipoAtendimento = normalizarTipoAtendimento(
          request.data?.tipoAtendimento,
      );

      const primeiroDia = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      const ultimoDia = `${ano}-${String(mes).padStart(2, "0")}-${String(
          totalDias,
      ).padStart(2, "0")}`;

      const snapshot = await db
          .collection("ordens")
          .where("atendimento.dataConfirmada", ">=", primeiroDia)
          .where("atendimento.dataConfirmada", "<=", ultimoDia)
          .get();

      const documentosPorData = new Map();

      snapshot.docs.forEach((ordemSnapshot) => {
        const data = texto(ordemSnapshot.data()?.atendimento?.dataConfirmada);

        if (!documentosPorData.has(data)) {
          documentosPorData.set(data, []);
        }

        documentosPorData.get(data).push(ordemSnapshot);
      });

      const agora = obterDataHoraSaoPaulo();
      const dias = [];

      for (let dia = 1; dia <= totalDias; dia += 1) {
        const data = `${ano}-${String(mes).padStart(2, "0")}-${String(
            dia,
        ).padStart(2, "0")}`;

        const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
        const diaUtil = diaSemana !== 0 && diaSemana !== 6;
        const dataFutura = data >= agora.data;
        const documentos = documentosPorData.get(data) || [];
        const snapshotDaData = {
          docs: documentos,
        };
        const ocupacao = mapearOcupacaoDaAgenda(snapshotDaData);
        const limiteVistoriasAtingido =
        tipoAtendimento === "vistoria" &&
        ocupacao.totalVistorias >= LIMITE_VISTORIAS_DIA;

        const horarios =
        diaUtil && dataFutura && !limiteVistoriasAtingido ?
          criarListaDeHorarios({
            data,
            tipoAtendimento,
            ocupacoes: ocupacao.ocupacoes,
          }) :
          [];

        dias.push({
          data,
          disponivel: horarios.length > 0,
          horarios,
          totalVistorias: ocupacao.totalVistorias,
          limiteVistoriasAtingido,
        });
      }

      return {
        sucesso: true,
        ano,
        mes,
        tipoAtendimento,
        duracaoMinutos: obterDuracaoAtendimento(tipoAtendimento),
        intervaloMinutos: INTERVALO_AGENDA_MINUTOS,
        limiteVistoriasDia: LIMITE_VISTORIAS_DIA,
        dias,
      };
    },
);

exports.verificarDisponibilidadeAgenda = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 20,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      await obterUsuarioAtivo(request.auth.uid, [
        "admin",
        "cliente",
        "funcionario",
      ]);

      const ordemId = texto(request.data?.ordemId);
      let tipoAtendimento = texto(request.data?.tipoAtendimento);

      if (!tipoAtendimento && ordemId) {
        const ordemSnapshot = await db.collection("ordens").doc(ordemId).get();

        if (ordemSnapshot.exists) {
          tipoAtendimento = obterTipoDaOrdem(ordemSnapshot.data() || {});
        }
      }

      const agendamento = validarAgendamento({
        data: request.data?.data,
        horario: request.data?.horario,
        tipoAtendimento: tipoAtendimento || "manutencao",
      });

      const ocupacao = await consultarOcupacaoAgenda({
        data: agendamento.data,
        ordemId,
      });

      const conflito = encontrarConflito(agendamento, ocupacao.ocupacoes);
      const limiteVistoriasAtingido =
      agendamento.tipoAtendimento === "vistoria" &&
      ocupacao.totalVistorias >= LIMITE_VISTORIAS_DIA;

      return {
        sucesso: true,
        disponivel: !conflito && !limiteVistoriasAtingido,
        conflito,
        limiteVistoriasAtingido,
        totalVistorias: ocupacao.totalVistorias,
        duracaoMinutos: agendamento.duracaoMinutos,
        horarioFinal: agendamento.horarioFinal,
      };
    },
);

function mapa(valor) {
  return valor && typeof valor === "object" && !Array.isArray(valor) ?
    valor :
    {};
}

function limitarTexto(valor, limite = 1200) {
  return texto(valor).slice(0, limite);
}

function numeroSeguro(valor, padrao = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : padrao;
}

function sanitizarValor(valor, profundidade = 0) {
  if (profundidade > 8 || valor === undefined) {
    return null;
  }

  if (valor === null || typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "string") {
    return valor.slice(0, 5000);
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (Array.isArray(valor)) {
    return valor
        .slice(0, 500)
        .map((item) => sanitizarValor(item, profundidade + 1));
  }

  if (typeof valor === "object") {
    return Object.entries(valor).reduce((resultado, [chave, item]) => {
      if (item !== undefined) {
        resultado[chave.slice(0, 120)] = sanitizarValor(item, profundidade + 1);
      }

      return resultado;
    }, {});
  }

  return null;
}

function formatarEnderecoAgenda(endereco = {}) {
  if (texto(endereco.resumo)) {
    return texto(endereco.resumo);
  }

  return [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.uf,
  ]
      .map(texto)
      .filter(Boolean)
      .join(", ");
}

function construirDadosOrdemAgendada({
  payload,
  agendamento,
  usuario,
  clienteUid,
  cliente,
  condominioId,
  condominio,
  ordemId,
  numero,
  codigo,
}) {
  const atendimentoPayload = mapa(payload.atendimento);
  const observacoesPayload = mapa(payload.observacoes);
  const funcionarioPayload = mapa(payload.funcionarioResponsavel);
  const vistoriaPayload = mapa(payload.vistoria);
  const origemPayload = mapa(payload.origem);
  const enderecoPayload = mapa(payload.endereco);
  const tipoFirestore =
    agendamento.tipoAtendimento === "vistoria" ? "vistoria" : "servico";
  const categoriaPadrao =
    agendamento.tipoAtendimento === "vistoria" ?
      "vistoria" :
      "manutencao-geral";
  const tituloPadrao =
    agendamento.tipoAtendimento === "vistoria" ?
      "Vistoria técnica" :
      "Manutenção geral";
  const funcionarioUid = limitarTexto(payload.funcionarioResponsavelUid, 160);
  const possuiFuncionario =
    texto(usuario.role) === "admin" && Boolean(funcionarioUid);
  const clientesIds = Array.isArray(condominio.clientesIds) ?
    condominio.clientesIds.filter((uid) => typeof uid === "string") :
    [];

  return {
    id: ordemId,
    numero,
    codigo,
    criadoEm: FieldValue.serverTimestamp(),
    atualizadoEm: FieldValue.serverTimestamp(),
    statusAtualizadoEm: FieldValue.serverTimestamp(),
    perfilCriador: texto(usuario.role),
    criadoPorUid: usuario.uid,
    criadoPorNome:
      limitarTexto(usuario.nome, 180) || limitarTexto(usuario.email, 180),
    ...(possuiFuncionario ?
      {
        funcionarioResponsavelUid: funcionarioUid,
        funcionarioResponsavel: {
          funcionarioId: limitarTexto(funcionarioPayload.funcionarioId, 160),
          usuarioUid: funcionarioUid,
          codigo: limitarTexto(funcionarioPayload.codigo, 80),
          nome: limitarTexto(funcionarioPayload.nome, 180),
          cargo: limitarTexto(funcionarioPayload.cargo, 120),
          designadoEm: FieldValue.serverTimestamp(),
          designadoPorUid: usuario.uid,
          designadoPorNome:
              limitarTexto(usuario.nome, 180) ||
              limitarTexto(usuario.email, 180),
        },
      } :
      {}),
    clienteUid,
    condominioId,
    clientesAutorizadosIds: clientesIds,
    tipoAtendimento: tipoFirestore,
    categoriaPrincipal:
      limitarTexto(payload.categoriaPrincipal, 120) || categoriaPadrao,
    servicoPrincipal:
      limitarTexto(payload.servicoPrincipal, 240) || tituloPadrao,
    titulo: limitarTexto(payload.titulo, 240) || tituloPadrao,
    cliente: {
      id: clienteUid,
      nome:
        limitarTexto(mapa(payload.cliente).nome, 180) ||
        limitarTexto(cliente.nome, 180),
      telefone:
        limitarTexto(mapa(payload.cliente).telefone, 40) ||
        limitarTexto(cliente.telefone, 40),
      email:
        limitarTexto(mapa(payload.cliente).email, 240) ||
        limitarTexto(cliente.email, 240),
    },
    condominio: {
      id: condominioId,
      codigo: limitarTexto(condominio.codigo, 80),
      nome: limitarTexto(condominio.nome, 240),
      cnpj: limitarTexto(condominio.cnpj, 40),
      endereco: sanitizarValor(mapa(condominio.endereco)),
      estruturaAmbientes: sanitizarValor(
        Array.isArray(condominio.estruturaAmbientes) ?
          condominio.estruturaAmbientes :
          [],
      ),
      equipamentos: sanitizarValor(
        Array.isArray(condominio.equipamentos) ? condominio.equipamentos : [],
      ),
    },
    endereco: sanitizarValor(enderecoPayload),
    categorias: [categoriaPadrao],
    servicos: [
      {
        categoria: categoriaPadrao,
        servico: limitarTexto(payload.servicoPrincipal, 240) || tituloPadrao,
      },
    ],
    atendimento: {
      modo: "agendado",
      dataPreferida: agendamento.data,
      periodo:
        limitarTexto(atendimentoPayload.periodo, 20) ||
        (agendamento.inicioMinutos < 12 * 60 ? "manha" : "tarde"),
      horarioPreferido: agendamento.horario,
      dataConfirmada: agendamento.data,
      periodoConfirmado:
        agendamento.inicioMinutos < 12 * 60 ? "manha" : "tarde",
      horarioConfirmado: agendamento.horario,
      horarioFinal: agendamento.horarioFinal,
      duracaoMinutos: agendamento.duracaoMinutos,
      intervaloMinutos: INTERVALO_AGENDA_MINUTOS,
      fusoHorario: "America/Sao_Paulo",
      agendadoEm: FieldValue.serverTimestamp(),
      lembretesEnviados: {},
    },
    observacoes: {
      cliente: limitarTexto(observacoesPayload.cliente, 5000),
      resposta:
        texto(usuario.role) === "admin" ?
          limitarTexto(observacoesPayload.resposta, 2000) :
          "",
      interna: "",
    },
    prioridade: "normal",
    status: "agendada",
    ativo: true,
    arquivado: false,
    quantidadeFotos: 0,
    vistoria:
      agendamento.tipoAtendimento === "vistoria" ?
        {
          id: limitarTexto(vistoriaPayload.id, 160),
          codigo: limitarTexto(vistoriaPayload.codigo, 80),
          tipo: limitarTexto(vistoriaPayload.tipo, 240) || "Vistoria técnica",
          status: limitarTexto(vistoriaPayload.status, 80) || "agendada",
          validada: vistoriaPayload.validada === true,
          progresso: numeroSeguro(vistoriaPayload.progresso),
          checklist: sanitizarValor(
              Array.isArray(vistoriaPayload.checklist) ?
                vistoriaPayload.checklist :
                [],
          ),
          totalItens: numeroSeguro(vistoriaPayload.totalItens),
          itensConcluidos: numeroSeguro(vistoriaPayload.itensConcluidos),
          equipamentosAvaliados: numeroSeguro(
              vistoriaPayload.equipamentosAvaliados,
          ),
          naoConformidades: numeroSeguro(vistoriaPayload.naoConformidades),
          pendenciasCriticas: numeroSeguro(
              vistoriaPayload.pendenciasCriticas,
          ),
          quantidadeFotos: numeroSeguro(vistoriaPayload.quantidadeFotos),
          concluidaEm: sanitizarValor(vistoriaPayload.concluidaEm),
        } :
        null,
    origem: {
      tipo:
        limitarTexto(origemPayload.tipo, 80) ||
        (texto(usuario.role) === "admin" ?
          "cadastro-admin" :
          "solicitacao-cliente"),
      vistoriaId: limitarTexto(origemPayload.vistoriaId, 160),
      codigoVistoria: limitarTexto(origemPayload.codigoVistoria, 80),
      ordemOrigemId: "",
    },
  };
}

async function sincronizarNovaOrdemNaAgenda(ordem, token) {
  let eventId = "";

  try {
    const payload = montarPayload(
        {
          acao: "criar",
          codigo: ordem.codigo,
          servico: ordem.titulo,
          condominio: ordem.condominio?.nome,
          cliente: ordem.cliente?.nome,
          telefone: ordem.cliente?.telefone,
          descricao: ordem.observacoes?.cliente,
          endereco: formatarEnderecoAgenda(ordem.endereco),
          data: ordem.atendimento?.dataConfirmada,
          horario: ordem.atendimento?.horarioConfirmado,
          horarioFinal: ordem.atendimento?.horarioFinal,
          duracaoMinutos: ordem.atendimento?.duracaoMinutos,
        },
        token,
    );

    validarPayload(payload);

    const resultado = await chamarAppsScript(payload);
    eventId = texto(resultado.eventId);

    await db
        .collection("ordens")
        .doc(ordem.id)
        .update({
          agendaGoogle: {
            eventId,
            status: "sincronizado",
            ultimaAcao: "criar",
            sincronizadoEm: FieldValue.serverTimestamp(),
            erro: "",
          },
          atualizadoEm: FieldValue.serverTimestamp(),
        });
  } catch (error) {
    logger.error("Agendamento criado, mas a Google Agenda falhou.", {
      ordemId: ordem.id,
      codigo: ordem.codigo,
      message: error.message,
    });

    await db
        .collection("ordens")
        .doc(ordem.id)
        .update({
          agendaGoogle: {
            eventId,
            status: "erro",
            ultimaAcao: "criar",
            sincronizadoEm: null,
            erro: texto(error.message) || "ERRO_DESCONHECIDO",
          },
          atualizadoEm: FieldValue.serverTimestamp(),
        });
  }
}

exports.criarAgendamentoSeguro = onCall(
    {
      region: "southamerica-east1",
      secrets: [salvateckApiToken],
      maxInstances: 20,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      const usuario = await obterUsuarioAtivo(request.auth.uid, [
        "admin",
        "cliente",
      ]);

      const payload = mapa(request.data?.ordem);
      const agendamentoRecebido = mapa(request.data?.agendamento);
      const agendamento = validarAgendamento({
        data: agendamentoRecebido.data,
        horario: agendamentoRecebido.horario,
        tipoAtendimento: agendamentoRecebido.tipoAtendimento,
      });

      if (
        texto(agendamentoRecebido.horarioFinal) !== agendamento.horarioFinal ||
      Number(agendamentoRecebido.duracaoMinutos) !== agendamento.duracaoMinutos
      ) {
        throw new HttpsError(
            "invalid-argument",
            "A duração ou o horário final do atendimento é inválido.",
        );
      }

      const clienteUid =
      texto(usuario.role) === "cliente" ?
        usuario.uid :
        texto(payload.clienteUid);

      if (!clienteUid) {
        throw new HttpsError(
            "invalid-argument",
            "O cliente do agendamento é obrigatório.",
        );
      }

      const clienteSnapshot = await db
          .collection("usuarios")
          .doc(clienteUid)
          .get();

      if (!clienteSnapshot.exists) {
        throw new HttpsError("not-found", "O cliente não foi encontrado.");
      }

      const cliente = clienteSnapshot.data() || {};

      if (texto(cliente.role) !== "cliente" || cliente.ativo !== true) {
        throw new HttpsError(
            "failed-precondition",
            "O cliente informado não está ativo.",
        );
      }

      const condominioId = texto(payload.condominioId);

      if (!condominioId) {
        throw new HttpsError(
            "invalid-argument",
            "O condomínio do atendimento é obrigatório.",
        );
      }

      const condominioReference = db.collection("condominios").doc(condominioId);
      const condominioSnapshot = await condominioReference.get();

      if (!condominioSnapshot.exists) {
        throw new HttpsError(
            "not-found",
            "O condomínio informado não foi encontrado.",
        );
      }

      const condominio = condominioSnapshot.data() || {};
      const clientesIds = Array.isArray(condominio.clientesIds) ?
      condominio.clientesIds :
      [];

      if (
        texto(usuario.role) === "cliente" &&
      !clientesIds.includes(usuario.uid)
      ) {
        throw new HttpsError(
            "permission-denied",
            "O cliente não está vinculado a este condomínio.",
        );
      }

      const ordemReference = db.collection("ordens").doc();
      const contadorReference = db.collection("contadores").doc("ordens");
      const bloqueioReference = db
          .collection("agendaBloqueios")
          .doc(agendamento.data);
      const vistoriaId = texto(payload.vistoria?.id);
      const vistoriaReference = vistoriaId ?
      db.collection("vistorias").doc(vistoriaId) :
      null;
      const observacaoInterna =
      texto(usuario.role) === "admin" ?
        limitarTexto(request.data?.observacaoInterna, 5000) :
        "";
      const ordemPrivadaReference = observacaoInterna ?
      db.collection("ordensPrivadas").doc(ordemReference.id) :
      null;

      const resultado = await db.runTransaction(async (transaction) => {
        await transaction.get(bloqueioReference);

        const contadorSnapshot = await transaction.get(contadorReference);

        let vistoriaSnapshot = null;

        if (vistoriaReference) {
          vistoriaSnapshot = await transaction.get(vistoriaReference);

          if (!vistoriaSnapshot.exists) {
            throw new HttpsError(
                "not-found",
                "A vistoria selecionada não foi encontrada.",
            );
          }

          if (vistoriaSnapshot.data()?.ordemVinculada === true) {
            throw new HttpsError(
                "already-exists",
                "A vistoria já possui uma OS vinculada.",
            );
          }
        }

        if (!contadorSnapshot.exists) {
          throw new HttpsError(
              "failed-precondition",
              "O contador das ordens não foi encontrado.",
          );
        }

        const ocupacao = await consultarOcupacaoAgenda({
          data: agendamento.data,
          transaction,
        });

        const conflito = encontrarConflito(agendamento, ocupacao.ocupacoes);

        if (conflito) {
          throw new HttpsError(
              "already-exists",
              "Este horário acabou de ser ocupado.",
              {conflito},
          );
        }

        if (
          agendamento.tipoAtendimento === "vistoria" &&
        ocupacao.totalVistorias >= LIMITE_VISTORIAS_DIA
        ) {
          throw new HttpsError(
              "resource-exhausted",
              "O limite de quatro vistorias nesta data foi atingido.",
          );
        }

        const numeroAtual = Number(contadorSnapshot.data()?.ultimoNumero || 0);

        if (!Number.isInteger(numeroAtual) || numeroAtual < 0) {
          throw new HttpsError(
              "failed-precondition",
              "O contador das ordens possui um valor inválido.",
          );
        }

        const numero = numeroAtual + 1;
        const codigo = `OS-${String(numero).padStart(4, "0")}`;
        const ordem = construirDadosOrdemAgendada({
          payload,
          agendamento,
          usuario,
          clienteUid,
          cliente,
          condominioId,
          condominio,
          ordemId: ordemReference.id,
          numero,
          codigo,
        });

        transaction.update(contadorReference, {
          ultimoNumero: numero,
          ultimoDocumentoId: ordemReference.id,
          atualizadoEm: FieldValue.serverTimestamp(),
        });

        transaction.set(
            bloqueioReference,
            {
              data: agendamento.data,
              versao: FieldValue.increment(1),
              atualizadoEm: FieldValue.serverTimestamp(),
            },
            {merge: true},
        );

        transaction.set(ordemReference, ordem);

        if (vistoriaReference) {
          transaction.update(vistoriaReference, {
            ordemVinculada: true,
            ordemId: ordemReference.id,
            codigoOS: codigo,
            atualizadoEm: FieldValue.serverTimestamp(),
            conversaoOS: {
              convertida: true,
              ordemId: ordemReference.id,
              codigoOS: codigo,
              convertidaEm: FieldValue.serverTimestamp(),
              convertidaPorUid: usuario.uid,
            },
          });
        }

        if (ordemPrivadaReference) {
          transaction.set(ordemPrivadaReference, {
            ordemId: ordemReference.id,
            codigo,
            observacaoInterna,
            atualizadoEm: FieldValue.serverTimestamp(),
          });
        }

        return {
          ordem,
          numero,
          codigo,
        };
      });

      const ordemCriada = {
        ...resultado.ordem,
        id: ordemReference.id,
        numero: resultado.numero,
        codigo: resultado.codigo,
      };

      await sincronizarNovaOrdemNaAgenda(ordemCriada, salvateckApiToken.value());

      logger.info("Agendamento criado com segurança.", {
        uid: request.auth.uid,
        ordemId: ordemReference.id,
        codigo: resultado.codigo,
        data: agendamento.data,
        horario: agendamento.horario,
        tipoAtendimento: agendamento.tipoAtendimento,
      });

      return {
        sucesso: true,
        ordem: {
          id: ordemReference.id,
          numero: resultado.numero,
          codigo: resultado.codigo,
          tipoAtendimento: ordemCriada.tipoAtendimento,
          titulo: ordemCriada.titulo,
          status: "agendada",
          prioridade: "normal",
          descricao: ordemCriada.observacoes?.cliente || "",
          cliente: ordemCriada.cliente,
          condominio: ordemCriada.condominio,
          endereco: formatarEnderecoAgenda(ordemCriada.endereco),
          data: agendamento.data,
          horario: agendamento.horario,
          horarioFinal: agendamento.horarioFinal,
          duracaoMinutos: agendamento.duracaoMinutos,
        },
      };
    },
);

/* =========================================
   NOTIFICAÇÕES
========================================= */

async function listarAdministradoresAtivos() {
  const snapshot = await db
      .collection("usuarios")
      .where("role", "==", "admin")
      .get();

  return snapshot.docs
      .filter((documento) => documento.data()?.ativo === true)
      .map((documento) => documento.id);
}

async function registrarNotificacoes({
  destinatarios,
  tipo,
  titulo,
  mensagem,
  ordemId,
  codigo,
  url,
}) {
  const uids = [...new Set(destinatarios.filter(Boolean))];

  if (uids.length === 0) {
    return [];
  }

  const batch = db.batch();

  uids.forEach((uid) => {
    const reference = db.collection("notificacoes").doc();

    batch.set(reference, {
      destinatarioUid: uid,
      tipo,
      titulo,
      mensagem,
      ordemId: ordemId || "",
      codigo: codigo || "",
      url: url || "principal.html",
      lida: false,
      criadaEm: FieldValue.serverTimestamp(),
      lidaEm: null,
    });
  });

  await batch.commit();

  return uids;
}

async function buscarTokensDoUsuario(uid) {
  const [porUsuarioUid, porUid] = await Promise.all([
    db.collection("fcmTokens").where("usuarioUid", "==", uid).get(),
    db.collection("fcmTokens").where("uid", "==", uid).get(),
  ]);

  const documentos = new Map();

  [...porUsuarioUid.docs, ...porUid.docs].forEach((documento) => {
    const dados = documento.data() || {};

    if (dados.ativo !== false && texto(dados.token)) {
      documentos.set(documento.id, {
        reference: documento.ref,
        token: texto(dados.token),
      });
    }
  });

  return [...documentos.values()];
}

async function enviarPushParaUsuarios({
  destinatarios,
  titulo,
  mensagem,
  url,
  ordemId,
}) {
  const uids = [...new Set(destinatarios.filter(Boolean))];
  const registros = (
    await Promise.all(uids.map((uid) => buscarTokensDoUsuario(uid)))
  ).flat();

  if (registros.length === 0) {
    return;
  }

  for (let inicio = 0; inicio < registros.length; inicio += 500) {
    const lote = registros.slice(inicio, inicio + 500);
    const resposta = await messagingAdmin.sendEachForMulticast({
      tokens: lote.map((registro) => registro.token),
      notification: {
        title: titulo,
        body: mensagem,
      },
      webpush: {
        notification: {
          icon: "/assets/icons/icon-192-v2.png",
          badge: "/assets/icons/favicon-32-v2.png",
          tag: ordemId ? `ordem-${ordemId}` : "salvateck",
          data: {
            url: url || "principal.html",
            ordemId: ordemId || "",
          },
        },
      },
      data: {
        url: url || "principal.html",
        ordemId: ordemId || "",
      },
    });

    const invalidos = [];

    resposta.responses.forEach((item, index) => {
      const codigoErro = item.error?.code || "";

      if (
        codigoErro === "messaging/registration-token-not-registered" ||
        codigoErro === "messaging/invalid-registration-token"
      ) {
        invalidos.push(lote[index].reference);
      }
    });

    if (invalidos.length > 0) {
      const batch = db.batch();

      invalidos.forEach((reference) => {
        batch.set(
            reference,
            {
              ativo: false,
              invalidadoEm: FieldValue.serverTimestamp(),
            },
            {merge: true},
        );
      });

      await batch.commit();
    }
  }
}

async function publicarNotificacao(dados) {
  const destinatarios = await registrarNotificacoes(dados);

  try {
    await enviarPushParaUsuarios({
      destinatarios,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      url: dados.url,
      ordemId: dados.ordemId,
    });
  } catch (error) {
    logger.error("Notificação registrada, mas o push falhou.", {
      ordemId: dados.ordemId || null,
      message: error.message,
    });
  }
}

function montarUrlDetalhes(ordemId) {
  return `detalhes-solicitacao.html?id=${encodeURIComponent(ordemId)}`;
}

function deveIgnorarNotificacoes(ordem = {}) {
  return (
    ordem.notificacoes?.habilitadas === false ||
    texto(ordem.origem?.tipo) === "os-rapida"
  );
}

exports.notificarNovaOrdem = onDocumentCreated(
    {
      document: "ordens/{ordemId}",
      region: "southamerica-east1",
      maxInstances: 20,
    },
    async (event) => {
      const ordem = event.data?.data() || {};

      if (deveIgnorarNotificacoes(ordem)) {
        logger.info("Notificações ignoradas para OS interna.", {
          ordemId: event.params.ordemId,
          origem: texto(ordem.origem?.tipo),
        });

        return;
      }

      const ordemId = event.params.ordemId;
      const codigo = texto(ordem.codigo) || ordemId;
      const clienteUid = texto(ordem.clienteUid);
      const administradores = await listarAdministradoresAtivos();
      const url = montarUrlDetalhes(ordemId);
      const agendada = texto(ordem.status) === "agendada";
      const emergencia = texto(ordem.prioridade) === "urgente";
      const dataAgendada = texto(ordem.atendimento?.dataConfirmada);
      const horarioInicial = texto(ordem.atendimento?.horarioConfirmado);
      const horarioFinal = texto(ordem.atendimento?.horarioFinal);
      let tipoAdmin = "nova-ordem";
      let tituloAdmin = "Nova solicitação";
      let mensagemAdmin = `${codigo} foi criada e aguarda análise.`;
      let tipoCliente = "solicitacao-criada";
      let tituloCliente = "Solicitação criada";
      let mensagemCliente = `${codigo} foi registrada com sucesso.`;

      if (emergencia) {
        tipoAdmin = "emergencia";
        tituloAdmin = "Nova emergência";
        mensagemAdmin = `${codigo} foi registrada como emergência.`;
        tipoCliente = "emergencia-registrada";
        tituloCliente = "Emergência registrada";
        mensagemCliente = `${codigo} foi registrada. A equipe da Salvateck foi avisada.`;
      } else if (agendada) {
        tipoAdmin = "novo-agendamento";
        tituloAdmin = "Novo agendamento";
        mensagemAdmin =
        `${codigo} foi agendada para ${dataAgendada}, ` +
        `às ${horarioInicial}.`;
        tipoCliente = "agendamento-realizado";
        tituloCliente = "Agendamento realizado";
        mensagemCliente =
        `${codigo} está agendada para ${dataAgendada}, ` +
        `das ${horarioInicial} às ${horarioFinal}.`;
      }

      await publicarNotificacao({
        destinatarios: administradores,
        tipo: tipoAdmin,
        titulo: tituloAdmin,
        mensagem: mensagemAdmin,
        ordemId,
        codigo,
        url,
      });

      if (clienteUid) {
        await publicarNotificacao({
          destinatarios: [clienteUid],
          tipo: tipoCliente,
          titulo: tituloCliente,
          mensagem: mensagemCliente,
          ordemId,
          codigo,
          url,
        });
      }
    },
);

exports.notificarAlteracaoOrdem = onDocumentUpdated(
    {
      document: "ordens/{ordemId}",
      region: "southamerica-east1",
      maxInstances: 20,
    },
    async (event) => {
      const anterior = event.data?.before.data() || {};
      const atual = event.data?.after.data() || {};

      if (deveIgnorarNotificacoes(atual)) {
        return;
      }

      const ordemId = event.params.ordemId;
      const codigo = texto(atual.codigo) || ordemId;
      const clienteUid = texto(atual.clienteUid);
      const statusAnterior = texto(anterior.status);
      const statusAtual = texto(atual.status);
      const dataAnterior = texto(anterior.atendimento?.dataConfirmada);
      const dataAtual = texto(atual.atendimento?.dataConfirmada);
      const horarioAnterior = texto(anterior.atendimento?.horarioConfirmado);
      const horarioAtual = texto(atual.atendimento?.horarioConfirmado);
      const horarioMudou =
      dataAnterior !== dataAtual || horarioAnterior !== horarioAtual;
      const url = montarUrlDetalhes(ordemId);

      if (!clienteUid) {
        return;
      }

      if (statusAtual === "cancelada" && statusAnterior !== "cancelada") {
        await publicarNotificacao({
          destinatarios: [clienteUid],
          tipo: "agendamento-cancelado",
          titulo: "Agendamento cancelado",
          mensagem: `${codigo} foi cancelada. O horário foi liberado na agenda.`,
          ordemId,
          codigo,
          url,
        });

        return;
      }

      if (horarioMudou && statusAtual === "agendada") {
        await publicarNotificacao({
          destinatarios: [clienteUid],
          tipo: "agendamento-alterado",
          titulo: "Agendamento alterado",
          mensagem:
          `${codigo} foi reagendada para ${dataAtual}, ` +
          `das ${horarioAtual} às ${atual.atendimento?.horarioFinal}.`,
          ordemId,
          codigo,
          url,
        });

        return;
      }

      if (statusAtual === "concluida" && statusAnterior !== "concluida") {
        await publicarNotificacao({
          destinatarios: [clienteUid],
          tipo: "atendimento-concluido",
          titulo: "Atendimento concluído",
          mensagem: `${codigo} foi concluída pela equipe da Salvateck.`,
          ordemId,
          codigo,
          url,
        });
      }
    },
);

function dataHoraAgendamentoEmMilissegundos(data, horario) {
  return Date.parse(`${data}T${horario}:00-03:00`);
}

function obterDatasParaLembretes() {
  const agora = obterDataHoraSaoPaulo();
  const hoje = new Date(`${agora.data}T12:00:00-03:00`);
  const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
  const dataAmanha = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(amanha);

  return [agora.data, dataAmanha];
}

function identificarLembrete(diferencaMinutos) {
  const lembretes = [
    {chave: "24h", alvo: 24 * 60, titulo: "Atendimento amanhã"},
    {chave: "1h", alvo: 60, titulo: "Atendimento em 1 hora"},
    {chave: "10min", alvo: 10, titulo: "Atendimento em 10 minutos"},
  ];

  return (
    lembretes.find(
        (lembrete) => Math.abs(diferencaMinutos - lembrete.alvo) <= 3,
    ) || null
  );
}

exports.processarLembretesAgenda = onSchedule(
    {
      schedule: "every 5 minutes",
      timeZone: "America/Sao_Paulo",
      region: "southamerica-east1",
      maxInstances: 1,
    },
    async () => {
      const datas = obterDatasParaLembretes();
      const snapshots = await Promise.all(
          datas.map((data) =>
            db
                .collection("ordens")
                .where("atendimento.dataConfirmada", "==", data)
                .get(),
          ),
      );
      const agora = Date.now();

      for (const snapshot of snapshots) {
        for (const ordemSnapshot of snapshot.docs) {
          const ordem = ordemSnapshot.data() || {};

          if (texto(ordem.status) !== "agendada") {
            continue;
          }

          const data = texto(ordem.atendimento?.dataConfirmada);
          const horario = texto(ordem.atendimento?.horarioConfirmado);
          const instante = dataHoraAgendamentoEmMilissegundos(data, horario);

          if (!Number.isFinite(instante)) {
            continue;
          }

          const diferencaMinutos = (instante - agora) / 60000;
          const lembrete = identificarLembrete(diferencaMinutos);

          if (!lembrete) {
            continue;
          }

          const clienteUid = texto(ordem.clienteUid);

          if (!clienteUid) {
            continue;
          }

          const campoLembrete = `atendimento.lembretesEnviados.${lembrete.chave}`;
          const notificationReference = db.collection("notificacoes").doc();
          const mensagemLembrete = `${texto(ordem.codigo)} está agendada para ${horario}.`;
          const url = montarUrlDetalhes(ordemSnapshot.id);
          const criado = await db.runTransaction(async (transaction) => {
            const atual = await transaction.get(ordemSnapshot.ref);
            const lembretesEnviados =
            atual.data()?.atendimento?.lembretesEnviados || {};

            if (lembretesEnviados[lembrete.chave]) {
              return false;
            }

            transaction.update(ordemSnapshot.ref, {
              [campoLembrete]: FieldValue.serverTimestamp(),
              atualizadoEm: FieldValue.serverTimestamp(),
            });

            transaction.set(notificationReference, {
              destinatarioUid: clienteUid,
              tipo: `lembrete-${lembrete.chave}`,
              titulo: lembrete.titulo,
              mensagem: mensagemLembrete,
              ordemId: ordemSnapshot.id,
              codigo: texto(ordem.codigo),
              url,
              lida: false,
              criadaEm: FieldValue.serverTimestamp(),
              lidaEm: null,
            });

            return true;
          });

          if (criado) {
            await enviarPushParaUsuarios({
              destinatarios: [clienteUid],
              titulo: lembrete.titulo,
              mensagem: mensagemLembrete,
              url,
              ordemId: ordemSnapshot.id,
            });
          }
        }
      }
    },
);

exports.iniciarVistoriaAgora = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      await validarAdministrador(request.auth.uid);

      const ordemId = texto(request.data?.ordemId);

      if (!ordemId) {
        throw new HttpsError(
            "invalid-argument",
            "O ID da Ordem de Serviço é obrigatório.",
        );
      }

      const ordemReference = db.collection("ordens").doc(ordemId);

      try {
        const resultado = await db.runTransaction(async (transaction) => {
          const ordemSnapshot = await transaction.get(ordemReference);

          if (!ordemSnapshot.exists) {
            throw new HttpsError(
                "not-found",
                "A Ordem de Serviço não foi encontrada.",
            );
          }

          const ordem = ordemSnapshot.data() || {};

          const tipoAtendimento = texto(ordem.tipoAtendimento).toLowerCase();

          if (tipoAtendimento !== "vistoria") {
            throw new HttpsError(
                "failed-precondition",
                "Esta Ordem de Serviço não é uma vistoria técnica.",
            );
          }

          const status = texto(ordem.status).toLowerCase();

          if (status !== "nova-solicitacao" && status !== "em-analise") {
            throw new HttpsError(
                "failed-precondition",
                "Esta vistoria não pode mais ser iniciada imediatamente.",
            );
          }

          const vistoriaId =
          texto(ordem.vistoria?.id) ||
          texto(ordem.vistoria?.vistoriaId) ||
          texto(ordem.vistoriaId);

          if (vistoriaId) {
            throw new HttpsError(
                "already-exists",
                "Esta Ordem de Serviço já possui uma vistoria vinculada.",
            );
          }

          const agora = obterDataHoraSaoPaulo();

          const atendimento = {
            ...(ordem.atendimento || {}),
            dataConfirmada: agora.data,
            periodoConfirmado: agora.periodo,
            horarioConfirmado: agora.horario,
            modo: "imediato",
          };

          transaction.update(ordemReference, {
            status: "agendada",
            atendimento,
            atualizadoEm: FieldValue.serverTimestamp(),
            statusAtualizadoEm: FieldValue.serverTimestamp(),
          });

          return {
            sucesso: true,
            ordemId,
            codigo: texto(ordem.codigo),
            data: agora.data,
            periodo: agora.periodo,
            horario: agora.horario,
            modo: "imediato",
          };
        });

        logger.info("Vistoria imediata iniciada.", {
          uid: request.auth.uid,
          ordemId,
          codigo: resultado.codigo || null,
          data: resultado.data,
          horario: resultado.horario,
        });

        return resultado;
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error("Não foi possível iniciar a vistoria imediatamente.", {
          uid: request.auth.uid,
          ordemId,
          message: error.message,
        });

        throw new HttpsError(
            "internal",
            "Não foi possível iniciar a vistoria agora.",
        );
      }
    },
);

exports.criarAcessoFuncionario = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      await validarAdministrador(request.auth.uid);

      const funcionarioId = texto(request.data?.funcionarioId);

      if (!funcionarioId) {
        throw new HttpsError(
            "invalid-argument",
            "O ID do funcionário é obrigatório.",
        );
      }

      const funcionarioReference = db
          .collection("funcionarios")
          .doc(funcionarioId);

      const funcionarioSnapshot = await funcionarioReference.get();

      if (!funcionarioSnapshot.exists) {
        throw new HttpsError("not-found", "O funcionário não foi encontrado.");
      }

      const funcionario = funcionarioSnapshot.data() || {};

      const nome = texto(funcionario.nome);

      const email = texto(funcionario.email).toLowerCase();

      const codigo = texto(funcionario.codigo);

      const status = texto(funcionario.status).toLowerCase();

      const usuarioUidAtual = texto(funcionario.usuarioUid);

      if (status === "inativo" || funcionario.ativo === false) {
        throw new HttpsError(
            "failed-precondition",
            "Não é possível criar acesso para um funcionário inativo.",
        );
      }

      if (!nome) {
        throw new HttpsError(
            "failed-precondition",
            "O funcionário não possui nome cadastrado.",
        );
      }

      if (!email) {
        throw new HttpsError(
            "failed-precondition",
            "O funcionário não possui e-mail cadastrado.",
        );
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpsError(
            "failed-precondition",
            "O funcionário possui um e-mail inválido.",
        );
      }

      if (funcionario.acessoConfigurado === true || usuarioUidAtual) {
        throw new HttpsError(
            "already-exists",
            "Este funcionário já possui acesso ao sistema.",
        );
      }

      let usuarioCriado = null;

      try {
        usuarioCriado = await authAdmin.createUser({
          email,
          emailVerified: false,
          displayName: nome,
          disabled: false,
        });

        const usuarioReference = db.collection("usuarios").doc(usuarioCriado.uid);

        const batch = db.batch();

        batch.set(usuarioReference, {
          nome,
          email,
          role: "funcionario",
          ativo: true,
          funcionarioId,
          funcionarioCodigo: codigo,
          criadoEm: FieldValue.serverTimestamp(),
          criadoPorUid: request.auth.uid,
          atualizadoEm: FieldValue.serverTimestamp(),
          atualizadoPorUid: request.auth.uid,
        });

        batch.update(funcionarioReference, {
          acessoConfigurado: true,
          usuarioUid: usuarioCriado.uid,
          acessoCriadoEm: FieldValue.serverTimestamp(),
          acessoCriadoPorUid: request.auth.uid,
          atualizadoEm: FieldValue.serverTimestamp(),
          atualizadoPorUid: request.auth.uid,
        });

        await batch.commit();

        logger.info("Acesso de funcionário criado.", {
          uidAdmin: request.auth.uid,
          funcionarioId,
          codigo: codigo || null,
          usuarioUid: usuarioCriado.uid,
        });

        return {
          sucesso: true,
          funcionarioId,
          codigo,
          nome,
          email,
          usuarioUid: usuarioCriado.uid,
          precisaDefinirSenha: true,
        };
      } catch (error) {
        if (usuarioCriado) {
          try {
            await authAdmin.deleteUser(usuarioCriado.uid);
          } catch (rollbackError) {
            logger.error(
                "Não foi possível remover usuário após falha no cadastro.",
                {
                  usuarioUid: usuarioCriado.uid,
                  message: rollbackError.message,
                },
            );
          }
        }

        if (error instanceof HttpsError) {
          throw error;
        }

        if (error?.code === "auth/email-already-exists") {
          throw new HttpsError(
              "already-exists",
              "Este e-mail já possui uma conta no sistema.",
          );
        }

        if (error?.code === "auth/invalid-email") {
          throw new HttpsError(
              "invalid-argument",
              "O e-mail do funcionário é inválido.",
          );
        }

        logger.error("Não foi possível criar acesso do funcionário.", {
          uidAdmin: request.auth.uid,
          funcionarioId,
          message: error.message,
          code: error.code || null,
        });

        throw new HttpsError(
            "internal",
            "Não foi possível criar o acesso do funcionário.",
        );
      }
    },
);

exports.enviarExecucaoParaValidacao = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      const ordemId = texto(request.data?.ordemId);

      const observacao = texto(request.data?.observacao);

      if (!ordemId) {
        throw new HttpsError(
            "invalid-argument",
            "O ID da Ordem de Serviço é obrigatório.",
        );
      }

      if (observacao.length > 1000) {
        throw new HttpsError(
            "invalid-argument",
            "A observação da execução deve ter no máximo 1000 caracteres.",
        );
      }

      const usuarioReference = db.collection("usuarios").doc(request.auth.uid);

      const ordemReference = db.collection("ordens").doc(ordemId);

      try {
        const resultado = await db.runTransaction(async (transaction) => {
          const usuarioSnapshot = await transaction.get(usuarioReference);

          if (!usuarioSnapshot.exists) {
            throw new HttpsError(
                "permission-denied",
                "Usu\u00e1rio n\u00e3o autorizado.",
            );
          }

          const usuario = usuarioSnapshot.data() || {};

          if (usuario.ativo !== true || usuario.role !== "funcionario") {
            throw new HttpsError(
                "permission-denied",
                "Apenas funcionários ativos podem enviar uma execução.",
            );
          }

          const funcionarioId = texto(usuario.funcionarioId);

          if (!funcionarioId) {
            throw new HttpsError(
                "failed-precondition",
                "A conta não possui um funcionário vinculado.",
            );
          }

          const funcionarioReference = db
              .collection("funcionarios")
              .doc(funcionarioId);

          const funcionarioSnapshot = await transaction.get(funcionarioReference);

          if (!funcionarioSnapshot.exists) {
            throw new HttpsError(
                "failed-precondition",
                "O cadastro do funcionário não foi encontrado.",
            );
          }

          const funcionario = funcionarioSnapshot.data() || {};

          const funcionarioUid = texto(funcionario.usuarioUid);

          const funcionarioStatus = texto(funcionario.status).toLowerCase();

          if (
            funcionario.ativo !== true ||
          funcionarioStatus === "inativo" ||
          funcionarioUid !== request.auth.uid
          ) {
            throw new HttpsError(
                "permission-denied",
                "O funcionário não possui autorização " + "para esta operação.",
            );
          }

          const ordemSnapshot = await transaction.get(ordemReference);

          if (!ordemSnapshot.exists) {
            throw new HttpsError(
                "not-found",
                "A Ordem de Serviço não foi encontrada.",
            );
          }

          const ordem = ordemSnapshot.data() || {};

          const funcionarioResponsavelUid = texto(
              ordem.funcionarioResponsavelUid ||
            ordem.funcionarioResponsavel?.usuarioUid,
          );

          if (funcionarioResponsavelUid !== request.auth.uid) {
            throw new HttpsError(
                "permission-denied",
                "Esta Ordem de Serviço não está atribuída " + "a este funcionário.",
            );
          }

          const status = texto(ordem.status).toLowerCase();

          if (status !== "agendada") {
            throw new HttpsError(
                "failed-precondition",
                "Somente uma OS agendada pode ser enviada para validação.",
            );
          }

          const tipoAtendimento = texto(ordem.tipoAtendimento).toLowerCase();

          if (tipoAtendimento === "vistoria") {
            throw new HttpsError(
                "failed-precondition",
                "Vistorias devem seguir o fluxo pr\u00f3prio de checklist.",
            );
          }

          const funcionarioNome =
          texto(funcionario.nome) || texto(usuario.nome) || "Funcionário";

          const funcionarioCodigo = texto(funcionario.codigo);

          transaction.update(ordemReference, {
            status: "aguardando-validacao",

            execucaoFuncionario: {
              status: "aguardando-validacao",
              funcionarioUid: request.auth.uid,
              funcionarioId,
              funcionarioCodigo,
              funcionarioNome,
              observacao,
              finalizadoEm: FieldValue.serverTimestamp(),
              enviadoParaValidacaoEm: FieldValue.serverTimestamp(),
            },

            atualizadoEm: FieldValue.serverTimestamp(),

            statusAtualizadoEm: FieldValue.serverTimestamp(),
          });

          return {
            sucesso: true,
            ordemId,
            codigo: texto(ordem.codigo),
            status: "aguardando-validacao",
          };
        });

        logger.info("Execução enviada para validação.", {
          funcionarioUid: request.auth.uid,
          ordemId,
          codigo: resultado.codigo || null,
        });

        return resultado;
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error("Não foi possível enviar a execução para validação.", {
          funcionarioUid: request.auth.uid,
          ordemId,
          message: error.message,
          code: error.code || null,
        });

        throw new HttpsError(
            "internal",
            "Não foi possível enviar a execução para validação.",
        );
      }
    },
);

function normalizarItemChecklistVistoria(item, index) {
  if (!item || typeof item !== "object") {
    throw new HttpsError(
        "invalid-argument",
        `O item ${index + 1} do checklist é inválido.`,
    );
  }

  const resultado = texto(item.resultado).toLowerCase();

  if (!["ok", "precisa-ajuste"].includes(resultado)) {
    throw new HttpsError(
        "invalid-argument",
        `Avalie corretamente o item ${index + 1} do checklist.`,
    );
  }

  const observacao = texto(item.observacao);

  if (observacao.length > 1000) {
    throw new HttpsError(
        "invalid-argument",
        `A observação do item ${index + 1} ultrapassa 1000 caracteres.`,
    );
  }

  if (resultado === "precisa-ajuste" && !observacao) {
    throw new HttpsError(
        "invalid-argument",
        `Descreva o ajuste necessário no item ${index + 1}.`,
    );
  }

  const quantidadeInformada = Number(item.quantidade);

  const quantidade =
    Number.isInteger(quantidadeInformada) && quantidadeInformada > 0 ?
      Math.min(quantidadeInformada, 1000) :
      1;

  return {
    ambienteId: texto(item.ambienteId).slice(0, 200),
    ambienteNome: texto(item.ambienteNome).slice(0, 200),
    categoriaAmbiente: texto(item.categoriaAmbiente).slice(0, 200),
    equipamentoId: texto(item.equipamentoId).slice(0, 200),
    nome: texto(item.nome).slice(0, 200),
    categoria: texto(item.categoria).slice(0, 200),
    quantidade,
    localizacao: texto(item.localizacao).slice(0, 500),
    resultado,
    observacao,
    ...(resultado === "precisa-ajuste" ?
      {
        pendencia: {
          status: "aberta",
          orcamentoId: "",
          osExecucaoId: "",
          resolvidaEm: null,
        },
      } :
      {}),
  };
}

function formatarCodigoVistoria(numero) {
  return `VST-${String(numero).padStart(4, "0")}`;
}

exports.enviarVistoriaParaValidacao = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      const ordemId = texto(request.data?.ordemId);

      const checklistRecebido = Array.isArray(request.data?.checklist) ?
      request.data.checklist :
      [];

      if (!ordemId) {
        throw new HttpsError(
            "invalid-argument",
            "O ID da Ordem de Serviço é obrigatório.",
        );
      }

      if (checklistRecebido.length === 0) {
        throw new HttpsError(
            "invalid-argument",
            "A vistoria precisa possuir itens avaliados.",
        );
      }

      if (checklistRecebido.length > 500) {
        throw new HttpsError(
            "invalid-argument",
            "O checklist ultrapassa o limite permitido.",
        );
      }

      const checklist = checklistRecebido.map(normalizarItemChecklistVistoria);

      const usuarioReference = db.collection("usuarios").doc(request.auth.uid);

      const ordemReference = db.collection("ordens").doc(ordemId);

      const contadorReference = db.collection("contadores").doc("vistorias");

      const novaVistoriaReference = db.collection("vistorias").doc();

      try {
        const resultado = await db.runTransaction(async (transaction) => {
          const usuarioSnapshot = await transaction.get(usuarioReference);

          if (!usuarioSnapshot.exists) {
            throw new HttpsError(
                "permission-denied",
                "Usu\u00e1rio n\u00e3o autorizado.",
            );
          }

          const usuario = usuarioSnapshot.data() || {};

          if (usuario.ativo !== true || usuario.role !== "funcionario") {
            throw new HttpsError(
                "permission-denied",
                "Apenas funcionários ativos podem enviar uma vistoria.",
            );
          }

          const funcionarioId = texto(usuario.funcionarioId);

          if (!funcionarioId) {
            throw new HttpsError(
                "failed-precondition",
                "A conta não possui um funcionário vinculado.",
            );
          }

          const funcionarioReference = db
              .collection("funcionarios")
              .doc(funcionarioId);

          const funcionarioSnapshot = await transaction.get(funcionarioReference);

          if (!funcionarioSnapshot.exists) {
            throw new HttpsError(
                "failed-precondition",
                "O cadastro do funcionário não foi encontrado.",
            );
          }

          const funcionario = funcionarioSnapshot.data() || {};

          const funcionarioUid = texto(funcionario.usuarioUid);

          const funcionarioStatus = texto(funcionario.status).toLowerCase();

          if (
            funcionario.ativo !== true ||
          funcionarioStatus === "inativo" ||
          funcionarioUid !== request.auth.uid
          ) {
            throw new HttpsError(
                "permission-denied",
                "O funcionário não possui autorização " + "para esta operação.",
            );
          }

          const ordemSnapshot = await transaction.get(ordemReference);

          if (!ordemSnapshot.exists) {
            throw new HttpsError(
                "not-found",
                "A Ordem de Serviço não foi encontrada.",
            );
          }

          const ordem = ordemSnapshot.data() || {};

          const tipoAtendimento = texto(ordem.tipoAtendimento).toLowerCase();

          if (tipoAtendimento !== "vistoria") {
            throw new HttpsError(
                "failed-precondition",
                "Esta Ordem de Serviço não é uma vistoria técnica.",
            );
          }

          const funcionarioResponsavelUid = texto(
              ordem.funcionarioResponsavelUid ||
            ordem.funcionarioResponsavel?.usuarioUid,
          );

          if (funcionarioResponsavelUid !== request.auth.uid) {
            throw new HttpsError(
                "permission-denied",
                "Esta vistoria não está atribuída a este funcionário.",
            );
          }

          const status = texto(ordem.status).toLowerCase();

          if (status !== "agendada") {
            throw new HttpsError(
                "failed-precondition",
                "Somente uma vistoria agendada pode ser enviada.",
            );
          }

          const vistoriaIdExistente =
          texto(ordem.vistoria?.id) ||
          texto(ordem.vistoria?.vistoriaId) ||
          texto(ordem.vistoriaId);

          let vistoriaReference = novaVistoriaReference;

          let vistoriaSnapshot = null;

          let numeroVistoria = 0;

          let codigoVistoria = "";

          if (vistoriaIdExistente) {
            vistoriaReference = db
                .collection("vistorias")
                .doc(vistoriaIdExistente);

            vistoriaSnapshot = await transaction.get(vistoriaReference);

            if (!vistoriaSnapshot.exists) {
              throw new HttpsError(
                  "failed-precondition",
                  "A vistoria vinculada à OS não foi encontrada.",
              );
            }

            const vistoriaExistente = vistoriaSnapshot.data() || {};

            if (texto(vistoriaExistente.ordemId) !== ordemId) {
              throw new HttpsError(
                  "failed-precondition",
                  "A vistoria vinculada não pertence a esta OS.",
              );
            }

            if (
              vistoriaExistente.validada === true ||
            texto(vistoriaExistente.status).toLowerCase() === "concluida"
            ) {
              throw new HttpsError(
                  "failed-precondition",
                  "Esta vistoria já foi validada.",
              );
            }

            numeroVistoria = Number(vistoriaExistente.numero || 0);

            codigoVistoria =
            texto(vistoriaExistente.codigo) || texto(ordem.codigoVistoria);
          } else {
            const contadorSnapshot = await transaction.get(contadorReference);

            const numeroAtual = contadorSnapshot.exists ?
            Number(contadorSnapshot.data().ultimoNumero || 0) :
            0;

            if (!Number.isInteger(numeroAtual) || numeroAtual < 0) {
              throw new HttpsError(
                  "failed-precondition",
                  "O contador das vistorias possui um valor inválido.",
              );
            }

            numeroVistoria = numeroAtual + 1;

            codigoVistoria = formatarCodigoVistoria(numeroVistoria);
          }

          const funcionarioNome =
          texto(funcionario.nome) || texto(usuario.nome) || "Funcionário";

          const funcionarioCodigo = texto(funcionario.codigo);

          const funcionarioEmail =
          texto(funcionario.email) || texto(usuario.email);

          const itensComAjuste = checklist.filter(
              (item) => item.resultado === "precisa-ajuste",
          );

          const totalItens = checklist.length;

          const resumoExecucao =
          itensComAjuste.length > 0 ?
            [
              "Vistoria técnica concluída com",
              `${itensComAjuste.length} item(ns) que precisam de ajuste.`,
            ].join(" ") :
            "Vistoria técnica concluída sem ajustes apontados.";

          const estruturaAmbientes = Array.isArray(
              ordem.condominio?.estruturaAmbientes,
          ) ?
          ordem.condominio.estruturaAmbientes :
          [];

          const vistoriaData = {
            id: vistoriaReference.id,
            numero: numeroVistoria,
            codigo: codigoVistoria,
            atualizadoEm: FieldValue.serverTimestamp(),
            statusAtualizadoEm: FieldValue.serverTimestamp(),
            enviadoParaValidacaoEm: FieldValue.serverTimestamp(),
            tipoAtendimento: "vistoria",
            tipo: "Vistoria técnica",
            titulo:
            texto(ordem.titulo) ||
            texto(ordem.servicoPrincipal) ||
            "Vistoria técnica",
            status: "aguardando-validacao",
            validada: false,
            progresso: 100,
            prioridade: texto(ordem.prioridade) || "normal",
            condominioId:
            texto(ordem.condominioId) || texto(ordem.condominio?.id),
            clienteUid: texto(ordem.clienteUid) || texto(ordem.cliente?.id),
            condominio: {
              id: texto(ordem.condominio?.id) || texto(ordem.condominioId),
              codigo: texto(ordem.condominio?.codigo),
              nome: texto(ordem.condominio?.nome),
              cnpj: texto(ordem.condominio?.cnpj),
              endereco: ordem.condominio?.endereco || ordem.endereco || {},
            },
            cliente: {
              id: texto(ordem.cliente?.id) || texto(ordem.clienteUid),
              nome: texto(ordem.cliente?.nome),
              telefone: texto(ordem.cliente?.telefone),
              email: texto(ordem.cliente?.email),
            },
            endereco: ordem.condominio?.endereco || ordem.endereco || {},
            tecnico: {
              uid: request.auth.uid,
              funcionarioId,
              codigo: funcionarioCodigo,
              nome: funcionarioNome,
              email: funcionarioEmail,
            },
            estruturaAmbientesSnapshot: estruturaAmbientes,
            checklist,
            totalItens,
            itensConcluidos: totalItens,
            equipamentosAvaliados: totalItens,
            naoConformidades: itensComAjuste.length,
            pendenciasCriticas: 0,
            quantidadeFotos: 0,
            observacao: "",
            ordemVinculada: true,
            ordemId,
            codigoOS: texto(ordem.codigo),
            origem: {
              tipo: "ordem-servico",
              ordemId,
              codigoOS: texto(ordem.codigo),
            },
            execucaoFuncionario: {
              status: "aguardando-validacao",
              funcionarioUid: request.auth.uid,
              funcionarioId,
              funcionarioCodigo,
              funcionarioNome,
              enviadoParaValidacaoEm: FieldValue.serverTimestamp(),
            },
            tentativaValidacao: FieldValue.increment(1),
          };

          if (!vistoriaIdExistente) {
            vistoriaData.criadoEm = FieldValue.serverTimestamp();
            vistoriaData.criadoPorUid = request.auth.uid;
            vistoriaData.criadoPorNome = funcionarioNome;
            vistoriaData.perfilCriador = "funcionario";

            transaction.set(
                contadorReference,
                {
                  ultimoNumero: numeroVistoria,
                  ultimoDocumentoId: vistoriaReference.id,
                  atualizadoEm: FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                },
            );
          }

          transaction.set(vistoriaReference, vistoriaData, {
            merge: Boolean(vistoriaIdExistente),
          });

          transaction.update(ordemReference, {
            status: "aguardando-validacao",

            vistoria: {
              ...(ordem.vistoria || {}),
              id: vistoriaReference.id,
              vistoriaId: vistoriaReference.id,
              codigo: codigoVistoria,
              codigoVistoria,
              status: "aguardando-validacao",
              validada: false,
              progresso: 100,
              totalItens,
              itensConcluidos: totalItens,
              equipamentosAvaliados: totalItens,
              naoConformidades: itensComAjuste.length,
              pendenciasCriticas: 0,
              quantidadeFotos: 0,
              enviadoParaValidacaoEm: FieldValue.serverTimestamp(),
            },

            vistoriaId: vistoriaReference.id,

            codigoVistoria,

            execucaoFuncionario: {
              status: "aguardando-validacao",
              tipo: "vistoria",
              funcionarioUid: request.auth.uid,
              funcionarioId,
              funcionarioCodigo,
              funcionarioNome,
              observacao: resumoExecucao,
              finalizadoEm: FieldValue.serverTimestamp(),
              enviadoParaValidacaoEm: FieldValue.serverTimestamp(),
              vistoriaId: vistoriaReference.id,
              codigoVistoria,
            },

            atualizadoEm: FieldValue.serverTimestamp(),

            statusAtualizadoEm: FieldValue.serverTimestamp(),
          });

          return {
            sucesso: true,
            ordemId,
            codigo: texto(ordem.codigo),
            vistoriaId: vistoriaReference.id,
            codigoVistoria,
            status: "aguardando-validacao",
            naoConformidades: itensComAjuste.length,
          };
        });

        logger.info("Vistoria enviada para validação.", {
          funcionarioUid: request.auth.uid,
          ordemId,
          codigo: resultado.codigo || null,
          vistoriaId: resultado.vistoriaId,
          codigoVistoria: resultado.codigoVistoria,
        });

        return resultado;
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error("Não foi possível enviar a vistoria para validação.", {
          funcionarioUid: request.auth.uid,
          ordemId,
          message: error.message,
          code: error.code || null,
        });

        throw new HttpsError(
            "internal",
            "Não foi possível enviar a vistoria para validação.",
        );
      }
    },
);
function normalizarFotoVistoria(foto, index, vistoriaId) {
  if (!foto || typeof foto !== "object") {
    throw new HttpsError(
        "invalid-argument",
        `A foto ${index + 1} da vistoria é inválida.`,
    );
  }

  const storagePath = texto(foto.storagePath);
  const nome = texto(foto.nome);
  const tamanho = Number(foto.tamanho || 0);
  const prefixoEsperado = `vistorias/${vistoriaId}/imagens/`;

  if (
    !storagePath.startsWith(prefixoEsperado) ||
    !storagePath.endsWith(".webp")
  ) {
    throw new HttpsError(
        "invalid-argument",
        `O caminho da foto ${index + 1} é inválido.`,
    );
  }

  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > 2 * 1024 * 1024) {
    throw new HttpsError(
        "invalid-argument",
        `O tamanho da foto ${index + 1} é inválido.`,
    );
  }

  const nomeArquivo = storagePath.split("/").pop();

  return {
    id: nomeArquivo.replace(/[.]webp$/i, ""),
    storagePath,
    nome: nome.slice(0, 240) || nomeArquivo,
    contentType: "image/webp",
    tamanho,
    posicao: index + 1,
  };
}

exports.registrarFotosVistoria = onCall(
    {
      region: "southamerica-east1",
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      const vistoriaId = texto(request.data?.vistoriaId);

      const fotosRecebidas = Array.isArray(request.data?.fotos) ?
      request.data.fotos :
      [];

      if (!vistoriaId) {
        throw new HttpsError(
            "invalid-argument",
            "O ID da vistoria é obrigatório.",
        );
      }

      if (fotosRecebidas.length === 0) {
        throw new HttpsError("invalid-argument", "Nenhuma foto foi informada.");
      }

      const usuarioReference = db.collection("usuarios").doc(request.auth.uid);

      const vistoriaReference = db.collection("vistorias").doc(vistoriaId);

      const [usuarioSnapshot, vistoriaSnapshot] = await Promise.all([
        usuarioReference.get(),
        vistoriaReference.get(),
      ]);

      if (!usuarioSnapshot.exists) {
        throw new HttpsError("permission-denied", "Usuário não autorizado.");
      }

      if (!vistoriaSnapshot.exists) {
        throw new HttpsError("not-found", "A vistoria não foi encontrada.");
      }

      const usuario = usuarioSnapshot.data() || {};
      const vistoria = vistoriaSnapshot.data() || {};
      const role = texto(usuario.role).toLowerCase();

      if (usuario.ativo !== true) {
        throw new HttpsError("permission-denied", "Usuário inativo.");
      }

      const tecnicoUid =
      texto(vistoria.tecnico?.uid) ||
      texto(vistoria.execucaoFuncionario?.funcionarioUid);

      const podeRegistrar =
      role === "admin" ||
      (role === "funcionario" && tecnicoUid === request.auth.uid);

      if (!podeRegistrar) {
        throw new HttpsError(
            "permission-denied",
            "Você não possui permissão para registrar fotos nesta vistoria.",
        );
      }

      const fotos = fotosRecebidas.map((foto, index) =>
        normalizarFotoVistoria(foto, index, vistoriaId),
      );

      const fotosCollection = vistoriaReference.collection("fotos");

      for (let inicio = 0; inicio < fotos.length; inicio += 400) {
        const lote = fotos.slice(inicio, inicio + 400);
        const batch = db.batch();

        lote.forEach((foto) => {
          const fotoReference = fotosCollection.doc(foto.id);

          batch.set(
              fotoReference,
              {
                vistoriaId,
                storagePath: foto.storagePath,
                nome: foto.nome,
                contentType: foto.contentType,
                tamanho: foto.tamanho,
                posicao: foto.posicao,
                enviadoPorUid: request.auth.uid,
                enviadoPorPerfil: role,
                enviadoEm: FieldValue.serverTimestamp(),
              },
              {
                merge: true,
              },
          );
        });

        await batch.commit();
      }

      const contagemSnapshot = await fotosCollection.count().get();

      const quantidadeFotos = Number(contagemSnapshot.data().count || 0);

      const ordemId = texto(vistoria.ordemId);

      const finalBatch = db.batch();

      finalBatch.update(vistoriaReference, {
        quantidadeFotos,
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      if (ordemId) {
        const ordemReference = db.collection("ordens").doc(ordemId);

        const ordemSnapshot = await ordemReference.get();

        if (ordemSnapshot.exists) {
          finalBatch.update(ordemReference, {
            "vistoria.quantidadeFotos": quantidadeFotos,
            "atualizadoEm": FieldValue.serverTimestamp(),
          });
        }
      }

      await finalBatch.commit();

      logger.info("Fotos da vistoria registradas.", {
        vistoriaId,
        uid: request.auth.uid,
        quantidadeFotos,
      });

      return {
        sucesso: true,
        vistoriaId,
        quantidadeFotos,
      };
    },
);
exports.sincronizarGoogleAgenda = onCall(
    {
      region: "southamerica-east1",
      secrets: [salvateckApiToken],
      maxInstances: 10,
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "É necessário estar autenticado.",
        );
      }

      await validarAdministrador(request.auth.uid);

      const data = request.data || {};

      const payload = montarPayload(data, salvateckApiToken.value());

      validarPayload(payload);

      logger.info("Sincronização com Google Agenda iniciada.", {
        uid: request.auth.uid,
        acao: payload.acao,
        codigo: payload.codigo || null,
      });

      const resultado = await chamarAppsScript(payload);

      logger.info("Sincronização com Google Agenda concluída.", {
        uid: request.auth.uid,
        acao: payload.acao,
        codigo: payload.codigo || null,
        eventId: resultado.eventId || null,
      });

      return resultado;
    },
);
