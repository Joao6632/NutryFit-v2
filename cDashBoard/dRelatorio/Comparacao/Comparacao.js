document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const sidebarToggle = document.getElementById("sidebarToggle");

    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") {
        sidebar.classList.add("collapsed");
        if (mainContent) mainContent.classList.add("sidebar-collapsed");
    }

    sidebarToggle.addEventListener("click", function() {
        sidebar.classList.toggle("collapsed");
        if (mainContent) mainContent.classList.toggle("sidebar-collapsed");
        localStorage.setItem("sidebarState", sidebar.classList.contains("collapsed") ? "collapsed" : "expanded");
    });

    const pdfBtn = document.querySelector(".pdf-btn");
    if (pdfBtn) {
        pdfBtn.addEventListener("click", () => window.print());
    }

    const logoutLink = document.querySelector(".logout-section .nav-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Tem certeza que quer sair?")) {
                localStorage.removeItem("nutryfit_current_user");
                window.location.href = "../../bTelaLogin&Cad/LoginCad.html";
            }
        });
    }

    carregarComparativo();
});

function carregarComparativo() {
    const urlParams = new URLSearchParams(window.location.search);
    const idAvaliacao = urlParams.get("id");

    if (!idAvaliacao) {
        mostrarErro("ID da avaliação não encontrado na URL");
        return;
    }

    const todasAvaliacoes = JSON.parse(localStorage.getItem("nutrifit-avaliacoes") || "[]");
    const avaliacaoSelecionada = todasAvaliacoes.find(av => av.id == idAvaliacao);

    if (!avaliacaoSelecionada) {
        mostrarErro("Avaliação não encontrada");
        return;
    }

    const pacienteId = avaliacaoSelecionada.pacienteId;
    const avaliacoesDoPaciente = todasAvaliacoes
        .filter(av => av.pacienteId == pacienteId)
        .sort((a, b) => new Date(a.dataAvaliacao) - new Date(b.dataAvaliacao));

    if (avaliacoesDoPaciente.length < 2) {
        mostrarErro("Paciente precisa ter pelo menos 2 avaliações para comparar");
        return;
    }

    const indexAtual = avaliacoesDoPaciente.findIndex(av => av.id == idAvaliacao);
    let avaliacaoAntiga, avaliacaoNova;

    if (indexAtual > 0) {
        avaliacaoAntiga = avaliacoesDoPaciente[indexAtual - 1];
        avaliacaoNova = avaliacoesDoPaciente[indexAtual];
    } else {
        avaliacaoAntiga = avaliacoesDoPaciente[0];
        avaliacaoNova = avaliacoesDoPaciente[1];
    }

    preencherRelatorio(avaliacaoAntiga, avaliacaoNova);
}

function preencherRelatorio(avaliacaoAntiga, avaliacaoNova) {
    preencherHeader(avaliacaoAntiga, avaliacaoNova);
    preencherMetricas(avaliacaoAntiga, avaliacaoNova);
    preencherDetalhes(avaliacaoAntiga, avaliacaoNova);
    preencherObservacoes(avaliacaoAntiga, avaliacaoNova);
}

function preencherHeader(avaliacaoAntiga, avaliacaoNova) {
    const patientInfo = document.querySelector(".patient-info");
    if (patientInfo) {
        const dataAntiga = formatarData(avaliacaoAntiga.dataAvaliacao);
        const dataNova = formatarData(avaliacaoNova.dataAvaliacao);

        patientInfo.innerHTML = `
            <span>Paciente: ${avaliacaoNova.pacienteNome} - Avaliação #${avaliacaoAntiga.numeroAvaliacao || "1"} - ${dataAntiga}</span>
            <i class="bi bi-arrow-right"></i>
            <span>Avaliação #${avaliacaoNova.numeroAvaliacao || "2"} - ${dataNova}</span>
        `;
    }
}

