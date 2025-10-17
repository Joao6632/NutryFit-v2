class Relatorio {
    constructor(paciente, avaliacao1, avaliacao2, titulo = '') {
        this.id = `rel-${new Date().getTime()}`;
        this.pacienteId = paciente.id;
        this.pacienteNome = paciente.nome;
        this.titulo = titulo || `Comparativo de ${paciente.nome}`;
        this.dataCriacao = new Date().toISOString();
        this.idAvaliacao1 = avaliacao1.id;
        this.idAvaliacao2 = avaliacao2.id;
    }

    salvar() {
        const relatoriosExistentes = Relatorio.listarTodos();
        relatoriosExistentes.push(this);
        localStorage.setItem('nutrifit-relatorios', JSON.stringify(relatoriosExistentes));
    }

    static listarTodos() {
        const dados = localStorage.getItem('nutrifit-relatorios');
        return dados ? JSON.parse(dados) : [];
    }

    static buscarPorId(id) {
        const todos = Relatorio.listarTodos();
        return todos.find(relatorio => relatorio.id === id);
    }

    // Novo método para validar se um relatório ainda é válido
    static validarRelatorio(relatorio) {
        // Busca as avaliações no localStorage (assumindo que estão armazenadas lá)
        const avaliacoes = JSON.parse(localStorage.getItem('nutrifit-avaliacoes') || '[]');
        
        // Verifica se ambas as avaliações ainda existem
        const avaliacao1Existe = avaliacoes.some(av => av.id === relatorio.idAvaliacao1);
        const avaliacao2Existe = avaliacoes.some(av => av.id === relatorio.idAvaliacao2);
        
        return avaliacao1Existe && avaliacao2Existe;
    }

    // Novo método para listar apenas relatórios válidos
    static listarValidos() {
        const todosRelatorios = Relatorio.listarTodos();
        const relatoriosValidos = todosRelatorios.filter(relatorio => 
            Relatorio.validarRelatorio(relatorio)
        );

        // Se houver relatórios inválidos, remove eles do localStorage
        if (relatoriosValidos.length !== todosRelatorios.length) {
            localStorage.setItem('nutrifit-relatorios', JSON.stringify(relatoriosValidos));
        }

        return relatoriosValidos;
    }
}

// =================================================================================
// LÓGICA PRINCIPAL DA PÁGINA DE LISTAGEM DE RELATÓRIOS
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {

    // --- CONFIGURAÇÃO DA SIDEBAR ---
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

    // --- CONFIGURAÇÃO DO LOGOUT ---
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

    // --- RENDERIZAÇÃO DOS CARDS ---
    const renderizarCards = (relatorios) => {
        const container = document.getElementById("relatorios-lista");
        if (!container) return;

        container.innerHTML = ""; // limpa a lista

        if (relatorios.length === 0) {
            container.innerHTML = '<p class="feedback-text">Nenhum relatório foi gerado ainda.</p>';
            return;
        }

        relatorios.forEach(relatorio => {
            const cardLink = document.createElement("a");
            cardLink.href = `Comparacao/Comparacao.html?id=${relatorio.id}`;
            cardLink.className = "relatorio-card";
            cardLink.setAttribute("data-id", relatorio.id);

            cardLink.innerHTML = `
                <div class="relatorio-content">
                    <span class="card-text">${relatorio.titulo}</span>
                    <span class="card-text">Criado em: ${formatarData(relatorio.dataCriacao)}</span>
                </div>
            `;

            container.appendChild(cardLink);
        });
    };

    // --- FORMATAÇÃO DE DATA ---
    const formatarData = (dataString) => {
        if (!dataString) return "Data inválida";
        const data = new Date(dataString);
        return data.toLocaleDateString("pt-BR", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // --- BUSCA FILTRADA ---
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

    // --- DELEGATION: REMOVE CARD SE RELATÓRIO NÃO EXISTIR (mantido como fallback) ---
    const container = document.getElementById("relatorios-lista");
    if (container) {
        container.addEventListener("click", (e) => {
            const card = e.target.closest(".relatorio-card");
            if (!card) return;

            const id = card.getAttribute("data-id");
            const relatorio = Relatorio.buscarPorId(id);
            if (!relatorio || !Relatorio.validarRelatorio(relatorio)) {
                card.remove();
                alert("Este relatório não existe mais ou suas avaliações foram removidas.");
                e.preventDefault(); // impede redirecionamento
                return;
            }
            // se existir e for válido, o clique segue normalmente
        });
    }

    // --- INICIALIZAÇÃO ---
    const inicializarPagina = () => {
        configurarSidebar();
        configurarLogout();

        // Agora usa o método que filtra apenas relatórios válidos
        let relatoriosValidos = Relatorio.listarValidos();
        relatoriosValidos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

        renderizarCards(relatoriosValidos);
        configurarBusca(relatoriosValidos);
    };

    inicializarPagina();
});