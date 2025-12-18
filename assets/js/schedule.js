import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Schedule data storage
let scheduleData = {};
let currentWeekStart = null;
let selectedDate = null;
let currentUserData = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    initializeDate();
    await loadScheduleData();
    renderCalendar();
    setupEventListeners();
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

// Initialize current date
function initializeDate() {
    const today = new Date();
    currentWeekStart = getStartOfWeek(today);
}

// Get start of week (Sunday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

// Format date
function formatDate(date, format) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === 'MM-DD-YYYY') {
        return `${month}-${day}-${year}`;
    } else if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    }
    return d.toLocaleDateString();
}

// Get day name
function getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

// Get month name
function getMonthName(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()];
}

// Check if dates are the same day
function isSameDay(date1, date2) {
    return formatDate(date1, 'YYYY-MM-DD') === formatDate(date2, 'YYYY-MM-DD');
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonth = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonth) return;
    
    calendarGrid.innerHTML = '';
    
    // Display month and year
    currentMonth.textContent = `${getMonthName(currentWeekStart)} ${currentWeekStart.getFullYear()}`;
    
    // Generate 7 days starting from currentWeekStart
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        
        const dayElement = createDayElement(date);
        calendarGrid.appendChild(dayElement);
    }
}

// Create day element
function createDayElement(date) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    const schedule = scheduleData[dateStr];
    const today = new Date();
    
    // Add classes based on status
    if (isSameDay(date, today)) {
        dayDiv.classList.add('today');
    }
    
    if (schedule) {
        if (schedule.is_available) {
            dayDiv.classList.add('available');
        } else {
            dayDiv.classList.add('unavailable');
        }
    }
    
    // Day name
    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = getDayName(date);
    dayDiv.appendChild(dayName);
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);
    
    // Badge if schedule exists
    if (schedule) {
        const badge = document.createElement('div');
        badge.className = `day-badge ${schedule.is_available ? 'badge-available' : 'badge-unavailable'}`;
        badge.textContent = schedule.is_available ? 'Available' : 'Unavailable';
        dayDiv.appendChild(badge);
        
        // Show time if available
        if (schedule.is_available && schedule.start_time && schedule.end_time) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'day-time';
            timeDiv.textContent = `${schedule.start_time} - ${schedule.end_time}`;
            dayDiv.appendChild(timeDiv);
        }
    }
    
    // Click handler
    dayDiv.addEventListener('click', () => selectDate(date));
    
    return dayDiv;
}

// Select a date
function selectDate(date) {
    selectedDate = date;
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    const schedule = scheduleData[dateStr];
    
    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Add selection to clicked date
    event.currentTarget.classList.add('selected');
    
    // Show form
    document.getElementById('detailsContent').style.display = 'none';
    document.getElementById('detailsForm').style.display = 'block';
    
    // Update form title
    const formTitle = document.querySelector('.form-title');
    formTitle.textContent = `Edit Schedule - ${formatDate(date, 'MM-DD-YYYY')}`;
    
    // Populate form
    if (schedule) {
        document.getElementById('availability').value = schedule.is_available ? 'available' : 'unavailable';
        document.getElementById('startTime').value = schedule.start_time || '09:00';
        document.getElementById('endTime').value = schedule.end_time || '17:00';
        document.getElementById('notes').value = schedule.notes || '';
    } else {
        // Default values for new schedule
        document.getElementById('availability').value = 'available';
        document.getElementById('startTime').value = '09:00';
        document.getElementById('endTime').value = '17:00';
        document.getElementById('notes').value = '';
    }
    
    // Toggle time fields based on availability
    toggleTimeFields();
}

// Toggle time fields based on availability
function toggleTimeFields() {
    const availability = document.getElementById('availability').value;
    const timeFields = document.getElementById('timeFields');
    
    if (availability === 'available') {
        timeFields.style.display = 'grid';
    } else {
        timeFields.style.display = 'none';
    }
}

