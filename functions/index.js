const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

initializeApp();

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
        "Apenas administradores podem sincronizar a agenda.",
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
