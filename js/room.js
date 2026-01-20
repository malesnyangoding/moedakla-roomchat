// Room Chat Logic

let currentRoom = '';
let userClass = '';
let dailyBalance = 20;
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Get room from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentRoom = urlParams.get('room') || getFromLocalStorage('selectedRoom') || 'all-class';
    
    // Get user data
    const userData = getFromLocalStorage('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    userClass = userData.kelas || 'XII';
    
    // Initialize page
    initializePage();
    loadMessages();
    startOnlineCountUpdate();
    
    // Event listeners
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('infoBtn').addEventListener('click', showInfoModal);
    document.getElementById('closeInfoModal').addEventListener('click', hideInfoModal);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('input', updateCharCount);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('voiceBtn').addEventListener('click', toggleVoiceRecording);
    document.getElementById('voiceCancelBtn').addEventListener('click', cancelVoiceRecording);
    document.getElementById('voiceSendBtn').addEventListener('click', sendVoiceMessage);
    
    // Click outside modals to close
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target.id === 'infoModal') hideInfoModal();
    });
});

function initializePage() {
    // Set room name
    const roomNames = {
        'all-class': 'All Class',
        'kelas-x': 'Kelas X',
        'kelas-xi': 'Kelas XI',
        'kelas-xii': 'Kelas XII'
    };
    
    const roomName = roomNames[currentRoom] || 'Chat Room';
    document.getElementById('roomName').textContent = roomName;
    document.getElementById('modalRoomName').textContent = roomName;
    document.getElementById('modalUserClass').textContent = userClass;
    
    // Check if user is in their own class
    const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
    
    if (!isOwnClass) {
        // Show balance bar
        document.getElementById('balanceBar').style.display = 'block';
        document.getElementById('balanceInfo').style.display = 'flex';
        
        // Load balance from localStorage
        const savedBalance = getFromLocalStorage(`balance_${currentRoom}`);
        if (savedBalance) {
            dailyBalance = savedBalance.balance;
            const lastReset = savedBalance.lastReset;
            const now = new Date().getTime();
            const hoursPassed = (now - lastReset) / (1000 * 60 * 60);
            
            // Reset balance if 24 hours passed
            if (hoursPassed >= 24) {
                dailyBalance = 20;
                saveBalance();
            }
        }
        
        updateBalanceDisplay();
        startResetTimer();
    }
}