function preencherMetricas(avaliacaoAntiga, avaliacaoNova) {
    const metricas = [
        { campo: "peso", unidade: "kg", decimais: 1, posicao: 1 },
        { campo: "percentualGordura", unidade: "%", decimais: 2, posicao: 2 },
        { campo: "quadril", unidade: "cm", decimais: 0, posicao: 3 },
        { campo: "cintura", unidade: "cm", decimais: 0, posicao: 4 },
    ];

    metricas.forEach((metrica) => {
        const valorAntigo = getValue(avaliacaoAntiga, metrica.campo) || 0;
        const valorNovo = getValue(avaliacaoNova, metrica.campo) || 0;
        const variacao = valorNovo - valorAntigo;

        const card = document.querySelector(`.col-md-3:nth-child(${metrica.posicao}) .metric-card`);
        if (card) {
            const valueElement = card.querySelector(".metric-value");
            const changeElement = card.querySelector(".metric-change");

            if (valueElement) {
                valueElement.textContent = `${valorNovo.toFixed(metrica.decimais)} ${metrica.unidade}`;
            }

            if (changeElement) {
                const variacaoTexto = Math.abs(variacao).toFixed(metrica.decimais);
                const sinal = variacao > 0 ? "+" : "";

                changeElement.innerHTML = `
                    <i class="bi bi-triangle-fill" ${variacao < 0 ? 'style="transform: rotate(180deg);"' : ""}></i>
                    ${sinal}${variacaoTexto} ${metrica.unidade}
                `;

                changeElement.className = "metric-change";
                if (variacao > 0) changeElement.classList.add("positive");
                else if (variacao < 0) changeElement.classList.add("negative");
                else changeElement.classList.add("neutral");
            }
        }
    });
}

function preencherDetalhes(avaliacaoAntiga, avaliacaoNova) {
    const detailItems = document.querySelectorAll(".detail-item");
    const campos = ["atividadesFisicas", "habitosMastigacao", "imc", "altura", "frequenciaRefeicoes", "atividadesFisicas", "usoSubstancias"];

    detailItems.forEach((item, index) => {
        if (index < campos.length) {
            const campo = campos[index];
            const sublabel = item.querySelector(".detail-sublabel");

            if (sublabel) {
                let valor = getValue(avaliacaoNova, campo);
                if (campo === "usoSubstancias") {
                    valor = formatarSubstancias(avaliacaoNova);
                }
                sublabel.textContent = valor || "Não informado";
            }
        }
    });
}

function preencherObservacoes(avaliacaoAntiga, avaliacaoNova) {
    const observacaoCards = document.querySelectorAll(".observacao-card");

    if (observacaoCards[0]) {
        const titulo = observacaoCards[0].querySelector(".observacao-title");
        const texto = observacaoCards[0].querySelector(".observacao-text");
        if (titulo) titulo.textContent = `Observações - Aval. #${avaliacaoAntiga.numeroAvaliacao || "1"}`;
        if (texto) texto.textContent = getValue(avaliacaoAntiga, "observacoes") || "Nenhuma observação";
    }

    if (observacaoCards[1]) {
        const titulo = observacaoCards[1].querySelector(".observacao-title");
        const texto = observacaoCards[1].querySelector(".observacao-text");
        if (titulo) titulo.textContent = `Observações - Aval. #${avaliacaoNova.numeroAvaliacao || "2"}`;
        if (texto) texto.textContent = getValue(avaliacaoNova, "observacoes") || "Nenhuma observação";
    }
}

function getValue(avaliacao, campo) {
    if (!avaliacao) return null;
    return avaliacao[campo] || avaliacao[campo.toLowerCase()] || null;
}

function formatarData(dataString) {
    if (!dataString) return "Data não informada";
    try {
        return new Date(dataString).toLocaleDateString("pt-BR");
    } catch {
        return dataString;
    }
}

function formatarSubstancias(avaliacao) {
    const substancias = [];
    if (getValue(avaliacao, "alcool")) substancias.push("Álcool");
    if (getValue(avaliacao, "drogasIlicitas")) substancias.push("Drogas ilícitas");

    if (substancias.length === 0) return "Nenhuma";

    let resultado = substancias.join(", ");
    const detalhes = getValue(avaliacao, "detalhesSubstancias");
    if (detalhes) resultado += `: ${detalhes}`;
    return resultado;
}

function mostrarErro(mensagem) {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #dc3545;">Erro</h2>
                <p>${mensagem}</p>
                <button onclick="window.history.back()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        `;
    }
}