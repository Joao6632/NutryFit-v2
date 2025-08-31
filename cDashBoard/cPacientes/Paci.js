document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle sidebar
    sidebarToggle?.addEventListener('click', function() {
        sidebar?.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar-collapsed');
    });

    // Navegação entre páginas
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const url = this.getAttribute('href');

            if (url.startsWith('#')) {
                e.preventDefault();
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            } else {
                window.location.href = url;
            }
        });
    });
});

// === SISTEMA DE PACIENTES ===
class SistemaPacientes {
    constructor() {
        this.pacientes = this.carregarPacientes();
        this.pacientesFiltrados = [];
        this.pacienteAtual = null;
        this.proximoId = this.gerarProximoId();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPacientes();
    }

    // === LOCALSTORAGE - CORRIGIDO ===
    carregarPacientes() {
        try {
            const dados = localStorage.getItem('nutrifit-pacientes');
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            return [];
        }
    }

    salvarPacientes() {
        try {
            localStorage.setItem('nutrifit-pacientes', JSON.stringify(this.pacientes));
            console.log('Pacientes salvos com sucesso!'); // Debug
        } catch (error) {
            console.error('Erro ao salvar pacientes:', error);
            this.mostrarMensagem('Erro ao salvar dados. Tente novamente.', 'error');
        }
    }

    gerarProximoId() {
        try {
            const ultimoId = localStorage.getItem('nutrifit-ultimo-id');
            const novoId = ultimoId ? parseInt(ultimoId) + 1 : 1;
            localStorage.setItem('nutrifit-ultimo-id', novoId.toString());
            return novoId;
        } catch (error) {
            console.error('Erro ao gerar próximo ID:', error);
            // Fallback para método antigo se localStorage falhar
            if (this.pacientes.length === 0) return 1;
            return Math.max(...this.pacientes.map(p => p.id)) + 1;
        }
    }

