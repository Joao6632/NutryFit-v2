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

        localStorage.setItem(
            'sidebarState',
            sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded'
        );
    });

    // Botão PDF
    const pdfBtn = document.querySelector('.pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Inicializar relatório comparativo
    inicializarRelatorio();

    // Logout
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

// === SISTEMA DE RELATÓRIO COMPARATIVO ===
function inicializarRelatorio() {
    try {
        // 1. Carregar dados do comparativo
        const dadosComparativo = JSON.parse(localStorage.getItem('nutrifit-comparativo-avaliacoes') || '{}');
        
        if (!dadosComparativo.avaliacoes || dadosComparativo.avaliacoes.length !== 2) {
            console.error('Dados do comparativo não encontrados ou inválidos');
            mostrarErroCarregamento();
            return;
        }

        // 2. Carregar avaliações completas
        const todasAvaliacoes = JSON.parse(localStorage.getItem('nutrifit-avaliacoes') || '[]');
        
        const avaliacoesSelecionadas = todasAvaliacoes.filter(avaliacao => 
            dadosComparativo.avaliacoes.includes(avaliacao.id)
        );

        if (avaliacoesSelecionadas.length !== 2) {
            console.error(`Esperado 2 avaliações, encontrado ${avaliacoesSelecionadas.length}`);
            mostrarErroCarregamento();
            return;
        }

        // 3. Ordenar por data (mais antiga primeiro)
        avaliacoesSelecionadas.sort((a, b) => {
            const dataA = new Date(a.dataAvaliacao || a.data || a.dataCriacao);
            const dataB = new Date(b.dataAvaliacao || b.data || b.dataCriacao);
            return dataA - dataB;
        });

        const avaliacaoAntiga = avaliacoesSelecionadas[0];
        const avaliacaoNova = avaliacoesSelecionadas[1];

        // 4. Preencher o relatório
        preencherInformacoesPaciente(dadosComparativo, avaliacaoAntiga, avaliacaoNova);
        preencherResumoVariacoes(avaliacaoAntiga, avaliacaoNova);
        preencherDetalhes(avaliacaoAntiga, avaliacaoNova);
        preencherObservacoes(avaliacaoAntiga, avaliacaoNova);

        console.log('✅ Relatório carregado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao inicializar relatório:', error);
        mostrarErroCarregamento();
    }
}

function preencherInformacoesPaciente(dadosComparativo, avaliacaoAntiga, avaliacaoNova) {
    // Atualizar informações do paciente no header
    const patientInfo = document.querySelector('.patient-info');
    if (patientInfo) {
        const dataAntiga = formatarData(avaliacaoAntiga.dataAvaliacao || avaliacaoAntiga.data);
        const dataNova = formatarData(avaliacaoNova.dataAvaliacao || avaliacaoNova.data);
        
        patientInfo.innerHTML = `
            <span>Paciente: ${dadosComparativo.pacienteNome} - Avaliação #${avaliacaoAntiga.numeroAvaliacao || '1'} - ${dataAntiga}</span>
            <i class="bi bi-arrow-right"></i>
            <span>Avaliação #${avaliacaoNova.numeroAvaliacao || '3'} - ${dataNova}</span>
        `;
    }
}

function preencherResumoVariacoes(avaliacaoAntiga, avaliacaoNova) {
    // Definir métricas para comparação
    const metricas = [
        { 
            nome: 'peso', 
            unidade: 'kg', 
            decimais: 1,
            selector: '.col-md-3:nth-child(1)' 
        },
        { 
            nome: 'percentualGordura', 
            titulo: '% de gordura',
            unidade: '%', 
            decimais: 2,
            selector: '.col-md-3:nth-child(2)' 
        },
        { 
            nome: 'quadril', 
            unidade: 'cm', 
            decimais: 0,
            selector: '.col-md-3:nth-child(3)' 
        },
        { 
            nome: 'cintura', 
            unidade: 'cm', 
            decimais: 0,
            selector: '.col-md-3:nth-child(4)' 
        }
    ];

    metricas.forEach(metrica => {
        const valorAntigo = getValue(avaliacaoAntiga, metrica.nome);
        const valorNovo = getValue(avaliacaoNova, metrica.nome);
        
        const variacao = valorNovo - valorAntigo;
        const card = document.querySelector(`${metrica.selector} .metric-card`);
        
        if (card) {
            // Atualizar valor atual
            const valueElement = card.querySelector('.metric-value');
            if (valueElement) {
                valueElement.textContent = `${valorNovo.toFixed(metrica.decimais)} ${metrica.unidade}`;
            }

            // Atualizar variação
            const changeElement = card.querySelector('.metric-change');
            if (changeElement) {
                const variacaoTexto = Math.abs(variacao).toFixed(metrica.decimais);
                const sinal = variacao > 0 ? '+' : '';
                
                changeElement.innerHTML = `
                    <i class="bi bi-triangle-fill" ${variacao < 0 ? 'style="transform: rotate(180deg);"' : ''}></i>
                    ${sinal}${variacaoTexto} ${metrica.unidade}
                `;

                // Atualizar classe CSS baseada na direção
                changeElement.className = 'metric-change';
                if (variacao > 0) {
                    changeElement.classList.add('positive');
                } else if (variacao < 0) {
                    changeElement.classList.add('negative');
                } else {
                    changeElement.classList.add('neutral');
                }
            }
        }
    });
}

function preencherDetalhes(avaliacaoAntiga, avaliacaoNova) {
    // Array com mapeamento dos detalhes
    const detalhes = [
        {
            label: 'Atividades Físicas',
            campo: 'atividadesFisicas',
            index: 0
        },
        {
            label: 'Hábitos de mastigação',
            campo: 'habitosMastigacao',
            index: 1
        },
        {
            label: 'IMC',
            campo: 'imc',
            index: 2,
            formatador: (valor) => valor || 'Não calculado'
        },
        {
            label: 'Altura',
            campo: 'altura',
            index: 3,
            formatador: (valor) => valor || 'Não informado'
        },
        {
            label: 'Frequência das refeições',
            campo: 'frequenciaRefeicoes',
            index: 4
        },
        {
            label: 'Atividades Físicas',
            campo: 'atividadesFisicas',
            index: 5
        },
        {
            label: 'Uso de substâncias',
            campo: 'usoSubstancias',
            index: 6,
            formatador: (valor, avaliacao) => formatarSubstancias(avaliacao)
        }
    ];

    const detailItems = document.querySelectorAll('.detail-item');
    
    detalhes.forEach(detalhe => {
        if (detailItems[detalhe.index]) {
            const item = detailItems[detalhe.index];
            const sublabelElement = item.querySelector('.detail-sublabel');
            
            if (sublabelElement) {
                let valor = getValue(avaliacaoNova, detalhe.campo);
                
                if (detalhe.formatador) {
                    valor = detalhe.formatador(valor, avaliacaoNova);
                }
                
                sublabelElement.textContent = valor || 'Não informado';
            }

            // Atualizar indicador baseado na comparação
            atualizarIndicador(item, avaliacaoAntiga, avaliacaoNova, detalhe.campo);
        }
    });
}

function atualizarIndicador(item, avaliacaoAntiga, avaliacaoNova, campo) {
    const valorAntigo = getValue(avaliacaoAntiga, campo);
    const valorNovo = getValue(avaliacaoNova, campo);
    
    const indicator = item.querySelector('i[class*="detail-indicator"]');
    if (!indicator) return;

    // Para campos numéricos
    if (typeof valorNovo === 'number' && typeof valorAntigo === 'number') {
        if (valorNovo > valorAntigo) {
            indicator.className = 'detail-indicator-up bi-triangle-fill';
            indicator.style.transform = '';
        } else if (valorNovo < valorAntigo) {
            indicator.className = 'detail-indicator-down bi-triangle-fill';
            indicator.style.transform = 'rotate(180deg)';
        } else {
            indicator.className = 'detail-indicator-stable bi bi-circle-fill';
            indicator.style.transform = '';
        }
    } else {
        // Para campos de texto, comparar se mudaram
        if (String(valorNovo) !== String(valorAntigo)) {
            indicator.className = 'detail-indicator-up bi-triangle-fill';
            indicator.style.transform = '';
        } else {
            indicator.className = 'detail-indicator-stable bi bi-circle-fill';
            indicator.style.transform = '';
        }
    }
}

function preencherObservacoes(avaliacaoAntiga, avaliacaoNova) {
    const observacaoCards = document.querySelectorAll('.observacao-card');
    
    if (observacaoCards.length >= 2) {
        // Primeira observação (antiga)
        const obsAntigaText = observacaoCards[0].querySelector('.observacao-text');
        if (obsAntigaText) {
            obsAntigaText.textContent = getValue(avaliacaoAntiga, 'observacoes') || 'Nenhuma observação registrada.';
        }
        
        const tituloAntiga = observacaoCards[0].querySelector('.observacao-title');
        if (tituloAntiga) {
            tituloAntiga.textContent = `Observações - Aval. #${avaliacaoAntiga.numeroAvaliacao || '1'}`;
        }

        // Segunda observação (nova)
        const obsNovaText = observacaoCards[1].querySelector('.observacao-text');
        if (obsNovaText) {
            obsNovaText.textContent = getValue(avaliacaoNova, 'observacoes') || 'Nenhuma observação registrada.';
        }
        
        const tituloNova = observacaoCards[1].querySelector('.observacao-title');
        if (tituloNova) {
            tituloNova.textContent = `Observações - Aval. #${avaliacaoNova.numeroAvaliacao || '3'}`;
        }
    }
}

// === FUNÇÕES AUXILIARES ===

function getValue(avaliacao, campo) {
    // Tentar diferentes variações do nome do campo
    const possiveis = [
        campo,
        campo.toLowerCase(),
        camelToSnake(campo),
        snakeToCamel(campo)
    ];

    for (const key of possiveis) {
        if (avaliacao[key] !== undefined && avaliacao[key] !== null && avaliacao[key] !== '') {
            return avaliacao[key];
        }
    }

    return campo === 'imc' || campo === 'altura' || campo === 'peso' || campo === 'percentualGordura' || 
           campo === 'cintura' || campo === 'quadril' ? 0 : 'Não informado';
}

function formatarData(dataString) {
    if (!dataString) return 'Data não informada';
    
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    } catch (error) {
        return dataString;
    }
}

