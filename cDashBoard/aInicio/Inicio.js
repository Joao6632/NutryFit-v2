// === CONTROLE DA SIDEBAR ===
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // Recupera estado salvo no localStorage
    const savedState = localStorage.getItem('sidebarState');
    if (savedState === 'collapsed') {
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
    }

    // Toggle sidebar
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar-collapsed');

        // Salva estado no localStorage
        localStorage.setItem(
            'sidebarState',
            sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded'
        );
    });

    // Navegação entre páginas
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const url = this.getAttribute('href');

            if (url.startsWith('#')) {
                // só âncoras
                e.preventDefault();
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            } else {
                // Salva estado ANTES de trocar de página
                localStorage.setItem(
                    'sidebarState',
                    sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded'
                );
                // e troca de página
                window.location.href = url;
            }
        });
    });
});

// === GRÁFICO DE AVALIAÇÕES ===
document.addEventListener('DOMContentLoaded', function() {
    const avaliacoes = JSON.parse(localStorage.getItem("nutrifit-avaliacoes")) || [];
    const labels = [];
    const data = [];
    const hoje = new Date();

    // Gera os rótulos (labels) para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
        const diaAtualDoLoop = new Date(hoje);
        diaAtualDoLoop.setDate(hoje.getDate() - i);
        
        // Formata a data para "dia/mês" para usar como label no gráfico
        const diaFormatado = diaAtualDoLoop.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(diaFormatado);
        
        // Filtra avaliações do dia atual do loop
        const avaliacoesNesteDia = avaliacoes.filter(avaliacao => {
            let dataDaAvaliacao;
            
            if (typeof avaliacao.dataAvaliacao === 'string' && avaliacao.dataAvaliacao.includes('-')) {
                dataDaAvaliacao = new Date(avaliacao.dataAvaliacao + 'T12:00:00');
            } else {
                dataDaAvaliacao = new Date(avaliacao.dataAvaliacao);
            }
            
            // Normaliza as datas para comparar apenas dia/mês/ano
            const anoAval = dataDaAvaliacao.getFullYear();
            const mesAval = dataDaAvaliacao.getMonth();
            const diaAval = dataDaAvaliacao.getDate();
            
            const anoLoop = diaAtualDoLoop.getFullYear();
            const mesLoop = diaAtualDoLoop.getMonth();
            const diaLoop = diaAtualDoLoop.getDate();
            
            return anoAval === anoLoop && mesAval === mesLoop && diaAval === diaLoop;
        });
        
        const quantidadeNesteDia = avaliacoesNesteDia.length;
        data.push(quantidadeNesteDia);
    }

    // Configuração do gráfico
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avaliações Realizadas',
                data: data,
                backgroundColor: '#6c8197',
                borderColor: '#536577ff',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    // Renderiza o gráfico
    const ctx = document.getElementById('avaliacoesSemanaChart').getContext('2d');
    new Chart(ctx, config);
});

