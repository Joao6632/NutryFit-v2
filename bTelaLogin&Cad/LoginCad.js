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

// ==== FUNÇÕES EMAIL/TELEFONE ====
// Função para aplicar máscara de telefone
function applyPhoneMask(value) {
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }
    
    return value;
}

// Função para detectar se é email ou telefone (CORRIGIDA)
function detectInputType(value) {
    // Remove espaços
    value = value.trim();
    
    // Se contém @, é email (PRIORIDADE MÁXIMA)
    if (value.includes('@')) {
        return 'email';
    }
    
    // Remove todos os caracteres não numéricos para verificar se restam apenas números
    const numbersOnly = value.replace(/\D/g, '');
    
    // Se o valor original só contém números, parênteses, espaços e hífen E tem números suficientes, é telefone
    const phoneRegex = /^[\d\s\(\)\-]+$/;
    if (phoneRegex.test(value) && numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        return 'phone';
    }
    
    // Se é só números (sem formatação) e tem tamanho de telefone, é telefone
    if (/^\d+$/.test(value) && numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        return 'phone';
    }
    
    return 'unknown';
}

// Função para validar telefone
function isValidPhone(phone) {
    // Remove caracteres não numéricos para validação
    const numbersOnly = phone.replace(/\D/g, '');
    // Telefone brasileiro deve ter 10 ou 11 dígitos
    return numbersOnly.length === 10 || numbersOnly.length === 11;
}

// Função auxiliar para obter o valor limpo (sem máscara)
function getCleanValue(inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    const type = detectInputType(value);
    
    if (type === 'phone') {
        // Remove a máscara do telefone
        return value.replace(/\D/g, '');
    }
    
    return value;
}

// Função auxiliar para validar o campo antes do envio (CORRIGIDA)
function validateEmailPhoneField(inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    
    if (value === '') {
        return { valid: false, message: 'Campo obrigatório' };
    }
    
    // Se contém @, trata como email
    if (value.includes('@')) {
        const valid = isValidEmail(value);
        return { 
            valid, 
            type: 'email', 
            value,
            message: valid ? 'Email válido' : 'Email inválido' 
        };
    }
    
    // Se não contém @, verifica se pode ser um telefone válido
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length >= 10 && numbersOnly.length <= 11) {
        const valid = isValidPhone(value);
        return { 
            valid, 
            type: 'phone', 
            value: numbersOnly, // Retorna apenas números
            message: valid ? 'Telefone válido' : 'Telefone inválido' 
        };
    }
    
    // Se não é nem email nem telefone válido
    return { valid: false, message: 'Digite um email válido ou telefone com 10-11 dígitos' };
}

// Inicialização do campo email/telefone (LOGIN) - CORRIGIDA
function initEmailPhoneField() {
    const input = document.getElementById('email-login');
    if (!input) return;
    
    let lastValue = '';
    let inputType = 'unknown';
    
    input.addEventListener('input', function(e) {
        let currentValue = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        // Detecta o tipo de input
        const newInputType = detectInputType(currentValue);
        
        // Se mudou de telefone para email, remove a máscara
        if (inputType === 'phone' && newInputType === 'email') {
            currentValue = currentValue.replace(/[\(\)\s\-]/g, '');
            e.target.value = currentValue;
        }
        
        inputType = newInputType;
        
        // Aplica máscara APENAS para telefone (não para email)
        if (inputType === 'phone') {
            const maskedValue = applyPhoneMask(currentValue);
            
            // Sempre atualiza o valor com a máscara
            if (e.target.value !== maskedValue) {
                e.target.value = maskedValue;
                
                // Calcula nova posição do cursor
                let newCursorPosition = cursorPosition;
                
                // Se o valor ficou menor (removeu caracteres extras)
                if (maskedValue.length < currentValue.length) {
                    newCursorPosition = maskedValue.length;
                } else {
                    // Ajusta o cursor baseado na diferença de tamanho
                    newCursorPosition = cursorPosition + (maskedValue.length - currentValue.length);
                }
                
                // Garante que o cursor não passe do fim
                if (newCursorPosition > maskedValue.length) {
                    newCursorPosition = maskedValue.length;
                }
                
                // Define a nova posição do cursor
                setTimeout(() => {
                    e.target.setSelectionRange(newCursorPosition, newCursorPosition);
                }, 0);
            }
        }
        
        lastValue = e.target.value;
    });
    
    // Previne que o usuário digite mais caracteres quando já atingiu o limite (APENAS PARA TELEFONE)
    input.addEventListener('keydown', function(e) {
        const currentValue = e.target.value;
        
        // Só aplica limite se for telefone (não contém @)
        if (!currentValue.includes('@')) {
            const inputType = detectInputType(currentValue);
            
            if (inputType === 'phone') {
                const numbersOnly = currentValue.replace(/\D/g, '');
                
                // Se já tem 11 números e está tentando digitar mais números
                if (numbersOnly.length >= 11 && /\d/.test(e.key) && 
                    e.target.selectionStart === e.target.selectionEnd) {
                    e.preventDefault();
                }
            }
        }
    });
    
    // Remove classes de validação quando o usuário começa a digitar
    input.addEventListener('focus', function(e) {
        e.target.classList.remove('valid', 'invalid');
    });
}