function formatarSubstancias(avaliacao) {
    const substancias = [];
    
    if (getValue(avaliacao, 'alcool') === true || getValue(avaliacao, 'alcool') === 'sim') {
        substancias.push('Álcool');
    }
    if (getValue(avaliacao, 'drogasIlicitas') === true || getValue(avaliacao, 'drogasIlicitas') === 'sim') {
        substancias.push('Drogas ilícitas');
    }

    if (substancias.length === 0) {
        return 'Nenhuma';
    }

    let resultado = substancias.join(', ');
    const detalhes = getValue(avaliacao, 'detalhesSubstancias');
    if (detalhes && detalhes !== 'Não informado') {
        resultado += `: ${detalhes}`;
    }

    return resultado;
}

function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function mostrarErroCarregamento() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Erro ao carregar relatório</h2>
                <p style="margin-bottom: 20px;">Não foi possível encontrar os dados das avaliações selecionadas.</p>
                <button onclick="window.history.back()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    Voltar
                </button>
                <button onclick="debugDados()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Debug
                </button>
                
                <div id="debug-output" style="margin-top: 30px; text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; display: none;">
                    <h4>Informações de Debug:</h4>
                    <pre id="debug-info"></pre>
                </div>
            </div>
        `;
    }
}

// Função para debug
function debugDados() {
    console.log('=== DEBUG DOS DADOS ===');
    
    const comparativo = localStorage.getItem('nutrifit-comparativo-avaliacoes');
    const avaliacoes = localStorage.getItem('nutrifit-avaliacoes');
    
    const debugOutput = document.getElementById('debug-output');
    const debugInfo = document.getElementById('debug-info');
    
    if (debugOutput && debugInfo) {
        debugOutput.style.display = 'block';
        
        const info = {
            temComparativo: !!comparativo,
            temAvaliacoes: !!avaliacoes,
            dadosComparativo: comparativo ? JSON.parse(comparativo) : null,
            totalAvaliacoes: avaliacoes ? JSON.parse(avaliacoes).length : 0,
            primeirasAvaliacoes: avaliacoes ? JSON.parse(avaliacoes).slice(0, 2) : []
        };
        
        debugInfo.textContent = JSON.stringify(info, null, 2);
    }
    
    console.log('Comparativo:', comparativo ? JSON.parse(comparativo) : null);
    console.log('Total avaliações:', avaliacoes ? JSON.parse(avaliacoes).length : 0);
    
    if (avaliacoes && comparativo) {
        const avaliacoesList = JSON.parse(avaliacoes);
        const configComparativo = JSON.parse(comparativo);
        
        console.log('IDs selecionados:', configComparativo.avaliacoes);
        
        const selecionadas = avaliacoesList.filter(av => 
            configComparativo.avaliacoes.includes(av.id)
        );
        
        console.log('Avaliações encontradas:', selecionadas);
    }
}