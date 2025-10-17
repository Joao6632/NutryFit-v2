document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');

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

    // Navegação entre páginas
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const url = this.getAttribute('href');

            if (url.startsWith('#')) {
                e.preventDefault();
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            } else {
                localStorage.setItem(
                    'sidebarState',
                    sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded'
                );
                window.location.href = url;
            }
        });
    });

    // Logout functionality
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

    // Máscara para telefone
    const formatPhone = (value) => {
        const numbers = value.replace(/\D/g, '');
        
        if (numbers.length <= 11) {
            return numbers
                .replace(/^(\d{0,2})/, '($1')
                .replace(/^(\(\d{2})(\d{0,5})/, '$1) $2')
                .replace(/(\d{5})(\d{0,4})/, '$1-$2');
        }
        return value;
    };

    // Aplicar máscara no campo de alterar telefone
    const novoTelefoneInput = document.getElementById('novoTelefone');
    if (novoTelefoneInput) {
        novoTelefoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    }

    // Função para carregar e exibir dados do perfil
    const loadAndDisplayProfileData = () => {
        try {
            const currentUser = localStorage.getItem("nutryfit_current_user");
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                
                // Exibir dados nas seções de visualização (partes azuis)
                const displayNome = document.getElementById('displayNomeCompleto');
                const displayTelefone = document.getElementById('displayTelefone');
                const displayEmail = document.getElementById('displayEmailProfissional');

                if (displayNome && userData.nome) {
                    displayNome.querySelector('.display-text').textContent = userData.nome;
                }

                if (displayTelefone && userData.telefone) {
                    displayTelefone.querySelector('.display-text').textContent = formatPhone(userData.telefone);
                }

                if (displayEmail && userData.email) {
                    displayEmail.querySelector('.display-text').textContent = userData.email;
                }

                // Carregar configurações salvas se existirem
                const savedConfig = localStorage.getItem("nutryfit_profile_config");
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    if (config.infoRodape) {
                        const infoRodapeField = document.getElementById('infoRodape');
                        if (infoRodapeField) infoRodapeField.value = config.infoRodape;
                    }
                    if (config.usarLogo !== undefined) {
                        const usarLogoField = document.getElementById('usarLogo');
                        if (usarLogoField) usarLogoField.checked = config.usarLogo;
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
        }
    };

    // Função para salvar configurações de rodapé
    const saveProfileConfig = () => {
        try {
            const infoRodapeField = document.getElementById('infoRodape');
            const usarLogoField = document.getElementById('usarLogo');

            const config = {
                infoRodape: infoRodapeField ? infoRodapeField.value : '',
                usarLogo: usarLogoField ? usarLogoField.checked : false,
                dataSalvo: new Date().toISOString()
            };
            localStorage.setItem("nutryfit_profile_config", JSON.stringify(config));
            return true;
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            return false;
        }
    };

    // Função para atualizar dados do usuário no localStorage
    const updateUserInStorage = (updatedData) => {
        try {
            const currentUser = localStorage.getItem("nutryfit_current_user");
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                const newUserData = { ...userData, ...updatedData };
                localStorage.setItem("nutryfit_current_user", JSON.stringify(newUserData));
                
                // Também atualizar na lista de usuários
                const users = JSON.parse(localStorage.getItem("nutryfit_users") || "{}");
                if (users[userData.email]) {
                    // Se o email mudou, precisamos criar nova entrada e remover a antiga
                    if (updatedData.email && updatedData.email !== userData.email) {
                        users[updatedData.email] = newUserData;
                        delete users[userData.email];
                    } else {
                        users[userData.email] = newUserData;
                    }
                    localStorage.setItem("nutryfit_users", JSON.stringify(users));
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("Erro ao atualizar dados do usuário:", error);
            return false;
        }
    };

    // Botão Alterar informações
    const btnAlterar = document.getElementById('btnAlterar');
    if (btnAlterar) {
        btnAlterar.addEventListener('click', () => {
            const novoNome = document.getElementById('novoNome')?.value.trim();
            const novoTelefone = document.getElementById('novoTelefone')?.value.trim();
            const novoEmail = document.getElementById('novoEmail')?.value.trim();
            const novaSenha = document.getElementById('novaSenha')?.value.trim();
            const senhaAtual = document.getElementById('senhaAtual')?.value.trim();

            // Verificar se pelo menos um campo foi preenchido
            if (!novoNome && !novoTelefone && !novoEmail && !novaSenha) {
                alert('Por favor, preencha pelo menos um campo que deseja alterar.');
                return;
            }

            // Se tem alterações que precisam de confirmação, exige senha atual
            if ((novoEmail || novaSenha) && !senhaAtual) {
                alert('Por favor, confirme sua senha atual para alterar email ou senha.');
                return;
            }

            try {
                const currentUser = JSON.parse(localStorage.getItem("nutryfit_current_user") || "{}");
                
                // Verificar senha atual se foi fornecida
                if (senhaAtual && currentUser.senha && currentUser.senha !== senhaAtual) {
                    alert('Senha atual incorreta.');
                    return;
                }

                // Preparar dados para atualização
                const updateData = {};
                let hasChanges = false;

                if (novoNome && novoNome !== currentUser.nome) {
                    updateData.nome = novoNome;
                    hasChanges = true;
                }

                if (novoTelefone) {
                    const telefoneLimpo = novoTelefone.replace(/\D/g, '');
                    if (telefoneLimpo !== currentUser.telefone) {
                        updateData.telefone = telefoneLimpo;
                        hasChanges = true;
                    }
                }

                if (novoEmail && novoEmail !== currentUser.email) {
                    updateData.email = novoEmail.toLowerCase();
                    hasChanges = true;
                }

                if (novaSenha) {
                    updateData.senha = novaSenha;
                    hasChanges = true;
                }

                if (hasChanges) {
                    if (updateUserInStorage(updateData)) {
                        alert('Informações alteradas com sucesso!');
                        
                        // Limpar campos
                        if (document.getElementById('novoNome')) document.getElementById('novoNome').value = '';
                        if (document.getElementById('novoTelefone')) document.getElementById('novoTelefone').value = '';
                        if (document.getElementById('novoEmail')) document.getElementById('novoEmail').value = '';
                        if (document.getElementById('novaSenha')) document.getElementById('novaSenha').value = '';
                        if (document.getElementById('senhaAtual')) document.getElementById('senhaAtual').value = '';
                        
                        // Recarregar dados na tela
                        loadAndDisplayProfileData();
                    } else {
                        alert('Erro ao alterar informações. Tente novamente.');
                    }
                } else {
                    alert('Nenhuma alteração foi detectada.');
                }

            } catch (error) {
                console.error("Erro ao alterar informações:", error);
                alert('Erro ao alterar informações. Tente novamente.');
            }
        });
    }

    // Botão Salvar alterações (configurações de rodapé)
    const btnSalvarAlteracoes = document.getElementById('btnSalvarAlteracoes');
    if (btnSalvarAlteracoes) {
        btnSalvarAlteracoes.addEventListener('click', () => {
            if (saveProfileConfig()) {
                alert('Configurações salvas com sucesso!');
            } else {
                alert('Erro ao salvar configurações. Tente novamente.');
            }
        });
    }

    // Inicializar dados do perfil
    loadAndDisplayProfileData();
});