import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";
const profileConfig = {
  cliente: {
    kicker: "Área do Cliente",
    name: "Bem-vindo à Salvateck",
    sectionEyebrow: "Serviços e solicitações",
    searchPlaceholder: "Pesquisar serviço, solicitação ou condomínio",

    cards: [
      {
        title: "Nova Solicitação",
        description: "Solicite um novo atendimento de manutenção.",
        target: "nova-ordem.html",
        icon: "clipboard",
      },
      {
        title: "Minhas Solicitações",
        description: "Acompanhe pedidos enviados e respostas da equipe.",
        target: "ordens.html",
        icon: "inbox",
      },

      {
        title: "Meus Orçamentos",
        description: "Consulte propostas comerciais enviadas pela Salvateck.",
        action: "client-budgets",
        icon: "budget",
      },

      {
        title: "Serviços Agendados",
        description: "Veja datas, períodos e horários já confirmados.",
        target: "ordens.html?filtro=agendadas",
        icon: "calendar",
      },
      {
        title: "Meus Condomínios",
        description: "Consulte os condomínios vinculados ao seu cadastro.",
        target: "meus-condominios.html?perfil=cliente",
        icon: "building",
      },
      {
        title: "Histórico",
        description: "Consulte serviços concluídos ou cancelados.",
        target: "historico.html?perfil=cliente",
        icon: "history",
      },
      {
        title: "Meus Dados",
        description: "Revise telefone, endereço e informações pessoais.",
        target: "meus-dados.html?perfil=cliente",
        icon: "user",
      },
    ],
  },

  admin: {
    kicker: "Sistema de Gestão",
    name: "Painel Salvateck",
    sectionEyebrow: "Operação e administração",
    searchPlaceholder: "Pesquisar cliente, ordem ou serviço",

    cards: [
      {
        title: "Nova Ordem de Serviço",
        description: "Cadastre uma ordem manualmente para um cliente.",
        target: "nova-ordem.html?perfil=admin",
        icon: "clipboard",
      },
      {
        title: "OS Rápida",
        description: "Registre uma manutenção concluída e seu valor.",
        target: "os-rapida.html",
        icon: "bolt",
      },
      {
        title: "Nova Vistoria",
        description: "Cadastre e agende uma nova vistoria técnica.",
        target: "nova-ordem.html?perfil=admin&tipo=vistoria",
        icon: "inspection",
      },

      {
        title: "Ordens de Serviço",
        description: "Gerencie todas as ordens e seus respectivos status.",
        target: "ordens.html?perfil=admin",
        icon: "list",
      },
      {
        title: "Orçamentos",
        description: "Crie, acompanhe e compartilhe propostas comerciais.",
        target: "orcamentos.html?perfil=admin",
        icon: "budget",
      },
      {
        title: "Vistorias",
        description: "Acompanhe vistorias técnicas e não conformidades.",
        target: "vistorias.html?perfil=admin",
        icon: "inspection",
      },
      {
        title: "Clientes",
        description: "Consulte cadastros, contatos e históricos.",
        target: "clientes.html?perfil=admin",
        icon: "users",
      },
      {
        title: "Condomínios",
        description: "Gerencie imóveis, equipamentos e clientes vinculados.",
        target: "condominios.html?perfil=admin",
        icon: "building",
      },
      {
        title: "Ambientes e Equipamentos",
        description:
          "Cadastre os ambientes e equipamentos utilizados nos condomínios e vistorias.",
        target: "ambientes-e-equipamentos.html?perfil=admin",
        icon: "tools",
      },
      {
        title: "Funcionários",
        description: "Área preparada para a futura gestão da equipe.",
        target: "funcionarios.html?perfil=admin",
        icon: "badge",
      },
      {
        title: "Financeiro",
        description: "Controle recebimentos, despesas e valores pendentes.",
        target: "financeiro.html?perfil=admin",
        icon: "wallet",
      },
      {
        title: "Dashboard",
        description: "Acompanhe indicadores operacionais e financeiros.",
        target: "dashboard.html?perfil=admin",
        icon: "chart",
      },
    ],
  },

  funcionario: {
    kicker: "Área do Funcionário",
    name: "Bem-vindo à Salvateck",
    sectionEyebrow: "Minha operação",
    searchPlaceholder: "Pesquisar agenda, OS ou vistoria",

    cards: [
      {
        title: "Agenda",
        description: "Consulte seus atendimentos e compromissos agendados.",
        target: "agenda.html?perfil=funcionario",
        icon: "calendar",
      },
      {
        title: "Minhas OS",
        description: "Acompanhe as ordens de serviço designadas para você.",
        target: "ordens.html?perfil=funcionario",
        icon: "list",
      },
      {
        title: "Vistorias",
        description: "Consulte as vistorias técnicas atribuídas a você.",
        target: "vistorias.html?perfil=funcionario",
        icon: "inspection",
      },
      {
        title: "Meu Perfil",
        description: "Consulte seus dados e informações de acesso.",
        target: "meus-dados.html?perfil=funcionario",
        icon: "user",
      },
    ],
  },
};

/* ==============================
   ÍCONES
================================ */

