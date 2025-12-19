import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// Added 'onValue' to imports for real-time updates
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Global state
let currentDate = new Date();
let currentUserData = null;

// Check authentication and load user data
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    initializeCalendar();
    
    // *** NEW: Initialize Real-time Stats ***
    initializeDashboardStats(); 
});

function initializeDashboardStats() {
    // 1. Listen for Patient Count
    const patientsRef = ref(database, 'patients');
    onValue(patientsRef, (snapshot) => {
        const countEl = document.getElementById('total-patients-count');
        if (countEl) {
            if (snapshot.exists()) {
                const count = Object.keys(snapshot.val()).length;
                countEl.textContent = count;
            } else {
                countEl.textContent = "0";
            }
        }
    });

    // 2. Listen for Queue Count AND Render List
    const queueRef = ref(database, 'queue');
    onValue(queueRef, (snapshot) => {
        const countEl = document.getElementById('current-queue-count');
        const queueListContainer = document.querySelector('.queue-list');

        if (snapshot.exists()) {
            const queueData = snapshot.val();
            const queueKeys = Object.keys(queueData);
            
            if (countEl) countEl.textContent = queueKeys.length;

            if (queueListContainer) {
                queueListContainer.innerHTML = ''; 

                snapshot.forEach((childSnapshot) => {
                    const key = childSnapshot.key; 
                    const patient = childSnapshot.val();
                    
                    // *** FIX STARTS HERE ***
                    const numberPart = key.split('_')[1]; 
                    const queueId = `Q-${numberPart.padStart(3, '0')}`;
                    // *** FIX ENDS HERE ***

                    let dateDisplay = "N/A";
                    if (patient.timestamp) {
                        const dateObj = new Date(patient.timestamp);
                        dateDisplay = dateObj.toLocaleDateString('en-US', {
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'queue-item';
                    itemDiv.innerHTML = `
                        <div class="queue-info">
                            <h4>${patient.name || 'Unknown'}</h4>
                            <p class="date">📅 ${dateDisplay}</p>
                            <p>${patient.type || 'General'}</p>
                        </div>
                        <div class="queue-badge">${queueId}</div>
                    `;
                    
                    queueListContainer.appendChild(itemDiv);
                });
            }
        } else {
            if (countEl) countEl.textContent = "0";
            if (queueListContainer) {
                queueListContainer.innerHTML = '<p style="padding:15px; text-align:center; color:#666;">No patients in queue.</p>';
            }
        }
    });
}

// Load user data from Firebase
async function loadUserData(username) {
    try {
        const userRef = ref(database, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
            currentUserData.username = username;
            
            sessionStorage.setItem('userData', JSON.stringify({
                username: currentUserData.username,
                firstName: currentUserData.firstName,
                lastName: currentUserData.lastName,
                email: currentUserData.email,
                role: currentUserData.role || 'user'
            }));
            
            updateUserDisplay();
        } else {
            const userDataString = sessionStorage.getItem('userData');
            if (userDataString) {
                currentUserData = JSON.parse(userDataString);
                updateUserDisplay();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        const userDataString = sessionStorage.getItem('userData');
        if (userDataString) {
            currentUserData = JSON.parse(userDataString);
            updateUserDisplay();
        }
    }
}

function updateUserDisplay() {
    if (!currentUserData) return;

    const displayName = document.getElementById('user-display-name');
    const roleElement = document.getElementById('user-role');
    
    if (displayName) displayName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
    
    if (roleElement) {
        const role = currentUserData.role || 'Admin';
        roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${currentUserData.firstName} ${currentUserData.lastName}!`;
}

function initializeHeader() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) updateHeaderDate();

    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            window.location.href = 'Notif-Page.html';
        });
    }
}

function updateHeaderDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;

    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    dateElement.textContent = currentDate.toLocaleDateString('en-US', options);
}

function initializeCalendar() {
    renderCalendar();
    
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

function renderCalendar() {
    const monthElement = document.getElementById('calendar-month');
    const datesElement = document.getElementById('calendar-dates');
    
    if (!monthElement || !datesElement) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                       'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    monthElement.textContent = `📅 ${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();
    
    datesElement.innerHTML = '';
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date other-month';
        dateDiv.textContent = daysInPrevMonth - i;
        datesElement.appendChild(dateDiv);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateDiv = document.createElement('div');
        const currentDayOfWeek = new Date(year, month, day).getDay();
        
        if (currentDayOfWeek === 0) dateDiv.className = 'calendar-date red';
        else dateDiv.className = 'calendar-date';
        
        if (isCurrentMonth && day === todayDate) dateDiv.classList.add('today');
        
        dateDiv.textContent = day;
        dateDiv.addEventListener('click', () => {
            document.querySelectorAll('.calendar-date.selected').forEach(el => el.classList.remove('selected'));
            if (!dateDiv.classList.contains('today')) dateDiv.style.background = '#e2e8f0';
        });
        
        datesElement.appendChild(dateDiv);
    }
    
    const totalCells = datesElement.children.length;
    const remainingCells = 42 - totalCells; 
    
    for (let day = 1; day <= remainingCells; day++) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date other-month';
        dateDiv.textContent = day;
        datesElement.appendChild(dateDiv);
    }
}

const logoutLink = document.querySelector('a[href="LogIn.html"]');
if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        alert('You have been logged out successfully.');
        window.location.href = 'LogIn.html';
    });
}