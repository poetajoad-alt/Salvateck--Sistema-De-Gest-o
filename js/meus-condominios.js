import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  ref as storageRef,
  getDownloadURL,
  getBlob,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
  db,
  storage,
} from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES
========================================= */

const statusConfig = {
  ativo: {
    nome: "Ativo",
    classe: "status--ativo",
  },

  atencao: {
    nome: "Com atenção",
    classe: "status--atencao",
  },

  inativo: {
    nome: "Inativo",
    classe: "status--inativo",
  },
};

const papelConfig = {
  sindico: "Síndico",
  subsindico: "Subsíndico",
  proprietario: "Proprietário",
  gerente: "Gerente",
  administradora: "Administradora",
  zelador: "Zelador",
  financeiro: "Responsável financeiro",
  outro: "Outro",
};

const tamanhoMaximoDocumento =
  10 * 1024 * 1024;

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const shell =
  document.getElementById("my-condominiums-shell");

const summaryTotal =
  document.getElementById("summary-total");

const summaryActive =
  document.getElementById("summary-active");

const summaryEnvironments =
  document.getElementById("summary-environments");

const summaryDocuments =
  document.getElementById("summary-documents");

const condominiumsSearch =
  document.getElementById("condominiums-search");

const condominiumFilter =
  document.getElementById("condominium-filter");

const condominiumsLoading =
  document.getElementById("condominiums-loading");

const condominiumsContent =
  document.getElementById("condominiums-content");

const condominiumsCount =
  document.getElementById("condominiums-count");

const condominiumsList =
  document.getElementById("condominiums-list");

const emptyState =
  document.getElementById("empty-state");

const emptyStateTitle =
  document.getElementById("empty-state-title");

const emptyStateDescription =
  document.getElementById("empty-state-description");

const clearCondominiumSearchButton =
  document.getElementById(
    "clear-condominium-search-button",
  );

const condominiumCardTemplate =
  document.getElementById(
    "condominium-card-template",
  );

/* =========================================
   MODAL
========================================= */

const condominiumModal =
  document.getElementById("condominium-modal");

const condominiumModalEyebrow =
  document.getElementById(
    "condominium-modal-eyebrow",
  );

const condominiumModalTitle =
  document.getElementById(
    "condominium-modal-title",
  );

const closeCondominiumModalButton =
  document.getElementById(
    "close-condominium-modal-button",
  );

const closeCondominiumButton =
  document.getElementById(
    "close-condominium-button",
  );

const modalTabButtons =
  document.querySelectorAll("[data-modal-tab]");

const modalPanels =
  document.querySelectorAll("[data-modal-panel]");

/* =========================================
   DADOS GERAIS
========================================= */

const detailCondominiumName =
  document.getElementById(
    "detail-condominium-name",
  );

const detailCondominiumCode =
  document.getElementById(
    "detail-condominium-code",
  );

const detailCondominiumDocument =
  document.getElementById(
    "detail-condominium-document",
  );

const detailCondominiumStatus =
  document.getElementById(
    "detail-condominium-status",
  );

const detailCondominiumBlocks =
  document.getElementById(
    "detail-condominium-blocks",
  );

const detailCondominiumUnits =
  document.getElementById(
    "detail-condominium-units",
  );

const detailCondominiumAddress =
  document.getElementById(
    "detail-condominium-address",
  );

const detailCondominiumNotes =
  document.getElementById(
    "detail-condominium-notes",
  );

/* =========================================
   RESPONSÁVEIS
========================================= */

const linkedClientsCount =
  document.getElementById(
    "linked-clients-count",
  );

const linkedClientsList =
  document.getElementById(
    "linked-clients-list",
  );

const linkedClientsEmpty =
  document.getElementById(
    "linked-clients-empty",
  );

const linkedClientTemplate =
  document.getElementById(
    "linked-client-template",
  );

/* =========================================
   AMBIENTES E EQUIPAMENTOS
========================================= */

const selectedEquipmentCount =
  document.getElementById(
    "selected-equipment-count",
  );

const condominiumEnvironmentsList =
  document.getElementById(
    "condominium-environments-list",
  );

const condominiumEnvironmentsEmpty =
  document.getElementById(
    "condominium-environments-empty",
  );

const condominiumEnvironmentTemplate =
  document.getElementById(
    "condominium-environment-template",
  );

const condominiumEnvironmentEquipmentTemplate =
  document.getElementById(
    "condominium-environment-equipment-template",
  );

/* =========================================
   DOCUMENTOS
========================================= */

const documentsCount =
  document.getElementById("documents-count");

const documentsLoading =
  document.getElementById("documents-loading");

const documentsList =
  document.getElementById("documents-list");

const documentsEmpty =
  document.getElementById("documents-empty");

const documentTemplate =
  document.getElementById("document-template");

/* =========================================
   HISTÓRICO
========================================= */

const condominiumHistory =
  document.getElementById(
    "condominium-history",
  );

const historyEmpty =
  document.getElementById("history-empty");

/* =========================================
   FEEDBACK
========================================= */

const feedbackMessage =
  document.getElementById("feedback-message");

/* =========================================
   ESTADO
========================================= */

let sessaoAtual = null;

let condominios = [];

let ordens = [];

let condominioAtual = null;

let feedbackTimer = null;

/* =========================================
   SESSÃO
========================================= */

async function aguardarSessaoDaPagina() {
  if (window.salvateckSessionReady) {
    return window.salvateckSessionReady;
  }

  return new Promise((resolve) => {
    window.addEventListener(
      "salvateck:auth-ready",
      (event) => resolve(event.detail),
      {
        once: true,
      },
    );
  });
}

/* =========================================
   NORMALIZAÇÃO
========================================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarListaDeIds(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return [
    ...new Set(
      lista
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  ];
}

function formatarQuantidade(
  quantidade,
  singular,
  plural,
) {
  const valor =
    Math.max(0, Number(quantidade) || 0);

  return `${valor} ${
    valor === 1 ? singular : plural
  }`;
}

/* =========================================
   DATAS
========================================= */

