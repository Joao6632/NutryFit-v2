function salvarDados() {
    var nome = document.getElementById('nome').value.trim();
    var idade = document.getElementById('idade').value.trim();
    var altura = document.getElementById('altura').value.trim();
    var peso = document.getElementById('peso').value.trim();
    var genero = document.getElementById('genero').value;
    var percentualGordura = document.getElementById('percentualgordura').value.trim();

    if (nome === "" || idade === "") {
        alert("Preencha todos os campos!");
        return;
    }

    idade = parseInt(idade);
    altura = parseFloat(altura);
    peso = parseFloat(peso);
    percentualGordura = percentualGordura ? parseFloat(percentualGordura) : 0;

    if (isNaN(peso) || isNaN(altura) || altura <= 0 || peso <= 0) {
        alert("Por favor, insira valores válidos para altura e peso.");
        return;
    }

    var imc = peso / (altura * altura);

    const paciente = {
        nome,
        idade,
        altura,
        peso,
        genero,
        percentualGordura,
        imc    
    };

    localStorage.setItem('nome', nome);
    localStorage.setItem('idade', idade);
    localStorage.setItem('altura', altura);
    localStorage.setItem('peso', peso);
    localStorage.setItem('genero', genero);
    localStorage.setItem('percentualGordura', percentualGordura);
    localStorage.setItem('imc', imc);

   

    window.location.href = "aEstadoNutricional.html";
}

function SituacaoNutricional(){
  var imc = parseFloat(localStorage.getItem('imc')) || 0;
  let pesobaixomsg = "Baixo peso";
  let pesonormalmsg = "IMC adequado!";
  let sobrepesomsg = "Sobrepeso";
  let obesidademsg = "Obesidade";
  
  let pesobaixo = "O IMC está abaixo da faixa considerada ideal, o que sugere um estado de desnutrição ou risco de deficiências nutricionais. Isso pode resultar em baixa reserva de gordura corporal e, possivelmente, em uma ingestão inadequada de nutrientes essenciais. Recomenda-se uma avaliação detalhada da alimentação e a inclusão de alimentos ricos em calorias e nutrientes para promover o ganho de peso saudável. O acompanhamento nutricional contínuo é indicado para garantir que as necessidades nutricionais sejam atendidas adequadamente.";

let pesonormal = "O Índice de Massa Corporal (IMC) está dentro da faixa considerada saudável, o que indica um bom equilíbrio entre peso e altura. Este é um indicativo de um estado nutricional adequado, refletindo um nível de gordura corporal compatível com a saúde geral. É importante manter um estilo de vida saudável, com uma alimentação equilibrada e prática regular de atividades físicas para garantir que este padrão seja sustentado ao longo do tempo.";

let sobrepeso = "O IMC encontra-se na faixa de sobrepeso, sugerindo que o paciente apresenta um peso superior ao considerado ideal para sua altura. Essa condição pode estar associada a um aumento na gordura corporal, o que pode elevar o risco de doenças crônicas, como hipertensão e diabetes tipo 2. Aconselha-se a revisão da dieta e o aumento da atividade física para promover uma redução ponderal gradual, visando melhorar a composição corporal e reduzir potenciais riscos à saúde.";

let obesidade = "O IMC está acima da faixa considerada saudável, indicando obesidade. Esta condição está associada a um risco elevado para várias comorbidades, como doenças cardiovasculares, resistência à insulina e distúrbios metabólicos. Recomenda-se a implementação de um plano alimentar específico, com foco na perda de peso saudável, aliado a uma rotina de atividades físicas. O acompanhamento contínuo é essencial para garantir a eficácia e a segurança do processo de redução de peso.";

if (imc <= 18.5) {
    document.getElementById("situacao").textContent = pesobaixomsg;
    document.getElementById("descricao").textContent = pesobaixo;
    document.getElementById("situacao").style.color = "blue"; 
} else if (imc > 18.5 && imc <= 24.9) {
    document.getElementById("situacao").textContent = pesonormalmsg;
    document.getElementById("descricao").textContent = pesonormal;
    document.getElementById("situacao").style.color = "green"; 
} else if (imc >= 25 && imc <= 29.9) {
    document.getElementById("situacao").textContent = sobrepesomsg;
    document.getElementById("descricao").textContent = sobrepeso;
    document.getElementById("situacao").style.color = "orange"; 
} else if (imc >= 30) {
    document.getElementById("situacao").textContent = obesidademsg;
    document.getElementById("descricao").textContent = obesidade;
    document.getElementById("situacao").style.color = "red"; 
}
}
window.onload = function () {
  SituacaoNutricional();
}