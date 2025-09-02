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


// === SISTEMA DE PACIENTES ===
class SistemaPacientes {
    constructor() {
        this.pacientes = this.carregarPacientes();
        this.pacientesFiltrados = [];
        this.pacienteAtual = null;
        this.proximoId = this.carregarProximoId();
        this.init();
    }

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
        } catch (error) {
            console.error('Erro ao salvar pacientes:', error);
        }
    }

    carregarProximoId() {
        try {
            const ultimoId = localStorage.getItem('nutrifit-ultimo-id');
            if (ultimoId) {
                return parseInt(ultimoId);
            }
            // Se não tem ID salvo, calcular baseado nos pacientes existentes
            const pacientes = this.carregarPacientes();
            return pacientes.length > 0 ? Math.max(...pacientes.map(p => p.id)) + 1 : 1;
        } catch (error) {
            console.error('Erro ao carregar próximo ID:', error);
            return 1;
        }
    }

    salvarProximoId() {
        try {
            localStorage.setItem('nutrifit-ultimo-id', this.proximoId.toString());
        } catch (error) {
            console.error('Erro ao salvar próximo ID:', error);
        }
    }

    init() {
        this.bindEvents();
        this.renderPacientes();
    }

    gerarProximoId() {
        const novoId = this.proximoId++;
        this.salvarProximoId();
        return novoId;
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
                this.abrirAvaliacoesPaciente();
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

    abrirAvaliacoesPaciente() {
        if (!this.pacienteAtual) {
            this.mostrarMensagem('Nenhum paciente selecionado', 'error');
            return;
        }
        
        // Inicializar sistema de avaliações se não existir
        if (!window.sistemaAvaliacoes) {
            window.sistemaAvaliacoes = new SistemaAvaliacoes(this);
        }
        
        window.sistemaAvaliacoes.abrirModalAvaliacoes(this.pacienteAtual);
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
                this.salvarPacientes();
                this.mostrarMensagem('Paciente atualizado com sucesso!', 'success');
            }
        } else {
            // Adicionando novo paciente
            const novoPaciente = {
                id: this.gerarProximoId(),
                ...formData,
                dataCadastro: new Date().toISOString()
            };
            this.pacientes.push(novoPaciente);
            this.salvarPacientes();
            this.mostrarMensagem('Paciente adicionado com sucesso!', 'success');
        }

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
}

