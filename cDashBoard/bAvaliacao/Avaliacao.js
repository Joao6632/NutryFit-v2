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

// === SISTEMA DE AVALIAÇÕES ===
class SistemaAvaliacoes {
    constructor() {
        this.avaliacoes = this.carregarAvaliacoes();
        this.pacientes = this.carregarPacientes();
        this.avaliacoesFiltradas = [];
        this.proximoId = this.carregarProximoId();
        this.avaliacaoAtualId = null; // Para controlar qual avaliação está sendo visualizada
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
                return parseInt(ultimoId) + 1;
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
            localStorage.setItem('nutrifit-ultimo-id-avaliacao', (this.proximoId - 1).toString());
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

        // Botão excluir avaliação
        const btnExcluir = document.getElementById('btnExcluirAvaliacao');
        if (btnExcluir) {
            btnExcluir.addEventListener('click', () => this.excluirAvaliacaoAtual());
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
            const campos = {
                'alturaAtual': paciente.altura,
                'frequenciaRefeicoes': paciente.frequenciaRefeicoes,
                'atividadesFisicas': paciente.atividadesFisicas,
                'habitosMastigacao': paciente.habitosMastigacao,
                'percentualGordura': paciente.percentualGordura,
                'objetivosNutricionais': paciente.objetivos // CORRIGIDO: Adicionar objetivos
            };

            Object.entries(campos).forEach(([campoId, valor]) => {
                const elemento = document.getElementById(campoId);
                if (elemento) {
                    elemento.value = valor || '';
                }
            });
            
            // Calcular IMC se tiver peso
            this.calcularIMC();
        }
    }

