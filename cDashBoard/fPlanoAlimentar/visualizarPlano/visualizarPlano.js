// =================================================================================
// CONTROLE DA SIDEBAR
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');

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
});

// =================================================================================
// CONTROLE DO LOGOUT
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const logoutLink = document.getElementById('logoutLink');

    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();

            const confirmar = confirm("Tem certeza que quer sair?");
            if (confirmar) {
                localStorage.removeItem("nutryfit_current_user");
                window.location.href = "../../bTelaLogin&Cad/LoginCad.html";
            }
        });
    }
});

// =================================================================================
// CARREGAMENTO E EXIBIÇÃO DO PLANO
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
    carregarPlanoAlimentar();
    configurarBotoes();
});

/**
 * Carrega e exibe os dados do plano alimentar
 */
function carregarPlanoAlimentar() {
    const urlParams = new URLSearchParams(window.location.search);
    const planoId = urlParams.get('id');

    if (!planoId) {
        mostrarErro();
        return;
    }

    const planos = JSON.parse(localStorage.getItem('nutrifit-planos') || '[]');
    const plano = planos.find(p => p.id === planoId);

    if (!plano) {
        mostrarErro();
        return;
    }

    // Armazena o plano globalmente para outras funções
    window.planoAtual = plano;

    // Preenche os dados na página
    preencherDadosPlano(plano);
}

/**
 * Preenche os dados do plano na página
 */
function preencherDadosPlano(plano) {
    // Atualiza título da página
    document.getElementById('tituloPlano').textContent = plano.titulo || 'Plano alimentar';
    
    // Atualiza informações do paciente
    document.getElementById('infoPaciente').textContent = `Paciente: ${plano.pacienteNome}`;
    
    // Preenche tabela de refeições
    preencherTabelaRefeicoes(plano.refeicoes);
    
    // Preenche observações
    preencherObservacoes(plano.observacoes);
}

/**
 * Preenche a tabela de refeições
 */
function preencherTabelaRefeicoes(refeicoes) {
    const tbody = document.getElementById('tabelaRefeicoes');
    tbody.innerHTML = '';

    refeicoes.forEach(refeicao => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="refeicao-nome">${refeicao.nome}</div>
            </td>
            <td class="col-horario">
                <span class="horario-texto">${refeicao.horarioInicio} - ${refeicao.horarioFim}</span>
            </td>
            <td>
                <div class="objetivo-texto">${refeicao.objetivo}</div>
            </td>
            <td>
                <div class="alimentos-texto">${refeicao.alimentos}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Preenche a seção de observações
 */
function preencherObservacoes(observacoes) {
    const container = document.getElementById('observacoesConteudo');
    
    if (observacoes && observacoes.trim()) {
        container.textContent = observacoes;
        container.classList.remove('observacoes-vazio');
    } else {
        container.textContent = 'Nenhuma observação adicionada.';
        container.classList.add('observacoes-vazio');
    }
}

/**
 * Mostra a mensagem de erro quando o plano não é encontrado
 */
function mostrarErro() {
    document.getElementById('conteudoImpressao').style.display = 'none';
    document.getElementById('erroContainer').style.display = 'flex';
}

// =================================================================================
// CONFIGURAÇÃO DOS BOTÕES
// =================================================================================
function configurarBotoes() {
    // Botão de gerar PDF
    const btnPDF = document.getElementById('btnPDF');
    if (btnPDF) {
        btnPDF.addEventListener('click', gerarPDF);
    }

    // Botão de excluir plano
    const btnExcluir = document.getElementById('btnExcluirPlano');
    if (btnExcluir) {
        btnExcluir.addEventListener('click', excluirPlanoAtual);
    }
}

// =================================================================================
// GERAÇÃO DE PDF
// =================================================================================
function gerarPDF() {
    if (!window.planoAtual) {
        alert('Erro ao gerar PDF: dados do plano não encontrados.');
        return;
    }

    const elemento = document.getElementById('conteudoImpressao');
    
    // Clona o elemento para modificações sem afetar a página
    const clone = elemento.cloneNode(true);
    
    // Remove elementos que não devem aparecer no PDF
    const elementosRemover = clone.querySelectorAll('.btn-voltar, .btn-pdf, .acoes-container');
    elementosRemover.forEach(el => el.remove());
    
    // Ajusta estilos para impressão
    clone.style.marginLeft = '0';
    clone.style.minHeight = 'auto';
    clone.style.width = '100%';
    clone.style.padding = '20px';

    const opcoes = {
        margin: 10,
        filename: `plano-alimentar-${window.planoAtual.pacienteNome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { 
            type: 'jpeg', 
            quality: 0.98 
        },
        html2canvas: { 
            scale: 2,
            useCORS: true }
             }