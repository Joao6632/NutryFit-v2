function ValidarFormulario() {
  const emailuser = document.getElementById("email").value;
  const senhauser = document.getElementById("senha").value;

  localStorage.setItem("email", emailuser);
  localStorage.setItem("senha", senhauser);

  if (emailuser === "" || senhauser === "") {
    alert("Preencha todos os campos corretamente!");
    return false; 
  }

  if (senhauser.length < 8) {
    alert("A senha deve ter pelo menos 8 caracteres.");
    return false; 
  }

  console.log("Email digitado: " + emailuser);
  console.log("senha digitada: " + senhauser);
  window.location.href = "pLoginInfo.html"; 
  return false; 
}


window.onload = function() {
const emailField = document.getElementById("email");
if (emailField) {
  emailField.value = "";
}
}
