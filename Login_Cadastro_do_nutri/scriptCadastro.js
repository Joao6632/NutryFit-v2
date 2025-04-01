
document.addEventListener("DOMContentLoaded", function () {
    let cpfInput = document.querySelector("input[name='cpf']");

    document.getElementById("telefone").addEventListener("input", function (e) {
        let telefone = e.target.value;
        telefone = telefone.replace(/\D/g, '');
        
        if (telefone.length > 2) {
            telefone = `(${telefone.substring(0, 2)}) ${telefone.substring(2)}`;
        }
        if (telefone.length > 10) {
            telefone = telefone.replace(/(\(\d{2}\))\s(\d{5})(\d{4})/, "$1 $2-$3");
        } else if (telefone.length > 9) {
            telefone = telefone.replace(/(\(\d{2}\))\s(\d{4})(\d{4})/, "$1 $2-$3");
        }
        e.target.value = telefone;
    });

    cpfInput.addEventListener("input", function (e) {  
        let cursorPos = e.target.selectionStart;  
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) {  
            value = value.substring(0, 11); 
        }
        let formattedCpf = value;  
        if (value.length > 9) {  
            formattedCpf = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");  
        } else if (value.length > 6) {  
            formattedCpf = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");  
        } else if (value.length > 3) {  
            formattedCpf = value.replace(/(\d{3})(\d{1,3})/, "$1.$2"); 
        }
        e.target.value = formattedCpf;
        let newCursorPos = cursorPos;
        if (formattedCpf.length > value.length) {
            newCursorPos += 1;
        }
        e.target.setSelectionRange(newCursorPos, newCursorPos);  
    });
});


function ValidarFormulario2() {
    let nomeuser = document.getElementById("name").value;
    let emailuser = document.getElementById("email").value;
    let cpf = document.querySelector("input[name='cpf']").value;
    let senhauser = document.getElementById("senha").value;
    let datanascimento = document.getElementById("data").value;
    let genero = document.getElementById("genero").value;    
    let numtelefone = document.getElementById("telefone").value;
    let confirmarSenha = document.querySelector("input[name='confirmar-senha']").value;

    if (nomeuser === "" || emailuser === "" || cpf === "" || senhauser === "" || confirmarSenha === "") {
        alert("Por favor, insira todos os campos!");
        return false;
    }

    if (senhauser.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres.");
        return false;
    }

    if (senhauser !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return false;
    }

    
    localStorage.setItem("nome", nomeuser);
    localStorage.setItem("email", emailuser);
    localStorage.setItem("senha", senhauser);
    localStorage.setItem("cpf", cpf);
    localStorage.setItem("data", datanascimento);
    localStorage.setItem("telefone", numtelefone);
    localStorage.setItem("genero", genero);

    console.log(localStorage); 

    
    alert("Cadastro realizado com sucesso!");
    window.location.href = "pInfoCad.html"; 
    return false; 
}


window.onload = function() {
    const emailField = document.getElementById("email");
    if (emailField) {
        emailField.value = "";
    }
};