function loadMessages() {
    const container = document.getElementById('messagesContainer');
    
    // Load saved messages from localStorage
    const savedMessages = getFromLocalStorage(`messages_${currentRoom}`) || [];
    
    if (savedMessages.length === 0) {
        // Add welcome message
        addMessage('System', 'Welcome to the chat! Be respectful and have fun! 🎉', false, true);
    } else {
        savedMessages.forEach(msg => {
            addMessage(msg.username, msg.text, msg.isOwn, false, msg.isVoice, msg.duration);
        });
    }
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function addMessage(username, text, isOwn = false, save = true, isVoice = false, duration = '0:00') {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    const avatar = username === 'System' ? 'S' : 'A';
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    if (isVoice) {
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${username}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble voice">
                    <button class="voice-play-btn" onclick="playVoiceMessage(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </button>
                    <span class="voice-duration">${duration}</span>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${username}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">${text}</div>
            </div>
        `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // Save message with 100 message limit
    if (save && username !== 'System') {
        let messages = getFromLocalStorage(`messages_${currentRoom}`) || [];
        messages.push({
            username: isOwn ? 'You' : username,
            text,
            isOwn,
            isVoice,
            duration,
            timestamp: new Date().getTime()
        });
        
        // Keep only last 100 messages
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        saveToLocalStorage(`messages_${currentRoom}`, messages);
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Check balance
    const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
    if (!isOwnClass && dailyBalance <= 0) {
        alert('Balance habis! Tunggu reset besok atau chat di room kelas kamu.');
        return;
    }
    
    // Show typing indicator briefly
    showTypingIndicator();
    
    setTimeout(() => {
        hideTypingIndicator();
        addMessage('You', text, true);
        
        // Decrease balance if not in own class
        if (!isOwnClass) {
            dailyBalance--;
            updateBalanceDisplay();
            saveBalance();
        }
        
        // Simulate random response
        setTimeout(() => {
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                const responses = [
                    'Haha setuju banget!',
                    'Bener juga sih',
                    'Wah menarik tuh',
                    'Gw juga gitu kok',
                    'Thanks infonya!'
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage('Anonymous', randomResponse, false);
            }, 1000);
        }, 2000);
    }, 500);
    
    input.value = '';
    updateCharCount();
}

function toggleVoiceRecording() {
    const voiceBtn = document.getElementById('voiceBtn');
    
    if (!isRecording) {
        // Check balance
        const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
        if (!isOwnClass && dailyBalance <= 0) {
            alert('Balance habis! Tunggu reset besok atau chat di room kelas kamu.');
            return;
        }
        
        // Request microphone permission
        requestMicrophonePermission();
    } else {
        stopVoiceRecording();
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Permission granted, start recording
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        startVoiceRecording();
        
    } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('❌ Akses mikrofon ditolak!\n\nUntuk mengirim pesan suara, izinkan akses mikrofon di pengaturan browser kamu.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ Mikrofon tidak ditemukan!\n\nPastikan perangkat kamu memiliki mikrofon.');
        } else {
            alert('❌ Gagal mengakses mikrofon: ' + error.message);
        }
        console.error('Microphone error:', error);
    }
}

function startVoiceRecording() {
    isRecording = true;
    recordingSeconds = 0;
    
    document.getElementById('voiceBtn').classList.add('recording');
    document.getElementById('voiceModal').style.display = 'flex';
    
    // Start timer
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        document.getElementById('voiceTimer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Auto stop at 60 seconds
        if (recordingSeconds >= 60) {
            sendVoiceMessage();
        }
    }, 1000);
}

function stopVoiceRecording() {
    isRecording = false;
    clearInterval(recordingTimer);
    document.getElementById('voiceBtn').classList.remove('recording');
}

function cancelVoiceRecording() {
    stopVoiceRecording();
    document.getElementById('voiceModal').style.display = 'none';
    recordingSeconds = 0;
    document.getElementById('voiceTimer').textContent = '00:00';
}

function sendVoiceMessage() {
    if (recordingSeconds === 0) return;
    
    stopVoiceRecording();
    document.getElementById('voiceModal').style.display = 'none';
    
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    // Add voice message
    addMessage('You', '', true, true, true, duration);
    
    // Decrease balance if not in own class
    const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
    if (!isOwnClass) {
        dailyBalance--;
        updateBalanceDisplay();
        saveBalance();
    }
    
    recordingSeconds = 0;
    document.getElementById('voiceTimer').textContent = '00:00';
}

function playVoiceMessage(button) {
    // Simulate playing voice message
    const svg = button.querySelector('svg');
    const isPlaying = button.classList.contains('playing');
    
    if (!isPlaying) {
        button.classList.add('playing');
        svg.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="white"></rect><rect x="14" y="4" width="4" height="16" fill="white"></rect>';
        
        // Auto stop after duration (simulated)
        setTimeout(() => {
            button.classList.remove('playing');
            svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="white"></polygon>';
        }, 3000);
    } else {
        button.classList.remove('playing');
        svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="white"></polygon>';
    }
}

function updateCharCount() {
    const input = document.getElementById('messageInput');
    const count = input.value.length;
    document.getElementById('charCount').textContent = `${count}/500`;
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'flex';
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

function updateBalanceDisplay() {
    document.getElementById('balanceCount').textContent = dailyBalance;
    document.getElementById('modalBalance').textContent = `${dailyBalance}/20`;
}

function saveBalance() {
    saveToLocalStorage(`balance_${currentRoom}`, {
        balance: dailyBalance,
        lastReset: new Date().getTime()
    });
}

function startResetTimer() {
    const savedBalance = getFromLocalStorage(`balance_${currentRoom}`);
    if (!savedBalance) return;
    
    setInterval(() => {
        const now = new Date().getTime();
        const lastReset = savedBalance.lastReset;
        const timeDiff = 24 * 60 * 60 * 1000 - (now - lastReset);
        
        if (timeDiff <= 0) {
            dailyBalance = 20;
            updateBalanceDisplay();
            saveBalance();
            return;
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        document.getElementById('resetTimer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function startOnlineCountUpdate() {
    updateOnlineCount();
    setInterval(updateOnlineCount, 10000);
}

function updateOnlineCount() {
    const count = Math.floor(Math.random() * 10) + 15;
    document.getElementById('onlineCount').textContent = `${count} Online`;
    document.getElementById('modalOnlineCount').textContent = `${count} users`;
}

function showInfoModal() {
    document.getElementById('infoModal').style.display = 'flex';
}

function hideInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

function goBack() {
    window.location.href = 'chat.html';
}