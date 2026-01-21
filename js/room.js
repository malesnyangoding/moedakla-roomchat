// Room Chat Logic

let currentRoom = '';
let userClass = '';
let dailyBalance = 20;
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;
let messagePollingInterval = null;

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

function getAuthToken() {
    return localStorage.getItem('authToken');
}

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
    loadMessagesFromAPI();
    startMessagePolling();
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
    
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target.id === 'infoModal') hideInfoModal();
    });
});

function initializePage() {
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
    
    const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
    
    if (!isOwnClass) {
        document.getElementById('balanceBar').style.display = 'block';
        document.getElementById('balanceInfo').style.display = 'flex';
        
        loadBalanceFromAPI();
        startResetTimer();
    }
}

async function loadBalanceFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/balance?room=${currentRoom}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            dailyBalance = data.balance;
            updateBalanceDisplay();
        }
    } catch (error) {
        console.error('Load balance error:', error);
    }
}

async function loadMessagesFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/get?room=${currentRoom}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';
            
            if (data.messages.length === 0) {
                addMessage('System', 'Welcome to the chat! Be respectful and have fun! 🎉', false, false, true);
            } else {
                data.messages.forEach(msg => {
                    const isOwn = msg.user_id === data.currentUserId;
                    addMessageToUI(msg.username, msg.message_text, isOwn, msg.is_voice, msg.voice_duration, msg.avatar);
                });
            }
            
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

function startMessagePolling() {
    // Poll for new messages every 3 seconds
    messagePollingInterval = setInterval(loadMessagesFromAPI, 3000);
}

function addMessageToUI(username, text, isOwn = false, isVoice = false, duration = '0:00', avatar = null) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    let avatarContent = 'A';
    if (avatar) {
        avatarContent = `<img src="${avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
        avatarContent = username.charAt(0).toUpperCase();
    }
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    if (isVoice) {
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatarContent}</div>
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
            <div class="message-avatar">${typeof avatarContent === 'string' && avatarContent.includes('<img') ? avatarContent : `<span>${avatarContent}</span>`}</div>
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
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
    if (!isOwnClass && dailyBalance <= 0) {
        alert('Balance habis! Tunggu reset besok atau chat di room kelas kamu.');
        return;
    }
    
    // Disable input while sending
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                roomType: currentRoom,
                messageText: text,
                isVoice: false
            })
        });
        
        if (response.ok) {
            input.value = '';
            updateCharCount();
            
            // Reload messages
            await loadMessagesFromAPI();
            
            // Update balance
            if (!isOwnClass) {
                await loadBalanceFromAPI();
            }
        } else {
            const data = await response.json();
            alert(data.error || 'Gagal kirim pesan');
        }
    } catch (error) {
        console.error('Send message error:', error);
        alert('Gagal kirim pesan. Cek koneksi internet.');
    } finally {
        input.disabled = false;
        document.getElementById('sendBtn').disabled = false;
    }
}

function toggleVoiceRecording() {
    if (!isRecording) {
        const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
        if (!isOwnClass && dailyBalance <= 0) {
            alert('Balance habis! Tunggu reset besok atau chat di room kelas kamu.');
            return;
        }
        
        requestMicrophonePermission();
    } else {
        stopVoiceRecording();
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
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
    
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        document.getElementById('voiceTimer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
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

async function sendVoiceMessage() {
    if (recordingSeconds === 0) return;
    
    stopVoiceRecording();
    document.getElementById('voiceModal').style.display = 'none';
    
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                roomType: currentRoom,
                messageText: '',
                isVoice: true,
                voiceDuration: duration
            })
        });
        
        if (response.ok) {
            await loadMessagesFromAPI();
            
            const isOwnClass = currentRoom === `kelas-${userClass.toLowerCase()}`;
            if (!isOwnClass) {
                await loadBalanceFromAPI();
            }
        } else {
            const data = await response.json();
            alert(data.error || 'Gagal kirim voice message');
        }
    } catch (error) {
        console.error('Send voice error:', error);
        alert('Gagal kirim voice message');
    }
    
    recordingSeconds = 0;
    document.getElementById('voiceTimer').textContent = '00:00';
}

function playVoiceMessage(button) {
    const svg = button.querySelector('svg');
    const isPlaying = button.classList.contains('playing');
    
    if (!isPlaying) {
        button.classList.add('playing');
        svg.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="white"></rect><rect x="14" y="4" width="4" height="16" fill="white"></rect>';
        
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

function startResetTimer() {
    setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeDiff = tomorrow - now;
        
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
    clearInterval(messagePollingInterval);
    window.location.href = 'chat.html';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
});