const icons = {
  bolt: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 5 14h6l-1 8 9-13h-6V2Z"></path>
    </svg>
  `,

  clipboard: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2"></rect>
      <path d="M9 4.5V3h6v1.5"></path>
      <path d="M9 10h6M9 14h6M9 18h4"></path>
    </svg>
  `,

  inbox: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16l1 10H15l-2 3h-2l-2-3H3L4 5Z"></path>
      <path d="M8 9h8"></path>
    </svg>
  `,

  calendar: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2"></rect>
      <path d="M8 3v4M16 3v4M3 10h18"></path>
    </svg>
  `,

  history: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path>
      <path d="M3 3v5h5M12 7v5l3 2"></path>
    </svg>
  `,

  user: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21c.8-4.2 3.5-6.5 8-6.5s7.2 2.3 8 6.5"></path>
    </svg>
  `,

  bell: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
      <path d="M10 21h4"></path>
    </svg>
  `,

  list: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13"></path>
      <circle cx="3.5" cy="6" r=".7"></circle>
      <circle cx="3.5" cy="12" r=".7"></circle>
      <circle cx="3.5" cy="18" r=".7"></circle>
    </svg>
  `,

  users: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3"></circle>
      <circle cx="17" cy="9" r="2.5"></circle>
      <path d="M3 20c.7-3.8 2.8-5.7 6-5.7S14.3 16.2 15 20"></path>
      <path d="M14 15.5c3.8-.7 6.2.8 7 4.5"></path>
    </svg>
  `,
  inspection: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5h6"></path>
      <path d="M9 3h6v4H9z"></path>
      <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1"></path>
      <path d="m8 14 2 2 5-5"></path>
    </svg>
  `,

  building: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
      <path d="M16 9h2a2 2 0 0 1 2 2v10"></path>
      <path d="M8 7h4"></path>
      <path d="M8 11h4"></path>
      <path d="M8 15h4"></path>
      <path d="M2 21h20"></path>
    </svg>
  `,

  budget: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path>
      <path d="M15 3v5h4"></path>
      <path d="M8 12h8M8 16h5"></path>
    </svg>
  `,

  wallet: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 4.5 4H17"></path>
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"></path>
    </svg>
  `,

  chart: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>
    </svg>
  `,

  tools: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14 6 4-4 4 4-4 4"></path>
      <path d="m16 8-9.5 9.5a2.1 2.1 0 0 1-3-3L13 5"></path>
      <path d="m14 14 6 6"></path>
    </svg>
  `,

  badge: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M6 21c.8-4.2 2.8-6.5 6-6.5s5.2 2.3 6 6.5"></path>
      <path d="m18 3 .7 1.4 1.5.2-1.1 1 .3 1.5L18 6.4l-1.4.7.3-1.5-1.1-1 1.5-.2L18 3Z"></path>
    </svg>
  `,
};

const arrowIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
`;

/* ==============================
   ELEMENTOS DA PÁGINA
================================ */

const appShell = document.getElementById("app-shell");

const quickGrid = document.getElementById("quick-grid");
const quickSearch = document.getElementById("quick-search");

const profileKicker = document.getElementById("profile-kicker");
const profileTitle = document.getElementById("profile-title");

const sectionEyebrow = document.getElementById("section-eyebrow");
const cardCount = document.getElementById("card-count");

const emptyState = document.getElementById("empty-state");

const companyLogo = document.getElementById("company-logo");
const logoContainer = companyLogo.closest(".profile-logo");

const backButton = document.getElementById("back-button");
const logoutButton = document.getElementById("logout-button");

const notificationButton = document.getElementById("notification-button");
const notificationBadge = document.getElementById("notification-badge");
const notificationsPanel = document.getElementById("notifications-panel");
const notificationsList = document.getElementById("notifications-list");
const notificationsEmpty = document.getElementById("notifications-empty");
const notificationsMarkAll = document.getElementById("notifications-mark-all");

/* ==============================
   MEUS ORÇAMENTOS - CLIENTE
================================ */

const clientBudgetsModal = document.getElementById("client-budgets-modal");

const clientBudgetsListView = document.getElementById(
  "client-budgets-list-view",
);

const clientBudgetsLoading = document.getElementById("client-budgets-loading");

const clientBudgetsEmpty = document.getElementById("client-budgets-empty");

const clientBudgetsList = document.getElementById("client-budgets-list");

const clientBudgetDetail = document.getElementById("client-budget-detail");

const clientBudgetDetailBack = document.getElementById(
  "client-budget-detail-back",
);

const clientBudgetDetailStatus = document.getElementById(
  "client-budget-detail-status",
);

const clientBudgetDetailCode = document.getElementById(
  "client-budget-detail-code",
);

const clientBudgetDetailTitle = document.getElementById(
  "client-budget-detail-title",
);

const clientBudgetDetailSubtitle = document.getElementById(
  "client-budget-detail-subtitle",
);

const clientBudgetDetailCondominium = document.getElementById(
  "client-budget-detail-condominium",
);

const clientBudgetDetailValue = document.getElementById(
  "client-budget-detail-value",
);

const clientBudgetDetailValidity = document.getElementById(
  "client-budget-detail-validity",
);

const clientBudgetDetailDescription = document.getElementById(
  "client-budget-detail-description",
);

const clientBudgetDetailServices = document.getElementById(
  "client-budget-detail-services",
);

const clientBudgetDetailConditions = document.getElementById(
  "client-budget-detail-conditions",
);

const clientBudgetDetailResponse = document.getElementById(
  "client-budget-detail-response",
);

const clientBudgetDetailActions = document.getElementById(
  "client-budget-detail-actions",
);

const clientBudgetRejectButton = document.getElementById(
  "client-budget-reject-button",
);

const clientBudgetAcceptButton = document.getElementById(
  "client-budget-accept-button",
);

const clientBudgetConfirmModal = document.getElementById(
  "client-budget-confirm-modal",
);

const clientBudgetConfirmIcon = document.getElementById(
  "client-budget-confirm-icon",
);

const clientBudgetConfirmTitle = document.getElementById(
  "client-budget-confirm-title",
);

const clientBudgetConfirmMessage = document.getElementById(
  "client-budget-confirm-message",
);

const clientBudgetConfirmCancel = document.getElementById(
  "client-budget-confirm-cancel",
);

const clientBudgetConfirmSubmit = document.getElementById(
  "client-budget-confirm-submit",
);

const clientBudgetsCloseButtons = document.querySelectorAll(
  "[data-close-client-budgets]",
);

function formatClientBudgetCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getClientBudgetStatusLabel(status) {
  const labels = {
    enviado: "Aguardando confirmação",
    aprovado: "Aprovado",
    recusado: "Recusado",
    expirado: "Expirado",
  };

  return labels[status] || "Aguardando confirmação";
}

function formatClientBudgetDate(value) {
  if (!value) {
    return "—";
  }

  if (typeof value === "string") {
    const date = new Date(`${value}T12:00:00`);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }

    return value;
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("pt-BR");
  }

  return "—";
}

function getClientBudgetConditionsText(budget) {
  const conditions = budget.condicoes || {};

  const parts = [];

  if (Array.isArray(conditions.gerais)) {
    parts.push(
      ...conditions.gerais
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    );
  }

  if (conditions.garantia) {
    parts.push(`Garantia: ${conditions.garantia}`);
  }

  if (conditions.prazoExecucao) {
    parts.push(`Prazo: ${conditions.prazoExecucao}`);
  }

  if (conditions.pagamento) {
    parts.push(`Pagamento: ${conditions.pagamento}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : "Não informado.";
}

