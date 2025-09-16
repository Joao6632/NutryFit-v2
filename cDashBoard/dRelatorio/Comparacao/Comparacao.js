// =================================================================================
// 1. CAMADA DE DADOS - Responsabilidade única para acesso aos dados
// =================================================================================

class DataService {
  static getRelatorioById(id) {
    const dados = localStorage.getItem("nutrifit-relatorios");
    const todos = dados ? JSON.parse(dados) : [];
    return todos.find(relatorio => relatorio.id === id);
  }

  static getAllAvaliacoes() {
    return JSON.parse(localStorage.getItem("nutrifit-avaliacoes") || "[]");
  }

  static getAvaliacaoById(id) {
    return this.getAllAvaliacoes().find(av => av.id === id);
  }
}

// =================================================================================
// 2. UTILITÁRIOS - Funções puras para transformações
// =================================================================================

class DateUtils {
  static formatToBrazilian(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }
}

class NumberUtils {
  static formatWithDecimals(value, decimals = 2) {
    return Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}

// =================================================================================
// 3. MODELOS DE DOMÍNIO - Encapsulam regras de negócio
// =================================================================================

class Avaliacao {
  constructor(dados) {
    Object.assign(this, dados);
  }

  get dataFormatada() {
    return DateUtils.formatToBrazilian(this.dataAvaliacao);
  }

  static ordenarPorData(avaliacao1, avaliacao2) {
    const data1 = new Date(avaliacao1.dataAvaliacao);
    const data2 = new Date(avaliacao2.dataAvaliacao);
    return data1 < data2 ? [avaliacao1, avaliacao2] : [avaliacao2, avaliacao1];
  }
}

class ComparadorAvaliacoes {
  constructor(avaliacaoAntiga, avaliacaoNova) {
    this.antiga = new Avaliacao(avaliacaoAntiga);
    this.nova = new Avaliacao(avaliacaoNova);
  }

  calcularVariacao(campo, decimals = 2) {
    const valorAntigo = this.antiga[campo] || 0;
    const valorNovo = this.nova[campo] || 0;
    return {
      antiga: valorAntigo,
      nova: valorNovo,
      diferenca: valorNovo - valorAntigo,
      novaFormatada: NumberUtils.formatWithDecimals(valorNovo, decimals),
      diferencaFormatada: NumberUtils.formatWithDecimals(valorNovo - valorAntigo, decimals)
    };
  }

  getTipoVariacao(diferenca) {
    if (diferenca > 0) return 'positive';
    if (diferenca < 0) return 'negative';
    return 'stable';
  }
}

// =================================================================================
// 4. COMPONENTES DE UI - Responsáveis pela renderização
// =================================================================================

class UIComponents {

  static createDetailIndicator(valorAntigo, valorNovo) {
    if (valorNovo > valorAntigo) return "detail-indicator-up bi-triangle-fill";
    if (valorNovo < valorAntigo) return "detail-indicator-down bi-triangle-fill";
    return "detail-indicator-stable bi bi-circle-fill";
  }
}

// =================================================================================
// 5. RENDERIZADORES - Separam lógica de apresentação
// =================================================================================

class HeaderRenderer {
  static render(comparador) {
    const container = document.querySelector(".patient-info");
    if (!container) return;

    container.innerHTML = `
      <span>Paciente: ${comparador.nova.pacienteNome} - Avaliação #${comparador.antiga.numeroAvaliacao} - ${comparador.antiga.dataFormatada}</span>
      <i class="bi bi-arrow-right"></i>
      <span>Avaliação #${comparador.nova.numeroAvaliacao} - ${comparador.nova.dataFormatada}</span>
    `;
  }
}

class MetricsRenderer {
  static CONFIGS = [
    { selector: ".col-md-3:nth-child(1)", campo: "pesoAtual", unidade: "kg", decimais: 2, titulo: "Peso" },
    { selector: ".col-md-3:nth-child(2)", campo: "percentualGordura", unidade: "%", decimais: 2, titulo: "% de gordura" },
    { selector: ".col-md-3:nth-child(3)", campo: "quadril", unidade: "cm", decimais: 0, titulo: "Quadril" },
    { selector: ".col-md-3:nth-child(4)", campo: "cintura", unidade: "cm", decimais: 0, titulo: "Cintura" },
  ];

  static render(comparador) {
    this.CONFIGS.forEach(config => {
      const card = document.querySelector(config.selector);
      if (!card) return;

      const variacao = comparador.calcularVariacao(config.campo, config.decimais);
      
      // Mantém a estrutura HTML original, apenas atualiza o conteúdo
      const titleEl = card.querySelector(".metric-title");
      const valueEl = card.querySelector(".metric-value");
      const changeEl = card.querySelector(".metric-change");
      
      if (titleEl) titleEl.textContent = config.titulo;
      if (valueEl) valueEl.textContent = `${variacao.novaFormatada} ${config.unidade}`;
      
      if (changeEl) {
        const { diferenca, diferencaFormatada } = variacao;
        const tipo = comparador.getTipoVariacao(diferenca);
        
        changeEl.innerHTML = `
          <i class="bi bi-triangle-fill" style="${diferenca < 0 ? 'transform: rotate(180deg);' : ''}"></i>
          ${diferenca > 0 ? '+' : ''}${diferencaFormatada} ${config.unidade}
        `;
        
        // Remove classes antigas e adiciona a nova
        changeEl.className = "metric-change";
        if (tipo !== 'stable') changeEl.classList.add(tipo);
      }
    });
  }
}

class DetailsRenderer {
  static CONFIGS = [
    { selector: ".detail-item:nth-child(1)", campo: "atividadesFisicas" },
    { selector: ".detail-item:nth-child(2)", campo: "habitosMastigacao" },
    { selector: ".detail-item:nth-child(3)", campo: "imc" },
    { selector: ".detail-item:nth-child(4)", campo: "alturaAtual" },
    { selector: ".detail-item:nth-child(5)", campo: "frequenciaRefeicoes" },
    { selector: ".detail-item:nth-child(6)", campo: "detalhesSubstancias" },
  ];

