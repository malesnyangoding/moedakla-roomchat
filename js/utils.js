// Utility Functions

// Generate random particles for background animation
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 2px and 8px
        const size = Math.random() * 6 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random horizontal position
        particle.style.left = `${Math.random() * 100}%`;
        
        // Random starting vertical position
        particle.style.bottom = `-${Math.random() * 20}px`;
        
        // Random animation delay
        particle.style.animationDelay = `${Math.random() * 15}s`;
        
        // Random animation duration
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Format WhatsApp message template
function formatWhatsAppMessage(username, kelas) {
    return `Halo, saya ingin mendaftar untuk Anonymous Chat.%0A%0ANama: ${encodeURIComponent(username)}%0AKelas: ${kelas}%0A%0AMohon bantuannya untuk proses pendaftaran. Terima kasih!`;
}

// Open WhatsApp with pre-filled message
function sendToWhatsApp(username, kelas, phoneNumber) {
    const message = formatWhatsAppMessage(username, kelas);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Validate form inputs
function validateInput(input) {
    if (input.value.trim() === '') {
        return false;
    }
    return true;
}

// Show notification (bisa dipake nanti untuk feedback)
function showNotification(message, type = 'info') {
    // Simple console log for now, bisa diganti dengan toast notification
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Save to localStorage (untuk "Ingat Saya")
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

// Get from localStorage
function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
    }
}

// Remove from localStorage
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
});