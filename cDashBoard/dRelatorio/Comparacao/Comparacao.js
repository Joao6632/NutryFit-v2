// =================================================================================
// DEFINIÇÃO DAS CLASSES DE DADOS
// =================================================================================

class Relatorio {
  static buscarPorId(id) {
    const dados = localStorage.getItem("nutrifit-relatorios");
    const todos = dados ? JSON.parse(dados) : [];
    return todos.find((relatorio) => relatorio.id === id);
  }
}

class Avaliacao {
  constructor(dados) {
    Object.assign(this, dados);
  }
}

// =================================================================================
// LÓGICA PRINCIPAL DA PÁGINA DE COMPARAÇÃO
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
  const inicializarPagina = () => {
    configurarInterface();
    carregarDadosDoRelatorio();
  };

  const configurarInterface = () => {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebar && mainContent && sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("sidebar-collapsed");
      });
    }
    const pdfBtn = document.querySelector(".pdf-btn");
    if (pdfBtn) {
      pdfBtn.addEventListener("click", () => window.print());
    }
    const logoutLink = document.querySelector(".logout-section .nav-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Tem certeza que quer sair?")) {
          localStorage.removeItem("nutryfit_current_user");
          window.location.href = "../../bTelaLogin&Cad/LoginCad.html";
        }
      });
    }
  };

  /**
   * Carrega os dados do relatório a partir do ID na URL e chama as funções de preenchimento.
   */
  const carregarDadosDoRelatorio = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const relatorioId = urlParams.get("id");

    if (!relatorioId) {
      return mostrarErro("ID do relatório não foi encontrado na URL.");
    }

    const relatorio = Relatorio.buscarPorId(relatorioId);
    if (!relatorio) {
      return mostrarErro(
        `Relatório com ID "${relatorioId}" não foi encontrado.`
      );
    }

    const todasAvaliacoes = JSON.parse(
      localStorage.getItem("nutrifit-avaliacoes") || "[]"
    );
    const avaliacao1 = todasAvaliacoes.find(
      (av) => av.id === relatorio.idAvaliacao1
    );
    const avaliacao2 = todasAvaliacoes.find(
      (av) => av.id === relatorio.idAvaliacao2
    );

    if (!avaliacao1 || !avaliacao2) {
      return mostrarErro(
        "Os dados das avaliações para este relatório não foram encontrados."
      );
    }

    // ============================================================================
    // CORREÇÃO AQUI: Garante a ordem correta (da mais antiga para a mais nova)
    // ============================================================================
    let antiga, nova;
    if (
      new Date(avaliacao1.dataAvaliacao) < new Date(avaliacao2.dataAvaliacao)
    ) {
      antiga = new Avaliacao(avaliacao1);
      nova = new Avaliacao(avaliacao2);
    } else {
      antiga = new Avaliacao(avaliacao2);
      nova = new Avaliacao(avaliacao1);
    }

    // Chama as funções para preencher cada seção do seu HTML
    preencherHeader(antiga, nova);
    preencherMetricas(antiga, nova);
    preencherDetalhes(antiga, nova);
    preencherObservacoes(antiga, nova);
  };

  // --- FUNÇÕES DE PREENCHIMENTO DO HTML ---

  const preencherHeader = (antiga, nova) => {
    const container = document.querySelector(".patient-info");
    const dataAntiga = new Date(antiga.dataAvaliacao).toLocaleDateString(
      "pt-BR",
      { timeZone: "UTC" }
    );
    const dataNova = new Date(nova.dataAvaliacao).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });

    container.innerHTML = `
            <span>Paciente: ${nova.pacienteNome} - Avaliação #${antiga.numeroAvaliacao} - ${dataAntiga}</span>
            <i class="bi bi-arrow-right"></i>
            <span>Avaliação #${nova.numeroAvaliacao} - ${dataNova}</span>
        `;
  };

  const preencherMetricas = (antiga, nova) => {
    const configs = [
      {
        el: ".col-md-3:nth-child(1)",
        campo: "pesoAtual",
        unidade: "kg",
        decimais: 2,
        titulo: "Peso",
      },
      {
        el: ".col-md-3:nth-child(2)",
        campo: "percentualGordura",
        unidade: "%",
        decimais: 2,
        titulo: "% de gordura",
      },
      {
        el: ".col-md-3:nth-child(3)",
        campo: "quadril",
        unidade: "cm",
        decimais: 0,
        titulo: "Quadril",
      },
      {
        el: ".col-md-3:nth-child(4)",
        campo: "cintura",
        unidade: "cm",
        decimais: 0,
        titulo: "Cintura",
      },
    ];

    configs.forEach((config) => {
      const card = document.querySelector(config.el);
      if (!card) return;

      const valorAntigo = antiga[config.campo] || 0;
      const valorNovo = nova[config.campo] || 0;
      const variacao = valorNovo - valorAntigo;

      card.querySelector(".metric-title").textContent = config.titulo;
      card.querySelector(
        ".metric-value"
      ).textContent = `${valorNovo.toLocaleString("pt-BR", {
        minimumFractionDigits: config.decimais,
        maximumFractionDigits: config.decimais,
      })} ${config.unidade}`;

      const changeEl = card.querySelector(".metric-change");
      const variacaoAbs = Math.abs(variacao).toLocaleString("pt-BR", {
        minimumFractionDigits: config.decimais,
        maximumFractionDigits: config.decimais,
      });

      changeEl.innerHTML = `
                <i class="bi bi-triangle-fill" style="${
                  variacao < 0 ? "transform: rotate(180deg);" : ""
                }"></i>
                ${variacao > 0 ? "+" : ""}${variacao.toLocaleString("pt-BR", {
        minimumFractionDigits: config.decimais,
        maximumFractionDigits: config.decimais,
      })} ${config.unidade}
            `;
      changeEl.className = "metric-change";
      if (variacao < 0) changeEl.classList.add("negative");
      if (variacao > 0) changeEl.classList.add("positive");
    });
  };

  const preencherDetalhes = (antiga, nova) => {
    const configs = [
      { el: ".detail-item:nth-child(1)", campo: "atividadesFisicas" },
      { el: ".detail-item:nth-child(2)", campo: "habitosMastigacao" },
      { el: ".detail-item:nth-child(3)", campo: "imc" },
      {
        el: ".detail-item:nth-child(4)",
        campo: "alturaAtual",
       
      },
      { el: ".detail-item:nth-child(5)", campo: "frequenciaRefeicoes" },
      {
        el: ".detail-item:nth-child(6)",
        campo: "usoSubstancias",
        
      },
    ];

    configs.forEach((config) => {
      const item = document.querySelector(config.el);
      if (!item) return;

      const valorAntigo = antiga[config.campo];
      const valorNovo = nova[config.campo];

      item.querySelector(".detail-sublabel").textContent = config.formatar
        ? config.formatar(nova)
        : String(valorNovo) || "Não informado";

      const indicator = item.querySelector("i");
      if (indicator) {
        if (valorNovo > valorAntigo) {
          indicator.className = "detail-indicator-up bi-triangle-fill";
        } else if (valorNovo < valorAntigo) {
          indicator.className = "detail-indicator-down bi-triangle-fill";
        } else {
          indicator.className = "detail-indicator-stable bi bi-circle-fill";
        }
      }
    });
  };

  const preencherObservacoes = (antiga, nova) => {
    const cardAntigo = document.querySelector(".observacao-card:nth-child(1)");
    const cardNovo = document.querySelector(".observacao-card:nth-child(3)");

    if (cardAntigo) {
      cardAntigo.querySelector(
        ".observacao-title"
      ).textContent = `Observações - Aval. #${antiga.numeroAvaliacao}`;
      cardAntigo.querySelector(".observacao-text").textContent =
        antiga.observacoes || "Nenhuma observação.";
    }
    if (cardNovo) {
      cardNovo.querySelector(
        ".observacao-title"
      ).textContent = `Observações - Aval. #${nova.numeroAvaliacao}`;
      cardNovo.querySelector(".observacao-text").textContent =
        nova.observacoes || "Nenhuma observação.";
    }
  };

  const mostrarErro = (mensagem) => {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #dc3545;">Erro no Carregamento</h2>
                    <p>${mensagem}</p>
                    <button onclick="window.history.back()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Voltar
                    </button>
                </div>`;
    }
  };

  inicializarPagina();
});
