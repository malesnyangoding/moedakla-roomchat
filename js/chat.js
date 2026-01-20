// Chat Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkLoginStatus();

    // Get user data from localStorage
    const userData = getFromLocalStorage('currentUser');
    
    if (userData) {
        // Display user info
        const userInitial = userData.username.charAt(0).toUpperCase();
        document.getElementById('user-initial').textContent = userInitial;
        document.getElementById('username').textContent = userData.username;
        document.getElementById('user-class').textContent = `Kelas ${userData.kelas || 'XII'}`;
    }

    // Room cards click handler
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            const roomType = card.getAttribute('data-room');
            enterRoom(roomType);
        });

        // Add hover sound effect simulation (optional)
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        });
    });

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        handleLogout();
    });

    // Profile button handler
    const profileBtn = document.getElementById('profileBtn');
    profileBtn.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });

    // Update online counts (simulasi - nanti bisa integrasiin dengan real data)
    updateOnlineCounts();
    
    // Update online counts every 10 seconds
    setInterval(updateOnlineCounts, 10000);
});

// Check login status - redirect if not logged in
function checkLoginStatus() {
    const loginTime = getFromLocalStorage('loginTime');
    const currentUser = getFromLocalStorage('currentUser');
    
    if (!loginTime || !currentUser) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return;
    }

    // Check if 24 hours have passed
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - loginTime;
    const hoursPassed = timeDiff / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
        // Session expired, logout
        handleLogout();
    }
}

// Enter room - navigate to chat room page
function enterRoom(roomType) {
    // Save selected room to localStorage
    saveToLocalStorage('selectedRoom', roomType);
    
    // Add animation before redirect
    const roomCard = document.querySelector(`[data-room="${roomType}"]`);
    roomCard.style.transform = 'scale(0.95)';
    roomCard.style.opacity = '0.7';
    
    setTimeout(() => {
        // Redirect to room page with URL parameter
        window.location.href = `room.html?room=${roomType}`;
    }, 300);
}

// Format room name for display
function formatRoomName(roomType) {
    const roomNames = {
        'all-class': 'All Class',
        'kelas-x': 'Kelas X',
        'kelas-xi': 'Kelas XI',
        'kelas-xii': 'Kelas XII'
    };
    return roomNames[roomType] || roomType;
}

// Handle logout
function handleLogout() {
    const confirmLogout = confirm('Yakin mau logout?');
    
    if (confirmLogout) {
        // Clear user session (tapi tetap simpan "remember me" jika ada)
        const rememberedUser = getFromLocalStorage('rememberedUser');
        
        removeFromLocalStorage('currentUser');
        removeFromLocalStorage('loginTime');
        removeFromLocalStorage('selectedRoom');
        
        // Keep remembered user if exists
        if (rememberedUser) {
            saveToLocalStorage('rememberedUser', rememberedUser);
        }
        
        // Redirect to login page with animation
        document.querySelector('.room-container').style.transform = 'scale(0.8)';
        document.querySelector('.room-container').style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 400);
    }
}

// Update online counts (simulasi - nanti ganti dengan real data dari database)
function updateOnlineCounts() {
    // Simulasi random online count
    const allOnline = Math.floor(Math.random() * 10) + 20; // 20-30
    const xOnline = Math.floor(Math.random() * 5) + 5; // 5-10
    const xiOnline = Math.floor(Math.random() * 5) + 10; // 10-15
    const xiiOnline = Math.floor(Math.random() * 5) + 12; // 12-17

    // Update DOM
    const allOnlineEl = document.getElementById('all-online');
    const xOnlineEl = document.getElementById('x-online');
    const xiOnlineEl = document.getElementById('xi-online');
    const xiiOnlineEl = document.getElementById('xii-online');

    if (allOnlineEl) animateCount(allOnlineEl, allOnline);
    if (xOnlineEl) animateCount(xOnlineEl, xOnline);
    if (xiOnlineEl) animateCount(xiOnlineEl, xiOnline);
    if (xiiOnlineEl) animateCount(xiiOnlineEl, xiiOnline);
}

// Animate number count
function animateCount(element, targetCount) {
    const currentCount = parseInt(element.textContent) || 0;
    const increment = targetCount > currentCount ? 1 : -1;
    const duration = 500; // ms
    const steps = Math.abs(targetCount - currentCount);
    const stepDuration = steps > 0 ? duration / steps : 0;

    let current = currentCount;
    
    const counter = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === targetCount) {
            clearInterval(counter);
        }
    }, stepDuration);
}