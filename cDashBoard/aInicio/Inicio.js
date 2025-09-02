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
    const avaliacoes = JSON.parse(localStorage.getItem("nutrifit-avaliacoes")) || [];
    const labels = [];
    const data = [];
    const hoje = new Date(); // Pega a data de hoje

    // Gera os rótulos (labels) para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
        const diaAtualDoLoop = new Date(hoje);
        diaAtualDoLoop.setDate(hoje.getDate() - i);
        
        // Formata a data para "dia/mês" para usar como label no gráfico
        const diaFormatado = diaAtualDoLoop.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(diaFormatado);
        
        // --- LÓGICA PRINCIPAL (CORRIGIDA) ---
        // Filtra a lista 'avaliacoes' para encontrar apenas as que ocorreram no 'diaAtualDoLoop'.
        const avaliacoesNesteDia = avaliacoes.filter(avaliacao => {
            // Supondo que cada avaliação tem uma propriedade 'dataAvaliacao'
            let dataDaAvaliacao;
            
            // Se a data vier como string no formato "YYYY-MM-DD", precisa ajustar para evitar problema de timezone
            if (typeof avaliacao.dataAvaliacao === 'string' && avaliacao.dataAvaliacao.includes('-')) {
                // Adiciona horário local para evitar conversão UTC
                dataDaAvaliacao = new Date(avaliacao.dataAvaliacao + 'T12:00:00');
            } else {
                dataDaAvaliacao = new Date(avaliacao.dataAvaliacao);
            }
            
            // Normaliza as datas para comparar apenas dia/mês/ano (sem hora)
            const anoAval = dataDaAvaliacao.getFullYear();
            const mesAval = dataDaAvaliacao.getMonth();
            const diaAval = dataDaAvaliacao.getDate();
            
            const anoLoop = diaAtualDoLoop.getFullYear();
            const mesLoop = diaAtualDoLoop.getMonth();
            const diaLoop = diaAtualDoLoop.getDate();
            
            // Compara apenas dia, mês e ano
            return anoAval === anoLoop && mesAval === mesLoop && diaAval === diaLoop;
        });
        
        // A quantidade de avaliações é o tamanho da lista filtrada.
        const quantidadeNesteDia = avaliacoesNesteDia.length;
        
        // Adiciona a quantidade real ao array de dados do gráfico.
        data.push(quantidadeNesteDia);
    }

    // --- ETAPA 2: CONFIGURAR O GRÁFICO ---
    const config = {
        type: 'bar', // Tipo de gráfico: barras
        data: {
            labels: labels, // Nossos dias da semana
            datasets: [{
                label: 'Avaliações Realizadas',
                data: data, // Nossos dados reais
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

    const totalAval = quantidadeNesteDia.length;
    console.log(totalAval)
});