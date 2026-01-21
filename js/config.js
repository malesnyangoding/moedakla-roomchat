// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.vercel.app/api'
  : 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  SEND_MESSAGE: `${API_BASE_URL}/messages/send`,
  GET_MESSAGES: `${API_BASE_URL}/messages/get`,
  GET_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
  GET_BALANCE: `${API_BASE_URL}/user/balance`
};

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

export function clearAuthToken() {
  localStorage.removeItem('authToken');
}

export async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearAuthToken();
    window.location.href = '/index.html';
    throw new Error('Unauthorized');
  }

  return response.json();
}
