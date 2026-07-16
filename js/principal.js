const profileConfig = {
  cliente: {
    kicker: "Área do Cliente",
    name: "Bem-vindo à Salvateck",
    sectionEyebrow: "Serviços e solicitações",
    searchPlaceholder: "Pesquisar serviço ou solicitação",

    cards: [
      {
        title: "Nova Ordem de Serviço",
        description: "Solicite um novo atendimento de manutenção.",
        target: "nova-ordem.html",
        icon: "clipboard",
      },
      {
        title: "Minhas Solicitações",
        description: "Acompanhe pedidos enviados e respostas da equipe.",
        target: "minhas-solicitacoes.html",
        icon: "inbox",
      },
      {
        title: "Serviços Agendados",
        description: "Veja datas e períodos já confirmados.",
        target: "servicos-agendados.html",
        icon: "calendar",
      },
      {
        title: "Histórico",
        description: "Consulte serviços concluídos ou cancelados.",
        target: "historico.html",
        icon: "history",
      },
      {
        title: "Meus Dados",
        description: "Revise telefone, endereço e informações pessoais.",
        target: "meus-dados.html",
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
        title: "Novas Solicitações",
        description: "Analise pedidos enviados pelos clientes.",
        target: "novas-solicitacoes.html",
        icon: "bell",
      },
      {
        title: "Nova Ordem de Serviço",
        description: "Cadastre uma ordem manualmente para um cliente.",
        target: "nova-ordem.html",
        icon: "clipboard",
      },
      {
        title: "Agenda",
        description: "Consulte atendimentos confirmados e disponíveis.",
        target: "agenda.html",
        icon: "calendar",
      },
      {
        title: "Ordens de Serviço",
        description: "Gerencie todas as ordens e seus respectivos status.",
        target: "ordens.html",
        icon: "list",
      },
      {
        title: "Clientes",
        description: "Consulte cadastros, endereços e históricos.",
        target: "clientes.html",
        icon: "users",
      },
      {
        title: "Financeiro",
        description: "Controle recebimentos, despesas e valores pendentes.",
        target: "financeiro.html",
        icon: "wallet",
      },
      {
        title: "Dashboard",
        description: "Acompanhe indicadores operacionais e financeiros.",
        target: "dashboard.html",
        icon: "chart",
      },
      {
        title: "Serviços",
        description: "Configure categorias, mini serviços e valores.",
        target: "servicos.html",
        icon: "tools",
      },
      {
        title: "Funcionários",
        description: "Área preparada para a futura gestão da equipe.",
        target: "funcionarios.html",
        icon: "badge",
      },
    ],
  },
};

/* ==============================
   ÍCONES
================================ */

const icons = {
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

const quickGrid = document.getElementById("quick-grid");
const quickSearch = document.getElementById("quick-search");

const profileKicker = document.getElementById("profile-kicker");
const profileTitle = document.getElementById("profile-title");

const sectionEyebrow = document.getElementById("section-eyebrow");
const cardCount = document.getElementById("card-count");

const emptyState = document.getElementById("empty-state");

const profileButtons = document.querySelectorAll("[data-profile]");

const companyLogo = document.getElementById("company-logo");
const logoContainer = companyLogo.closest(".profile-logo");

const backButton = document.getElementById("back-button");
const logoutButton = document.getElementById("logout-button");

let currentProfile = "cliente";

/* ==============================
   NORMALIZAÇÃO DA PESQUISA
================================ */

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* ==============================
   CRIAÇÃO DOS CARDS
================================ */

function createCard(card) {
  const button = document.createElement("button");

  button.className = "quick-card";
  button.type = "button";

  button.dataset.target = card.target;

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
    window.location.href = card.target;
  });

  return button;
}

/* ==============================
   EXIBIÇÃO DOS CARDS
================================ */

function renderCards() {
  const config = profileConfig[currentProfile];

  const searchTerm = normalizeText(quickSearch.value);

  const filteredCards = config.cards.filter((card) => {
    const searchableText = normalizeText(`${card.title} ${card.description}`);

    return searchableText.includes(searchTerm);
  });

  quickGrid.innerHTML = "";

  filteredCards.forEach((card) => {
    quickGrid.appendChild(createCard(card));
  });

  const cardText = filteredCards.length === 1 ? "atalho" : "atalhos";

  cardCount.textContent = `${filteredCards.length} ${cardText}`;

  emptyState.hidden = filteredCards.length !== 0;
}

/* ==============================
   ALTERAÇÃO DO PERFIL
================================ */

function changeProfile(profile) {
  if (!profileConfig[profile]) {
    return;
  }

  currentProfile = profile;

  const config = profileConfig[profile];

  profileKicker.textContent = config.kicker;
  profileTitle.textContent = config.name;

  sectionEyebrow.textContent = config.sectionEyebrow;

  quickSearch.placeholder = config.searchPlaceholder;

  quickSearch.value = "";

  profileButtons.forEach((button) => {
    const isActive = button.dataset.profile === profile;

    button.classList.toggle("is-active", isActive);

    button.setAttribute("aria-pressed", String(isActive));
  });

  renderCards();
}

/* ==============================
   EVENTOS DO SELETOR
================================ */

profileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeProfile(button.dataset.profile);
  });
});

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

logoutButton.addEventListener("click", () => {
  alert("O logout será conectado quando criarmos a tela de login.");
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
   INICIALIZAÇÃO
================================ */

changeProfile("cliente");