    bindEvents() {
        // Botão novo paciente
        const btnNovo = document.getElementById('btnNovoPaciente');
        if (btnNovo) {
            btnNovo.addEventListener('click', () => this.abrirModal());
        }

        // Botão adicionar no modal
        const btnAdicionar = document.getElementById('btnAdicionar');
        if (btnAdicionar) {
            btnAdicionar.addEventListener('click', (e) => {
                e.preventDefault();
                this.adicionarPaciente();
            });
        }

        // Pesquisa
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtrarPacientes(e.target.value);
            });
        }

        // Cálculo automático do IMC
        const pesoInput = document.getElementById('peso');
        const alturaInput = document.getElementById('altura');
        if (pesoInput) pesoInput.addEventListener('input', () => this.calcularIMC());
        if (alturaInput) alturaInput.addEventListener('input', () => this.calcularIMC());

        // Event delegation para botões dos cards e clique no card
        document.addEventListener('click', (e) => {
            // Clique no card inteiro para abrir informações
            const pacienteCard = e.target.closest('.paciente-card');
            if (pacienteCard && !e.target.closest('.paciente-acoes')) {
                const id = parseInt(pacienteCard.dataset.id);
                this.abrirInfoPaciente(id);
                return;
            }

            // Botões específicos
            if (e.target.closest('.btn-info')) {
                const id = parseInt(e.target.closest('.paciente-card').dataset.id);
                this.abrirInfoPaciente(id);
            }
            if (e.target.closest('.btn-editar')) {
                const id = parseInt(e.target.closest('.paciente-card').dataset.id);
                this.editarPaciente(id);
            }
            if (e.target.closest('.btn-excluir')) {
                const id = parseInt(e.target.closest('.paciente-card').dataset.id);
                this.excluirPaciente(id);
            }
            if (e.target.id === 'btnExcluirPaciente') {
                this.excluirPacienteModal();
            }
            if (e.target.id === 'btnAvaliacoes') {
                this.abrirAvaliacoes();
            }
        });
    }

    renderPacientes() {
        const lista = document.getElementById('pacientesLista');
        if (!lista) return;

        const pacientesParaRender = this.pacientesFiltrados.length > 0 ? this.pacientesFiltrados : this.pacientes;

        if (pacientesParaRender.length === 0) {
            lista.innerHTML = `
                <div class="paciente-vazio">
                    <p>Nenhum paciente cadastrado</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = pacientesParaRender.map(paciente => `
            <div class="paciente-card" data-id="${paciente.id}" style="cursor: pointer;">
                <div class="paciente-content">
                    <div class="paciente-nome">${paciente.nome}</div>
                    <div class="paciente-sexo">${paciente.sexo}</div>
                </div>
                <div class="paciente-acoes">
                    <button class="btn-info" title="Ver detalhes">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    abrirInfoPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (!paciente) return;

        this.pacienteAtual = paciente;
        this.preencherModalInfo(paciente);
        
        // Tentar usar Bootstrap Modal se disponível, senão usar alert
        const modalElement = document.getElementById('modalInfoPaciente');
        if (modalElement && window.bootstrap) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            // Fallback para alert simples
            this.mostrarDetalhesSimples(paciente);
        }
    }

    mostrarDetalhesSimples(paciente) {
        const idade = this.calcularIdade(paciente.dataNascimento);
        const detalhes = `
Detalhes de ${paciente.nome}:

• Sexo: ${paciente.sexo}
• Contato: ${paciente.contato || 'Não informado'}
• Idade: ${idade || 'Não informada'}
• Peso: ${paciente.peso || 'Não informado'}
• Altura: ${paciente.altura || 'Não informado'}
• IMC: ${paciente.imc || 'Não calculado'}
• Objetivos: ${paciente.objetivos || 'Não informado'}
        `.trim();
        
        alert(detalhes);
    }

    preencherModalInfo(paciente) {
        const modalTitulo = document.getElementById('modalInfoTitulo');
        const modalBody = document.getElementById('modalInfoBody');
        
        if (!modalTitulo || !modalBody) return;

        modalTitulo.textContent = `Informações - ${paciente.nome}`;

        const idade = this.calcularIdade(paciente.dataNascimento);

        modalBody.innerHTML = `
            <div class="info-content">
                <div class="info-row">
                    <div class="info-col">
                        <div class="info-group">
                            <strong>Nome</strong>
                            <span>${paciente.nome}</span>
                        </div>
                        <div class="info-group">
                            <strong>Sexo</strong>
                            <span>${paciente.sexo}</span>
                        </div>
                        <div class="info-group">
                            <strong>Contato</strong>
                            <span>${paciente.contato || 'Não informado'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Data de Nascimento</strong>
                            <span>${this.formatarData(paciente.dataNascimento)}${idade ? ` - ${idade} Anos` : ''}</span>
                        </div>
                    </div>
                    
                    <div class="info-col">
                        <div class="info-group">
                            <strong>Atividades Físicas</strong>
                            <span>${paciente.atividadesFisicas || 'Sedentário'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Hábitos de mastigação</strong>
                            <span>${paciente.habitosMastigacao || 'Rapidamente'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Percentual de gordura</strong>
                            <span>${paciente.percentualGordura ? paciente.percentualGordura + '%' : 'Não informado'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Peso atual</strong>
                            <span>${paciente.peso || 'Não informado'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Altura atual</strong>
                            <span>${paciente.altura || 'Não informado'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Frequência das refeições</strong>
                            <span>${paciente.frequenciaRefeicoes || '3 refeições por dia'}</span>
                        </div>
                    </div>
                    
                    <div class="info-col">
                        <div class="info-group">
                            <strong>Histórico de Saúde</strong>
                            <span>${paciente.historicoSaude || 'Sem histórico'}</span>
                        </div>
                        <div class="info-group">
                            <strong>Uso de substâncias</strong>
                            <span>${this.formatarSubstancias(paciente)}</span>
                        </div>
                        <div class="info-group">
                            <strong>IMC</strong>
                            <span>${paciente.imc ? paciente.imc + ' (automático)' : 'Não calculado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="metricas-section">
                    <h4>Métricas</h4>
                    <div class="metricas-row">
                        <div class="metrica-item">
                            <strong>Cintura</strong>
                            <span>${paciente.cintura || 'Não informado'}</span>
                        </div>
                        <div class="metrica-item">
                            <strong>Quadril</strong>
                            <span>${paciente.quadril || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="objetivos-section">
                    <h4>Objetivos nutricionais</h4>
                    <p>${paciente.objetivos || 'Não informado'}</p>
                </div>
            </div>
        `;
    }

    formatarSubstancias(paciente) {
        const substancias = [];
        if (paciente.alcool) substancias.push('Álcool');
        if (paciente.drogasIlicitas) substancias.push('Drogas ilícitas');
        
        if (substancias.length === 0) return 'Nenhuma';
        
        let resultado = substancias.join(', ');
        if (paciente.detalhesSubstancias) {
            resultado += `\nDetalhes: ${paciente.detalhesSubstancias}`;
        }
        
        return resultado;
    }

    formatarData(data) {
        if (!data) return 'Não informado';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    }

    excluirPacienteModal() {
        if (!this.pacienteAtual) return;
        
        if (confirm(`Tem certeza que deseja excluir ${this.pacienteAtual.nome}?`)) {
            this.pacientes = this.pacientes.filter(p => p.id !== this.pacienteAtual.id);
            this.salvarPacientes();
            this.renderPacientes();
            
            // Fechar modal se existir
            const modalElement = document.getElementById('modalInfoPaciente');
            if (modalElement && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal?.hide();
            }
            
            this.mostrarMensagem('Paciente excluído com sucesso!', 'success');
        }
    }

    abrirAvaliacoes() {
        this.mostrarMensagem('Funcionalidade de avaliações em desenvolvimento', 'info');
    }

    adicionarPaciente() {
        const formData = this.coletarDadosFormulario();
        
        if (!this.validarFormulario(formData)) {
            return;
        }

        const btnAdicionar = document.getElementById('btnAdicionar');
        const editandoId = btnAdicionar?.getAttribute('data-editing');

        if (editandoId) {
            // Editando paciente existente
            const index = this.pacientes.findIndex(p => p.id == editandoId);
            if (index !== -1) {
                this.pacientes[index] = { ...this.pacientes[index], ...formData };
                this.mostrarMensagem('Paciente atualizado com sucesso!', 'success');
            }
        } else {
            // Adicionando novo paciente
            const novoPaciente = {
                id: this.proximoId++,
                ...formData,
                dataCadastro: new Date().toISOString()
            };
            this.pacientes.push(novoPaciente);
            this.mostrarMensagem('Paciente adicionado com sucesso!', 'success');
        }

        this.salvarPacientes();
        this.renderPacientes();
        
        // Fechar modal
        const modalElement = document.getElementById('modalCriarPaciente');
        if (modalElement && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
        }
        
        this.limparFormulario();
    }

    coletarDadosFormulario() {
        return {
            nome: this.getInputValue('nome'),
            sexo: this.getInputValue('sexo'),
            contato: this.getInputValue('contato'),
            dataNascimento: this.getInputValue('dataNascimento'),
            cintura: parseFloat(this.getInputValue('cintura')) || null,
            quadril: parseFloat(this.getInputValue('quadril')) || null,
            objetivos: this.getInputValue('objetivos'),
            atividadesFisicas: this.getInputValue('atividadesFisicas'),
            habitosMastigacao: this.getInputValue('habitosMastigacao'),
            percentualGordura: parseFloat(this.getInputValue('percentualGordura')) || null,
            peso: parseFloat(this.getInputValue('peso')) || null,
            altura: parseFloat(this.getInputValue('altura')) || null,
            imc: parseFloat(this.getInputValue('imc')) || null,
            frequenciaRefeicoes: this.getInputValue('frequenciaRefeicoes'),
            historicoSaude: this.getInputValue('historicoSaude'),
            alcool: this.getCheckboxValue('alcool'),
            drogasIlicitas: this.getCheckboxValue('drogasIlicitas'),
            detalhesSubstancias: this.getInputValue('detalhesSubstancias')
        };
    }

    getInputValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }

    getCheckboxValue(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
    }

    validarFormulario(data) {
        if (!data.nome) {
            this.mostrarMensagem('Nome é obrigatório!', 'error');
            document.getElementById('nome')?.focus();
            return false;
        }

        if (!data.sexo) {
            this.mostrarMensagem('Sexo é obrigatório!', 'error');
            document.getElementById('sexo')?.focus();
            return false;
        }

        // Validação adicional de email se fornecido
        if (data.contato && data.contato.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.contato)) {
                this.mostrarMensagem('Email inválido!', 'error');
                document.getElementById('contato')?.focus();
                return false;
            }
        }

        return true;
    }

    calcularIMC() {
        const peso = parseFloat(this.getInputValue('peso'));
        const altura = parseFloat(this.getInputValue('altura'));
        const imcInput = document.getElementById('imc');
        
        if (peso && altura && altura > 0 && imcInput) {
            const imc = peso / (altura * altura);
            imcInput.value = imc.toFixed(2);
        } else if (imcInput) {
            imcInput.value = '';
        }
    }

    filtrarPacientes(termo) {
        if (!termo.trim()) {
            this.pacientesFiltrados = [];
        } else {
            this.pacientesFiltrados = this.pacientes.filter(paciente => 
                paciente.nome.toLowerCase().includes(termo.toLowerCase()) ||
                paciente.sexo.toLowerCase().includes(termo.toLowerCase()) ||
                (paciente.contato && paciente.contato.toLowerCase().includes(termo.toLowerCase()))
            );
        }
        this.renderPacientes();
    }

    calcularIdade(dataNascimento) {
        if (!dataNascimento) return null;
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const meses = hoje.getMonth() - nascimento.getMonth();
        
        if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    }

    editarPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (paciente) {
            this.preencherFormulario(paciente);
            this.abrirModal();
            
            const btnAdicionar = document.getElementById('btnAdicionar');
            if (btnAdicionar) {
                btnAdicionar.textContent = 'Atualizar';
                btnAdicionar.setAttribute('data-editing', id);
            }
            
            const modalTitulo = document.querySelector('#modalCriarPaciente .modal-title');
            if (modalTitulo) {
                modalTitulo.textContent = `Editar Paciente - ${paciente.nome}`;
            }
        }
    }

    excluirPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (paciente && confirm(`Tem certeza que deseja excluir ${paciente.nome}?`)) {
            this.pacientes = this.pacientes.filter(p => p.id !== id);
            this.salvarPacientes();
            this.renderPacientes();
            this.mostrarMensagem('Paciente excluído com sucesso!', 'success');
        }
    }

    preencherFormulario(paciente) {
        Object.keys(paciente).forEach(key => {
            const elemento = document.getElementById(key);
            if (elemento) {
                if (elemento.type === 'checkbox') {
                    elemento.checked = !!paciente[key];
                } else if (key === 'dataNascimento' && paciente[key]) {
                    // Formatar data para input date
                    const data = new Date(paciente[key]);
                    elemento.value = data.toISOString().split('T')[0];
                } else {
                    elemento.value = paciente[key] || '';
                }
            }
        });
    }

    abrirModal() {
        const modalElement = document.getElementById('modalCriarPaciente');
        if (modalElement && window.bootstrap) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            // Fallback se não tiver Bootstrap
            this.mostrarMensagem('Modal não disponível. Verifique se Bootstrap está carregado.', 'error');
        }
    }

    limparFormulario() {
        const form = document.getElementById('formPaciente');
        if (form) form.reset();
        
        const btnAdicionar = document.getElementById('btnAdicionar');
        if (btnAdicionar) {
            btnAdicionar.textContent = 'Adicionar';
            btnAdicionar.removeAttribute('data-editing');
        }
        
        const modalTitulo = document.querySelector('#modalCriarPaciente .modal-title');
        if (modalTitulo) {
            modalTitulo.textContent = 'Novo Paciente';
        }
    }

    mostrarMensagem(texto, tipo) {
        // Remover mensagens anteriores
        const alertasAnteriores = document.querySelectorAll('.alert.position-fixed');
        alertasAnteriores.forEach(alerta => alerta.remove());
        
        const alerta = document.createElement('div');
        const tipoClass = tipo === 'error' ? 'danger' : tipo === 'info' ? 'info' : 'success';
        alerta.className = `alert alert-${tipoClass} position-fixed alert-dismissible fade show`;
        alerta.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        alerta.innerHTML = `
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alerta);
        
        // Auto remover após 4 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 4000);
    }

    // Método para debug - verificar dados salvos
    verificarDados() {
        console.log('Dados no localStorage:', localStorage.getItem('nutrifit-pacientes'));
        console.log('Pacientes carregados:', this.pacientes);
        console.log('Próximo ID:', localStorage.getItem('nutrifit-ultimo-id'));
    }

    // Método para limpar todos os dados (útil para testes)
    limparTodosOsDados() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('nutrifit-pacientes');
            localStorage.removeItem('nutrifit-ultimo-id');
            this.pacientes = [];
            this.pacientesFiltrados = [];
            this.proximoId = 1;
            this.renderPacientes();
            this.mostrarMensagem('Todos os dados foram limpos!', 'info');
        }
    }
}

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaPacientes = new SistemaPacientes();
    
    // Adicionar métodos de debug ao console (apenas em desenvolvimento)
    if (typeof window !== 'undefined') {
        window.debugPacientes = {
            verificar: () => window.sistemaPacientes.verificarDados(),
            limpar: () => window.sistemaPacientes.limparTodosOsDados()
        };
        console.log('Debug disponível: debugPacientes.verificar() e debugPacientes.limpar()');
    }
});