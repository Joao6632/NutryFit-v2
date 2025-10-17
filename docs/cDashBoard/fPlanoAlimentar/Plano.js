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
    const logoutLink = document.querySelector(".logout-section .nav-link");

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
// FUNCIONALIDADE DE BUSCA
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const planosCards = document.querySelectorAll('.planos-card');
            
            planosCards.forEach(card => {
                const cardText = card.textContent.toLowerCase();
                if (cardText.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});

// =================================================================================
// CONTROLE DO MODAL E REFEIÇÕES
// =================================================================================
document.addEventListener("DOMContentLoaded", () => {
    const modalElement = document.getElementById('modalPlano');
    const formPlanoAlimentar = document.getElementById('formPlanoAlimentar');

    // Carrega pacientes no select
    carregarPacientes();

    // Habilita/desabilita campos baseado no checkbox
    document.querySelectorAll('.refeicao-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const refeicao = this.dataset.refeicao;
            const linha = this.closest('tr');
            const campos = linha.querySelectorAll('input:not([type="checkbox"]), textarea');
            
            campos.forEach(campo => {
                campo.disabled = !this.checked;
            });
            
            // Aplicar estilo visual
            if (this.checked) {
                linha.classList.add('linha-ativa');
                linha.classList.remove('linha-inativa');
            } else {
                linha.classList.add('linha-inativa');
                linha.classList.remove('linha-ativa');
            }
        });

        // Estado inicial - todos desabilitados
        const linha = checkbox.closest('tr');
        const campos = linha.querySelectorAll('input:not([type="checkbox"]), textarea');
        campos.forEach(campo => campo.disabled = true);
        linha.classList.add('linha-inativa');
    });

    // Reset do modal ao fechar
    modalElement.addEventListener('hidden.bs.modal', function () {
        formPlanoAlimentar.reset();
        
        // Reseta estado visual das linhas
        document.querySelectorAll('.tabela-refeicoes tbody tr').forEach(linha => {
            const campos = linha.querySelectorAll('input:not([type="checkbox"]), textarea');
            campos.forEach(campo => campo.disabled = true);
            linha.classList.add('linha-inativa');
            linha.classList.remove('linha-ativa');
        });
    });

    // Submit do formulário
    formPlanoAlimentar.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const pacienteSelecionado = document.getElementById('pacienteSelect').value;
        const observacoes = document.getElementById('observacoes').value;
        
        // Coleta dados das refeições selecionadas
        const refeicoesSelecionadas = [];
        document.querySelectorAll('.refeicao-checkbox:checked').forEach(checkbox => {
            const refeicao = checkbox.dataset.refeicao;
            const linha = checkbox.closest('tr');
            
            const refeicaoData = {
                nome: linha.querySelector(`[data-refeicao="${refeicao}"]`).value,
                horarioInicio: linha.querySelector(`[name="horario_inicio_${refeicao}"]`).value,
                horarioFim: linha.querySelector(`[name="horario_fim_${refeicao}"]`).value,
                objetivo: linha.querySelector(`[name="objetivo_${refeicao}"]`).value,
                alimentos: linha.querySelector(`[name="alimentos_${refeicao}"]`).value
            };
            
            refeicoesSelecionadas.push({ id: refeicao, ...refeicaoData });
        });

        // Validações
        if (!pacienteSelecionado) {
            alert('Por favor, selecione um paciente.');
            return;
        }

        if (refeicoesSelecionadas.length === 0) {
            alert('Por favor, selecione pelo menos uma refeição.');
            return;
        }

        // Verifica se campos obrigatórios das refeições selecionadas estão preenchidos
        let camposVazios = false;
        refeicoesSelecionadas.forEach(refeicao => {
            if (!refeicao.objetivo.trim() || !refeicao.alimentos.trim()) {
                camposVazios = true;
            }
        });

        if (camposVazios) {
            alert('Por favor, preencha todos os campos (objetivo e alimentos) das refeições selecionadas.');
            return;
        }

        // Cria o objeto do plano
        const planoData = {
            id: `plano-${Date.now()}`,
            pacienteId: pacienteSelecionado,
            pacienteNome: obterNomePaciente(pacienteSelecionado),
            titulo: `Plano Alimentar - ${obterNomePaciente(pacienteSelecionado)}`,
            refeicoes: refeicoesSelecionadas,
            observacoes: observacoes,
            dataCriacao: new Date().toISOString()
        };

        // Salva no localStorage
        salvarPlano(planoData);

        alert('Plano alimentar criado com sucesso!');

        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Atualiza a lista de planos
        carregarPlanos();
    });
});

// =================================================================================
// FUNÇÕES DE GERENCIAMENTO DE DADOS
// =================================================================================

function carregarPacientes() {
    const pacienteSelect = document.getElementById('pacienteSelect');
    if (!pacienteSelect) return;
    const pacientes = JSON.parse(localStorage.getItem('nutrifit-pacientes') || '[]');
    
    // Limpa opções existentes (mantém a primeira)
    while (pacienteSelect.children.length > 1) {
        pacienteSelect.removeChild(pacienteSelect.lastChild);
    }
    
    // Adiciona pacientes como opções
    pacientes.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = paciente.nome;
        pacienteSelect.appendChild(option);
    });
}

function obterNomePaciente(pacienteId) {
    const pacientes = JSON.parse(localStorage.getItem('nutrifit-pacientes') || '[]');
    const pacienteEncontrado = pacientes.find(p => p.id === parseInt(pacienteId, 10));
    return pacienteEncontrado ? pacienteEncontrado.nome : 'Paciente não encontrado';
}

function salvarPlano(planoData) {
    const planos = JSON.parse(localStorage.getItem('nutrifit-planos') || '[]');
    planos.push(planoData);
    localStorage.setItem('nutrifit-planos', JSON.stringify(planos));
}


function listarPlanos() {
    return JSON.parse(localStorage.getItem('nutrifit-planos') || '[]');
}
function carregarPlanos() {
    const planosList = document.getElementById('planos-lista');
    if (!planosList) return;
    
    const planos = listarPlanos();
    
    if (planos.length === 0) {
        mostrarEstadoVazio();
    } else {
        // Ordena por data de criação (mais recente primeiro)
        planos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        
        planosList.innerHTML = '';
        planos.forEach(plano => {
            const planoCard = criarCardPlano(plano);
            planosList.appendChild(planoCard);
        });
    }
}

function mostrarEstadoVazio() {
    const planosList = document.getElementById('planos-lista');
    
    planosList.innerHTML = `
        <div class="estado-vazio">
            <i class="bi bi-clipboard-x"></i>
            <p>Nenhum plano alimentar criado ainda.</p>
            <p>Clique no botão abaixo para criar seu primeiro plano!</p>
            </div>
            `;
        }
        
function criarCardPlano(plano) {
  const card = document.createElement("a");
  card.className = "planos-card";
  card.href = `visualizarPlano/visualizarPlano.html?id=${plano.id}`; // link direto
  card.dataset.planoId = plano.id;

  const data = new Date(plano.dataCriacao).toLocaleDateString("pt-BR");

  card.innerHTML = `
    <div class="planos-content">
      <div class="card-info">
        <span class="card-text">${plano.titulo}</span>
      </div>
      <div class="card-actions">
        <span class="card-text-data">Criado em: ${data}</span>
      </div>
    </div>
  `;

  return card;
}

document.addEventListener("DOMContentLoaded", () => {
    // Carrega os planos ao inicializar a página
    
    carregarPlanos();
});