function obterInicioDoDia(data = new Date()) {
  const novaData = new Date(data);

  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function obterDataISO(data = new Date()) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    data.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(valor) {
  if (!valor) {
    return null;
  }

  if (
    valor &&
    typeof valor.toDate === "function"
  ) {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const apenasData = texto.split("T")[0];

  const data = new Date(
    `${apenasData}T12:00:00`,
  );

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function converterDataDoFirestoreParaISO(
  valor,
) {
  if (!valor) {
    return "";
  }

  if (
    typeof valor.toDate === "function"
  ) {
    return obterDataISO(valor.toDate());
  }

  if (valor instanceof Date) {
    return obterDataISO(valor);
  }

  const texto = String(valor).trim();

  if (!texto) {
    return "";
  }

  return texto.includes("T")
    ? texto.split("T")[0]
    : texto;
}

function formatarData(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "Não informado";
  }

  return data.toLocaleDateString("pt-BR");
}

/* =========================================
   ENDEREÇO
========================================= */

function obterEnderecoCompleto(
  condominio,
) {
  const endereco =
    condominio?.endereco || {};

  const primeiraLinha = [
    endereco.logradouro,
    endereco.numero,
  ]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [
    endereco.complemento,
    endereco.bairro,
  ]
    .filter(Boolean)
    .join(" — ");

  const terceiraLinha = [
    endereco.cidade,
    endereco.estado,
  ]
    .filter(Boolean)
    .join("/");

  return [
    primeiraLinha,
    segundaLinha,
    terceiraLinha,
  ]
    .filter(Boolean)
    .join(" — ");
}

/* =========================================
   FORMATAÇÃO
========================================= */

function aplicarMascaraCNPJ(valor) {
  const numeros = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 14);

  if (!numeros) {
    return "";
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3",
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2",
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2",
    );
}

function obterIniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "CL";
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${
    partes[0][0]
  }${
    partes[partes.length - 1][0]
  }`.toUpperCase();
}

/* =========================================
   DOCUMENTOS
========================================= */

function atualizarStatusDocumento(
  documento,
) {
  if (!documento?.vencimento) {
    return "regular";
  }

  const vencimento =
    criarDataLocal(documento.vencimento);

  if (
    !vencimento ||
    Number.isNaN(vencimento.getTime())
  ) {
    return "pendente";
  }

  const hoje = obterInicioDoDia();

  if (vencimento < hoje) {
    return "vencido";
  }

  return "regular";
}

function formatarTamanhoDocumento(
  tamanho,
) {
  const valor =
    Math.max(0, Number(tamanho) || 0);

  if (valor < 1024) {
    return `${valor} bytes`;
  }

  if (valor < 1024 * 1024) {
    return `${(
      valor / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    valor /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatarDataHoraDocumento(
  valor,
) {
  if (!valor) {
    return "";
  }

  const data =
    typeof valor?.toDate === "function"
      ? valor.toDate()
      : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterNomeDocumentoParaDownload(
  documento,
) {
  const nomeBase = String(
    documento?.nomeOriginal ||
      documento?.nome ||
      "documento.pdf",
  )
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  return /\.pdf$/i.test(nomeBase)
    ? nomeBase
    : `${nomeBase}.pdf`;
}

/* =========================================
   HISTÓRICO
========================================= */

function normalizarHistorico(
  historico,
) {
  if (!Array.isArray(historico)) {
    return [];
  }

  return historico
    .filter(
      (registro) =>
        registro &&
        typeof registro === "object",
    )
    .map((registro, index) => ({
      id:
        String(registro.id || "").trim() ||
        `HIST-${index}`,

      tipo:
        String(
          registro.tipo || "cadastro",
        ).trim(),

      titulo:
        String(
          registro.titulo ||
            "Atualização do cadastro",
        ).trim(),

      descricao:
        String(
          registro.descricao || "",
        ).trim(),

      data:
        converterDataDoFirestoreParaISO(
          registro.data,
        ),

      origemFirestore: false,
    }));
}

/* =========================================
   ESTRUTURA DE AMBIENTES
========================================= */

function normalizarEquipamentoDaEstrutura(
  valor,
) {
  const dados =
    valor &&
    typeof valor === "object"
      ? valor
      : {
          equipamentoId: valor,
        };

  const equipamentoId = String(
    dados.equipamentoId ||
      dados.equipmentId ||
      dados.id ||
      dados.codigo ||
      "",
  ).trim();

  if (!equipamentoId) {
    return null;
  }

  return {
    equipamentoId,

    equipamentoNome: String(
      dados.equipamentoNome ||
        dados.nome ||
        equipamentoId,
    ).trim(),

    categoria: String(
      dados.categoria ||
        "Outros equipamentos",
    ).trim(),

    quantidade: Math.max(
      1,
      Number(dados.quantidade) || 1,
    ),

    observacao: String(
      dados.observacao ||
        dados.localizacao ||
        dados.notas ||
        "",
    ).trim(),
  };
}

function normalizarEstruturaDeAmbientes(
  estrutura,
) {
  if (!Array.isArray(estrutura)) {
    return [];
  }

  return estrutura
    .map((valor) => {
      if (
        !valor ||
        typeof valor !== "object"
      ) {
        return null;
      }

      const ambienteId = String(
        valor.ambienteId ||
          valor.environmentId ||
          valor.id ||
          valor.codigo ||
          "",
      ).trim();

      if (!ambienteId) {
        return null;
      }

      const legado =
        Boolean(valor.legado) ||
        ambienteId ===
          "sem-ambiente-definido";

      const equipamentosOriginais =
        Array.isArray(valor.equipamentos)
          ? valor.equipamentos
          : Array.isArray(
                valor.equipamentosIds,
              )
            ? valor.equipamentosIds
            : Array.isArray(
                  valor.equipmentIds,
                )
              ? valor.equipmentIds
              : [];

      const equipamentos =
        equipamentosOriginais
          .map(
            normalizarEquipamentoDaEstrutura,
          )
          .filter(Boolean);

      return {
        ambienteId,

        ambienteNome: String(
          valor.ambienteNome ||
            valor.nome ||
            (legado
              ? "Sem ambiente definido"
              : ambienteId),
        ).trim(),

        categoria: String(
          valor.categoria ||
            (legado
              ? "Cadastro anterior"
              : "Outros ambientes"),
        ).trim(),

        observacao: String(
          valor.observacao ||
            valor.observacoes ||
            valor.notas ||
            "",
        ).trim(),

        legado,

        equipamentos,
      };
    })
    .filter(Boolean);
}

/* =========================================
   MAPEAMENTO DO CONDOMÍNIO
========================================= */

function mapearCondominioDoFirestore(
  snapshot,
) {
  const dados = snapshot.data();

  const endereco =
    dados.endereco || {};

  const estruturaAmbientes =
    normalizarEstruturaDeAmbientes(
      dados.estruturaAmbientes ||
        dados.ambientesEquipamentos ||
        [],
    );

  const documentos =
    Array.isArray(dados.documentos)
      ? dados.documentos
          .filter(
            (documento) =>
              documento &&
              typeof documento === "object",
          )
          .map(
            (
              documento,
              index,
            ) => {
              let enviadoEm = "";

              if (
                documento.enviadoEm &&
                typeof documento.enviadoEm
                  .toDate === "function"
              ) {
                enviadoEm =
                  documento.enviadoEm
                    .toDate()
                    .toISOString();
              } else {
                enviadoEm = String(
                  documento.enviadoEm ||
                    "",
                ).trim();
              }

              return {
                id:
                  String(
                    documento.id || "",
                  ).trim() ||
                  `DOC-${index}`,

                nome:
                  String(
                    documento.nome ||
                      "Documento",
                  ).trim() ||
                  "Documento",

                nomeOriginal:
                  String(
                    documento.nomeOriginal ||
                      "",
                  ).trim(),

                storagePath:
                  String(
                    documento.storagePath ||
                      "",
                  ).trim(),

                contentType:
                  String(
                    documento.contentType ||
                      "application/pdf",
                  ).trim(),

                tamanho:
                  Math.max(
                    0,
                    Number(
                      documento.tamanho,
                    ) || 0,
                  ),

                vencimento:
                  converterDataDoFirestoreParaISO(
                    documento.vencimento,
                  ),

                status:
                  atualizarStatusDocumento(
                    documento,
                  ),

                enviadoPorUid:
                  String(
                    documento.enviadoPorUid ||
                      "",
                  ).trim(),

                enviadoEm,
              };
            },
          )
      : [];

  const clientesVinculados =
    Array.isArray(
      dados.clientesVinculados,
    )
      ? dados.clientesVinculados.map(
          (vinculo) => ({
            clienteId: String(
              vinculo.clienteId || "",
            ).trim(),

            nome: String(
              vinculo.nome ||
                vinculo.clienteNome ||
                "",
            ).trim(),

            papel:
              String(
                vinculo.papel || "outro",
              ).trim(),

            contatoPrincipal:
              Boolean(
                vinculo.contatoPrincipal,
              ),

            responsavelFinanceiro:
              Boolean(
                vinculo.responsavelFinanceiro,
              ),
          }),
        )
      : [];

  return {
    id: snapshot.id,

    codigo:
      String(
        dados.codigo || "",
      ).trim() ||
      `COND-${snapshot.id
        .slice(0, 6)
        .toUpperCase()}`,

    nome:
      String(
        dados.nome || "",
      ).trim() ||
      "Condomínio sem nome",

    cnpj:
      String(
        dados.cnpj || "",
      ).trim(),

    status:
      [
        "ativo",
        "atencao",
        "inativo",
      ].includes(dados.status)
        ? dados.status
        : "ativo",

    blocos: Math.max(
      0,
      Number(dados.blocos) || 0,
    ),

    unidades: Math.max(
      0,
      Number(dados.unidades) || 0,
    ),

    endereco: {
      cep:
        endereco.cep ||
        dados.cep ||
        "",

      logradouro:
        endereco.logradouro ||
        endereco.rua ||
        dados.logradouro ||
        dados.rua ||
        "",

      numero:
        endereco.numero ||
        dados.numero ||
        "",

      complemento:
        endereco.complemento ||
        dados.complemento ||
        "",

      bairro:
        endereco.bairro ||
        dados.bairro ||
        "",

      cidade:
        endereco.cidade ||
        dados.cidade ||
        "",

      estado:
        endereco.estado ||
        dados.estado ||
        "SP",
    },

    observacoes:
      String(
        dados.observacoes || "",
      ).trim(),

    clientesVinculados,

    clientesIds:
      normalizarListaDeIds(
        dados.clientesIds,
      ),

    estruturaAmbientes,

    documentos,

    historico:
      normalizarHistorico(
        dados.historico,
      ),

    criadoEm:
      converterDataDoFirestoreParaISO(
        dados.criadoEm,
      ),

    atualizadoEm:
      converterDataDoFirestoreParaISO(
        dados.atualizadoEm,
      ),
  };
}

/* =========================================
   ORDENS NO HISTÓRICO
========================================= */

function obterCondominioIdDaOrdem(
  ordem,
) {
  return String(
    ordem?.condominio?.id ||
      ordem?.condominioId ||
      "",
  ).trim();
}

function criarHistoricoDaOrdem(
  ordem,
) {
  const vistoria =
    ordem.tipoAtendimento === "vistoria";

  const codigo =
    ordem.codigo || "Ordem";

  const titulo =
    ordem.titulo ||
    (vistoria
      ? "Vistoria técnica"
      : "Ordem de serviço");

  return {
    id: `ordem-${ordem.id}`,

    tipo:
      vistoria
        ? "vistoria"
        : "ordem",

    titulo:
      `${codigo} — ${titulo}`,

    descricao:
      ordem.status
        ? `Status atual: ${String(
            ordem.status,
          ).replace(/-/g, " ")}.`
        : "Ordem registrada no sistema.",

    data:
      converterDataDoFirestoreParaISO(
        ordem.atualizadoEm ||
          ordem.criadoEm,
      ),

    origemFirestore: true,
  };
}

function aplicarOrdensAosCondominios() {
  condominios.forEach(
    (condominio) => {
      const historicoPersistido =
        condominio.historico.filter(
          (registro) =>
            !registro.origemFirestore,
        );

      const ordensRelacionadas =
        ordens.filter(
          (ordem) =>
            obterCondominioIdDaOrdem(
              ordem,
            ) === condominio.id,
        );

      const historicoOperacional =
        ordensRelacionadas.map(
          criarHistoricoDaOrdem,
        );

      condominio.historico = [
        ...historicoPersistido,
        ...historicoOperacional,
      ];
    },
  );
}

/* =========================================
   RESPONSÁVEIS
========================================= */

function obterNomeDoVinculo(
  vinculo,
) {
  const nomeSalvo =
    String(
      vinculo?.nome || "",
    ).trim();

  if (nomeSalvo) {
    return nomeSalvo;
  }

  const uidAtual =
    String(
      sessaoAtual?.uid || "",
    ).trim();

  if (
    vinculo?.clienteId ===
    uidAtual
  ) {
    return (
      String(
        sessaoAtual?.nome || "",
      ).trim() ||
      "Você"
    );
  }

  return "Responsável vinculado";
}

function obterResponsavelPrincipal(
  condominio,
) {
  const vinculos =
    Array.isArray(
      condominio?.clientesVinculados,
    )
      ? condominio.clientesVinculados
      : [];

  return (
    vinculos.find(
      (vinculo) =>
        vinculo.contatoPrincipal,
    ) ||
    vinculos[0] ||
    null
  );
}

/* =========================================
   FEEDBACK
========================================= */

function mostrarFeedback(
  mensagem,
) {
  if (!feedbackMessage) {
    return;
  }

  window.clearTimeout(
    feedbackTimer,
  );

  feedbackMessage.textContent =
    mensagem;

  feedbackMessage.hidden = false;

  feedbackTimer =
    window.setTimeout(() => {
      feedbackMessage.hidden = true;
    }, 3200);
}

/* =========================================
   CARREGAMENTO DO FIRESTORE
========================================= */

async function carregarDados() {
  const uid =
    String(
      sessaoAtual?.uid || "",
    ).trim();

  if (!uid) {
    throw new Error(
      "CLIENT_UID_NOT_FOUND",
    );
  }

  const consultaCondominios =
    query(
      collection(
        db,
        "condominios",
      ),
      where(
        "clientesIds",
        "array-contains",
        uid,
      ),
    );

  const consultaOrdensDoCliente =
    query(
      collection(
        db,
        "ordens",
      ),
      where(
        "clienteUid",
        "==",
        uid,
      ),
    );

  const consultaOrdensAutorizadas =
    query(
      collection(
        db,
        "ordens",
      ),
      where(
        "clientesAutorizadosIds",
        "array-contains",
        uid,
      ),
    );

  const resultados =
    await Promise.allSettled([
      getDocs(
        consultaCondominios,
      ),

      getDocs(
        consultaOrdensDoCliente,
      ),

      getDocs(
        consultaOrdensAutorizadas,
      ),
    ]);

  const [
    resultadoCondominios,
    resultadoOrdensDoCliente,
    resultadoOrdensAutorizadas,
  ] = resultados;

  if (
    resultadoCondominios.status ===
    "rejected"
  ) {
    throw resultadoCondominios.reason;
  }

  condominios =
    resultadoCondominios.value.docs
      .map(
        mapearCondominioDoFirestore,
      )
      .sort(
        (
          condominioA,
          condominioB,
        ) =>
          condominioA.nome.localeCompare(
            condominioB.nome,
            "pt-BR",
          ),
      );

  const mapaDeOrdens =
    new Map();

  [
    resultadoOrdensDoCliente,
    resultadoOrdensAutorizadas,
  ].forEach((resultado) => {
    if (
      resultado.status !==
      "fulfilled"
    ) {
      console.warn(
        "[Meus Condomínios] Uma consulta de ordens não pôde ser carregada:",
        resultado.reason,
      );

      return;
    }

    resultado.value.docs.forEach(
      (snapshot) => {
        mapaDeOrdens.set(
          snapshot.id,
          {
            id: snapshot.id,
            ...snapshot.data(),
          },
        );
      },
    );
  });

  ordens =
    [...mapaDeOrdens.values()];

  aplicarOrdensAosCondominios();
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const total =
    condominios.length;

  const ativos =
    condominios.filter(
      (condominio) =>
        condominio.status === "ativo",
    ).length;

  const ambientes =
    condominios.reduce(
      (totalAtual, condominio) =>
        totalAtual +
        condominio
          .estruturaAmbientes
          .length,
      0,
    );

  const documentos =
    condominios.reduce(
      (totalAtual, condominio) =>
        totalAtual +
        condominio.documentos.length,
      0,
    );

  summaryTotal.textContent =
    String(total);

  summaryActive.textContent =
    String(ativos);

  summaryEnvironments.textContent =
    String(ambientes);

  summaryDocuments.textContent =
    String(documentos);
}

/* =========================================
   FILTRO POR CONDOMÍNIO
========================================= */

function popularFiltroDeCondominios() {
  condominiumFilter.innerHTML = "";

  const optionTodos =
    document.createElement("option");

  optionTodos.value = "";

  optionTodos.textContent =
    "Todos";

  condominiumFilter.appendChild(
    optionTodos,
  );

  condominios.forEach(
    (condominio) => {
      const option =
        document.createElement(
          "option",
        );

      option.value =
        condominio.id;

      option.textContent =
        condominio.nome;

      condominiumFilter.appendChild(
        option,
      );
    },
  );
}

/* =========================================
   PESQUISA
========================================= */

function condominioCorrespondeAPesquisa(
  condominio,
) {
  const pesquisa =
    normalizarTexto(
      condominiumsSearch.value,
    );

  if (!pesquisa) {
    return true;
  }

  const endereco =
    obterEnderecoCompleto(
      condominio,
    );

  const conteudo =
    normalizarTexto(
      [
        condominio.codigo,
        condominio.nome,
        condominio.cnpj,
        condominio.endereco.cidade,
        condominio.endereco.estado,
        endereco,
      ].join(" "),
    );

  return conteudo.includes(
    pesquisa,
  );
}

function obterCondominiosVisiveis() {
  const filtroId =
    String(
      condominiumFilter.value || "",
    ).trim();

  return condominios.filter(
    (condominio) => {
      if (
        filtroId &&
        condominio.id !== filtroId
      ) {
        return false;
      }

      return condominioCorrespondeAPesquisa(
        condominio,
      );
    },
  );
}

/* =========================================
   CARDS
========================================= */

function fecharCard(card) {
  const details =
    card.querySelector(
      ".condominium-card__details",
    );

  const toggle =
    card.querySelector(
      ".condominium-card__toggle",
    );

  details.hidden = true;

  toggle.setAttribute(
    "aria-expanded",
    "false",
  );

  toggle.setAttribute(
    "aria-label",
    "Mostrar informações do condomínio",
  );

  card.classList.remove(
    "is-expanded",
  );
}

function fecharTodosOsCards(
  excecao = null,
) {
  document
    .querySelectorAll(
      ".condominium-card",
    )
    .forEach((card) => {
      if (card !== excecao) {
        fecharCard(card);
      }
    });
}

function alternarCard(card) {
  const details =
    card.querySelector(
      ".condominium-card__details",
    );

  const toggle =
    card.querySelector(
      ".condominium-card__toggle",
    );

  const seraAberto =
    details.hidden;

  if (seraAberto) {
    fecharTodosOsCards(card);
  }

  details.hidden =
    !seraAberto;

  toggle.setAttribute(
    "aria-expanded",
    String(seraAberto),
  );

  toggle.setAttribute(
    "aria-label",
    seraAberto
      ? "Ocultar informações do condomínio"
      : "Mostrar informações do condomínio",
  );

  card.classList.toggle(
    "is-expanded",
    seraAberto,
  );
}

function contarEquipamentos(
  condominio,
) {
  return condominio
    .estruturaAmbientes
    .reduce(
      (
        total,
        ambiente,
      ) =>
        total +
        ambiente.equipamentos.reduce(
          (
            totalEquipamentos,
            equipamento,
          ) =>
            totalEquipamentos +
            Math.max(
              1,
              Number(
                equipamento.quantidade,
              ) || 1,
            ),
          0,
        ),
      0,
    );
}

function preencherCard(
  condominio,
) {
  const fragmento =
    condominiumCardTemplate.content.cloneNode(
      true,
    );

  const card =
    fragmento.querySelector(
      ".condominium-card",
    );

  const code =
    card.querySelector(
      ".condominium-card__code",
    );

  const status =
    card.querySelector(
      ".condominium-card__status",
    );

  const name =
    card.querySelector(
      ".condominium-card__name",
    );

  const manager =
    card.querySelector(
      ".condominium-card__manager",
    );

  const city =
    card.querySelector(
      ".condominium-card__city",
    );

  const equipmentCount =
    card.querySelector(
      ".condominium-card__equipment-count",
    );

  const documentCount =
    card.querySelector(
      ".condominium-card__document-count",
    );

  const toggle =
    card.querySelector(
      ".condominium-card__toggle",
    );

  const details =
    card.querySelector(
      ".condominium-card__details",
    );

  const address =
    card.querySelector(
      ".condominium-card__address",
    );

  const contact =
    card.querySelector(
      ".condominium-card__contact",
    );

  const environmentCount =
    card.querySelector(
      ".condominium-card__environment-count",
    );

  const documentsSummary =
    card.querySelector(
      ".condominium-card__documents-summary",
    );

  const openButton =
    card.querySelector(
      '[data-condominium-action="open"]',
    );

  const statusData =
    statusConfig[
      condominio.status
    ] ||
    statusConfig.ativo;

  const principal =
    obterResponsavelPrincipal(
      condominio,
    );

  const quantidadeEquipamentos =
    contarEquipamentos(
      condominio,
    );

  card.dataset.condominiumId =
    condominio.id;

  code.textContent =
    condominio.codigo;

  status.textContent =
    statusData.nome;

  status.classList.add(
    statusData.classe,
  );

  name.textContent =
    condominio.nome;

  manager.textContent =
    principal
      ? obterNomeDoVinculo(
          principal,
        )
      : "Sem responsável informado";

  city.textContent =
    condominio.endereco.cidade
      ? [
          condominio.endereco.cidade,
          condominio.endereco.estado,
        ]
          .filter(Boolean)
          .join("/")
      : "Cidade não informada";

  equipmentCount.textContent =
    formatarQuantidade(
      quantidadeEquipamentos,
      "equipamento",
      "equipamentos",
    );

  documentCount.textContent =
    formatarQuantidade(
      condominio.documentos.length,
      "documento",
      "documentos",
    );

  address.textContent =
    obterEnderecoCompleto(
      condominio,
    ) ||
    "Endereço não informado";

  contact.textContent =
    principal
      ? obterNomeDoVinculo(
          principal,
        )
      : "Sem contato principal";

  environmentCount.textContent =
    formatarQuantidade(
      condominio
        .estruturaAmbientes.length,
      "ambiente",
      "ambientes",
    );

  documentsSummary.textContent =
    formatarQuantidade(
      condominio.documentos.length,
      "documento disponível",
      "documentos disponíveis",
    );

  const detailId =
    `my-condominium-details-${condominio.id}`;

  details.id = detailId;

  toggle.setAttribute(
    "aria-controls",
    detailId,
  );

  toggle.setAttribute(
    "aria-label",
    `Mostrar informações de ${condominio.nome}`,
  );

  toggle.addEventListener(
    "click",
    () => {
      alternarCard(card);
    },
  );

  openButton.addEventListener(
    "click",
    () => {
      abrirModalDeCondominio(
        condominio,
      );
    },
  );

  return fragmento;
}

function renderizarCondominios() {
  condominiumsList.innerHTML = "";

  const visiveis =
    obterCondominiosVisiveis();

  condominiumsCount.textContent =
    formatarQuantidade(
      visiveis.length,
      "item",
      "itens",
    );

  visiveis.forEach(
    (condominio) => {
      condominiumsList.appendChild(
        preencherCard(
          condominio,
        ),
      );
    },
  );

  const semResultados =
    visiveis.length === 0;

  condominiumsList.hidden =
    semResultados;

  emptyState.hidden =
    !semResultados;

  if (!semResultados) {
    return;
  }

  if (
    condominios.length === 0
  ) {
    emptyStateTitle.textContent =
      "Nenhum condomínio vinculado";

    emptyStateDescription.textContent =
      "Seu cadastro ainda não possui condomínios vinculados.";

    clearCondominiumSearchButton.hidden =
      true;

    return;
  }

  emptyStateTitle.textContent =
    "Nenhum condomínio encontrado";

  emptyStateDescription.textContent =
    "Não existem condomínios correspondentes à pesquisa ou ao filtro selecionado.";

  clearCondominiumSearchButton.hidden =
    false;
}

/* =========================================
   ABAS DO MODAL
========================================= */

function alterarAbaDoModal(
  aba,
) {
  modalTabButtons.forEach(
    (button) => {
      const ativa =
        button.dataset.modalTab ===
        aba;

      button.classList.toggle(
        "is-active",
        ativa,
      );

      button.setAttribute(
        "aria-pressed",
        String(ativa),
      );
    },
  );

  modalPanels.forEach(
    (panel) => {
      const ativo =
        panel.dataset.modalPanel ===
        aba;

      panel.hidden = !ativo;

      panel.classList.toggle(
        "is-active",
        ativo,
      );
    },
  );
}

/* =========================================
   DADOS GERAIS DO MODAL
========================================= */

function renderizarDadosGerais() {
  if (!condominioAtual) {
    return;
  }

  const statusData =
    statusConfig[
      condominioAtual.status
    ] ||
    statusConfig.ativo;

  detailCondominiumName.textContent =
    condominioAtual.nome ||
    "Não informado";

  detailCondominiumCode.textContent =
    condominioAtual.codigo ||
    "Não informado";

  detailCondominiumDocument.textContent =
    condominioAtual.cnpj
      ? aplicarMascaraCNPJ(
          condominioAtual.cnpj,
        )
      : "Não informado";

  detailCondominiumStatus.textContent =
    statusData.nome;

  detailCondominiumBlocks.textContent =
    String(
      condominioAtual.blocos,
    );

  detailCondominiumUnits.textContent =
    String(
      condominioAtual.unidades,
    );

  detailCondominiumAddress.textContent =
    obterEnderecoCompleto(
      condominioAtual,
    ) ||
    "Endereço não informado";

  detailCondominiumNotes.textContent =
    condominioAtual.observacoes ||
    "Nenhuma observação cadastrada.";
}

/* =========================================
   RESPONSÁVEIS NO MODAL
========================================= */

function renderizarResponsaveis() {
  linkedClientsList.innerHTML = "";

  if (!condominioAtual) {
    linkedClientsCount.textContent =
      "0 vínculos";

    linkedClientsList.hidden =
      true;

    linkedClientsEmpty.hidden =
      false;

    return;
  }

  const vinculos =
    condominioAtual
      .clientesVinculados;

  linkedClientsCount.textContent =
    formatarQuantidade(
      vinculos.length,
      "vínculo",
      "vínculos",
    );

  linkedClientsEmpty.hidden =
    vinculos.length > 0;

  linkedClientsList.hidden =
    vinculos.length === 0;

  vinculos.forEach(
    (vinculo) => {
      const fragmento =
        linkedClientTemplate.content.cloneNode(
          true,
        );

      const card =
        fragmento.querySelector(
          ".linked-client-card",
        );

      const avatar =
        card.querySelector(
          ".linked-client-card__avatar",
        );

      const name =
        card.querySelector(
          ".linked-client-card__name",
        );

      const role =
        card.querySelector(
          ".linked-client-card__role",
        );

      const primaryBadge =
        card.querySelector(
          "[data-primary-badge]",
        );

      const financialBadge =
        card.querySelector(
          "[data-financial-badge]",
        );

      const nome =
        obterNomeDoVinculo(
          vinculo,
        );

      avatar.textContent =
        obterIniciais(nome);

      name.textContent =
        nome;

      role.textContent =
        papelConfig[
          vinculo.papel
        ] ||
        "Responsável";

      primaryBadge.hidden =
        !vinculo.contatoPrincipal;

      financialBadge.hidden =
        !vinculo.responsavelFinanceiro;

      linkedClientsList.appendChild(
        fragmento,
      );
    },
  );
}

/* =========================================
   AMBIENTES NO MODAL
========================================= */

function criarCardDeAmbiente(
  ambiente,
  index,
) {
  const fragmento =
    condominiumEnvironmentTemplate.content.cloneNode(
      true,
    );

  const card =
    fragmento.querySelector(
      ".condominium-environment-card",
    );

  const name =
    card.querySelector(
      ".condominium-environment-card__name",
    );

  const category =
    card.querySelector(
      ".condominium-environment-card__category",
    );

  const count =
    card.querySelector(
      ".condominium-environment-card__count",
    );

  const legacyBadge =
    card.querySelector(
      ".condominium-environment-card__legacy",
    );

  const toggle =
    card.querySelector(
      ".condominium-environment-card__toggle",
    );

  const details =
    card.querySelector(
      ".condominium-environment-card__details",
    );

  const equipmentList =
    card.querySelector(
      ".condominium-environment-card__equipment-list",
    );

  const equipamentos =
    Array.isArray(
      ambiente.equipamentos,
    )
      ? ambiente.equipamentos
      : [];

  const quantidadeTotal =
    equipamentos.reduce(
      (
        total,
        equipamento,
      ) =>
        total +
        Math.max(
          1,
          Number(
            equipamento.quantidade,
          ) || 1,
        ),
      0,
    );

  card.dataset.environmentIndex =
    String(index);

  card.classList.toggle(
    "is-legacy",
    Boolean(
      ambiente.legado,
    ),
  );

  name.textContent =
    ambiente.ambienteNome ||
    "Ambiente sem nome";

  category.textContent =
    ambiente.categoria ||
    "Outros ambientes";

  count.textContent =
    formatarQuantidade(
      quantidadeTotal,
      "equipamento",
      "equipamentos",
    );

  legacyBadge.hidden =
    !ambiente.legado;

  equipamentos.forEach(
    (equipamento) => {
      const equipamentoFragmento =
        condominiumEnvironmentEquipmentTemplate.content.cloneNode(
          true,
        );

      const equipmentName =
        equipamentoFragmento.querySelector(
          ".condominium-environment-equipment__name",
        );

      const equipmentCategory =
        equipamentoFragmento.querySelector(
          ".condominium-environment-equipment__category",
        );

      const equipmentQuantity =
        equipamentoFragmento.querySelector(
          ".condominium-environment-equipment__quantity strong",
        );

      const equipmentObservation =
        equipamentoFragmento.querySelector(
          ".condominium-environment-equipment__observation",
        );

      equipmentName.textContent =
        equipamento.equipamentoNome ||
        equipamento.equipamentoId;

      equipmentCategory.textContent =
        equipamento.categoria ||
        "Outros equipamentos";

      equipmentQuantity.textContent =
        String(
          Math.max(
            1,
            Number(
              equipamento.quantidade,
            ) || 1,
          ),
        );

      const observacao =
        String(
          equipamento.observacao ||
            "",
        ).trim();

      equipmentObservation.textContent =
        observacao;

      equipmentObservation.hidden =
        !observacao;

      equipmentList.appendChild(
        equipamentoFragmento,
      );
    },
  );

  toggle.addEventListener(
    "click",
    () => {
      const abrir =
        details.hidden;

      details.hidden =
        !abrir;

      toggle.setAttribute(
        "aria-expanded",
        String(abrir),
      );
    },
  );

  return fragmento;
}

function renderizarEstrutura() {
  condominiumEnvironmentsList.innerHTML =
    "";

  if (!condominioAtual) {
    condominiumEnvironmentsList.hidden =
      true;

    condominiumEnvironmentsEmpty.hidden =
      false;

    selectedEquipmentCount.textContent =
      "0 equipamentos";

    return;
  }

  const estrutura =
    condominioAtual
      .estruturaAmbientes;

  const quantidadeEquipamentos =
    contarEquipamentos(
      condominioAtual,
    );

  selectedEquipmentCount.textContent =
    formatarQuantidade(
      quantidadeEquipamentos,
      "equipamento",
      "equipamentos",
    );

  estrutura.forEach(
    (
      ambiente,
      index,
    ) => {
      condominiumEnvironmentsList.appendChild(
        criarCardDeAmbiente(
          ambiente,
          index,
        ),
      );
    },
  );

  const listaVazia =
    estrutura.length === 0;

  condominiumEnvironmentsList.hidden =
    listaVazia;

  condominiumEnvironmentsEmpty.hidden =
    !listaVazia;
}

/* =========================================
   ABRIR DOCUMENTO
========================================= */

async function obterUrlDocumento(
  documento,
) {
  const caminho =
    String(
      documento?.storagePath ||
        "",
    ).trim();

  if (!caminho) {
    throw new Error(
      "DOCUMENT_STORAGE_PATH_NOT_FOUND",
    );
  }

  return getDownloadURL(
    storageRef(
      storage,
      caminho,
    ),
  );
}

async function abrirDocumentoDoCondominio(
  documento,
) {
  const novaJanela =
    window.open(
      "",
      "_blank",
    );

  if (!novaJanela) {
    mostrarFeedback(
      "O navegador bloqueou a abertura do documento.",
    );

    return;
  }

  try {
    const url =
      await obterUrlDocumento(
        documento,
      );

    novaJanela.opener =
      null;

    novaJanela.location.href =
      url;
  } catch (error) {
    novaJanela.close();

    console.error(
      "[Meus Condomínios] Não foi possível abrir o documento:",
      error,
    );

    mostrarFeedback(
      error?.code ===
        "storage/unauthorized"
        ? "Você não possui permissão para abrir este documento."
        : "Não foi possível abrir o documento.",
    );
  }
}

async function baixarDocumentoDoCondominio(
  documento,
) {
  const caminho =
    String(
      documento?.storagePath ||
        "",
    ).trim();

  if (!caminho) {
    mostrarFeedback(
      "O arquivo deste documento não foi encontrado.",
    );

    return;
  }

  try {
    mostrarFeedback(
      "Preparando o download do documento...",
    );

    const blob =
      await getBlob(
        storageRef(
          storage,
          caminho,
        ),
        tamanhoMaximoDocumento +
          1024 * 1024,
      );

    const urlTemporaria =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a",
      );

    link.href =
      urlTemporaria;

    link.download =
      obterNomeDocumentoParaDownload(
        documento,
      );

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(
        urlTemporaria,
      );
    }, 1000);

    mostrarFeedback(
      "Download iniciado.",
    );
  } catch (error) {
    console.error(
      "[Meus Condomínios] Não foi possível baixar o documento:",
      error,
    );

    mostrarFeedback(
      error?.code ===
        "storage/unauthorized"
        ? "Você não possui permissão para baixar este documento."
        : "Não foi possível baixar o documento.",
    );
  }
}

/* =========================================
   DOCUMENTOS NO MODAL
========================================= */

function renderizarDocumentos() {
  documentsList.innerHTML = "";

  documentsLoading.hidden =
    true;

  if (!condominioAtual) {
    documentsCount.textContent =
      "0 documentos";

    documentsList.hidden =
      true;

    documentsEmpty.hidden =
      false;

    return;
  }

  const documentos =
    condominioAtual.documentos;

  documentsCount.textContent =
    formatarQuantidade(
      documentos.length,
      "documento",
      "documentos",
    );

  documentsEmpty.hidden =
    documentos.length > 0;

  documentsList.hidden =
    documentos.length === 0;

  documentos.forEach(
    (documento) => {
      documento.status =
        atualizarStatusDocumento(
          documento,
        );

      const fragmento =
        documentTemplate.content.cloneNode(
          true,
        );

      const name =
        fragmento.querySelector(
          ".document-card__name",
        );

      const metadata =
        fragmento.querySelector(
          ".document-card__metadata",
        );

      const expiration =
        fragmento.querySelector(
          ".document-card__expiration",
        );

      const status =
        fragmento.querySelector(
          ".document-card__status",
        );

      const openButton =
        fragmento.querySelector(
          ".document-card__action--open",
        );

      const downloadButton =
        fragmento.querySelector(
          ".document-card__action--download",
        );

      name.textContent =
        documento.nome;

      const metadados = [
        "PDF",
      ];

      if (
        documento.tamanho > 0
      ) {
        metadados.push(
          formatarTamanhoDocumento(
            documento.tamanho,
          ),
        );
      }

      const enviadoEm =
        formatarDataHoraDocumento(
          documento.enviadoEm,
        );

      if (enviadoEm) {
        metadados.push(
          `Enviado em ${enviadoEm}`,
        );
      }

      metadata.textContent =
        documento.storagePath
          ? metadados.join(" • ")
          : "Arquivo não disponível";

      expiration.textContent =
        documento.vencimento
          ? `Vencimento: ${formatarData(
              documento.vencimento,
            )}`
          : "Sem data de vencimento";

      if (
        documento.status ===
        "regular"
      ) {
        status.textContent =
          "Regular";

        status.classList.add(
          "status--regular",
        );
      }

      if (
        documento.status ===
        "pendente"
      ) {
        status.textContent =
          "Pendente";

        status.classList.add(
          "status--pendente",
        );
      }

      if (
        documento.status ===
        "vencido"
      ) {
        status.textContent =
          "Vencido";

        status.classList.add(
          "status--vencido",
        );
      }

      const possuiArquivo =
        Boolean(
          String(
            documento.storagePath ||
              "",
          ).trim(),
        );

      openButton.disabled =
        !possuiArquivo;

      downloadButton.disabled =
        !possuiArquivo;

      openButton.addEventListener(
        "click",
        () => {
          abrirDocumentoDoCondominio(
            documento,
          );
        },
      );

      downloadButton.addEventListener(
        "click",
        () => {
          baixarDocumentoDoCondominio(
            documento,
          );
        },
      );

      documentsList.appendChild(
        fragmento,
      );
    },
  );
}

/* =========================================
   HISTÓRICO NO MODAL
========================================= */

function criarItemHistorico(
  registro,
) {
  const article =
    document.createElement(
      "article",
    );

  article.className =
    "history-item";

  const icon =
    document.createElement(
      "span",
    );

  icon.className =
    "history-item__icon";

  const simbolos = {
    ordem: "OS",
    vistoria: "VI",
    documento: "DO",
    cadastro: "CA",
  };

  icon.textContent =
    simbolos[registro.tipo] ||
    "HI";

  const content =
    document.createElement(
      "div",
    );

  content.className =
    "history-item__content";

  const top =
    document.createElement(
      "div",
    );

  top.className =
    "history-item__top";

  const title =
    document.createElement(
      "strong",
    );

  title.className =
    "history-item__title";

  title.textContent =
    registro.titulo;

  const date =
    document.createElement(
      "span",
    );

  date.className =
    "history-item__date";

  date.textContent =
    formatarData(
      registro.data,
    );

  const description =
    document.createElement(
      "p",
    );

  description.className =
    "history-item__description";

  description.textContent =
    registro.descricao ||
    "Sem descrição adicional.";

  top.append(
    title,
    date,
  );

  content.append(
    top,
    description,
  );

  article.append(
    icon,
    content,
  );

  return article;
}

function obterTimestampDoHistorico(
  registro,
) {
  const data =
    criarDataLocal(
      registro?.data,
    );

  return data
    ? data.getTime()
    : 0;
}

function renderizarHistorico() {
  condominiumHistory.innerHTML =
    "";

  if (!condominioAtual) {
    condominiumHistory.hidden =
      true;

    historyEmpty.hidden =
      false;

    return;
  }

  const historico = [
    ...condominioAtual.historico,
  ].sort(
    (
      registroA,
      registroB,
    ) =>
      obterTimestampDoHistorico(
        registroB,
      ) -
      obterTimestampDoHistorico(
        registroA,
      ),
  );

  historyEmpty.hidden =
    historico.length > 0;

  condominiumHistory.hidden =
    historico.length === 0;

  historico.forEach(
    (registro) => {
      condominiumHistory.appendChild(
        criarItemHistorico(
          registro,
        ),
      );
    },
  );
}

/* =========================================
   MODAL
========================================= */

function abrirModalDeCondominio(
  condominio,
) {
  if (!condominio) {
    return;
  }

  condominioAtual =
    condominio;

  condominiumModalEyebrow.textContent =
    condominio.codigo ||
    "Condomínio";

  condominiumModalTitle.textContent =
    condominio.nome;

  renderizarDadosGerais();

  renderizarResponsaveis();

  renderizarEstrutura();

  renderizarDocumentos();

  renderizarHistorico();

  alterarAbaDoModal(
    "general",
  );

  condominiumModal.hidden =
    false;

  document.body.classList.add(
    "modal-open",
  );

  window.setTimeout(() => {
    closeCondominiumModalButton.focus();
  }, 50);
}

function fecharModalDeCondominio() {
  condominiumModal.hidden =
    true;

  document.body.classList.remove(
    "modal-open",
  );

  condominioAtual =
    null;
}

/* =========================================
   LIMPAR FILTROS
========================================= */

function limparPesquisa() {
  condominiumsSearch.value =
    "";

  condominiumFilter.value =
    "";

  renderizarCondominios();

  condominiumsSearch.focus();
}

/* =========================================
   EVENTOS
========================================= */

condominiumsSearch.addEventListener(
  "input",
  renderizarCondominios,
);

condominiumFilter.addEventListener(
  "change",
  renderizarCondominios,
);

clearCondominiumSearchButton.addEventListener(
  "click",
  limparPesquisa,
);

modalTabButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        alterarAbaDoModal(
          button.dataset.modalTab,
        );
      },
    );
  },
);