// Save schedule
async function saveSchedule() {
    if (!selectedDate || !currentUserData) return;
    
    const dateStr = formatDate(selectedDate, 'YYYY-MM-DD');
    const availability = document.getElementById('availability').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const notes = document.getElementById('notes').value;

    // Validate times if available
    if (availability === 'available') {
        if (!startTime || !endTime) {
            alert('Please enter both start and end times.');
            return;
        }
        if (startTime >= endTime) {
            alert('End time must be after start time.');
            return;
        }
    }
    
    const scheduleEntry = {
        is_available: availability === 'available',
        start_time: startTime,
        end_time: endTime,
        notes: notes,
        updated_by: currentUserData.username,
        updated_at: new Date().toISOString()
    };

    scheduleData[dateStr] = scheduleEntry;
    
    try {
        // Save to Firebase
        const username = currentUserData.username;
        await set(ref(database, `schedules/${username}/${dateStr}`), scheduleEntry);
        
        // Save to localStorage as backup
        saveScheduleDataLocal();
        
        // Create audit log
        await createAuditLog(
            availability === 'available' ? 'Updated Schedule' : 'Marked Unavailable',
            'Schedule',
            `Set ${dateStr} as ${availability} ${availability === 'available' ? `(${startTime} - ${endTime})` : ''}`
        );
        
        // Re-render calendar
        renderCalendar();
        
        // Show success message
        alert('Schedule saved successfully!');
        
        // Reset view
        cancelEdit();
    } catch (error) {
        console.error('Error saving schedule:', error);
        alert('Failed to save schedule. Please try again.');
    }
}

// Create audit log entry
async function createAuditLog(action, entityType, details) {
    if (!currentUserData) return;
    
    try {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const auditLog = {
            timestamp: new Date().toISOString(),
            user_name: `${currentUserData.firstName} ${currentUserData.lastName}`.trim(),
            username: currentUserData.username,
            user_role: currentUserData.role || 'user',
            action: action,
            entity_type: entityType,
            entity_id: currentUserData.username,
            details: details,
            ip_address: 'N/A',
            user_agent: navigator.userAgent || 'Unknown'
        };

        await set(ref(database, `audit_logs/${logId}`), auditLog);
        console.log('✅ Audit log created:', auditLog);
    } catch (error) {
        console.error('❌ Error creating audit log:', error);
    }
}

// Cancel edit
function cancelEdit() {
    selectedDate = null;
    
    // Remove selection from calendar
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    
    document.getElementById('detailsForm').style.display = 'none';
    document.getElementById('detailsContent').style.display = 'block';
}

// Navigate to previous week
function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderCalendar();
}

// Navigate to next week
function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderCalendar();
}

// Go to today
function goToToday() {
    currentWeekStart = getStartOfWeek(new Date());
    renderCalendar();
}

// Load schedule data from Firebase
async function loadScheduleData() {
    if (!currentUserData) return;
    
    try {
        const username = currentUserData.username;
        const scheduleRef = ref(database, `schedules/${username}`);
        const snapshot = await get(scheduleRef);
        
        if (snapshot.exists()) {
            scheduleData = snapshot.val();
            console.log('✅ Schedule data loaded from Firebase');
        } else {
            // Try loading from localStorage as fallback
            loadScheduleDataLocal();
        }
    } catch (error) {
        console.error('Error loading schedule from Firebase:', error);
        // Fallback to localStorage
        loadScheduleDataLocal();
    }
}

// Load schedule data from localStorage (fallback)
function loadScheduleDataLocal() {
    const stored = localStorage.getItem('doctorSchedule');
    if (stored) {
        try {
            scheduleData = JSON.parse(stored);
            console.log('✅ Schedule data loaded from localStorage');
        } catch (e) {
            console.error('Error loading schedule data from localStorage:', e);
            scheduleData = {};
        }
    }
}

// Save schedule data to localStorage (backup)
function saveScheduleDataLocal() {
    localStorage.setItem('doctorSchedule', JSON.stringify(scheduleData));
}

// Setup event listeners
function setupEventListeners() {
    // Calendar navigation
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', previousWeek);
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', nextWeek);
    if (todayBtn) todayBtn.addEventListener('click', goToToday);
    
    // Form actions
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (saveBtn) saveBtn.addEventListener('click', saveSchedule);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);
    
    // Availability change
    const availabilitySelect = document.getElementById('availability');
    if (availabilitySelect) {
        availabilitySelect.addEventListener('change', toggleTimeFields);
    }
}