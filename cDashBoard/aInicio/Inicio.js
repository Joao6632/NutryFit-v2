document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // 🔹 Recupera estado salvo no localStorage
    const savedState = localStorage.getItem('sidebarState');
    if (savedState === 'collapsed') {
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
    }

    // Toggle sidebar
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar-collapsed');

        // 🔹 Salva estado no localStorage
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
                // 🔹 Salva estado ANTES de trocar de página
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
document.addEventListener('DOMContentLoaded', function() {
            // --- ETAPA 1: PREPARAR OS DADOS ---
            // No futuro, estes dados virão do seu backend (Java/MySQL).
            // Por agora, vamos simular os dados para os últimos 7 dias.
            
            const labels = [];
            const data = [];
            const hoje = new Date(); // Pega a data de hoje

            // Gera os rótulos (labels) para os últimos 7 dias
            for (let i = 6; i >= 0; i--) {
                const dia = new Date(hoje);
                dia.setDate(hoje.getDate() - i);
                
                // Formata a data para "dia/mês" (ex: "29/08")
                const diaFormatado = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                labels.push(diaFormatado);
                
                // Gera um número aleatório de avaliações para o exemplo
                data.push(Math.floor(Math.random() * 10)); // Gera de 0 a 9 avaliações
            }

            // --- ETAPA 2: CONFIGURAR O GRÁFICO ---
            const config = {
                type: 'bar', // Tipo de gráfico: barras
                data: {
                    labels: labels, // Nossos dias da semana
                    datasets: [{
                        label: 'Avaliações Realizadas',
                        data: data, // Nossos dados simulados
                        backgroundColor: '#6c8197', // Cor das barras
                        borderColor: '#536577ff',
                        borderWidth: 1,
                        borderRadius: 5 // Deixa as bordas das barras arredondadas
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true, // Eixo Y começa no zero
                            ticks: {
                                // Garante que o eixo Y só mostre números inteiros
                                stepSize: 1 
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false // Esconde a legenda "Avaliações Realizadas" no topo
                        }
                    }
                }
            };

            // --- ETAPA 3: RENDERIZAR O GRÁFICO ---
            const ctx = document.getElementById('avaliacoesSemanaChart').getContext('2d');
            new Chart(ctx, config);
        });