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

class ProfileConfigService {
  static getConfig() {
    try {
      // Lista de possíveis nomes para a configuração
      const possiveisNomes = [
        "nutryfit_profile_config",
        "nutrifit_profile_config", 
        "nutrifit-profile-config",
        "nutryfit-profile-config"
      ];

      let savedConfig = null;
      let nomeEncontrado = null;

      // Tenta encontrar a configuração com qualquer um dos nomes
      for (const nome of possiveisNomes) {
        const config = localStorage.getItem(nome);
        if (config) {
          savedConfig = config;
          nomeEncontrado = nome;
          break;
        }
      }

      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log(`Configurações carregadas de: ${nomeEncontrado}`, config);
        return {
          usarLogo: config.usarLogo || false,
          infoRodape: config.infoRodape || ''
        };
      }
      
      console.log("Nenhuma configuração de perfil encontrada, usando padrões");
      return {
        usarLogo: false,
        infoRodape: ''
      };
    } catch (error) {
      console.error("Erro ao carregar configurações do perfil:", error);
      return {
        usarLogo: false,
        infoRodape: ''
      };
    }
  }

  // Método para debug
  static debugConfig() {
    console.log("=== DEBUG CONFIGURAÇÕES DE PERFIL ===");
    
    const possiveisNomes = [
      "nutryfit_profile_config",
      "nutrifit_profile_config", 
      "nutrifit-profile-config",
      "nutryfit-profile-config"
    ];

    possiveisNomes.forEach(nome => {
      const valor = localStorage.getItem(nome);
      console.log(`${nome}: ${valor}`);
    });

    // Lista todas as chaves que contém config ou profile
    const allKeys = Object.keys(localStorage);
    const configKeys = allKeys.filter(key => 
      key.toLowerCase().includes('config') || key.toLowerCase().includes('profile')
    );
    console.log("Todas as chaves relacionadas:", configKeys);
    
    console.log("Configuração final:", this.getConfig());
    console.log("=====================================");
  }
}

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
    if (!element) {
      console.error("Elemento .main-content não encontrado");
      return;
    }

    console.log("Iniciando geração do PDF...");

    // Obter as configurações do perfil
    const config = ProfileConfigService.getConfig();
    console.log("Configurações para PDF:", config);

    const clone = element.cloneNode(true);
    clone.style.marginLeft = "0";
    clone.style.minHeight = "auto";
    clone.style.width = "100%";

    // Aplicar logo se configurado
    if (config.usarLogo) {
      console.log("Adicionando logo ao PDF");
      this.adicionarHeaderComLogo(clone);
    }

    // Aplicar rodapé se configurado
    if (config.infoRodape && config.infoRodape.trim()) {
      console.log("Adicionando rodapé ao PDF:", config.infoRodape);
      this.adicionarRodape(clone, config.infoRodape);
    }

    const options = {
      margin: 5,
      filename: "relatorio_comparacao.pdf",
      image: { type: "jpeg", quality: 0.9 },
      html2canvas: {
        scale: 1.3,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (el) => el.classList.contains("pdf-btn") || el.classList.contains("back-btn")
      },
      jsPDF: { 
        unit: "pt", 
        format: "a4", 
        orientation: "portrait"
      }
    };

    html2pdf().set(options).from(clone).save()
      .then(() => {
        console.log("PDF gerado com sucesso!");
      })
      .catch((error) => {
        console.error("Erro ao gerar PDF:", error);
      });
  }

  static adicionarHeaderComLogo(elemento) {
    // Logo sutil no canto superior direito
    const logoContainer = document.createElement("div");
    logoContainer.style.cssText = `
      position: absolute;
      top: 15px;
      right: 20px;
      z-index: 10;
    `;

    const logoImg = document.createElement("img");
    const possiveisCaminhos = [
      "../../../assets/nutrifiticon.png"
    ];

    logoImg.src = possiveisCaminhos[0];
    logoImg.alt = "NutryFit";
    logoImg.style.cssText = `
      width: 35px;
      height: 35px;
      object-fit: contain;
      opacity: 0.8;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    `;

    logoImg.onerror = function() {
      console.warn("Logo não encontrado em:", this.src);
      // Tenta outros caminhos
      const currentIndex = possiveisCaminhos.indexOf(this.src);
      if (currentIndex < possiveisCaminhos.length - 1) {
        this.src = possiveisCaminhos[currentIndex + 1];
      } else {
        this.style.display = 'none';
      }
    };

    logoContainer.appendChild(logoImg);
    
    // Ajustar o elemento principal para ter position relative
    elemento.style.position = 'relative';
    elemento.style.paddingTop = '60px'; // Dar espaço para a logo
    
    // Inserir a logo
    elemento.insertBefore(logoContainer, elemento.firstChild);
  }

  static adicionarRodape(elemento, infoRodape) {
    const rodape = document.createElement("div");
    rodape.style.cssText = `
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      padding: 20px;
      border-top: 2px solid #e9ecef;
      background-color: #f8f9fa;
      line-height: 1.6;
      white-space: pre-line;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    rodape.textContent = infoRodape;
    
    // Adicionar data de geração
    const dataGeracao = document.createElement("div");
    dataGeracao.style.cssText = `
      margin-top: 10px;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #dee2e6;
      padding-top: 10px;
    `;
    dataGeracao.textContent = `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;
    
    rodape.appendChild(dataGeracao);
    elemento.appendChild(rodape);
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
      pdfBtn.addEventListener("click", () => {
        console.log("Botão PDF clicado");
        PDFService.gerar();
      });
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
      console.log("Inicializando relatório...");
      
      UIService.configurarInterface();
      
      const relatorioId = this.obterIdDaURL();
      if (!relatorioId) {
        throw new Error("ID do relatório não foi encontrado na URL.");
      }

      console.log("ID do relatório:", relatorioId);

      const comparador = RelatorioService.carregarDados(relatorioId);
      RelatorioService.renderizarComparacao(comparador);
      
      console.log("Relatório carregado com sucesso!");
      
      // Debug das configurações (remover em produção)
      ProfileConfigService.debugConfig();
      
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
  console.log("DOM carregado, inicializando aplicação...");
  RelatorioController.inicializar();
});

// =================================================================================
// 9. FUNÇÕES GLOBAIS PARA DEBUG (pode remover em produção)
// =================================================================================

// Para usar no console do navegador
window.debugNutryfit = {
  config: () => ProfileConfigService.debugConfig(),
  gerarPDF: () => PDFService.gerar(),
  localStorage: () => {
    console.log("=== TODOS OS DADOS DO LOCALSTORAGE ===");
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
  }
};