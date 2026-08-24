const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

initializeApp();

const authAdmin = getAuth();
const db = getFirestore();

const salvateckApiToken = defineSecret("SALVATECK_API_TOKEN");

const APPS_SCRIPT_URL = [
  "https://script.google.com/macros/s",
  "AKfycbwfV2TyiEDppeHdlJ3-fqJHJRS4PsqRah6UYO2hUrV3lVy5R2xFQ1mAm-axjulFoXb7",
  "exec",
].join("/");

const ACOES_PERMITIDAS = new Set(["criar", "atualizar", "excluir"]);

const DURACAO_ATENDIMENTO_MINUTOS = 120;

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

function obterIntervaloAgenda(valor) {
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

  const fimMinutos = inicioMinutos + DURACAO_ATENDIMENTO_MINUTOS;

  if (fimMinutos > 24 * 60) {
    throw new HttpsError(
        "invalid-argument",
        "O atendimento ultrapassaria o fim do dia.",
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
    periodo,
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

function montarDadosDoConflito(ordemSnapshot, intervaloExistente) {
  const ordem = ordemSnapshot.data() || {};

  return {
    ordemId: ordemSnapshot.id,
    codigo: texto(ordem.codigo) || ordemSnapshot.id,
    tipoAtendimento: texto(ordem.tipoAtendimento) || "servico",
    servico:
      texto(ordem.titulo) || texto(ordem.servicoPrincipal) || "Atendimento",
    condominio: texto(ordem.condominio?.nome),
    horarioInicio: minutosParaHorario(intervaloExistente.inicioMinutos),
    horarioFim: minutosParaHorario(intervaloExistente.fimMinutos),
  };
}

async function buscarConflitoAgenda({
  data,
  horario,
  ordemId = "",
  transaction = null,
}) {
  const intervaloNovo = obterIntervaloAgenda(horario);

  const consulta = db
      .collection("ordens")
      .where("atendimento.dataConfirmada", "==", data);

  const snapshot = transaction ?
    await transaction.get(consulta) :
    await consulta.get();

  for (const ordemSnapshot of snapshot.docs) {
    if (ordemSnapshot.id === ordemId) {
      continue;
    }

    const ordem = ordemSnapshot.data() || {};

    const modoAtendimento = texto(ordem.atendimento?.modo).toLowerCase();

    if (modoAtendimento === "imediato") {
      continue;
    }

    const status = texto(ordem.status).toLowerCase();

    if (status !== "agendada" && status !== "aguardando-confirmacao") {
      continue;
    }

    const horarioExistente = texto(ordem.atendimento?.horarioConfirmado);

    if (!horarioExistente) {
      continue;
    }

    let intervaloExistente;

    try {
      intervaloExistente = obterIntervaloAgenda(horarioExistente);
    } catch (error) {
      logger.warn("OS com horário confirmado inválido ignorada na checagem.", {
        ordemId: ordemSnapshot.id,
        horario: horarioExistente,
      });

      continue;
    }

    if (
      intervalosConflitam(
          intervaloNovo.inicioMinutos,
          intervaloNovo.fimMinutos,
          intervaloExistente.inicioMinutos,
          intervaloExistente.fimMinutos,
      )
    ) {
      return montarDadosDoConflito(ordemSnapshot, intervaloExistente);
    }
  }

  return null;
}

exports.verificarDisponibilidadeAgenda = onCall(
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

      const dados = request.data || {};

      const data = validarDataAgenda(dados.data);

      const horario = texto(dados.horario);

      const ordemId = texto(dados.ordemId);

      obterIntervaloAgenda(horario);

      const conflito = await buscarConflitoAgenda({
        data,
        horario,
        ordemId,
      });

      return {
        sucesso: true,
        disponivel: !conflito,
        conflito,
        duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
      };
    },
);

exports.confirmarAgendamentoSeguro = onCall(
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

          if (ordem.status !== "aguardando-confirmacao") {
            throw new HttpsError(
                "failed-precondition",
                "A OS não está aguardando confirmação.",
            );
          }

          const proposta = ordem.proposta || {};

          const novaData = validarDataAgenda(proposta.data);

          const novoPeriodo = texto(proposta.periodo);

          const novoHorario = texto(proposta.horario);

          if (!novoPeriodo || !novoHorario) {
            throw new HttpsError(
                "failed-precondition",
                "A proposta não possui data e horário completos.",
            );
          }

          obterIntervaloAgenda(novoHorario);

          const dataAnterior = texto(ordem.atendimento?.dataConfirmada);

          const datasParaBloquear = [novaData, dataAnterior]
              .filter(
                  (data, index, array) =>
                  // eslint-disable-next-line max-len
                    /^\d{4}-\d{2}-\d{2}$/.test(data) && array.indexOf(data) === index,
              )
              .sort();

          const referenciasDeBloqueio = datasParaBloquear.map((data) =>
            db.collection("agendaBloqueios").doc(data),
          );

          for (const referencia of referenciasDeBloqueio) {
            await transaction.get(referencia);
          }

          const conflito = await buscarConflitoAgenda({
            data: novaData,
            horario: novoHorario,
            ordemId,
            transaction,
          });

          if (conflito) {
            throw new HttpsError(
                "already-exists",
                "Já existe um atendimento neste período.",
                {
                  conflito,
                },
            );
          }

          const atendimento = {
            ...(ordem.atendimento || {}),
            dataConfirmada: novaData,
            periodoConfirmado: novoPeriodo,
            horarioConfirmado: novoHorario,
          };

          for (const referencia of referenciasDeBloqueio) {
            transaction.set(
                referencia,
                {
                  data: referencia.id,
                  versao: FieldValue.increment(1),
                  atualizadoEm: FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                },
            );
          }

          transaction.update(ordemReference, {
            status: "agendada",
            atendimento,
            proposta: {
              ...proposta,
              status: "aceita",
              confirmadaEm: new Date().toISOString(),
            },
            atualizadoEm: FieldValue.serverTimestamp(),
            statusAtualizadoEm: FieldValue.serverTimestamp(),
          });

          return {
            sucesso: true,
            ordemId,
            codigo: texto(ordem.codigo),
            data: novaData,
            periodo: novoPeriodo,
            horario: novoHorario,
            duracaoMinutos: DURACAO_ATENDIMENTO_MINUTOS,
          };
        });

        logger.info("Agendamento protegido confirmado.", {
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

        logger.error("Não foi possível confirmar o agendamento protegido.", {
          uid: request.auth.uid,
          ordemId,
          message: error.message,
        });

        throw new HttpsError(
            "internal",
            "Não foi possível confirmar o agendamento.",
        );
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

        const usuarioReference = db
            .collection("usuarios")
            .doc(usuarioCriado.uid);

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

          const funcionarioSnapshot = await transaction.get(
              funcionarioReference,
          );

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
                "O funcionário não possui autorização para esta operação.",
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
                "Esta Ordem de Serviço não está atribuída a este funcionário.",
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

          const funcionarioSnapshot = await transaction.get(
              funcionarioReference,
          );

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
                "O funcionário não possui autorização para esta operação.",
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
