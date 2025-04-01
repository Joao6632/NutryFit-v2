window.onload = function() {
    let listaPacientes = JSON.parse(localStorage.getItem("listaPacientes")) || [];

    let dashboard = document.getElementById("dashboard");

    // Limpar o conteúdo existente do dashboard
    dashboard.innerHTML = "<h3>Registro de pacientes</h3>";

    // Se não houver pacientes, exibe a mensagem "Nenhum paciente cadastrado"
    if (listaPacientes.length === 0) {
        dashboard.innerHTML += "<p>Nenhum paciente cadastrado.</p>";
        return;
    }

    // Adicionar pacientes
    listaPacientes.forEach((paciente, index) => {
        let pacienteInfoHTML = `
            <div class="paciente">
                <h3 onclick="mostrarInformacoes(${index})">Paciente ${index + 1}: ${paciente.nome}</h3>
            </div>
        `;
        dashboard.innerHTML += pacienteInfoHTML;
    });
};

function mostrarInformacoes(index) {
    let listaPacientes = JSON.parse(localStorage.getItem("listaPacientes")) || [];
    let paciente = listaPacientes[index];

    let infoHTML = `
        <p><strong>Nome completo:</strong> ${paciente.nome}</p>
        <p><strong>Idade:</strong> ${paciente.idade}</p>
        <p><strong>Gênero:</strong> ${paciente.genero}</p>
        <p><strong>IMC:</strong> ${paciente.imc.toFixed(2)}</p>
        <p><strong>TMB:</strong> ${paciente.tmb.toFixed(2)} kcal/dia</p>
        <p><strong>Percentual de Gordura:</strong> ${paciente.percentualGordura.toFixed(2)}%</p>
        
    `;

    document.getElementById("informacoes-modal").innerHTML = infoHTML;

    // Exibir o modal
    let modal = document.getElementById("modal");
    modal.style.display = "block";
}

function fecharModal() {
    // Fechar o modal
    let modal = document.getElementById("modal");
    modal.style.display = "none";
}

// Fechar o modal se o usuário clicar fora dele
window.onclick = function(event) {
    let modal = document.getElementById("modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
