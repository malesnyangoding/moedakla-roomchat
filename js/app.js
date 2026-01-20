// Main Application Logic

// Config - Ganti nomor WhatsApp di sini
const WHATSAPP_NUMBER = '6281234567890'; // Ganti dengan nomor WA yang dituju (format: 62xxx)

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
            
            // Prevent clicking the same tab
            if (currentTab === tabType) return;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Move slider with smooth animation
            if (tabType === 'register') {
                tabSlider.style.transform = 'translateX(calc(100% + 5px))';
            } else {
                tabSlider.style.transform = 'translateX(0)';
            }

            // Switch forms with slide animation
            const currentForm = currentTab === 'login' ? loginForm : registerForm;
            const nextForm = tabType === 'login' ? loginForm : registerForm;

            // Slide out current form
            currentForm.style.transform = tabType === 'login' ? 'translateX(50px)' : 'translateX(-50px)';
            currentForm.style.opacity = '0';
            
            setTimeout(() => {
                currentForm.classList.remove('active');
                
                // Prepare next form position
                nextForm.style.transform = tabType === 'login' ? 'translateX(-50px)' : 'translateX(50px)';
                nextForm.classList.add('active');
                
                // Slide in next form
                setTimeout(() => {
                    nextForm.style.transform = 'translateX(0)';
                    nextForm.style.opacity = '1';
                }, 50);
            }, 200);

            currentTab = tabType;
        });
    });

    // Login Form Handler
    loginFormElement.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember').checked;

        // Validasi
        if (!username || !password) {
            alert('Username dan Password harus diisi!');
            return;
        }

        // Simpan ke localStorage jika "Ingat Saya" dicentang
        if (rememberMe) {
            saveToLocalStorage('rememberedUser', {
                username: username,
                timestamp: new Date().getTime()
            });
        } else {
            removeFromLocalStorage('rememberedUser');
        }

        // TODO: Nanti ini bisa diintegrasikan dengan backend/database
        console.log('Login attempt:', { username, rememberMe });
        
        // Save current user session
        saveToLocalStorage('currentUser', {
            username: username,
            kelas: 'XII' // Nanti diambil dari database
        });
        
        // Save login time for 24-hour session
        saveToLocalStorage('loginTime', new Date().getTime());
        
        // Redirect ke chat.html
        window.location.href = 'chat.html';
    });

    // Register Form Handler
    registerFormElement.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const kelas = document.getElementById('register-kelas').value;

        // Validasi
        if (!username) {
            alert('Nama asli harus diisi!');
            return;
        }

        if (!kelas) {
            alert('Pilih kelas terlebih dahulu!');
            return;
        }

        // Kirim ke WhatsApp
        sendToWhatsApp(username, kelas, WHATSAPP_NUMBER);
        
        // Reset form
        registerFormElement.reset();
    });

    // Check if user wants to be remembered
    const rememberedUser = getFromLocalStorage('rememberedUser');
    if (rememberedUser) {
        // Auto-fill username
        document.getElementById('login-username').value = rememberedUser.username;
        document.getElementById('remember').checked = true;
    }

    // Prevent placeholder label overlap on autofill
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        // Check if input has value on load (autofill)
        if (input.value !== '') {
            input.classList.add('has-value');
        }

        // Add class when input has value
        input.addEventListener('input', () => {
            if (input.value !== '') {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
});