// Inicialização do campo telefone no CADASTRO
function initPhoneFieldSignup() {
    const input = document.getElementById('telefone-signup');
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let currentValue = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        // Aplica a máscara de telefone
        const maskedValue = applyPhoneMask(currentValue);
        
        // Atualiza o valor com a máscara
        if (e.target.value !== maskedValue) {
            e.target.value = maskedValue;
            
            // Calcula nova posição do cursor
            let newCursorPosition = cursorPosition;
            
            // Se o valor ficou menor (removeu caracteres extras)
            if (maskedValue.length < currentValue.length) {
                newCursorPosition = maskedValue.length;
            } else {
                // Ajusta o cursor baseado na diferença de tamanho
                newCursorPosition = cursorPosition + (maskedValue.length - currentValue.length);
            }
            
            // Garante que o cursor não passe do fim
            if (newCursorPosition > maskedValue.length) {
                newCursorPosition = maskedValue.length;
            }
            
            // Define a nova posição do cursor
            setTimeout(() => {
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            }, 0);
        }
    });
    
    // Previne que o usuário digite mais caracteres quando já atingiu o limite
    input.addEventListener('keydown', function(e) {
        const currentValue = e.target.value;
        const numbersOnly = currentValue.replace(/\D/g, '');
        
        // Se já tem 11 números e está tentando digitar mais números
        if (numbersOnly.length >= 11 && /\d/.test(e.key) && 
            e.target.selectionStart === e.target.selectionEnd) {
            e.preventDefault();
        }
    });
    
    // Remove classes de validação quando o usuário começa a digitar
    input.addEventListener('focus', function(e) {
        e.target.classList.remove('valid', 'invalid');
    });
}

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

    // Inicializa o campo email/telefone do LOGIN
    initEmailPhoneField();
    
    // Inicializa o campo telefone do CADASTRO
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
switchButton.addEventListener('click', () => toggleForms());

// ==== CADASTRO ====
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const sobrenome = document.getElementById('sobrenome').value.trim();
        const email = document.getElementById('email-signup').value.trim().toLowerCase();
        const telefone = document.getElementById('telefone-signup').value.trim();
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
        if (!sobrenome) {
            showMessage('signupMessage', 'Por favor, digite seu sobrenome.', 'error');
            return;
        }
        if (sobrenome.length < 2) {
            showMessage('signupMessage', 'Sobrenome deve ter pelo menos 2 caracteres.', 'error');
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
            showMessage('signupMessage', 'Por favor, insira um telefone válido.', 'error');
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
        
        // Verifica se email já existe
        if (users[email]) {
            showMessage('signupMessage', 'Este email já está cadastrado.', 'error');
            return;
        }

        // Verifica se telefone já existe
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
            sobrenome,
            email,
            telefone: phoneClean, // Salva só números
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

        const loginInputValue = document.getElementById('email-login').value.trim();
        const senha = document.getElementById('senha-login').value;

        // Valida o campo email/telefone
        const validation = validateEmailPhoneField('email-login');
        if (!validation.valid) {
            showMessage('loginMessage', validation.message, 'error');
            return;
        }

        const users = getUsersFromStorage();
        let foundUser = null;

        // Busca o usuário por email ou telefone
        if (validation.type === 'email') {
            // Busca por email (converte para lowercase)
            const email = validation.value.toLowerCase();
            foundUser = users[email] || null;
        } else if (validation.type === 'phone') {
            // Busca por telefone (apenas números)
            const phone = validation.value;
            // Procura em todos os usuários qual tem esse telefone
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