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
});

// Load user data from Firebase
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
            updateUserDisplay();
        } else {
            console.error('❌ User data not found in Firebase');
            // Try to get from session storage as fallback
            const userDataString = sessionStorage.getItem('userData');
            if (userDataString) {
                currentUserData = JSON.parse(userDataString);
                updateUserDisplay();
            }
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        // Try to get from session storage as fallback
        const userDataString = sessionStorage.getItem('userData');
        if (userDataString) {
            currentUserData = JSON.parse(userDataString);
            updateUserDisplay();
        }
    }
}

// Update user display in the UI
function updateUserDisplay() {
    if (!currentUserData) return;

    // Update sidebar display
    const displayName = document.getElementById('user-display-name');
    const roleElement = document.getElementById('user-role');
    
    if (displayName) {
        displayName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
    }
    
    if (roleElement) {
        const role = currentUserData.role || 'Admin';
        roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    // Update welcome message in header
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${currentUserData.firstName} ${currentUserData.lastName}!`;
    }
}


// Initialize header with current date
function initializeHeader() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        updateHeaderDate();
    }

    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            window.location.href = 'Notif-Page.html';
        });
    }
}

// Update header date display
function updateHeaderDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;

    const options = { 
        weekday: 'long',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    dateElement.textContent = formattedDate;
}

// Initialize calendar
function initializeCalendar() {
    renderCalendar();
    
    // Add event listeners for navigation buttons
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

// Render calendar
function renderCalendar() {
    const monthElement = document.getElementById('calendar-month');
    const datesElement = document.getElementById('calendar-dates');
    
    if (!monthElement || !datesElement) return;

    // Get current month and year
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Format month display
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                       'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    monthElement.textContent = `📅 ${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();
    
    // Clear previous dates
    datesElement.innerHTML = '';
    
    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date other-month';
        dateDiv.textContent = daysInPrevMonth - i;
        datesElement.appendChild(dateDiv);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateDiv = document.createElement('div');
        const currentDayOfWeek = new Date(year, month, day).getDay();
        
        // Check if it's a Sunday (0)
        if (currentDayOfWeek === 0) {
            dateDiv.className = 'calendar-date red';
        } else {
            dateDiv.className = 'calendar-date';
        }
        
        // Highlight today
        if (isCurrentMonth && day === todayDate) {
            dateDiv.classList.add('today');
        }
        
        dateDiv.textContent = day;
        
        // Add click event
        dateDiv.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.calendar-date.selected').forEach(el => {
                el.classList.remove('selected');
            });
            // Add selection to clicked date (if not today)
            if (!dateDiv.classList.contains('today')) {
                dateDiv.style.background = '#e2e8f0';
            }
        });
        
        datesElement.appendChild(dateDiv);
    }
    
    // Add next month's leading days
    const totalCells = datesElement.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells
    
    for (let day = 1; day <= remainingCells; day++) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date other-month';
        dateDiv.textContent = day;
        datesElement.appendChild(dateDiv);
    }
}

// Logout handler
const logoutLink = document.querySelector('a[href="LogIn.html"]');
if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        alert('You have been logged out successfully.');
        window.location.href = 'LogIn.html';
    });
}s