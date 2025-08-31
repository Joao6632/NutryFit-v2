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
        // === SISTEMA DE AVALIAÇÕES ===
        class SistemaAvaliacoes {
            constructor() {
                this.avaliacoes = this.carregarAvaliacoes();
                this.pacientes = this.carregarPacientes();
                this.avaliacoesFiltradas = [];
                this.proximoId = this.carregarProximoId();
                this.init();
            }

            carregarAvaliacoes() {
                try {
                    const dados = localStorage.getItem('nutrifit-avaliacoes');
                    return dados ? JSON.parse(dados) : [];
                } catch (error) {
                    console.error('Erro ao carregar avaliações:', error);
                    return [];
                }
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

            salvarAvaliacoes() {
                try {
                    localStorage.setItem('nutrifit-avaliacoes', JSON.stringify(this.avaliacoes));
                } catch (error) {
                    console.error('Erro ao salvar avaliações:', error);
                }
            }

            carregarProximoId() {
                try {
                    const ultimoId = localStorage.getItem('nutrifit-ultimo-id-avaliacao');
                    if (ultimoId) {
                        return parseInt(ultimoId);
                    }
                    const avaliacoes = this.carregarAvaliacoes();
                    return avaliacoes.length > 0 ? Math.max(...avaliacoes.map(a => a.id)) + 1 : 1;
                } catch (error) {
                    console.error('Erro ao carregar próximo ID:', error);
                    return 1;
                }
            }

            salvarProximoId() {
                try {
                    localStorage.setItem('nutrifit-ultimo-id-avaliacao', this.proximoId.toString());
                } catch (error) {
                    console.error('Erro ao salvar próximo ID:', error);
                }
            }

            gerarProximoId() {
                const novoId = this.proximoId++;
                this.salvarProximoId();
                return novoId;
            }

            init() {
                this.bindEvents();
                this.carregarPacientesSelect();
                this.renderAvaliacoes();
                this.definirDataAtual();
            }

            bindEvents() {
                // Botão nova avaliação
                const btnNova = document.getElementById('btnNovaAvaliacao');
                if (btnNova) {
                    btnNova.addEventListener('click', () => this.abrirModal());
                }

                // Botão salvar avaliação
                const btnSalvar = document.getElementById('btnSalvarAvaliacao');
                if (btnSalvar) {
                    btnSalvar.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.salvarAvaliacao();
                    });
                }

                // Pesquisa
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        this.filtrarAvaliacoes(e.target.value);
                    });
                }

                // Seleção de paciente
                const pacienteSelect = document.getElementById('pacienteId');
                if (pacienteSelect) {
                    pacienteSelect.addEventListener('change', () => this.preencherDadosPaciente());
                }

                // Cálculo automático do IMC
                const pesoInput = document.getElementById('pesoAtual');
                const alturaInput = document.getElementById('alturaAtual');
                if (pesoInput) pesoInput.addEventListener('input', () => this.calcularIMC());
                if (alturaInput) alturaInput.addEventListener('input', () => this.calcularIMC());

                // Toggle sidebar
                const sidebarToggle = document.getElementById('sidebarToggle');
                const sidebar = document.getElementById('sidebar');
                const mainContent = document.getElementById('mainContent');
                
                if (sidebarToggle) {
                    sidebarToggle.addEventListener('click', function() {
                        sidebar?.classList.toggle('collapsed');
                        if (mainContent) mainContent.classList.toggle('sidebar-collapsed');
                    });
                }
            }

            definirDataAtual() {
                const dataInput = document.getElementById('dataConsulta');
                if (dataInput) {
                    const hoje = new Date();
                    dataInput.value = hoje.toISOString().split('T')[0];
                }
            }

            carregarPacientesSelect() {
                const select = document.getElementById('pacienteId');
                if (!select) return;

                select.innerHTML = '<option value="">Selecione o paciente para avaliar</option>';
                
                this.pacientes.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id;
                    option.textContent = paciente.nome;
                    select.appendChild(option);
                });
            }

            preencherDadosPaciente() {
                const pacienteId = document.getElementById('pacienteId').value;
                if (!pacienteId) {
                    this.limparCamposPaciente();
                    return;
                }

                const paciente = this.pacientes.find(p => p.id == pacienteId);
                if (paciente) {
                    // Preencher campos com dados do paciente
                    document.getElementById('alturaAtual').value = paciente.altura || '';
                    document.getElementById('frequenciaRefeicoes').value = paciente.frequenciaRefeicoes || '';
                    document.getElementById('atividadesFisicas').value = paciente.atividadesFisicas || '';
                    document.getElementById('habitosMastigacao').value = paciente.habitosMastigacao || '';
                    document.getElementById('percentualGordura').value = paciente.percentualGordura || '';
                    
                    // Calcular IMC se tiver peso
                    this.calcularIMC();
                }
            }

            limparCamposPaciente() {
                const campos = ['alturaAtual', 'frequenciaRefeicoes', 'atividadesFisicas', 'habitosMastigacao', 'percentualGordura'];
                campos.forEach(campo => {
                    const elemento = document.getElementById(campo);
                    if (elemento) elemento.value = '';
                });
                document.getElementById('imc').value = '';
            }

            calcularIMC() {
                const peso = parseFloat(document.getElementById('pesoAtual').value);
                const altura = parseFloat(document.getElementById('alturaAtual').value);
                const imcInput = document.getElementById('imc');
                
                if (peso && altura && altura > 0 && imcInput) {
                    const imc = peso / (altura * altura);
                    imcInput.value = imc.toFixed(2);
                } else if (imcInput) {
                    imcInput.value = '';
                }
            }

            salvarAvaliacao() {
                const formData = this.coletarDadosFormulario();
                
                if (!this.validarFormulario(formData)) {
                    return;
                }

                const paciente = this.pacientes.find(p => p.id == formData.pacienteId);
                const numeroAvaliacao = this.contarAvaliacoesPaciente(formData.pacienteId) + 1;

                const novaAvaliacao = {
                    id: this.gerarProximoId(),
                    pacienteId: parseInt(formData.pacienteId),
                    pacienteNome: paciente.nome,
                    numeroAvaliacao: numeroAvaliacao,
                    dataAvaliacao: formData.dataConsulta,
                    ...formData,
                    dataCriacao: new Date().toISOString()
                };

                this.avaliacoes.push(novaAvaliacao);
                this.salvarAvaliacoes();
                this.renderAvaliacoes();
                
                // Fechar modal
                const modalElement = document.getElementById('modalNovaAvaliacao');
                if (modalElement && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal?.hide();
                }
                
                this.limparFormulario();
                this.mostrarMensagem('Avaliação realizada com sucesso!', 'success');
            }

            contarAvaliacoesPaciente(pacienteId) {
                return this.avaliacoes.filter(a => a.pacienteId == pacienteId).length;
            }

            coletarDadosFormulario() {
                return {
                    pacienteId: this.getInputValue('pacienteId'),
                    alturaAtual: parseFloat(this.getInputValue('alturaAtual')) || null,
                    pesoAtual: parseFloat(this.getInputValue('pesoAtual')) || null,
                    frequenciaRefeicoes: this.getInputValue('frequenciaRefeicoes'),
                    dataConsulta: this.getInputValue('dataConsulta'),
                    percentualGordura: parseFloat(this.getInputValue('percentualGordura')) || null,
                    atividadesFisicas: this.getInputValue('atividadesFisicas'),
                    habitosMastigacao: this.getInputValue('habitosMastigacao'),
                    cintura: parseFloat(this.getInputValue('cintura')) || null,
                    quadril: parseFloat(this.getInputValue('quadril')) || null,
                    imc: parseFloat(this.getInputValue('imc')) || null,
                    observacoes: this.getInputValue('observacoes')
                };
            }

            getInputValue(id) {
                const element = document.getElementById(id);
                return element ? element.value.trim() : '';
            }

            validarFormulario(data) {
                if (!data.pacienteId) {
                    this.mostrarMensagem('Selecione um paciente!', 'error');
                    document.getElementById('pacienteId')?.focus();
                    return false;
                }

                if (!data.dataConsulta) {
                    this.mostrarMensagem('Data da consulta é obrigatória!', 'error');
                    document.getElementById('dataConsulta')?.focus();
                    return false;
                }

                return true;
            }

            renderAvaliacoes() {
                const lista = document.getElementById('avaliacaoLista');
                if (!lista) return;

                const avaliacoesParaRender = this.avaliacoesFiltradas.length > 0 ? this.avaliacoesFiltradas : this.avaliacoes;

                if (avaliacoesParaRender.length === 0) {
                    lista.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: #666;">
                            <p>Nenhuma avaliação realizada</p>
                        </div>
                    `;
                    return;
                }

                // Ordenar por data mais recente
                const avaliacoesOrdenadas = avaliacoesParaRender.sort((a, b) => 
                    new Date(b.dataAvaliacao) - new Date(a.dataAvaliacao)
                );

                lista.innerHTML = avaliacoesOrdenadas.map(avaliacao => `
                    <div class="avaliacao-item" data-id="${avaliacao.id}">
                        <div>
                            <div style="font-weight: 500;">${avaliacao.pacienteNome}</div>
                            <div style="font-size: 13px; color: #666;">Avaliação: #${avaliacao.numeroAvaliacao}</div>
                        </div>
                        <div class="avaliacao-data">${this.formatarData(avaliacao.dataAvaliacao)}</div>
                    </div>
                `).join('');
            }

            filtrarAvaliacoes(termo) {
                if (!termo.trim()) {
                    this.avaliacoesFiltradas = [];
                } else {
                    this.avaliacoesFiltradas = this.avaliacoes.filter(avaliacao => 
                        avaliacao.pacienteNome.toLowerCase().includes(termo.toLowerCase())
                    );
                }
                this.renderAvaliacoes();
            }

            formatarData(data) {
                if (!data) return 'Não informado';
                const date = new Date(data);
                return date.toLocaleDateString('pt-BR');
            }

            abrirModal() {
                if (this.pacientes.length === 0) {
                    this.mostrarMensagem('Nenhum paciente cadastrado! Cadastre pacientes primeiro.', 'error');
                    return;
                }

                const modalElement = document.getElementById('modalNovaAvaliacao');
                if (modalElement && window.bootstrap) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    this.mostrarMensagem('Modal não disponível. Verifique se Bootstrap está carregado.', 'error');
                }
            }

            limparFormulario() {
                const form = document.getElementById('formAvaliacao');
                if (form) form.reset();
                
                this.definirDataAtual();
                this.carregarPacientesSelect();
                
                // Limpar campos específicos
                document.getElementById('imc').value = '';
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

        // Inicializar sistema quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            window.sistemaAvaliacoes = new SistemaAvaliacoes();
        });
    