closeCondominiumModalButton.addEventListener(
  "click",
  fecharModalDeCondominio,
);

closeCondominiumButton.addEventListener(
  "click",
  fecharModalDeCondominio,
);

condominiumModal.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      condominiumModal
    ) {
      fecharModalDeCondominio();
    }
  },
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      !condominiumModal.hidden
    ) {
      fecharModalDeCondominio();
    }
  },
);

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPagina() {
  try {
    sessaoAtual =
      await aguardarSessaoDaPagina();

    const uid =
      String(
        sessaoAtual?.uid || "",
      ).trim();

    if (!uid) {
      throw new Error(
        "CLIENT_UID_NOT_FOUND",
      );
    }

    await carregarDados();

    atualizarResumo();

    popularFiltroDeCondominios();

    renderizarCondominios();

    condominiumsLoading.hidden =
      true;

    condominiumsContent.hidden =
      false;

    shell.hidden =
      false;

    console.info(
      `[Meus Condomínios] ${condominios.length} condomínio(s) vinculado(s) carregado(s).`,
    );
  } catch (error) {
    console.error(
      "[Meus Condomínios] Não foi possível carregar a página:",
      error,
    );

    condominios = [];

    ordens = [];

    atualizarResumo();

    condominiumsLoading.hidden =
      true;

    condominiumsContent.hidden =
      false;

    shell.hidden =
      false;

    emptyState.hidden =
      false;

    condominiumsList.hidden =
      true;

    emptyStateTitle.textContent =
      "Não foi possível carregar seus condomínios";

    emptyStateDescription.textContent =
      error?.code ===
      "permission-denied"
        ? "O Firebase bloqueou o acesso aos condomínios vinculados."
        : "Ocorreu um erro ao carregar as informações. Tente novamente.";

    clearCondominiumSearchButton.hidden =
      true;
  }
}

inicializarPagina();