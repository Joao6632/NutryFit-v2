// ==== ELEMENTOS DO DOM ====
const container = document.getElementById('container');
const slidingPanel = document.getElementById('slidingPanel');
const switchButton = document.getElementById('switchButton');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');

// Página inicial
const homePage = document.getElementById('homePage');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutButton = document.getElementById('logoutButton');

// Formulários
const signupForm = document.getElementById('signupFormElement');
const loginForm = document.getElementById('loginFormElement');
const signupMessage = document.getElementById('signupMessage');
const loginMessage = document.getElementById('loginMessage');

// ==== CONTROLE DE ESTADO ====
let isLoginMode = false;
let currentUser = null;

// ==== STORAGE ====
function getUsersFromStorage() {
    return JSON.parse(localStorage.getItem('nutryfit_users')) || {};
}

function saveUsersToStorage(users) {
    localStorage.setItem('nutryfit_users', JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('nutryfit_current_user')) || null;
}

function saveCurrentUser(user) {
    localStorage.setItem('nutryfit_current_user', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('nutryfit_current_user');
}

// ==== FUNÇÕES DE UI ====
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function clearForms() {
    if (signupForm) signupForm.reset();
    if (loginForm) loginForm.reset();
    if (signupMessage) signupMessage.innerHTML = '';
    if (loginMessage) loginMessage.innerHTML = '';
}

function toggleForms(forceLogin = false) {
    container.classList.add('animating');

    if (signupMessage) signupMessage.innerHTML = '';
    if (loginMessage) loginMessage.innerHTML = '';

    if (!isLoginMode || forceLogin) {
        slidingPanel.classList.add('move-right');
        setTimeout(() => {
            panelTitle.innerHTML = 'Não tem uma conta? <br>Cadastre-se agora!';
            switchButton.textContent = 'Crie uma conta!';
        }, 500);
        isLoginMode = true;
    } else {
        slidingPanel.classList.remove('move-right');
        setTimeout(() => {
            panelTitle.innerHTML = 'Já possui uma<br>conta?';
            switchButton.textContent = 'Entre em uma conta existente!';
        }, 500);
        isLoginMode = false;
    }

    setTimeout(() => {
        container.classList.remove('animating');
    }, 1000);
}

function redirectToHome() {
    window.location.href = "../cDashBoard/aInicio/Inicio.html"; // <-- coloca aqui o caminho da tua página inicial
}

// ==== LOGOUT ====
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        currentUser = null;
        clearCurrentUser();
        homePage.classList.remove('active');
        container.style.display = 'flex';

        if (isLoginMode) {
            toggleForms();
        }
        clearForms();
        console.log('Logout realizado');
    });
}

// ==== VERIFICAR LOGIN AUTOMÁTICO ====
function checkLoggedUser() {
    const savedUser = getCurrentUser();
    if (savedUser) {
        currentUser = savedUser;
        redirectToHome();
    }
}

// ==== EVENTOS DE PÁGINA ====
document.addEventListener('DOMContentLoaded', () => {
    checkLoggedUser();

    if (!currentUser) {
        const nomeInput = document.getElementById('nome');
        if (nomeInput) nomeInput.focus();
    }

    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.type !== 'submit') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) nextInput.focus();
            }
        });
    });
});

// ==== BOTÃO TROCAR FORM ====
switchButton.addEventListener('click', () => toggleForms());

// ==== CADASTRO ====
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email-signup').value.trim().toLowerCase();
        const senha = document.getElementById('senha-signup').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (!nome) {
            showMessage('signupMessage', 'Por favor, digite seu nome.', 'error');
            return;
        }
        if (nome.length < 2) {
            showMessage('signupMessage', 'Nome deve ter pelo menos 2 caracteres.', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showMessage('signupMessage', 'Por favor, insira um email válido.', 'error');
            return;
        }
        if (senha.length < 6) {
            showMessage('signupMessage', 'Senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }
        if (senha !== confirmarSenha) {
            showMessage('signupMessage', 'As senhas não conferem.', 'error');
            return;
        }

        const users = getUsersFromStorage();
        if (users[email]) {
            showMessage('signupMessage', 'Este email já está cadastrado.', 'error');
            return;
        }

        const newUser = {
            nome,
            email,
            senha,
            dataCadastro: new Date().toISOString()
        };

        users[email] = newUser;
        saveUsersToStorage(users);

        // 🔹 mostra mensagem e joga pro login
        showMessage('signupMessage', 'Cadastro realizado! Agora faça login.', 'success');
        clearForms();
        toggleForms(true); // força mudar pro login
    });
}

// ==== LOGIN ====
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email-login').value.trim().toLowerCase();
        const senha = document.getElementById('senha-login').value;

        const users = getUsersFromStorage();

        if (!users[email]) {
            showMessage('loginMessage', 'Usuário não encontrado.', 'error');
            return;
        }

        if (users[email].senha !== senha) {
            showMessage('loginMessage', 'Senha incorreta.', 'error');
            return;
        }

        currentUser = users[email];
        saveCurrentUser(currentUser);
        redirectToHome();
    });
}
