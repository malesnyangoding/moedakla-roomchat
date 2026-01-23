// Main Application Logic

// Config - Ganti nomor WhatsApp di sini
const WHATSAPP_NUMBER = '6285727942871'; // Ganti dengan nomor WA yang dituju (format: 62xxx)

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabs = document.querySelectorAll('.tab');
    const tabSlider = document.querySelector('.tab-slider');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFormElement = document.getElementById('loginForm');
    const registerFormElement = document.getElementById('registerForm');

    let currentTab = 'login';

    // Tab Switching Logic
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabType = tab.getAttribute('data-tab');
            
            if (currentTab === tabType) return;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tabType === 'register') {
                tabSlider.style.transform = 'translateX(calc(100% + 5px))';
            } else {
                tabSlider.style.transform = 'translateX(0)';
            }

            const currentForm = currentTab === 'login' ? loginForm : registerForm;
            const nextForm = tabType === 'login' ? loginForm : registerForm;

            currentForm.style.transform = tabType === 'login' ? 'translateX(50px)' : 'translateX(-50px)';
            currentForm.style.opacity = '0';
            
            setTimeout(() => {
                currentForm.classList.remove('active');
                nextForm.style.transform = tabType === 'login' ? 'translateX(-50px)' : 'translateX(50px)';
                nextForm.classList.add('active');
                
                setTimeout(() => {
                    nextForm.style.transform = 'translateX(0)';
                    nextForm.style.opacity = '1';
                }, 50);
            }, 200);

            currentTab = tabType;
        });
    });

    // Login Form Handler - CONNECT TO API
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember').checked;

        if (!username || !password) {
            alert('Username dan Password harus diisi!');
            return;
        }

        // Show loading
        const submitBtn = loginFormElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Loading...';
        submitBtn.disabled = true;

        try {
            // Call Login API
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Save token & user data
                localStorage.setItem('authToken', data.token);
                saveToLocalStorage('currentUser', data.user);
                saveToLocalStorage('loginTime', new Date().getTime());
                
                if (rememberMe) {
                    saveToLocalStorage('rememberedUser', {
                        username: username,
                        timestamp: new Date().getTime()
                    });
                } else {
                    removeFromLocalStorage('rememberedUser');
                }

                // Redirect
                window.location.href = 'chat.html';
            } else {
                alert(data.error || 'Login gagal! Username atau password salah.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Gagal connect ke server. Cek koneksi internet atau hubungi admin.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Register Form Handler
    registerFormElement.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const kelas = document.getElementById('register-kelas').value;

        if (!username) {
            alert('Nama asli harus diisi!');
            return;
        }

        if (!kelas) {
            alert('Pilih kelas terlebih dahulu!');
            return;
        }

        sendToWhatsApp(username, kelas, WHATSAPP_NUMBER);
        registerFormElement.reset();
    });

    // Check if user wants to be remembered
    const rememberedUser = getFromLocalStorage('rememberedUser');
    if (rememberedUser) {
        document.getElementById('login-username').value = rememberedUser.username;
        document.getElementById('remember').checked = true;
    }

    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        if (input.value !== '') {
            input.classList.add('has-value');
        }

        input.addEventListener('input', () => {
            if (input.value !== '') {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
});

