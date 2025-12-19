import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxok6-e-GB8fdmSD8_Wpa-0_jYwK77eHk",
    authDomain: "patientflow-26dc1.firebaseapp.com",
    databaseURL: "https://patientflow-26dc1-default-rtdb.firebaseio.com",
    projectId: "patientflow-26dc1",
    storageBucket: "patientflow-26dc1.firebasestorage.app",
    messagingSenderId: "124429931982",
    appId: "1:124429931982:web:ef44ca54332b9fcca5079f"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Global variables
let currentUserData = null;
let allHistory = [];
let filteredHistory = [];
let currentWeekFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    await loadHistory();
    generateWeekTabs();
    updatePeriodInfo();
});

// Initialize header with current date
function initializeHeader() {
    updateHeaderDate();
    
    // Add notification button click handler
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            window.location.href = 'Notif-Page.html';
        });

        // Keyboard support
        notifBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = 'Notif-Page.html';
            }
        });
    }
}

// Update header date display
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

// Load user data
async function loadUserData(username) {
    try {
        const userDataString = sessionStorage.getItem('userData');
        
        if (userDataString) {
            currentUserData = JSON.parse(userDataString);
            
            // Update sidebar display
            const displayName = document.getElementById('user-display-name');
            const roleElement = document.getElementById('user-role');
            const welcomeMessage = document.getElementById('welcome-message');
            
            if (displayName) {
                displayName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
            }
            
            if (roleElement) {
                const role = currentUserData.role || 'User';
                roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }

            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${currentUserData.firstName} ${currentUserData.lastName}!`;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load history from completed queue items
async function loadHistory() {
    try {
        showLoading(true);
        
        // Load from audit logs where action is "Mark as Done" or "Consultation"
        const auditsRef = ref(database, 'audits');
        const snapshot = await get(auditsRef);
        
        allHistory = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const log = data[key];
                
                // Only include completed consultations or "Mark as Done" actions
                if (log.action && 
                    (log.action.includes('Mark as Done') || 
                     log.action.includes('Consultation') ||
                     log.action.includes('Done'))) {
                    
                    // Parse timestamp
                    let visitDate;
                    try {
                        if (log.timestamp.includes(',')) {
                            // Format: "12/19/2024, 10:30:00 AM"
                            visitDate = new Date(log.timestamp);
                        } else {
                            visitDate = new Date(log.timestamp);
                        }
                        
                        // Only include visits within last 30 days
                        if (visitDate >= thirtyDaysAgo && !isNaN(visitDate.getTime())) {
                            // Extract patient name and queue number from details
                            const details = log.details || '';
                            const queueMatch = details.match(/Q-\d+/);
                            const nameMatch = details.match(/- (.+)$/);
                            
                            allHistory.push({
                                id: key,
                                patientName: nameMatch ? nameMatch[1] : 'Unknown Patient',
                                queueNumber: queueMatch ? queueMatch[0] : 'N/A',
                                visitDate: visitDate,
                                visitType: log.action.includes('Consultation') ? 'Scheduled' : 'Walk-in',
                                reason: log.action.includes('Consultation') ? 'Consultation' : 'General Visit',
                                user: log.user || 'System',
                                entity: log.entity || 'N/A'
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing date:', log.timestamp, error);
                    }
                }
            });
            
            // Sort by date descending (newest first)
            allHistory.sort((a, b) => b.visitDate - a.visitDate);
        }
        
        filteredHistory = [...allHistory];
        displayHistory();
        updateStats();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading history:', error);
        showLoading(false);
        showEmptyState();
    }
}

// Display history cards
function displayHistory() {
    const grid = document.getElementById('visitorsGrid');
    if (!grid) return;
    
    if (filteredHistory.length === 0) {
        showEmptyState();
        return;
    }
    
    grid.innerHTML = filteredHistory.map(visit => {
        const firstLetter = visit.patientName.charAt(0).toUpperCase();
        const formattedDate = formatDate(visit.visitDate);
        const formattedTime = formatTime(visit.visitDate);
        
        return `
            <div class="visitor-card">
                <div class="visitor-header">
                    <div class="visitor-avatar">${firstLetter}</div>
                    <div class="visitor-info">
                        <h4>${escapeHtml(visit.patientName)}</h4>
                        <p>Queue: ${escapeHtml(visit.queueNumber)}</p>
                    </div>
                </div>
                <div class="visitor-details">
                    <div class="visitor-detail-row">
                        <span class="label"><i class="fi fi-rr-calendar"></i> Visit Date:</span>
                        <span class="value">${formattedDate}</span>
                    </div>
                    <div class="visitor-detail-row">
                        <span class="label"><i class="fi fi-rr-clock"></i> Time:</span>
                        <span class="value">${formattedTime}</span>
                    </div>
                    <div class="visitor-detail-row">
                        <span class="label"><i class="fi fi-rr-doctor"></i> Attended By:</span>
                        <span class="value">${escapeHtml(visit.user)}</span>
                    </div>
                    <span class="visit-type-badge ${visit.visitType.toLowerCase().replace('-', '')}">${visit.visitType}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Format date
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Format time
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Update statistics
function updateStats() {
    const totalVisits = document.getElementById('total-visits');
    const weekVisits = document.getElementById('week-visits');
    const todayVisits = document.getElementById('today-visits');
    
    // Total visits in last 30 days
    if (totalVisits) {
        totalVisits.textContent = allHistory.length;
    }
    
    // This week's visits
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = allHistory.filter(v => v.visitDate >= weekAgo);
    if (weekVisits) {
        weekVisits.textContent = thisWeek.length;
    }
    
    // Today's visits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayList = allHistory.filter(v => v.visitDate >= today && v.visitDate <= todayEnd);
    if (todayVisits) {
        todayVisits.textContent = todayList.length;
    }
}

// Generate week tabs
function generateWeekTabs() {
    const tabsContainer = document.getElementById('weekTabs');
    if (!tabsContainer) return;
    
    const today = new Date();
    const weeks = [];
    
    // Generate 5 weeks (including current week)
    for (let i = 0; i < 5; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7));
        
        // Get start of week (Sunday)
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        weeks.push({
            id: i === 0 ? 'current' : `week${i}`,
            label: i === 0 ? 'This Week' : `Week ${i + 1}`,
            start: weekStart,
            end: weekEnd
        });
    }
    
    tabsContainer.innerHTML = weeks.map((week, index) => {
        const startStr = `${week.start.getMonth() + 1}/${week.start.getDate()}`;
        const endStr = `${week.end.getMonth() + 1}/${week.end.getDate()}`;
        
        return `
            <button class="week-tab ${index === 0 ? 'active' : ''}" 
                    onclick="filterByWeek('${week.id}', ${week.start.getTime()}, ${week.end.getTime()})">
                ${week.label} (${startStr} - ${endStr})
            </button>
        `;
    }).join('');
}

// Filter by week
window.filterByWeek = function(weekId, startTime, endTime) {
    currentWeekFilter = weekId;
    
    // Update active tab
    document.querySelectorAll('.week-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter history
    if (weekId === 'all') {
        filteredHistory = [...allHistory];
    } else {
        const start = new Date(startTime);
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        
        filteredHistory = allHistory.filter(visit => 
            visit.visitDate >= start && visit.visitDate <= end
        );
    }
    
    displayHistory();
};

// Update period info
function updatePeriodInfo() {
    const periodEl = document.getElementById('tracking-period');
    const resetBadgeEl = document.getElementById('reset-badge');
    
    if (periodEl) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const startStr = formatDate(thirtyDaysAgo);
        const endStr = formatDate(today);
        
        periodEl.textContent = `${startStr} - ${endStr}`;
    }
    
    if (resetBadgeEl) {
        // History continuously rolls, showing last 30 days
        resetBadgeEl.textContent = 'Rolling 30-Day Window';
    }
}

// Show loading state
function showLoading(show) {
    const grid = document.getElementById('visitorsGrid');
    if (!grid) return;
    
    if (show) {
        grid.innerHTML = `
            <div class="loading-state">
                <i class="fi fi-rr-spinner"></i>
                <p>Loading patient history...</p>
            </div>
        `;
    }
}

// Show empty state
function showEmptyState() {
    const grid = document.getElementById('visitorsGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fi fi-rr-calendar-clock empty-icon"></i>
            <h3>No Patient History</h3>
            <p>No completed visits found in the last 30 days.</p>
        </div>
    `;
}

// Auto-refresh every 60 seconds
setInterval(async () => {
    console.log('🔄 Auto-refreshing history...');
    await loadHistory();
    updatePeriodInfo();
}, 60000);