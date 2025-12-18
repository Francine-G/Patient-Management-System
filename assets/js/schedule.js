// Schedule data storage
let scheduleData = {};
let currentWeekStart = null;
let selectedDate = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeDate();
    loadScheduleData();
    renderCalendar();
    setupEventListeners();
});

// Initialize current date
function initializeDate() {
    const today = new Date();
    currentWeekStart = getStartOfWeek(today);
    
    // Display today's date in header
    const todayDateElement = document.getElementById('todayDate');
    todayDateElement.textContent = formatDate(today, 'MM-DD-YYYY');
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
    
    // Show form
    document.getElementById('detailsContent').style.display = 'none';
    document.getElementById('detailsForm').style.display = 'block';
    
    // Update form title
    const formTitle = document.querySelector('.form-title');
    formTitle.textContent = `Edits of schedule - ${formatDate(date, 'MM-DD-YYYY')}`;
    
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
function saveSchedule() {
    if (!selectedDate) return;
    
    const dateStr = formatDate(selectedDate, 'YYYY-MM-DD');
    const availability = document.getElementById('availability').value;
    
    scheduleData[dateStr] = {
        is_available: availability === 'available',
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        notes: document.getElementById('notes').value
    };
    
    // Save to localStorage
    saveScheduleData();
    
    // Re-render calendar
    renderCalendar();
    
    // Show success message
    alert('Schedule saved successfully!');
    
    // Reset view
    cancelEdit();
}

// Cancel edit
function cancelEdit() {
    selectedDate = null;
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

// Load schedule data from localStorage
function loadScheduleData() {
    const stored = localStorage.getItem('doctorSchedule');
    if (stored) {
        try {
            scheduleData = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading schedule data:', e);
            scheduleData = {};
        }
    }
}

// Save schedule data to localStorage
function saveScheduleData() {
    localStorage.setItem('doctorSchedule', JSON.stringify(scheduleData));
}

// Setup event listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prevWeek').addEventListener('click', previousWeek);
    document.getElementById('nextWeek').addEventListener('click', nextWeek);
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    
    // Form actions
    document.getElementById('saveBtn').addEventListener('click', saveSchedule);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    
    // Availability change
    document.getElementById('availability').addEventListener('change', toggleTimeFields);
}

// Sample data for demonstration (optional)
function loadSampleData() {
    const today = new Date();
    
    // Add some sample schedules
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date, 'YYYY-MM-DD');
        
        if (i === 2 || i === 5) {
            // Make some days unavailable
            scheduleData[dateStr] = {
                is_available: false,
                start_time: '09:00',
                end_time: '17:00',
                notes: 'Day off'
            };
        } else {
            scheduleData[dateStr] = {
                is_available: true,
                start_time: '09:00',
                end_time: '17:00',
                notes: ''
            };
        }
    }
    
    saveScheduleData();
}

// Uncomment the line below to load sample data on first run
// if (Object.keys(scheduleData).length === 0) loadSampleData();