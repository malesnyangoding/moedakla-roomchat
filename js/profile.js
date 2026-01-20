// Profile Page Logic

let cropImage = null;
let cropCanvas = null;
let cropCtx = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let imagePos = { x: 0, y: 0 };
let imageScale = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const userData = getFromLocalStorage('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize page
    initializeProfile(userData);
    
    // Event listeners
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('profileForm').addEventListener('submit', handleSaveProfile);
    document.getElementById('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
    
    // Avatar edit
    document.getElementById('avatarEditBtn').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    
    document.getElementById('avatarInput').addEventListener('change', handleAvatarChange);
    document.getElementById('cropCancelBtn').addEventListener('click', closeCropModal);
    document.getElementById('cropSaveBtn').addEventListener('click', saveCroppedAvatar);
    
    // Password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const svg = this.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                input.type = 'password';
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });
    
    // Password strength checker
    document.getElementById('newPassword').addEventListener('input', checkPasswordStrength);
});

function initializeProfile(userData) {
    // Set profile data
    const initial = userData.username.charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
    document.getElementById('profileClass').textContent = `Kelas ${userData.kelas || 'XII'}`;
    document.getElementById('username').value = userData.username;
    
    // Load saved avatar if exists
    if (userData.avatar) {
        const avatarImg = document.getElementById('avatarImage');
        const avatarInitial = document.getElementById('profileInitial');
        avatarImg.src = userData.avatar;
        avatarImg.style.display = 'block';
        avatarInitial.style.display = 'none';
    }
    
    // Set member since (simulated)
    const memberSince = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    document.getElementById('memberSince').textContent = memberSince;
    
    // Set total messages (from all rooms)
    let totalMessages = 0;
    const rooms = ['all-class', 'kelas-x', 'kelas-xi', 'kelas-xii'];
    rooms.forEach(room => {
        const messages = getFromLocalStorage(`messages_${room}`) || [];
        totalMessages += messages.filter(msg => msg.isOwn).length;
    });
    document.getElementById('totalMessages').textContent = totalMessages;
}

function handleSaveProfile(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!username) {
        showNotification('Username tidak boleh kosong!', 'error');
        return;
    }
    
    if (!currentPassword) {
        showNotification('Password lama harus diisi!', 'error');
        return;
    }
    
    // Check if user wants to change password
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            showNotification('Password baru tidak cocok!', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Password baru minimal 6 karakter!', 'error');
            return;
        }
    }
    
    // Get current user data
    const userData = getFromLocalStorage('currentUser');
    
    // Update user data
    userData.username = username;
    if (newPassword) {
        userData.password = newPassword; // In real app, this should be hashed
    }
    
    // Save updated data
    saveToLocalStorage('currentUser', userData);
    
    // Update avatar initial
    const initial = username.charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
    
    // Show success notification
    showNotification('Perubahan berhasil disimpan!', 'success');
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordStrength').style.display = 'none';
}

function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthDiv = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
        strengthDiv.style.display = 'none';
        return;
    }
    
    strengthDiv.style.display = 'block';
    
    // Calculate strength
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Update UI
    strengthFill.className = 'strength-fill';
    
    if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
    } else if (strength <= 4) {
        strengthFill.classList.add('medium');
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }
}