    limparCamposPaciente() {
        const campos = ['alturaAtual', 'frequenciaRefeicoes', 'atividadesFisicas', 'habitosMastigacao', 'percentualGordura', 'objetivosNutricionais'];
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) elemento.value = '';
        });
        const imcElement = document.getElementById('imc');
        if (imcElement) imcElement.value = '';
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
            alturaAtual: formData.alturaAtual,
            pesoAtual: formData.pesoAtual,
            frequenciaRefeicoes: formData.frequenciaRefeicoes,
            percentualGordura: formData.percentualGordura,
            atividadesFisicas: formData.atividadesFisicas,
            habitosMastigacao: formData.habitosMastigacao,
            cintura: formData.cintura,
            quadril: formData.quadril,
            imc: formData.imc,
            objetivosNutricionais: formData.objetivosNutricionais, // CORRIGIDO: Salvar objetivos
            observacoes: formData.observacoes,
            dataCriacao: new Date().toISOString()
        };

        this.avaliacoes.push(novaAvaliacao);
        this.salvarAvaliacoes();
        this.renderAvaliacoes();
        
        // Fechar modal
        const modalElement = document.getElementById('modalNovaAvaliacao');
        if (modalElement && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
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
            objetivosNutricionais: this.getInputValue('objetivosNutricionais'), // CORRIGIDO: Coletar objetivos
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
                <div class="avaliacao-vazia">
                    <p>Nenhuma avaliação realizada</p>
                </div>
            `;
            return;
        }

        // CORRIGIDO: Ordenar por ID decrescente para mostrar as mais recentes primeiro
        const avaliacoesOrdenadas = avaliacoesParaRender.sort((a, b) => b.id - a.id);

        lista.innerHTML = avaliacoesOrdenadas.map(avaliacao => `
            <div class="avaliacao-item" data-id="${avaliacao.id}">
                <div>
                    <div style="font-weight: 500;"><strong>${avaliacao.pacienteNome}</strong></div>
                    <div style="font-size: 13px; color: #666;">Avaliação: <strong>#${avaliacao.numeroAvaliacao}</strong></div>
                </div>
                <div class="avaliacao-data"><strong>${this.formatarData(avaliacao.dataAvaliacao)}</strong></div>
            </div>
        `).join('');

        // Adicionar eventos de click após renderizar
        this.bindEventosAvaliacoes();
    }

    bindEventosAvaliacoes() {
        const avaliacaoItems = document.querySelectorAll('.avaliacao-item');
        avaliacaoItems.forEach(item => {
            item.addEventListener('click', () => {
                const avaliacaoId = parseInt(item.dataset.id);
                this.abrirModalInfo(avaliacaoId);
            });
        });
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
        try {
            const date = new Date(data + 'T00:00:00'); // Força timezone local
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    }

    // === MODAL DE INFORMAÇÕES ===
    abrirModalInfo(avaliacaoId) {
        console.log('Tentando abrir modal para avaliação ID:', avaliacaoId);
        console.log('Avaliações disponíveis:', this.avaliacoes);
        console.log('Pacientes disponíveis:', this.pacientes);
        
        const avaliacao = this.avaliacoes.find(a => a.id === avaliacaoId);
        if (!avaliacao) {
            console.error('Avaliação não encontrada para ID:', avaliacaoId);
            this.mostrarMensagem('Avaliação não encontrada!', 'error');
            return;
        }

        console.log('Avaliação encontrada:', avaliacao);

        const paciente = this.pacientes.find(p => p.id == avaliacao.pacienteId);
        if (!paciente) {
            console.error('Paciente não encontrado para ID:', avaliacao.pacienteId);
            this.mostrarMensagem('Dados do paciente não encontrados!', 'error');
            return;
        }

        console.log('Paciente encontrado:', paciente);

        // Armazenar ID da avaliação atual para possível exclusão
        this.avaliacaoAtualId = avaliacaoId;

        // Preencher dados do modal
        this.preencherModalInfo(avaliacao, paciente);

        // Abrir modal
        const modalElement = document.getElementById('modalInfoAvaliacao');
        if (!modalElement) {
            console.error('Modal modalInfoAvaliacao não encontrado no DOM');
            this.mostrarMensagem('Modal não encontrado!', 'error');
            return;
        }

        try {
            if (window.bootstrap) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                console.log('Modal aberto com Bootstrap');
            } else {
                console.warn('Bootstrap não disponível, usando fallback');
                this.abrirModalFallback(modalElement);
            }
        } catch (error) {
            console.error('Erro ao abrir modal:', error);
            this.abrirModalFallback(modalElement);
        }
    }

    abrirModalFallback(modalElement) {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Criar backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.zIndex = '1040';
        document.body.appendChild(backdrop);

        // Adicionar evento para fechar ao clicar no backdrop
        backdrop.addEventListener('click', () => this.fecharModalInfo());
        
        // Adicionar evento para fechar com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.fecharModalInfo();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    fecharModalInfo() {
        const modalElement = document.getElementById('modalInfoAvaliacao');
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Remover backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }

    preencherModalInfo(avaliacao, paciente) {
        console.log('Preenchendo modal com:', { avaliacao, paciente });
        
        // Função auxiliar para definir texto do elemento com fallback
        const setElementText = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text || '-';
                return true;
            } else {
                console.warn(`Elemento ${id} não encontrado no DOM`);
                return false;
            }
        };

        // Título do modal
        setElementText('modalInfoTitle', `Informações - ${paciente.nome}`);

        // Dados básicos do paciente
        setElementText('infoNome', paciente.nome);
        setElementText('infoSexo', paciente.sexo);
        setElementText('infoContato', paciente.telefone || paciente.contato);
        
        // Data de nascimento e idade
        if (paciente.dataNascimento) {
            try {
                const nascimento = new Date(paciente.dataNascimento + 'T00:00:00');
                const idade = this.calcularIdade(nascimento);
                setElementText('infoNascimento', `${nascimento.toLocaleDateString('pt-BR')} - ${idade} Anos`);
            } catch (error) {
                console.error('Erro ao processar data de nascimento:', error);
                setElementText('infoNascimento', '-');
            }
        } else {
            setElementText('infoNascimento', '-');
        }

        // Dados da avaliação atual (priorizar dados da avaliação sobre dados do paciente)
        setElementText('infoAltura', avaliacao.alturaAtual ? `${avaliacao.alturaAtual}m` : (paciente.altura ? `${paciente.altura}m` : '-'));
        setElementText('infoPeso', avaliacao.pesoAtual ? `${avaliacao.pesoAtual}kg` : '-');
        setElementText('infoIMC', avaliacao.imc ? avaliacao.imc : '-');
        setElementText('infoGordura', avaliacao.percentualGordura ? `${avaliacao.percentualGordura}%` : (paciente.percentualGordura ? `${paciente.percentualGordura}%` : '-'));
        
        // Hábitos e atividades (priorizar dados da avaliação)
        setElementText('infoRefeicoes', avaliacao.frequenciaRefeicoes || paciente.frequenciaRefeicoes);
        setElementText('infoAtividades', avaliacao.atividadesFisicas || paciente.atividadesFisicas);
        setElementText('infoMastigacao', avaliacao.habitosMastigacao || paciente.habitosMastigacao);
        
        // Histórico de saúde
        let historicoTexto = '';
        if (paciente.historicoSaude) {
            if (Array.isArray(paciente.historicoSaude)) {
                historicoTexto = paciente.historicoSaude.join(', ');
            } else if (typeof paciente.historicoSaude === 'string') {
                historicoTexto = paciente.historicoSaude;
            }
        }
        setElementText('infoHistorico', historicoTexto);

        // Uso de substâncias
        let substanciasTexto = '';
        if (paciente.usoSubstancias) {
            if (Array.isArray(paciente.usoSubstancias)) {
                substanciasTexto = paciente.usoSubstancias.join(', ');
            } else if (typeof paciente.usoSubstancias === 'string') {
                substanciasTexto = paciente.usoSubstancias;
            }
            
            if (paciente.detalhesSubstancias) {
                substanciasTexto += `\nDetalhes: ${paciente.detalhesSubstancias}`;
            }
        }
        setElementText('infoSubstancias', substanciasTexto);

        // Métricas corporais
        setElementText('infoCintura', avaliacao.cintura ? `${avaliacao.cintura}cm` : (paciente.cintura ? `${paciente.cintura}cm` : '-'));
        setElementText('infoQuadril', avaliacao.quadril ? `${avaliacao.quadril}cm` : (paciente.quadril ? `${paciente.quadril}cm` : '-'));

        // Data da consulta
        setElementText('infoDataConsulta', avaliacao.dataAvaliacao ? this.formatarData(avaliacao.dataAvaliacao) : '-');

        // Observações
        setElementText('infoObservacoes', avaliacao.observacoes);

        // CORRIGIDO: Objetivos nutricionais da avaliação ou do paciente
        const objetivos = avaliacao.objetivosNutricionais || paciente.objetivos || 'Nenhum objetivo específico definido.';
        setElementText('infoObjetivos', objetivos);
    }

    calcularIdade(dataNascimento) {
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const diaAtual = hoje.getDate();
        const mesNascimento = dataNascimento.getMonth();
        const diaNascimento = dataNascimento.getDate();

        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
            idade--;
        }

        return idade;
    }

    excluirAvaliacaoAtual() {
        if (!this.avaliacaoAtualId) {
            this.mostrarMensagem('Nenhuma avaliação selecionada!', 'error');
            return;
        }

        if (confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) {
            // Encontrar a avaliação antes de excluir para renumeração
            const avaliacaoParaExcluir = this.avaliacoes.find(a => a.id === this.avaliacaoAtualId);
            
            // Remover avaliação do array
            this.avaliacoes = this.avaliacoes.filter(a => a.id !== this.avaliacaoAtualId);
            
            // Renumerar avaliações do mesmo paciente se a avaliação foi encontrada
            if (avaliacaoParaExcluir) {
                this.renumerarAvaliacoesPaciente(avaliacaoParaExcluir.pacienteId);
            }

            // Salvar alterações
            this.salvarAvaliacoes();
            
            // Fechar modal
            this.fecharModalInfo();

            // Atualizar lista
            this.renderAvaliacoes();
            this.mostrarMensagem('Avaliação excluída com sucesso!', 'success');
            
            // Limpar ID atual
            this.avaliacaoAtualId = null;
        }
    }

    renumerarAvaliacoesPaciente(pacienteId) {
        const avaliacoesPaciente = this.avaliacoes
            .filter(a => a.pacienteId === pacienteId)
            .sort((a, b) => new Date(a.dataAvaliacao) - new Date(b.dataAvaliacao));
        
        avaliacoesPaciente.forEach((avaliacao, index) => {
            avaliacao.numeroAvaliacao = index + 1;
        });
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
        const imcElement = document.getElementById('imc');
        if (imcElement) imcElement.value = '';
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

// Inicializar sistema quando a página carregar e tornar disponível globalmente
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaAvaliacoes = new SistemaAvaliacoes();
    console.log('Sistema de avaliações inicializado:', window.sistemaAvaliacoes);
});