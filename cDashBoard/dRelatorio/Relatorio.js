document.addEventListener("DOMContentLoaded", () => {
    // Armazena a lista de relatórios para ser usada pela função de busca
    let listaDeRelatorios = [];

    const inicializar = () => {
        configurarSidebar();
        configurarLogout();
        
        listaDeRelatorios = carregarRelatoriosDoStorage();
        renderizarCards(listaDeRelatorios);

        configurarBusca(listaDeRelatorios);
    };

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

    // -------------------------------------------------------------------------------------------

    const carregarRelatoriosDoStorage = () => {
        const todasAvaliacoes = JSON.parse(localStorage.getItem("nutrifit-avaliacoes") || "[]");
        const pacientesMap = new Map();

        // Agrupa todas as avaliações por paciente
        todasAvaliacoes.forEach((avaliacao) => {
            if (!pacientesMap.has(avaliacao.pacienteId)) {
                pacientesMap.set(avaliacao.pacienteId, {
                    pacienteNome: avaliacao.pacienteNome,
                    avaliacoes: []
                });
            }
            pacientesMap.get(avaliacao.pacienteId).avaliacoes.push(avaliacao);
        });

        const relatoriosValidos = [];
        pacientesMap.forEach((pacienteData) => {
            // Um relatório só é válido se o paciente tiver 2 ou mais avaliações
            if (pacienteData.avaliacoes.length >= 2) {
                // Ordena para encontrar a avaliação mais recente
                pacienteData.avaliacoes.sort((a, b) => new Date(b.dataAvaliacao) - new Date(a.dataAvaliacao));
                const ultimaAvaliacao = pacienteData.avaliacoes[0];
                
                relatoriosValidos.push({
                    id: ultimaAvaliacao.id,
                    pacienteNome: pacienteData.pacienteNome,
                    dataAvaliacao: ultimaAvaliacao.dataAvaliacao,
                    totalAvaliacoes: pacienteData.avaliacoes.length,
                });
            }
        });

        // Retorna os relatórios ordenados por nome
        return relatoriosValidos.sort((a, b) => a.pacienteNome.localeCompare(b.pacienteNome));
    };

    const renderizarCards = (relatorios) => {
        const container = document.getElementById("relatorios-lista");
        const searchInput = document.getElementById("searchInput");
        container.innerHTML = "";

        if (relatorios.length === 0) {
            if (searchInput.value) {
                 container.innerHTML = '<p class="feedback-text">Nenhum paciente encontrado com este nome.</p>';
            } else {
                 container.innerHTML = '<p class="feedback-text">Nenhum relatório disponível. Os pacientes precisam ter pelo menos 2 avaliações.</p>';
            }
            return;
        }

        relatorios.forEach((relatorio) => {
            // Cria o link do card
            const cardLink = document.createElement("a");
            cardLink.href = `Comparacao/Comparacao.html?id=${relatorio.id}`;
            cardLink.className = "relatorio-card";

            // Adiciona o conteúdo interno do card, sem ícones novos
            cardLink.innerHTML = `
                <div class="relatorio-content">
                    <span class="card-text">Relatório - ${relatorio.pacienteNome}</span>
                    <span class="card-text-data">${formatarData(relatorio.dataAvaliacao)}</span>
                    
                </div>
            `;
            container.appendChild(cardLink);
        });
    };
    


    const formatarData = (dataString) => {
        if (!dataString) return "Data não informada";
        // Corrige problemas de fuso horário que podem alterar o dia
        const data = new Date(dataString);
        const dataCorrigida = new Date(data.valueOf() + data.getTimezoneOffset() * 60000);
        return dataCorrigida.toLocaleDateString("pt-BR");
    };
    

    const configurarBusca = (relatorios) => {
        const searchInput = document.getElementById("searchInput");
        searchInput.addEventListener("input", (e) => {
            const termoBusca = e.target.value.toLowerCase();
            const relatoriosFiltrados = relatorios.filter(relatorio =>
                relatorio.pacienteNome.toLowerCase().includes(termoBusca)
            );
            renderizarCards(relatoriosFiltrados);
        });
    };

    // Inicia tudo
    inicializar();
});