function handleDeleteAccount() {
    const confirmDelete = confirm(
        '⚠️ PERHATIAN!\n\n' +
        'Menghapus akun akan:\n' +
        '- Menghapus semua data kamu\n' +
        '- Menghapus semua pesan kamu\n' +
        '- Tidak dapat dikembalikan\n\n' +
        'Yakin ingin menghapus akun?'
    );
    
    if (!confirmDelete) return;
    
    const doubleConfirm = prompt('Ketik "HAPUS AKUN" untuk konfirmasi (huruf besar):');
    
    if (doubleConfirm === 'HAPUS AKUN') {
        // Clear all user data
        removeFromLocalStorage('currentUser');
        removeFromLocalStorage('loginTime');
        removeFromLocalStorage('rememberedUser');
        
        // Clear all room messages
        const rooms = ['all-class', 'kelas-x', 'kelas-xi', 'kelas-xii'];
        rooms.forEach(room => {
            removeFromLocalStorage(`messages_${room}`);
            removeFromLocalStorage(`balance_${room}`);
        });
        
        showNotification('Akun berhasil dihapus!', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else {
        showNotification('Penghapusan akun dibatalkan', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationContent = notification.querySelector('.notification-content');
    
    notificationText.textContent = message;
    
    // Change color based on type
    if (type === 'error') {
        notificationContent.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        notificationContent.querySelector('svg').innerHTML = `
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        `;
    } else {
        notificationContent.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        notificationContent.querySelector('svg').innerHTML = `
            <polyline points="20 6 9 17 4 12"></polyline>
        `;
    }
    
    notification.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function goBack() {
    window.location.href = 'chat.html';
}

// Avatar handling functions
function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('File harus berupa gambar!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        cropImage = new Image();
        cropImage.onload = () => {
            showCropModal();
        };
        cropImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function showCropModal() {
    document.getElementById('cropModal').style.display = 'flex';
    cropCanvas = document.getElementById('cropCanvas');
    cropCtx = cropCanvas.getContext('2d');
    
    // Set canvas size
    const size = 300;
    cropCanvas.width = size;
    cropCanvas.height = size;
    
    // Calculate initial scale and position
    const scale = Math.max(size / cropImage.width, size / cropImage.height);
    imageScale = scale;
    imagePos = {
        x: (size - cropImage.width * scale) / 2,
        y: (size - cropImage.height * scale) / 2
    };
    
    drawCropCanvas();
    
    // Add drag listeners
    cropCanvas.addEventListener('mousedown', startDrag);
    cropCanvas.addEventListener('mousemove', drag);
    cropCanvas.addEventListener('mouseup', stopDrag);
    cropCanvas.addEventListener('wheel', zoom);
    
    // Touch support
    cropCanvas.addEventListener('touchstart', handleTouchStart);
    cropCanvas.addEventListener('touchmove', handleTouchMove);
    cropCanvas.addEventListener('touchend', stopDrag);
}

function drawCropCanvas() {
    cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.fillStyle = '#000';
    cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    
    cropCtx.save();
    cropCtx.drawImage(
        cropImage,
        imagePos.x,
        imagePos.y,
        cropImage.width * imageScale,
        cropImage.height * imageScale
    );
    cropCtx.restore();
    
    // Draw circular crop overlay
    cropCtx.save();
    cropCtx.globalCompositeOperation = 'destination-in';
    cropCtx.beginPath();
    cropCtx.arc(150, 150, 150, 0, Math.PI * 2);
    cropCtx.fill();
    cropCtx.restore();
}

function startDrag(e) {
    isDragging = true;
    const rect = cropCanvas.getBoundingClientRect();
    dragStart = {
        x: e.clientX - rect.left - imagePos.x,
        y: e.clientY - rect.top - imagePos.y
    };
}

function drag(e) {
    if (!isDragging) return;
    const rect = cropCanvas.getBoundingClientRect();
    imagePos = {
        x: e.clientX - rect.left - dragStart.x,
        y: e.clientY - rect.top - dragStart.y
    };
    drawCropCanvas();
}

function stopDrag() {
    isDragging = false;
}

function zoom(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    imageScale *= delta;
    imageScale = Math.max(0.5, Math.min(3, imageScale));
    drawCropCanvas();
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    const rect = cropCanvas.getBoundingClientRect();
    isDragging = true;
    dragStart = {
        x: touch.clientX - rect.left - imagePos.x,
        y: touch.clientY - rect.top - imagePos.y
    };
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = cropCanvas.getBoundingClientRect();
    imagePos = {
        x: touch.clientX - rect.left - dragStart.x,
        y: touch.clientY - rect.top - dragStart.y
    };
    drawCropCanvas();
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    document.getElementById('avatarInput').value = '';
}

function saveCroppedAvatar() {
    // Create final canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 120;
    finalCanvas.height = 120;
    const finalCtx = finalCanvas.getContext('2d');
    
    // Draw scaled version
    finalCtx.drawImage(cropCanvas, 0, 0, 300, 300, 0, 0, 120, 120);
    
    // Convert to data URL
    const avatarData = finalCanvas.toDataURL('image/jpeg', 0.9);
    
    // Update UI
    const avatarImg = document.getElementById('avatarImage');
    const avatarInitial = document.getElementById('profileInitial');
    avatarImg.src = avatarData;
    avatarImg.style.display = 'block';
    avatarInitial.style.display = 'none';
    
    // Save to userData
    const userData = getFromLocalStorage('currentUser');
    userData.avatar = avatarData;
    saveToLocalStorage('currentUser', userData);
    
    closeCropModal();
    showNotification('Foto profil berhasil diubah!', 'success');
}