  static render(comparador) {
    this.CONFIGS.forEach(config => {
      const item = document.querySelector(config.selector);
      if (!item) return;

      const valorAntigo = comparador.antiga[config.campo];
      const valorNovo = comparador.nova[config.campo];

      const sublabel = item.querySelector(".detail-sublabel");
      const indicator = item.querySelector("i");

      if (sublabel) {
        sublabel.textContent = String(valorNovo) || "Não informado";
      }

      if (indicator) {
        indicator.className = UIComponents.createDetailIndicator(valorAntigo, valorNovo);
      }
    });
  }
}

class ObservationsRenderer {
  static render(comparador) {
    const cardAntigo = document.querySelector(".observacao-card:nth-child(1)");
    const cardNovo = document.querySelector(".observacao-card:nth-child(3)");

    if (cardAntigo) {
      const titleEl = cardAntigo.querySelector(".observacao-title");
      const textEl = cardAntigo.querySelector(".observacao-text");
      
      if (titleEl) titleEl.textContent = `Observações - Aval. #${comparador.antiga.numeroAvaliacao}`;
      if (textEl) textEl.textContent = comparador.antiga.observacoes || 'Nenhuma observação.';
    }

    if (cardNovo) {
      const titleEl = cardNovo.querySelector(".observacao-title");
      const textEl = cardNovo.querySelector(".observacao-text");
      
      if (titleEl) titleEl.textContent = `Observações - Aval. #${comparador.nova.numeroAvaliacao}`;
      if (textEl) textEl.textContent = comparador.nova.observacoes || 'Nenhuma observação.';
    }
  }
}

// =================================================================================
// 6. SERVIÇOS DE APLICAÇÃO - Orquestram o fluxo principal
// =================================================================================

class RelatorioService {
  static carregarDados(relatorioId) {
    const relatorio = DataService.getRelatorioById(relatorioId);
    if (!relatorio) {
      throw new Error(`Relatório com ID "${relatorioId}" não foi encontrado.`);
    }

    const avaliacao1 = DataService.getAvaliacaoById(relatorio.idAvaliacao1);
    const avaliacao2 = DataService.getAvaliacaoById(relatorio.idAvaliacao2);

    if (!avaliacao1 || !avaliacao2) {
      throw new Error("Os dados das avaliações para este relatório não foram encontrados.");
    }

    // Retorna na ordem correta: [antiga, nova]
    const [antiga, nova] = Avaliacao.ordenarPorData(avaliacao1, avaliacao2);
    return new ComparadorAvaliacoes(antiga, nova);
  }

  static renderizarComparacao(comparador) {
    HeaderRenderer.render(comparador);
    MetricsRenderer.render(comparador);
    DetailsRenderer.render(comparador);
    ObservationsRenderer.render(comparador);
  }
}

class PDFService {
  static gerar() {
    const element = document.querySelector(".main-content");
    if (!element) return;

    const clone = element.cloneNode(true);
    clone.style.marginLeft = "0";
    clone.style.minHeight = "auto";
    clone.style.width = "100%";

    const options = {
      margin: 10,
      filename: "relatorio_comparacao.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (el) => el.classList.contains("pdf-btn") || el.classList.contains("back-btn")
      },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(clone).save();
  }
}

class UIService {
  static configurarInterface() {
    this.configurarSidebar();
    this.configurarLogout();
    this.configurarPDF();
  }

  static configurarSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const sidebarToggle = document.getElementById("sidebarToggle");
    
    if (sidebar && mainContent && sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("sidebar-collapsed");
      });
    }
  }

  static configurarLogout() {
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
  }

  static configurarPDF() {
    const pdfBtn = document.querySelector(".pdf-btn");
    if (pdfBtn) {
      pdfBtn.addEventListener("click", PDFService.gerar);
    }
  }

  static mostrarErro(mensagem) {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <h2 style="color: #dc3545;">Erro no Carregamento</h2>
          <p>${mensagem}</p>
          <button onclick="window.history.back()" 
                  style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Voltar
          </button>
        </div>
      `;
    }
  }
}

// =================================================================================
// 7. CONTROLADOR PRINCIPAL - Orquestra toda a aplicação
// =================================================================================

class RelatorioController {
  static inicializar() {
    try {
      UIService.configurarInterface();
      
      const relatorioId = this.obterIdDaURL();
      if (!relatorioId) {
        throw new Error("ID do relatório não foi encontrado na URL.");
      }

      const comparador = RelatorioService.carregarDados(relatorioId);
      RelatorioService.renderizarComparacao(comparador);
      
    } catch (error) {
      UIService.mostrarErro(error.message);
      console.error("Erro ao carregar relatório:", error);
    }
  }

  static obterIdDaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
  }
}

// =================================================================================
// 8. INICIALIZAÇÃO
// =================================================================================

document.addEventListener("DOMContentLoaded", () => {
  RelatorioController.inicializar();
});