// === SISTEMA DE AVALIAÇÕES ===
class SistemaAvaliacoes {
    constructor(sistemaPacientes) {
        this.sistemaPacientes = sistemaPacientes;
        this.avaliacoesSelecionadas = new Set();
        this.pacienteAtual = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Event delegation para checkboxes das avaliações
        document.addEventListener('change', (e) => {
            if (e.target.closest('.avaliacao-checkbox input[type="checkbox"]')) {
                this.handleAvaliacaoSelection(e.target);
            }
        });

        // Botão gerar comparativo
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btnGerarComparativo' || e.target.closest('#btnGerarComparativo')) {
                this.gerarComparativo();
            }
        });
    }

    abrirModalAvaliacoes(paciente) {
        this.pacienteAtual = paciente;
        this.avaliacoesSelecionadas.clear();
        this.carregarAvaliacoesPaciente(paciente.id);
        this.atualizarTitulo(paciente.nome);
        this.abrirModal();
    }

    atualizarTitulo(nomePaciente) {
        const titulo = document.getElementById('modalAvaliacoesTitulo');
        if (titulo) {
            titulo.textContent = `Avaliações - ${nomePaciente}`;
        }
    }

    carregarAvaliacoesPaciente(pacienteId) {
        const container = document.getElementById('avaliacoesContainer');
        if (!container) return;

        // Mostrar loading
        container.innerHTML = `
            <div class="avaliacoes-loading">
                <i class="bi bi-hourglass-split"></i>
                <p>Carregando avaliações...</p>
            </div>
        `;

        // Simular pequeno delay para mostrar loading
        setTimeout(() => {
            const avaliacoes = this.buscarAvaliacoesDoPaciente(pacienteId);
            this.renderAvaliacoes(avaliacoes);
            this.atualizarContador();
        }, 300);
    }

    buscarAvaliacoesDoPaciente(pacienteId) {
        try {
            const avaliacoes = JSON.parse(localStorage.getItem('nutrifit-avaliacoes') || '[]');
            return avaliacoes
                .filter(av => av.pacienteId === pacienteId)
                .sort((a, b) => new Date(b.dataAvaliacao) - new Date(a.dataAvaliacao)); // Mais recentes primeiro
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            return [];
        }
    }

    renderAvaliacoes(avaliacoes) {
        const container = document.getElementById('avaliacoesContainer');
        if (!container) return;

        if (avaliacoes.length === 0) {
            container.innerHTML = `
                <div class="avaliacoes-empty">
                    <i class="bi bi-clipboard-x"></i>
                    <p>Nenhuma avaliação encontrada para este paciente</p>
                </div>
            `;
            this.atualizarBotaoComparativo(false);
            return;
        }

        // Adicionar info sobre seleções
        const infoHTML = `
            <div class="selecoes-info">
                <div class="contador" id="contadorSelecoes">0 avaliações selecionadas</div>
                <div class="minimo">Selecione pelo menos 2 avaliações para gerar comparativo</div>
            </div>
        `;

        const avaliacoesHTML = avaliacoes.map(avaliacao => `
            <div class="avaliacao-item" data-id="${avaliacao.id}">
                <div class="avaliacao-content">
                    <div class="avaliacao-numero">Avaliação: #${avaliacao.numeroAvaliacao}</div>
                    <div class="avaliacao-data">${this.formatarData(avaliacao.dataAvaliacao)}</div>
                </div>
                <div class="avaliacao-checkbox">
                    <input type="checkbox" id="avaliacao_${avaliacao.id}" value="${avaliacao.id}">
                    <div class="checkmark"></div>
                </div>
            </div>
        `).join('');

        container.innerHTML = infoHTML + avaliacoesHTML;
        this.atualizarBotaoComparativo(false);
    }

    handleAvaliacaoSelection(checkbox) {
        const avaliacaoItem = checkbox.closest('.avaliacao-item');
        const avaliacaoId = parseInt(checkbox.value);

        if (checkbox.checked) {
            this.avaliacoesSelecionadas.add(avaliacaoId);
            avaliacaoItem.classList.add('selected');
        } else {
            this.avaliacoesSelecionadas.delete(avaliacaoId);
            avaliacaoItem.classList.remove('selected');
        }

        this.atualizarContador();
        this.atualizarBotaoComparativo(this.avaliacoesSelecionadas.size >= 2);
    }

    atualizarContador() {
        const contador = document.getElementById('contadorSelecoes');
        if (contador) {
            const quantidade = this.avaliacoesSelecionadas.size;
            contador.textContent = `${quantidade} ${quantidade === 1 ? 'avaliação selecionada' : 'avaliações selecionadas'}`;
        }
    }

    atualizarBotaoComparativo(habilitar) {
        const botao = document.getElementById('btnGerarComparativo');
        if (botao) {
            botao.disabled = !habilitar;
            if (habilitar) {
                botao.innerHTML = `
                    <i class="bi bi-graph-up"></i>
                    Gerar Comparativo
                `;
            } else {
                botao.innerHTML = `
                    <i class="bi bi-graph-up"></i>
                    Selecione 2+ avaliações
                `;
            }
        }
    }

    gerarComparativo() {
        if (this.avaliacoesSelecionadas.size < 2) {
            this.mostrarMensagem('Selecione pelo menos 2 avaliações para comparar', 'error');
            return;
        }

        // Salvar avaliações selecionadas para a página de comparativo
        const avaliacoesSelecionadasArray = Array.from(this.avaliacoesSelecionadas);
        localStorage.setItem('nutrifit-comparativo-avaliacoes', JSON.stringify({
            pacienteId: this.pacienteAtual.id,
            pacienteNome: this.pacienteAtual.nome,
            avaliacoes: avaliacoesSelecionadasArray,
            dataComparativo: new Date().toISOString()
        }));

        this.mostrarMensagem(`Comparativo gerado com ${this.avaliacoesSelecionadas.size} avaliações!`, 'success');
        
        // Fechar modal
        this.fecharModal();
        
        // Aqui você pode redirecionar para a página de comparativo ou abrir outro modal
        // window.location.href = '../comparativo/comparativo.html';
        
        console.log('Dados salvos para comparativo:', {
            paciente: this.pacienteAtual.nome,
            avaliacoes: avaliacoesSelecionadasArray
        });
    }

    formatarData(dataString) {
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        } catch (error) {
            return 'Data inválida';
        }
    }

    abrirModal() {
        const modalElement = document.getElementById('modalAvaliacoesPaciente');
        if (modalElement && window.bootstrap) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Modal de avaliações não encontrado ou Bootstrap não disponível');
        }
    }

    fecharModal() {
        const modalElement = document.getElementById('modalAvaliacoesPaciente');
        if (modalElement && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
        }
    }

    mostrarMensagem(texto, tipo) {
        // Reutilizar o método do sistema de pacientes
        if (this.sistemaPacientes && this.sistemaPacientes.mostrarMensagem) {
            this.sistemaPacientes.mostrarMensagem(texto, tipo);
        } else {
            // Fallback
            alert(texto);
        }
    }
}

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaPacientes = new SistemaPacientes();
    
    // Inicializar sistema de avaliações após um pequeno delay
    setTimeout(() => {
        if (window.sistemaPacientes) {
            window.sistemaAvaliacoes = new SistemaAvaliacoes(window.sistemaPacientes);
        }
    }, 100);
});