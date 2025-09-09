const container = document.getElementById('container');
        const slidingPanel = document.getElementById('slidingPanel');
        const switchButton = document.getElementById('switchButton');
        const panelTitle = document.getElementById('panelTitle');
        const panelContent = document.getElementById('panelContent');
        
        let isLoginMode = false;

        switchButton.addEventListener('click', () => {
            // Adiciona classe de animação
            container.classList.add('animating');
            
            if (!isLoginMode) {
                // Vai para modo login - painel desliza para direita
                slidingPanel.classList.add('move-right');
                
                // Após um pequeno delay, muda o conteúdo do painel
                setTimeout(() => {
                    panelTitle.innerHTML = 'Não tem uma conta? <br>Cadastre-se agora!';
                    switchButton.textContent = 'Crie uma conta!';
                }, 500);
                
                isLoginMode = true;
            } else {
                // Volta para modo cadastro - painel desliza para esquerda
                slidingPanel.classList.remove('move-right');
                
                // Após um pequeno delay, muda o conteúdo do painel
                setTimeout(() => {
                    panelTitle.innerHTML = 'Já possui uma<br>conta?';
                    switchButton.textContent = 'Entre em uma conta existente!';
                }, 500);
                
                isLoginMode = false;
            }
            
            // Remove classe de animação após a transição
            setTimeout(() => {
                container.classList.remove('animating');
            }, 1000);
        });

        // Elementos do DOM

const authContainer = document.getElementById('authContainer');
const homePage = document.getElementById('homePage');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutButton = document.getElementById('logoutButton');

// Formulários
const signupForm = document.getElementById('signupFormElement');
const loginForm = document.getElementById('loginFormElement');
const signupMessage = document.getElementById('signupMessage');
const loginMessage = document.getElementById('loginMessage');

// Controle de estado
let users = {}; // Armazena usuários cadastrados em memória
let currentUser = null;

// Função para exibir mensagens
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para limpar formulários
function clearForms() {
    signupForm.reset();
    loginForm.reset();
    signupMessage.innerHTML = '';
    loginMessage.innerHTML = '';
}

// Função para alternar entre login e cadastro
switchButton.addEventListener('click', () => {
    container.classList.add('animating');
    
    // Limpar mensagens
    signupMessage.innerHTML = '';
    loginMessage.innerHTML = '';
    
    if (!isLoginMode) {
        // Vai para modo login - painel desliza para direita
        slidingPanel.classList.add('move-right');
        
        // Após um pequeno delay, muda o conteúdo do painel
        setTimeout(() => {
            panelTitle.innerHTML = 'Não tem uma conta? <br>Cadastre-se agora!';
            switchButton.textContent = 'Crie uma conta!';
        }, 500);
        
        isLoginMode = true;
    } else {
        // Volta para modo cadastro - painel desliza para esquerda
        slidingPanel.classList.remove('move-right');
        
        // Após um pequeno delay, muda o conteúdo do painel
        setTimeout(() => {
            panelTitle.innerHTML = 'Já possui uma<br>conta?';
            switchButton.textContent = 'Entre em uma conta existente!';
        }, 500);
        
        isLoginMode = false;
    }
    
    // Remove classe de animação após a transição
    setTimeout(() => {
        container.classList.remove('animating');
    }, 1000);
});

// Processamento do cadastro
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email-signup').value.trim().toLowerCase();
    const senha = document.getElementById('senha-signup').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    
    // Validações
    if (!nome) {
        showMessage('signupMessage', 'Por favor, digite seu nome.', 'error');
        return;
    }
    
    if (nome.length < 2) {
        showMessage('signupMessage', 'Nome deve ter pelo menos 2 caracteres.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('signupMessage', 'Por favor, digite um email válido.', 'error');
        return;
    }
    
    if (senha.length < 6) {
        showMessage('signupMessage', 'A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (senha !== confirmarSenha) {
        showMessage('signupMessage', 'As senhas não coincidem.', 'error');
        return;
    }
    
    // Verificar se o email já existe
    if (users[email]) {
        showMessage('signupMessage', 'Este email já está cadastrado.', 'error');
        return;
    }
    
    // Cadastrar usuário
    users[email] = {
        nome: nome,
        email: email,
        senha: senha
    };
    
    console.log('Usuário cadastrado:', users[email]); // Para debug
    
    showMessage('signupMessage', 'Cadastro realizado com sucesso! Agora você pode fazer login.', 'success');
    
    // Limpar formulário de cadastro
    signupForm.reset();
    
    // Após 2 segundos, mover automaticamente para o login
    setTimeout(() => {
        if (!isLoginMode) {
            switchButton.click(); // Simula clique no botão para ir para login
        }
    }, 2000);
});

// Processamento do login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email-login').value.trim().toLowerCase();
    const senha = document.getElementById('senha-login').value;
    
    // Validações básicas
    if (!email || !senha) {
        showMessage('loginMessage', 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('loginMessage', 'Por favor, digite um email válido.', 'error');
        return;
    }
    
    // Verificar credenciais
    const user = users[email];
    
    if (!user) {
        showMessage('loginMessage', 'Email não encontrado. Verifique suas credenciais ou cadastre-se.', 'error');
        return;
    }
    
    if (user.senha !== senha) {
        showMessage('loginMessage', 'Senha incorreta. Tente novamente.', 'error');
        return;
    }
    
    // Login bem-sucedido
    currentUser = user;
    showMessage('loginMessage', 'Login realizado com sucesso! Redirecionando...', 'success');
    
    console.log('Login bem-sucedido:', currentUser); // Para debug
    
    // Redirecionar para a página inicial após 1.5 segundos
    setTimeout(() => {
        redirectToHome();
    }, 1500);
});

// Função para redirecionar para a página inicial
function redirectToHome() {
    authContainer.style.display = 'none';
    homePage.classList.add('active');
    welcomeMessage.textContent = `Olá, ${currentUser.nome}! Sua jornada fitness começa agora.`;
    
    // Limpar formulários
    clearForms();
}

// Função de logout
logoutButton.addEventListener('click', () => {
    currentUser = null;
    homePage.classList.remove('active');
    authContainer.style.display = 'block';
    
    // Resetar para modo cadastro
    if (isLoginMode) {
        switchButton.click();
    }
    
    // Limpar formulários
    clearForms();
    
    console.log('Logout realizado'); // Para debug
});

// Função para debug - mostrar usuários cadastrados (pode remover em produção)
function mostrarUsuarios() {
    console.log('Usuários cadastrados:', users);
}

// Adicionar alguns usuários de teste (opcional - pode remover)
// users['teste@teste.com'] = {
//     nome: 'Usuário Teste',
//     email: 'teste@teste.com',
//     senha: '123456'
// };

// Event listeners adicionais para melhor UX
document.addEventListener('DOMContentLoaded', () => {
    // Focar no primeiro campo quando a página carregar
    document.getElementById('nome').focus();
    
    // Permitir Enter para alternar entre campos
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.type !== 'submit') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                }
            }
        });
    });
});

// Função para verificar se há usuários cadastrados (útil para debug)
function temUsuarios() {
    return Object.keys(users).length > 0;
}
        