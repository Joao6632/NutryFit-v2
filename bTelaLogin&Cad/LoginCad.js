// ==== ELEMENTOS DO DOM ====
const container = document.getElementById('container');
const slidingPanel = document.getElementById('slidingPanel');
const switchButton = document.getElementById('switchButton');
const panelTitle = document.getElementById('panelTitle');

// Formulários
const signupForm = document.getElementById('signupFormElement');
const loginForm = document.getElementById('loginFormElement');
const signupMessage = document.getElementById('signupMessage');
const loginMessage = document.getElementById('loginMessage');

// ==== CONTROLE DE ESTADO ====
let isLoginMode = false;
let currentUser = null;

// ==== FUNÇÕES EMAIL/TELEFONE ====
function applyPhoneMask(value) {
    value = value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }
    
    return value;
}

function detectInputType(value) {
    value = value.trim();
    
    if (value.includes('@')) {
        return 'email';
    }
    
    const numbersOnly = value.replace(/\D/g, '');
    const phoneRegex = /^[\d\s\(\)\-]+$/;
    
    if (phoneRegex.test(value) && numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        return 'phone';
    }
    
    if (/^\d+$/.test(value) && numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        return 'phone';
    }
    
    return 'unknown';
}

function isValidPhone(phone) {
    const numbersOnly = phone.replace(/\D/g, '');
    return numbersOnly.length === 10 || numbersOnly.length === 11;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateEmailPhoneField(inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    
    if (value === '') {
        return { valid: false, message: 'Campo obrigatório' };
    }
    
    if (value.includes('@')) {
        const valid = isValidEmail(value);
        return { 
            valid, 
            type: 'email', 
            value,
            message: valid ? 'Email válido' : 'Email inválido' 
        };
    }
    
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        const valid = isValidPhone(value);
        return { 
            valid, 
            type: 'phone', 
            value: numbersOnly,
            message: valid ? 'Telefone válido' : 'Telefone inválido' 
        };
    }
    
    return { valid: false, message: 'Digite um email válido ou telefone com 10-11 dígitos' };
}

// Inicialização do campo email/telefone (LOGIN)
function initEmailPhoneField() {
    const input = document.getElementById('email-login');
    if (!input) return;
    
    let inputType = 'unknown';
    
    input.addEventListener('input', function(e) {
        let currentValue = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        const newInputType = detectInputType(currentValue);
        
        if (inputType === 'phone' && newInputType === 'email') {
            currentValue = currentValue.replace(/[\(\)\s\-]/g, '');
            e.target.value = currentValue;
        }
        
        inputType = newInputType;
        
        if (inputType === 'phone') {
            const maskedValue = applyPhoneMask(currentValue);
            
            if (e.target.value !== maskedValue) {
                e.target.value = maskedValue;
                
                let newCursorPosition = cursorPosition;
                if (maskedValue.length < currentValue.length) {
                    newCursorPosition = maskedValue.length;
                } else {
                    newCursorPosition = cursorPosition + (maskedValue.length - currentValue.length);
                }
                
                if (newCursorPosition > maskedValue.length) {
                    newCursorPosition = maskedValue.length;
                }
                
                setTimeout(() => {
                    e.target.setSelectionRange(newCursorPosition, newCursorPosition);
                }, 0);
            }
        }
    });
    
    input.addEventListener('keydown', function(e) {
        const currentValue = e.target.value;
        
        if (!currentValue.includes('@')) {
            const inputType = detectInputType(currentValue);
            
            if (inputType === 'phone') {
                const numbersOnly = currentValue.replace(/\D/g, '');
                
                if (numbersOnly.length >= 11 && /\d/.test(e.key) && 
                    e.target.selectionStart === e.target.selectionEnd) {
                    e.preventDefault();
                }
            }
        }
    });
}

// Inicialização do campo telefone no CADASTRO
function initPhoneFieldSignup() {
    const input = document.getElementById('telefone-signup');
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let currentValue = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        const maskedValue = applyPhoneMask(currentValue);
        
        if (e.target.value !== maskedValue) {
            e.target.value = maskedValue;
            
            let newCursorPosition = cursorPosition;
            
            if (maskedValue.length < currentValue.length) {
                newCursorPosition = maskedValue.length;
            } else {
                newCursorPosition = cursorPosition + (maskedValue.length - currentValue.length);
            }
            
            if (newCursorPosition > maskedValue.length) {
                newCursorPosition = maskedValue.length;
            }
            
            setTimeout(() => {
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            }, 0);
        }
    });
    
    input.addEventListener('keydown', function(e) {
        const currentValue = e.target.value;
        const numbersOnly = currentValue.replace(/\D/g, '');
        
        if (numbersOnly.length >= 11 && /\d/.test(e.key) && 
            e.target.selectionStart === e.target.selectionEnd) {
            e.preventDefault();
        }
    });
}

// ==== STORAGE ====
let usersStorage = {};

function getUsersFromStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            return JSON.parse(localStorage.getItem('nutryfit_users')) || {};
        } else {
            return usersStorage;
        }
    } catch (error) {
        return usersStorage;
    }
}

function saveUsersToStorage(users) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('nutryfit_users', JSON.stringify(users));
        } else {
            usersStorage = users;
        }
    } catch (error) {
        usersStorage = users;
    }
}

function getCurrentUser() {
    try {
        if (typeof localStorage !== 'undefined') {
            return JSON.parse(localStorage.getItem('nutryfit_current_user')) || null;
        }
        return null;
    } catch (error) {
        return null;
    }
}

function saveCurrentUser(user) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('nutryfit_current_user', JSON.stringify(user));
        }
    } catch (error) {
        // Silently fail
    }
}

// ==== FUNÇÕES DE UI ====
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

function clearForms() {
    if (signupForm) signupForm.reset();
    if (loginForm) loginForm.reset();
    if (signupMessage) signupMessage.innerHTML = '';
    if (loginMessage) loginMessage.innerHTML = '';
}

function toggleForms(forceLogin = false) {
    if (!container) return;
    
    container.classList.add('animating');

    if (signupMessage) signupMessage.innerHTML = '';
    if (loginMessage) loginMessage.innerHTML = '';

    if (!isLoginMode || forceLogin) {
        if (slidingPanel) slidingPanel.classList.add('move-right');
        setTimeout(() => {
            if (panelTitle) panelTitle.innerHTML = 'Não tem uma conta? <br>Cadastre-se agora!';
            if (switchButton) switchButton.textContent = 'Crie uma conta!';
        }, 500);
        isLoginMode = true;
    } else {
        if (slidingPanel) slidingPanel.classList.remove('move-right');
        setTimeout(() => {
            if (panelTitle) panelTitle.innerHTML = 'Já possui uma<br>conta?';
            if (switchButton) switchButton.textContent = 'Entre em uma conta existente!';
        }, 500);
        isLoginMode = false;
    }

    setTimeout(() => {
        container.classList.remove('animating');
    }, 1000);
}

function redirectToHome() {
    window.location.href = "../cDashBoard/aInicio/Inicio.html";
}

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

    initEmailPhoneField();
    initPhoneFieldSignup();

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
if (switchButton) {
    switchButton.addEventListener('click', () => {
        toggleForms();
    });
}

// ==== CADASTRO ====
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome')?.value.trim() || '';
        const email = document.getElementById('email-signup')?.value.trim().toLowerCase() || '';
        const telefone = document.getElementById('telefone-signup')?.value.trim() || '';
        const senha = document.getElementById('senha-signup')?.value || '';
        const confirmarSenha = document.getElementById('confirmar-senha')?.value || '';

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
        if (!telefone) {
            showMessage('signupMessage', 'Por favor, digite seu telefone.', 'error');
            return;
        }
        if (!isValidPhone(telefone)) {
            showMessage('signupMessage', 'Por favor, insira um telefone válido (10-11 dígitos).', 'error');
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

        const phoneClean = telefone.replace(/\D/g, '');
        for (const userEmail in users) {
            const user = users[userEmail];
            if (user.telefone && user.telefone.replace(/\D/g, '') === phoneClean) {
                showMessage('signupMessage', 'Este telefone já está cadastrado.', 'error');
                return;
            }
        }

        const newUser = {
            nome,
            email,
            telefone: phoneClean,
            senha,
            dataCadastro: new Date().toISOString()
        };

        users[email] = newUser;
        saveUsersToStorage(users);

        showMessage('signupMessage', 'Cadastro realizado com sucesso! Agora faça login.', 'success');
        
        clearForms();
        setTimeout(() => {
            toggleForms(true);
        }, 1500);
    });
}

// ==== LOGIN ====
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const loginInputValue = document.getElementById('email-login')?.value.trim() || '';
        const senha = document.getElementById('senha-login')?.value || '';

        const validation = validateEmailPhoneField('email-login');
        if (!validation.valid) {
            showMessage('loginMessage', validation.message, 'error');
            return;
        }

        const users = getUsersFromStorage();
        let foundUser = null;

        if (validation.type === 'email') {
            const email = validation.value.toLowerCase();
            foundUser = users[email] || null;
        } else if (validation.type === 'phone') {
            const phone = validation.value;
            for (const userEmail in users) {
                const user = users[userEmail];
                if (user.telefone && user.telefone.replace(/\D/g, '') === phone) {
                    foundUser = user;
                    break;
                }
            }
        }

        if (!foundUser) {
            showMessage('loginMessage', 'Usuário não encontrado.', 'error');
            return;
        }

        if (foundUser.senha !== senha) {
            showMessage('loginMessage', 'Senha incorreta.', 'error');
            return;
        }
        
        currentUser = foundUser;
        saveCurrentUser(currentUser);
        redirectToHome();
    });
}