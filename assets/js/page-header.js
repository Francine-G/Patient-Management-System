import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxok6-e-GB8fdmSD8_Wpa-0_jYwK77eHk",
  authDomain: "patientflow-26dc1.firebaseapp.com",
  databaseURL: "https://patientflow-26dc1-default-rtdb.firebaseio.com",
  projectId: "patientflow-26dc1",
  storageBucket: "patientflow-26dc1.firebasestorage.app",
  messagingSenderId: "124429931982",
  appId: "1:124429931982:web:ef44ca54332b9fcca5079f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Global user data
let currentUserData = null;

export async function initializePageHeader() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return null;
    }

    await loadUserData(currentUser);
    updateHeaderDate();
    initializeNotificationButton();
    
    return currentUserData;
}

async function loadUserData(username) {
    try {
        console.log('🔄 Loading user data for:', username);
        
        const userRef = ref(database, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
            currentUserData.username = username;
            
            console.log('✅ User data loaded:', currentUserData);
            
            // Update session storage with fresh data
            sessionStorage.setItem('userData', JSON.stringify({
                username: currentUserData.username,
                firstName: currentUserData.firstName,
                lastName: currentUserData.lastName,
                email: currentUserData.email,
                role: currentUserData.role || 'user'
            }));
            
            // Update UI with user data
            updateSidebarUserDisplay();
            updateWelcomeMessage();
        } else {
            console.error('❌ User data not found in Firebase');
            // Try to get from session storage as fallback
            const userDataString = sessionStorage.getItem('userData');
            if (userDataString) {
                currentUserData = JSON.parse(userDataString);
                updateSidebarUserDisplay();
                updateWelcomeMessage();
            }
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        // Try to get from session storage as fallback
        const userDataString = sessionStorage.getItem('userData');
        if (userDataString) {
            currentUserData = JSON.parse(userDataString);
            updateSidebarUserDisplay();
            updateWelcomeMessage();
        }
    }
}

function updateSidebarUserDisplay() {
    if (!currentUserData) return;

    // Update sidebar display name
    const displayName = document.getElementById('user-display-name');
    const roleElement = document.getElementById('user-role');
    
    if (displayName) {
        displayName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
    }
    
    if (roleElement) {
        const role = currentUserData.role || 'User';
        roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
}

function updateWelcomeMessage() {
    if (!currentUserData) return;

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${currentUserData.firstName} ${currentUserData.lastName}!`;
    }
}


function updateHeaderDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;

    const currentDate = new Date();
    const options = { 
        weekday: 'long',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    dateElement.textContent = formattedDate;
}


function initializeNotificationButton() {
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function() {
            window.location.href = 'Notif-Page.html';
        });

        // Keyboard support
        notifBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = 'Notif-Page.html';
            }
        });
    }
}

export function getCurrentUser() {
    return currentUserData;
}


export function hasRole(role) {
    if (!currentUserData) return false;
    const userRole = (currentUserData.role || '').toLowerCase();
    return userRole === role.toLowerCase();
}

export function isAdmin() {
    return hasRole('admin');
}


export function isDoctor() {
    return hasRole('doctor');
}


export function logout() {
    sessionStorage.clear();
    alert('You have been logged out successfully.');
    window.location.href = 'LogIn.html';
}