function renderClientBudgetServices(services) {
  clientBudgetDetailServices.innerHTML = "";

  const items = Array.isArray(services)
    ? services.map((service) => String(service || "").trim()).filter(Boolean)
    : [];

  if (items.length === 0) {
    const empty = document.createElement("p");

    empty.textContent = "Nenhum serviço informado.";

    clientBudgetDetailServices.appendChild(empty);

    return;
  }

  items.forEach((service) => {
    const item = document.createElement("div");

    item.className = "client-budget-detail__service";

    const info = document.createElement("div");

    info.className = "client-budget-detail__service-info";

    const title = document.createElement("strong");

    title.textContent = service;

    info.appendChild(title);

    item.appendChild(info);

    clientBudgetDetailServices.appendChild(item);
  });
}

function openClientBudgetDetail(budget) {
  if (!budget) {
    return;
  }
  currentClientBudget = budget;
  const status = String(budget.status || "enviado")
    .trim()
    .toLowerCase();

  clientBudgetDetailStatus.dataset.status = status;

  clientBudgetDetailStatus.textContent = getClientBudgetStatusLabel(status);

  clientBudgetDetailCode.textContent = budget.codigo || "ORC-0000";

  clientBudgetDetailTitle.textContent = budget.titulo || "Orçamento";

  clientBudgetDetailSubtitle.textContent =
    budget.subtitulo || "Proposta comercial Salvateck";

  clientBudgetDetailCondominium.textContent =
    budget.condominioNome || budget.condominio?.nome || "—";

  clientBudgetDetailValue.textContent = formatClientBudgetCurrency(
    budget.valorFinal ?? budget.investimento?.valorFinal ?? 0,
  );

  clientBudgetDetailValidity.textContent = formatClientBudgetDate(
    budget.proposta?.validadeAte,
  );

  clientBudgetDetailDescription.textContent =
    budget.descricaoServico || budget.objetivo || "Não informado.";

  renderClientBudgetServices(budget.servicosInclusos);

  clientBudgetDetailConditions.textContent =
    getClientBudgetConditionsText(budget);

  const responseFromClient =
    budget.respostaCliente &&
    budget.respostaCliente.uid === auth.currentUser?.uid &&
    budget.respostaCliente.status === status;

  clientBudgetDetailResponse.hidden = true;

  if (status === "aprovado") {
    clientBudgetDetailResponse.hidden = false;
    clientBudgetDetailResponse.dataset.response = "aprovado";

    clientBudgetDetailResponse.textContent = responseFromClient
      ? "Você aprovou este orçamento."
      : "Este orçamento foi marcado como aprovado pela Salvateck.";

    clientBudgetDetailActions.hidden = true;
  } else if (status === "recusado") {
    clientBudgetDetailResponse.hidden = false;
    clientBudgetDetailResponse.dataset.response = "recusado";

    clientBudgetDetailResponse.textContent = responseFromClient
      ? "Você recusou este orçamento."
      : "Este orçamento foi marcado como recusado pela Salvateck.";

    clientBudgetDetailActions.hidden = true;
  } else if (status === "expirado") {
    clientBudgetDetailResponse.hidden = false;
    clientBudgetDetailResponse.dataset.response = "expirado";

    clientBudgetDetailResponse.textContent = "Este orçamento está expirado.";

    clientBudgetDetailActions.hidden = true;
  } else {
    clientBudgetDetailActions.hidden = false;
  }

  clientBudgetsListView.hidden = true;
  clientBudgetDetail.hidden = false;

  clientBudgetDetail.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function createClientBudgetCard(budget) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "client-budget-card";

  button.dataset.budgetId = budget.id;

  const content = document.createElement("div");

  content.className = "client-budget-card__content";

  const top = document.createElement("div");

  top.className = "client-budget-card__top";

  const code = document.createElement("span");

  code.className = "client-budget-card__code";
  code.textContent = budget.codigo || "ORC-0000";

  const status = document.createElement("span");

  status.className = "client-budget-card__status";

  const normalizedStatus = String(budget.status || "enviado")
    .trim()
    .toLowerCase();

  status.dataset.status = normalizedStatus;

  status.textContent = getClientBudgetStatusLabel(normalizedStatus);

  top.append(code, status);

  const title = document.createElement("strong");

  title.className = "client-budget-card__title";

  title.textContent = budget.titulo || "Orçamento Salvateck";

  const condominium = document.createElement("span");

  condominium.className = "client-budget-card__condominium";

  condominium.textContent =
    budget.condominioNome ||
    budget.condominio?.nome ||
    "Condomínio não informado";

  const value = document.createElement("strong");

  value.className = "client-budget-card__value";

  value.textContent = formatClientBudgetCurrency(
    budget.valorFinal ?? budget.investimento?.valorFinal ?? 0,
  );

  content.append(top, title, condominium, value);

  const arrow = document.createElement("span");

  arrow.className = "client-budget-card__arrow";

  arrow.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  `;

  button.append(content, arrow);

  button.addEventListener("click", () => {
    openClientBudgetDetail(budget);
  });

  return button;
}

function renderClientBudgets(budgets) {
  if (!clientBudgetsLoading || !clientBudgetsEmpty || !clientBudgetsList) {
    return;
  }

  clientBudgetsLoading.hidden = true;

  clientBudgetsList.innerHTML = "";

  if (budgets.length === 0) {
    clientBudgetsEmpty.hidden = false;
    clientBudgetsList.hidden = true;

    return;
  }

  clientBudgetsEmpty.hidden = true;
  clientBudgetsList.hidden = false;

  budgets.forEach((budget) => {
    clientBudgetsList.appendChild(createClientBudgetCard(budget));
  });
}

async function loadClientBudgets() {
  if (!clientBudgetsLoading || !clientBudgetsEmpty || !clientBudgetsList) {
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    return;
  }

  clientBudgetsLoading.hidden = false;
  clientBudgetsEmpty.hidden = true;
  clientBudgetsList.hidden = true;

  try {
    const budgetsQuery = query(
      collection(db, "orcamentos"),
      where("clienteUid", "==", user.uid),
      where("status", "in", ["enviado", "aprovado", "recusado", "expirado"]),
    );

    const snapshot = await getDocs(budgetsQuery);

    const visibleStatuses = new Set([
      "enviado",
      "aprovado",
      "recusado",
      "expirado",
    ]);

    const budgets = snapshot.docs
      .map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }))
      .filter((budget) =>
        visibleStatuses.has(
          String(budget.status || "")
            .trim()
            .toLowerCase(),
        ),
      )
      .sort((budgetA, budgetB) => {
        const getTime = (budget) => {
          const timestamp =
            budget.enviadoEm || budget.atualizadoEm || budget.criadoEm;

          if (timestamp?.toMillis) {
            return timestamp.toMillis();
          }

          return 0;
        };

        return getTime(budgetB) - getTime(budgetA);
      });

    renderClientBudgets(budgets);
  } catch (error) {
    console.error(
      "[Principal] Não foi possível carregar os orçamentos do cliente:",
      error,
    );

    clientBudgetsLoading.hidden = true;
    clientBudgetsList.hidden = true;

    clientBudgetsEmpty.hidden = false;

    const emptyTitle = clientBudgetsEmpty.querySelector("strong");

    const emptyDescription = clientBudgetsEmpty.querySelector("span");

    if (emptyTitle) {
      emptyTitle.textContent = "Não foi possível carregar os orçamentos";
    }

    if (emptyDescription) {
      emptyDescription.textContent =
        error?.code === "permission-denied"
          ? "O acesso aos orçamentos foi bloqueado pelo Firebase."
          : "Tente novamente em alguns instantes.";
    }
  }
}

let pendingClientBudgetStatus = "";

function closeClientBudgetConfirmModal() {
  pendingClientBudgetStatus = "";

  clientBudgetConfirmModal.hidden = true;
  clientBudgetConfirmModal.setAttribute("aria-hidden", "true");
  clientBudgetConfirmModal.removeAttribute("data-action");
}

function openClientBudgetConfirmModal(status) {
  if (status !== "aprovado" && status !== "recusado") {
    return;
  }

  pendingClientBudgetStatus = status;

  clientBudgetConfirmModal.dataset.action = status;
  clientBudgetConfirmCancel.hidden = false;

  if (status === "aprovado") {
    clientBudgetConfirmTitle.textContent = "Aceitar orçamento?";
    clientBudgetConfirmMessage.textContent =
      "Ao confirmar, este orçamento será registrado como aprovado e a Salvateck será notificada.";
    clientBudgetConfirmSubmit.textContent = "Aceitar orçamento";
  } else {
    clientBudgetConfirmTitle.textContent = "Recusar orçamento?";
    clientBudgetConfirmMessage.textContent =
      "Ao confirmar, este orçamento será registrado como recusado e a Salvateck será notificada.";
    clientBudgetConfirmSubmit.textContent = "Recusar orçamento";
  }

  clientBudgetConfirmModal.hidden = false;
  clientBudgetConfirmModal.setAttribute("aria-hidden", "false");

  setTimeout(() => clientBudgetConfirmSubmit.focus(), 50);
}

async function respondClientBudget(status) {
  if (!currentClientBudget || currentClientBudget.status !== "enviado") {
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    return;
  }

  if (status !== "aprovado" && status !== "recusado") {
    return;
  }

  const actionLabel = status === "aprovado" ? "aceitar" : "recusar";

  closeClientBudgetConfirmModal();

  clientBudgetAcceptButton.disabled = true;
  clientBudgetRejectButton.disabled = true;

  const originalAcceptText = clientBudgetAcceptButton.textContent;

  const originalRejectText = clientBudgetRejectButton.textContent;

  if (status === "aprovado") {
    clientBudgetAcceptButton.textContent = "Aceitando...";
  } else {
    clientBudgetRejectButton.textContent = "Recusando...";
  }

  const reference = doc(db, "orcamentos", currentClientBudget.id);

  try {
    const updates = {
      status,

      respostaCliente: {
        status,
        uid: user.uid,
        respondidoEm: serverTimestamp(),
      },

      statusAtualizadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    if (status === "aprovado") {
      updates.aprovadoEm = serverTimestamp();
    }

    if (status === "recusado") {
      updates.recusadoEm = serverTimestamp();
    }

    await updateDoc(reference, updates);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      throw new Error("BUDGET_NOT_FOUND_AFTER_RESPONSE");
    }

    const updatedBudget = {
      id: snapshot.id,
      ...snapshot.data(),
    };

    currentClientBudget = updatedBudget;

    await loadClientBudgets();

    openClientBudgetDetail(updatedBudget);
  } catch (error) {
    console.error(
      `[Principal] Não foi possível ${actionLabel} o orçamento:`,
      error,
    );

    pendingClientBudgetStatus = "";

    clientBudgetConfirmModal.dataset.action = "recusado";
    clientBudgetConfirmCancel.hidden = true;

    clientBudgetConfirmTitle.textContent =
      "Não foi possível registrar sua resposta";

    clientBudgetConfirmMessage.textContent =
      error?.code === "permission-denied"
        ? "O orçamento não está mais disponível para esta resposta."
        : "Ocorreu um erro ao registrar sua resposta. Tente novamente.";

    clientBudgetConfirmSubmit.textContent = "Fechar";

    clientBudgetConfirmModal.hidden = false;
    clientBudgetConfirmModal.setAttribute("aria-hidden", "false");
  } finally {
    clientBudgetAcceptButton.disabled = false;
    clientBudgetRejectButton.disabled = false;

    clientBudgetAcceptButton.textContent = originalAcceptText;

    clientBudgetRejectButton.textContent = originalRejectText;
  }
}

function openClientBudgetsModal() {
  if (!clientBudgetsModal) {
    return;
  }

  clientBudgetsModal.hidden = false;

  clientBudgetsModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("client-budgets-modal-open");

  if (clientBudgetsListView) {
    clientBudgetsListView.hidden = false;
  }

  if (clientBudgetDetail) {
    clientBudgetDetail.hidden = true;
  }

  loadClientBudgets();
}

function closeClientBudgetsModal() {
  if (!clientBudgetsModal) {
    return;
  }

  clientBudgetsModal.hidden = true;

  clientBudgetsModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("client-budgets-modal-open");
}

async function openClientBudgetFromNotification() {
  const parameters = new URLSearchParams(window.location.search);

  if (parameters.get("abrir") !== "orcamentos") {
    return;
  }

  const budgetId = String(parameters.get("orcamento") || "").trim();

  if (!budgetId) {
    openClientBudgetsModal();

    return;
  }

  const user = auth.currentUser;

  if (!user) {
    return;
  }

  try {
    const reference = doc(db, "orcamentos", budgetId);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      openClientBudgetsModal();

      return;
    }

    const budget = {
      id: snapshot.id,
      ...snapshot.data(),
    };

    const status = String(budget.status || "")
      .trim()
      .toLowerCase();

    const visibleStatuses = new Set([
      "enviado",
      "aprovado",
      "recusado",
      "expirado",
    ]);

    if (budget.clienteUid !== user.uid || !visibleStatuses.has(status)) {
      openClientBudgetsModal();

      return;
    }

    openClientBudgetsModal();

    currentClientBudget = budget;

    openClientBudgetDetail(budget);
  } catch (error) {
    console.error(
      "[Principal] Não foi possível abrir o orçamento da notificação:",
      error,
    );

    openClientBudgetsModal();
  }
}

clientBudgetsCloseButtons.forEach((button) => {
  button.addEventListener("click", closeClientBudgetsModal);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    clientBudgetsModal &&
    !clientBudgetsModal.hidden
  ) {
    closeClientBudgetsModal();
  }
});

if (clientBudgetDetailBack) {
  clientBudgetDetailBack.addEventListener("click", () => {
    clientBudgetDetail.hidden = true;
    clientBudgetsListView.hidden = false;
  });
}

if (clientBudgetAcceptButton) {
  clientBudgetAcceptButton.addEventListener("click", () => {
    openClientBudgetConfirmModal("aprovado");
  });
}

if (clientBudgetRejectButton) {
  clientBudgetRejectButton.addEventListener("click", () => {
    openClientBudgetConfirmModal("recusado");
  });
}

clientBudgetConfirmCancel?.addEventListener("click", () => {
  closeClientBudgetConfirmModal();
});

clientBudgetConfirmSubmit?.addEventListener("click", () => {
  if (!pendingClientBudgetStatus) {
    return;
  }

  respondClientBudget(pendingClientBudgetStatus);
});

let currentClientBudget = null;
let currentProfile = null;

let authActionInProgress = false;
let adminSearchItems = [];

let adminSearchLoaded = false;

let notificationsUnsubscribe = null;
let notificationsItems = [];
/* ==============================
   CENTRAL DE NOTIFICAÇÕES
================================ */

function getNotificationTimestamp(notification) {
  if (notification.criadaEm?.toMillis) {
    return notification.criadaEm.toMillis();
  }

  return 0;
}

function formatNotificationDate(timestamp) {
  if (!timestamp?.toDate) {
    return "Agora";
  }

  const date = timestamp.toDate();

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    return;
  }

  try {
    await updateDoc(doc(db, "notificacoes", notificationId), {
      lida: true,
      lidaEm: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      "[Principal] Não foi possível marcar a notificação como lida:",
      error,
    );
  }
}

function renderNotifications() {
  if (
    !notificationButton ||
    !notificationBadge ||
    !notificationsList ||
    !notificationsEmpty ||
    !notificationsMarkAll
  ) {
    return;
  }

  const sortedNotifications = [...notificationsItems].sort(
    (a, b) => getNotificationTimestamp(b) - getNotificationTimestamp(a),
  );

  const unreadNotifications = sortedNotifications.filter(
    (notification) => notification.lida !== true,
  );

  notificationsList.replaceChildren();

  notificationsEmpty.hidden = sortedNotifications.length > 0;
  notificationsMarkAll.hidden = unreadNotifications.length === 0;

  if (unreadNotifications.length > 0) {
    notificationBadge.hidden = false;

    notificationBadge.textContent =
      unreadNotifications.length > 99
        ? "99+"
        : String(unreadNotifications.length);

    notificationButton.setAttribute(
      "aria-label",
      `Abrir notificações. ${unreadNotifications.length} não lida(s).`,
    );
  } else {
    notificationBadge.hidden = true;
    notificationBadge.textContent = "";

    notificationButton.setAttribute("aria-label", "Abrir notificações");
  }

  sortedNotifications.forEach((notification) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className =
      notification.lida === true
        ? "notification-item"
        : "notification-item is-unread";

    const indicator = document.createElement("span");

    indicator.className = "notification-item__indicator";
    indicator.setAttribute("aria-hidden", "true");

    const content = document.createElement("span");

    content.className = "notification-item__content";

    const title = document.createElement("strong");

    title.className = "notification-item__title";
    title.textContent = notification.titulo || "Atualização Salvateck";

    const message = document.createElement("span");

    message.className = "notification-item__message";
    message.textContent =
      notification.mensagem || "Há uma nova atualização disponível.";

    content.append(title, message);

    const date = document.createElement("time");

    date.className = "notification-item__date";
    date.textContent = formatNotificationDate(notification.criadaEm);

    button.append(indicator, content, date);

    button.addEventListener("click", async () => {
      if (notification.lida !== true) {
        await markNotificationAsRead(notification.id);
      }

      const target = String(notification.url || "principal.html").trim();

      notificationsPanel.hidden = true;

      notificationButton.setAttribute("aria-expanded", "false");

      window.location.href = target || "principal.html";
    });

    notificationsList.appendChild(button);
  });
}

function startNotificationsCenter(uid) {
  if (!uid) {
    return;
  }

  if (notificationsUnsubscribe) {
    notificationsUnsubscribe();
    notificationsUnsubscribe = null;
  }

  notificationsItems = [];

  renderNotifications();

  const notificationsQuery = query(
    collection(db, "notificacoes"),
    where("destinatarioUid", "==", uid),
  );

  notificationsUnsubscribe = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      notificationsItems = snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }));

      renderNotifications();
    },
    (error) => {
      console.error(
        "[Principal] Não foi possível carregar as notificações:",
        error,
      );
    },
  );
}

notificationButton?.addEventListener("click", () => {
  if (!notificationsPanel) {
    return;
  }

  const shouldOpen = notificationsPanel.hidden;

  notificationsPanel.hidden = !shouldOpen;

  notificationButton.setAttribute(
    "aria-expanded",
    shouldOpen ? "true" : "false",
  );

  if (shouldOpen) {
    notificationsPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
});

notificationsMarkAll?.addEventListener("click", async () => {
  const unreadNotifications = notificationsItems.filter(
    (notification) => notification.lida !== true,
  );

  if (unreadNotifications.length === 0) {
    return;
  }

  notificationsMarkAll.disabled = true;

  try {
    await Promise.all(
      unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notificacoes", notification.id), {
          lida: true,
          lidaEm: serverTimestamp(),
        }),
      ),
    );
  } catch (error) {
    console.error(
      "[Principal] Não foi possível marcar todas as notificações como lidas:",
      error,
    );
  } finally {
    notificationsMarkAll.disabled = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    notificationsPanel &&
    !notificationsPanel.hidden
  ) {
    notificationsPanel.hidden = true;

    notificationButton?.setAttribute("aria-expanded", "false");

    notificationButton?.focus();
  }
});
/* ==============================
   NORMALIZAÇÃO DA PESQUISA
================================ */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function getOrderServices(order) {
  if (!Array.isArray(order.servicos)) {
    return [order.servicoPrincipal].filter(Boolean);
  }

  return order.servicos
    .map((service) => {
      if (typeof service === "string") {
        return service;
      }

      return service?.servico || service?.nome || "";
    })
    .filter(Boolean);
}

function mapClientSearchItem(documentSnapshot) {
  const data = documentSnapshot.data();

  const name = String(data.nome || "Cliente sem nome").trim();

  const phone = String(data.telefone || "").trim();

  const email = String(data.email || "").trim();

  const description =
    [phone, email].filter(Boolean).join(" · ") ||
    "Cliente cadastrado no sistema";

  return {
    title: `Cliente — ${name}`,

    description,

    target:
      `clientes.html?perfil=admin&cliente=` +
      encodeURIComponent(documentSnapshot.id),

    icon: "users",

    searchableText: normalizeText(
      [
        documentSnapshot.id,
        name,
        phone,
        email,
        data.cidade,
        data.bairro,
        data.endereco?.cidade,
        data.endereco?.bairro,
      ].join(" "),
    ),

    searchableDigits: normalizePhone(phone),
  };
}

function mapOrderSearchItem(documentSnapshot) {
  const data = documentSnapshot.data();

  const code = String(data.codigo || data.numero || documentSnapshot.id).trim();

  const title = String(
    data.titulo || data.servicoPrincipal || "Ordem de serviço",
  ).trim();

  const clientName = String(
    data.cliente?.nome || data.clienteNome || "Cliente não identificado",
  ).trim();

  const clientPhone = String(
    data.cliente?.telefone || data.telefoneCliente || "",
  ).trim();

  const clientEmail = String(
    data.cliente?.email || data.emailCliente || "",
  ).trim();

  const status = String(data.status || "")
    .replace(/-/g, " ")
    .trim();

  const services = getOrderServices(data);

  const description = [clientName, clientPhone, status]
    .filter(Boolean)
    .join(" · ");

  const parameters = new URLSearchParams({
    perfil: "admin",
    id: documentSnapshot.id,
    ordem: documentSnapshot.id,
    origem: "ordens",
  });

  return {
    title: `${code} — ${title}`,

    description: description || "Ordem de serviço cadastrada",

    target: `detalhes-solicitacao.html?${parameters.toString()}`,

    icon: data.tipoAtendimento === "vistoria" ? "inspection" : "list",

    searchableText: normalizeText(
      [
        documentSnapshot.id,
        code,
        data.numero,
        title,
        data.servicoPrincipal,
        data.categoriaPrincipal,
        services.join(" "),
        clientName,
        clientPhone,
        clientEmail,
        status,
        data.condominio?.nome,
        data.endereco?.bairro,
        data.endereco?.cidade,
      ].join(" "),
    ),

    searchableDigits: [normalizePhone(code), normalizePhone(clientPhone)].join(
      " ",
    ),
  };
}

async function loadAdminSearchData() {
  if (adminSearchLoaded) {
    return;
  }

  try {
    const clientsQuery = query(
      collection(db, "usuarios"),
      where("role", "==", "cliente"),
    );

    const [clientsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(clientsQuery),
      getDocs(collection(db, "ordens")),
    ]);

    const clientItems = clientsSnapshot.docs.map(mapClientSearchItem);

    const orderItems = ordersSnapshot.docs.map(mapOrderSearchItem);

    adminSearchItems = [...clientItems, ...orderItems];

    adminSearchLoaded = true;

    renderCards();

    console.info(
      `[Principal] Busca carregada com ${clientItems.length} cliente(s) e ${orderItems.length} ordem(ns).`,
    );
  } catch (error) {
    console.error(
      "[Principal] Não foi possível carregar a busca administrativa:",
      error,
    );
  }
}

function matchesAdminSearch(item, rawSearch) {
  const normalizedSearch = normalizeText(rawSearch);

  const numericSearch = normalizePhone(rawSearch);

  const matchesText = item.searchableText.includes(normalizedSearch);

  const matchesNumbers =
    numericSearch.length > 0 && item.searchableDigits.includes(numericSearch);

  return matchesText || matchesNumbers;
}

/* ==============================
   CRIAÇÃO DOS CARDS
================================ */

function createCard(card) {
  const button = document.createElement("button");

  button.className = "quick-card";
  button.type = "button";

  if (card.target) {
    button.dataset.target = card.target;
  }

  if (card.action) {
    button.dataset.action = card.action;
  }

  button.setAttribute("aria-label", `Abrir ${card.title}`);

  button.innerHTML = `
    <span class="quick-card__icon">
      ${icons[card.icon] || icons.clipboard}
    </span>

    <span class="quick-card__copy">

      <span class="quick-card__title">
        ${card.title}
      </span>

      <span class="quick-card__description">
        ${card.description}
      </span>

    </span>

    <span class="quick-card__arrow">
      ${arrowIcon}
    </span>
  `;

  button.addEventListener("click", () => {
    if (card.action === "client-budgets") {
      openClientBudgetsModal();

      return;
    }

    if (card.target) {
      window.location.href = card.target;
    }
  });

  return button;
}

/* ==============================
   EXIBIÇÃO DOS CARDS
================================ */

function renderCards() {
  if (!currentProfile || !profileConfig[currentProfile]) {
    return;
  }

  const config = profileConfig[currentProfile];

  const rawSearch = String(quickSearch.value || "").trim();

  const searchTerm = normalizeText(rawSearch);

  const filteredShortcuts = config.cards.filter((card) => {
    const searchableText = normalizeText(`${card.title} ${card.description}`);

    return searchableText.includes(searchTerm);
  });

  let displayedItems = filteredShortcuts;

  if (currentProfile === "admin" && searchTerm && adminSearchLoaded) {
    const dataResults = adminSearchItems.filter((item) =>
      matchesAdminSearch(item, rawSearch),
    );

    displayedItems = [...dataResults, ...filteredShortcuts];
  }

  quickGrid.innerHTML = "";

  displayedItems.forEach((item) => {
    quickGrid.appendChild(createCard(item));
  });

  if (searchTerm) {
    const resultText = displayedItems.length === 1 ? "resultado" : "resultados";

    cardCount.textContent = `${displayedItems.length} ${resultText}`;
  } else {
    const shortcutText = displayedItems.length === 1 ? "atalho" : "atalhos";

    cardCount.textContent = `${displayedItems.length} ${shortcutText}`;
  }

  const emptyTitle = emptyState.querySelector("strong");

  const emptyDescription = emptyState.querySelector("span");

  if (searchTerm) {
    emptyTitle.textContent = "Nenhum resultado encontrado";

    emptyDescription.textContent =
      "Pesquise por nome, celular, e-mail, código da OS ou serviço.";
  } else {
    emptyTitle.textContent = "Nenhum atalho encontrado";

    emptyDescription.textContent = "Tente pesquisar usando outro termo.";
  }

  emptyState.hidden = displayedItems.length !== 0;
}

/* ==============================
   PERFIL AUTENTICADO
================================ */

function changeProfile(profile, userProfile = {}) {
  if (!profileConfig[profile]) {
    return;
  }

  currentProfile = profile;

  const config = profileConfig[profile];

  const fullName = String(userProfile.nome || "").trim();

  const firstName = fullName.split(/\s+/)[0] || "";

  profileKicker.textContent = config.kicker;

  if (firstName) {
    profileTitle.textContent =
      profile === "admin" ? `Olá, ${firstName}` : `Bem-vindo, ${firstName}`;
  } else {
    profileTitle.textContent = config.name;
  }

  sectionEyebrow.textContent = config.sectionEyebrow;

  quickSearch.placeholder = config.searchPlaceholder;

  quickSearch.value = "";

  document.body.dataset.profile = profile;

  if (profile === "admin") {
    document.title = "Painel Administrativo | Salvateck";
  } else if (profile === "funcionario") {
    document.title = "Área do Funcionário | Salvateck";
  } else {
    document.title = "Área do Cliente | Salvateck";
  }

  renderCards();

  appShell.hidden = false;
}

/* ==============================
   EVENTO DA PESQUISA
================================ */

quickSearch.addEventListener("input", renderCards);

/* ==============================
   BOTÃO VOLTAR
================================ */

backButton.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "principal.html";
});

/* ==============================
   BOTÃO SAIR
================================ */

logoutButton.addEventListener("click", async (event) => {
  event.preventDefault();

  if (authActionInProgress) {
    return;
  }

  authActionInProgress = true;

  const originalText = logoutButton.textContent;

  logoutButton.textContent = "Saindo...";

  logoutButton.setAttribute("aria-disabled", "true");

  try {
    await signOut(auth);

    window.location.replace("index.html");
  } catch (error) {
    console.error("[Principal] Não foi possível sair:", error);

    authActionInProgress = false;

    logoutButton.textContent = originalText;

    logoutButton.removeAttribute("aria-disabled");

    window.alert("Não foi possível sair agora. Tente novamente.");
  }
});

/* ==============================
   VERIFICAÇÃO DA LOGO
================================ */

companyLogo.addEventListener("load", () => {
  logoContainer.classList.add("has-image");
});

companyLogo.addEventListener("error", () => {
  logoContainer.classList.remove("has-image");
});

if (companyLogo.complete && companyLogo.naturalWidth > 0) {
  logoContainer.classList.add("has-image");
}

/* ==============================
   CONTROLE DE ACESSO
================================ */

async function denyAccess(message) {
  authActionInProgress = true;

  try {
    await signOut(auth);
  } catch (error) {
    console.warn(
      "[Principal] Não foi possível encerrar a sessão inválida:",
      error,
    );
  }

  if (message) {
    window.alert(message);
  }

  window.location.replace("login.html");
}

/* ==============================
   INICIALIZAÇÃO
================================ */

onAuthStateChanged(auth, async (user) => {
  if (authActionInProgress) {
    return;
  }

  if (!user) {
    window.location.replace("login.html");

    return;
  }

  try {
    const userReference = doc(db, "usuarios", user.uid);

    const userSnapshot = await getDoc(userReference);

    if (!userSnapshot.exists()) {
      await denyAccess("Seu perfil não foi encontrado no sistema.");

      return;
    }

    const userProfile = userSnapshot.data();

    if (userProfile.ativo !== true) {
      await denyAccess(
        "Esta conta está inativa. Entre em contato com a Salvateck.",
      );

      return;
    }

    const role = String(userProfile.role || "")
      .trim()
      .toLowerCase();

    if (role !== "admin" && role !== "cliente" && role !== "funcionario") {
      await denyAccess("Esta conta não possui uma permissão válida.");

      return;
    }

    changeProfile(role, userProfile);

    changeProfile(role, userProfile);

    startNotificationsCenter(user.uid);

    if (role === "cliente") {
      await openClientBudgetFromNotification();
    }

    if (role === "admin") {
      loadAdminSearchData();
    }
  } catch (error) {
    console.error("[Principal] Não foi possível validar o acesso:", error);

    await denyAccess("Não foi possível validar seu acesso. Entre novamente.");
  }
});
