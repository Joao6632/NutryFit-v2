// =================================================================================
// CLASSE QUE DEFINE A ESTRUTURA E AS AÇÕES DE UM RELATÓRIO
// =================================================================================
class Relatorio {
    /**
     * @param {object} paciente
     * @param {object} avaliacao1
     * @param {object} avaliacao2
     * @param {string} [titulo='']
     */
    constructor(paciente, avaliacao1, avaliacao2, titulo = '') {
        this.id = `rel-${new Date().getTime()}`;
        this.pacienteId = paciente.id;
        this.pacienteNome = paciente.nome;
        this.titulo = titulo || `Comparativo de ${paciente.nome}`;
        this.dataCriacao = new Date().toISOString();
        this.idAvaliacao1 = avaliacao1.id;
        this.idAvaliacao2 = avaliacao2.id;
    }

    /** Salva a instância atual do relatório na lista de relatórios. */
    salvar() {
        const relatoriosExistentes = Relatorio.listarTodos();
        relatoriosExistentes.push(this);
        localStorage.setItem('nutrifit-relatorios', JSON.stringify(relatoriosExistentes));
    }

    /** @returns {Array} Uma lista de todos os relatórios salvos. */
    static listarTodos() {
        const dados = localStorage.getItem('nutrifit-relatorios');
        return dados ? JSON.parse(dados) : [];
    }

    /**
     * @param {string} id O ID do relatório a ser buscado.
     * @returns {object | undefined} O objeto do relatório ou undefined se não for encontrado.
     */
    static buscarPorId(id) {
        const todos = Relatorio.listarTodos();
        return todos.find(relatorio => relatorio.id === id);
    }
}


// =================================================================================
// LÓGICA PRINCIPAL DA PÁGINA DE LISTAGEM DE RELATÓRIOS
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {

    // --- FUNÇÕES DE CONFIGURAÇÃO DA PÁGINA ---

    const configurarSidebar = () => {
        const sidebar = document.getElementById("sidebar");
        const mainContent = document.getElementById("mainContent");
        const sidebarToggle = document.getElementById("sidebarToggle");

        if (!sidebar || !mainContent || !sidebarToggle) return;

        const estadoSalvo = localStorage.getItem("sidebarState");
        if (estadoSalvo === "collapsed") {
            sidebar.classList.add("collapsed");
            mainContent.classList.add("sidebar-collapsed");
        }

        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            mainContent.classList.toggle("sidebar-collapsed");
            const novoEstado = sidebar.classList.contains("collapsed") ? "collapsed" : "expanded";
            localStorage.setItem("sidebarState", novoEstado);
        });
    };

    const configurarLogout = () => {
        const logoutLink = document.getElementById("logoutLink");
        if (logoutLink) {
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                if (confirm("Tem certeza que deseja sair?")) {
                    localStorage.removeItem("nutryfit_current_user");
                    window.location.href = "../../bTelaLogin&Cad/LoginCad.html";
                }
            });
        }
    };

    // --- FUNÇÕES DE LÓGICA DOS RELATÓRIOS ---

    /** Renderiza os cards de relatório na tela. */
    const renderizarCards = (relatorios) => {
        const container = document.getElementById("relatorios-lista");
        if (!container) return;

        container.innerHTML = ""; // Limpa a lista antes de renderizar

        if (relatorios.length === 0) {
            container.innerHTML = '<p class="feedback-text">Nenhum relatório foi gerado ainda.</p>';
            return;
        }

        relatorios.forEach(relatorio => {
            const cardLink = document.createElement("a");
            cardLink.href = `Comparacao/Comparacao.html?id=${relatorio.id}`;
            cardLink.className = "relatorio-card";

            cardLink.innerHTML = `
                <div class="relatorio-content">
                    <span class="card-text">${relatorio.titulo}</span>
                    
                    <span class="card-text">Criado em: ${formatarData(relatorio.dataCriacao)}</span>
                </div>
                
            `;
            container.appendChild(cardLink);
        });
    };

    /** Configura a barra de busca para filtrar os relatórios. */
    const configurarBusca = (relatorios) => {
        const searchInput = document.getElementById("searchInput");
        if (!searchInput) return;

        searchInput.addEventListener("input", (e) => {
            const termoBusca = e.target.value.toLowerCase();
            const relatoriosFiltrados = relatorios.filter(relatorio =>
                relatorio.titulo.toLowerCase().includes(termoBusca) ||
                relatorio.pacienteNome.toLowerCase().includes(termoBusca)
            );
            renderizarCards(relatoriosFiltrados);
        });
    };

    /** Formata uma string de data para o padrão pt-BR. */
    const formatarData = (dataString) => {
        if (!dataString) return "Data inválida";
        const data = new Date(dataString);
        return data.toLocaleDateString("pt-BR", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };


    // --- INICIALIZAÇÃO DA PÁGINA ---

    /** Função principal que executa todas as outras na ordem correta. */
    const inicializarPagina = () => {
        configurarSidebar();
        configurarLogout();
        
        // Carrega os relatórios usando o método estático da classe
        let todosOsRelatorios = Relatorio.listarTodos();
        
        // Ordena os relatórios (mais recentes primeiro)
        todosOsRelatorios.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        
        // Exibe os relatórios na tela e configura a busca
        renderizarCards(todosOsRelatorios);
        configurarBusca(todosOsRelatorios);
    };

    // Ponto de entrada: chama a função principal
    inicializarPagina();
});