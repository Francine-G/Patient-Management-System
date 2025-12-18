import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let allLogs = [];
let filteredLogs = [];
let currentPage = 1;
const itemsPerPage = 20;
let currentUserData = null;

document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    
    // Check if audit-table-body exists before running
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return;

    await loadAuditLogs();
    initializeFilters();
    initializePagination();
    updateStats();
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
                const role = currentUserData.role || 'Admin';
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

// Load audit logs from Firebase
async function loadAuditLogs() {
    try {
        showLoading(true);
        
        // Target the 'audits' node as seen in your database screenshots
        const auditRef = ref(database, 'audits'); 
        const snapshot = await get(auditRef);

        allLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            allLogs = Object.keys(data).map(key => ({
                id: key, // This will be a_1, a_2, etc.
                ...data[key]
            }));
            
            // Sort by sequential ID descending (a_4, a_3, a_2...)
            allLogs.sort((a, b) => {
                const numA = parseInt(a.id.split('_')[1]);
                const numB = parseInt(b.id.split('_')[1]);
                return numB - numA;
            });
        }

        filteredLogs = [...allLogs];
        displayLogs();
        showLoading(false);
    } catch (error) {
        console.error('Error loading audit logs:', error);
        showLoading(false);
        showEmptyState(true);
    }
}

// Update statistics
function updateStats() {
    const totalActionsEl = document.getElementById('total-actions');
    const createdCountEl = document.getElementById('created-count');
    const updatedCountEl = document.getElementById('updated-count');
    const deletedCountEl = document.getElementById('deleted-count');

    if (totalActionsEl) {
        totalActionsEl.textContent = allLogs.length;
    }
    
    const createdCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add'))
    ).length;
    if (createdCountEl) {
        createdCountEl.textContent = createdCount;
    }
    
    const updatedCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('edit'))
    ).length;
    if (updatedCountEl) {
        updatedCountEl.textContent = updatedCount;
    }
    
    const deletedCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove'))
    ).length;
    if (deletedCountEl) {
        deletedCountEl.textContent = deletedCount;
    }
}

// Display logs in table
function displayLogs() {
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return;
    
    if (filteredLogs.length === 0) {
        showEmptyState(true);
        tableBody.innerHTML = '';
        return;
    }

    showEmptyState(false);
    
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const logsToDisplay = filteredLogs.slice(startIndex, endIndex);

    tableBody.innerHTML = logsToDisplay.map(log => `
        <tr>
            <td>
                <div class="timestamp-cell">
                    <i class="fi fi-rr-calendar"></i>
                    ${formatTimestamp(log.timestamp) || 'N/A'}
                </div>
            </td>
            <td class="user-cell">${escapeHtml(log.user || 'System')}</td>
            <td>
                <span class="role-badge">${escapeHtml(log.role || 'N/A')}</span>
            </td>
            <td>
                <span class="action-badge ${getActionClass(log.action)}">${escapeHtml(log.action || 'Unknown')}</span>
            </td>
            <td>
                <span class="entity-badge">${escapeHtml(log.entity || 'N/A')}</span>
            </td>
            <td class="details-cell" title="${escapeHtml(log.details || 'No details')}">
                ${escapeHtml(log.details || 'No details available')}
            </td>
        </tr>
    `).join('');

    updatePagination(totalPages);
}

// Format timestamp to readable format
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        // If timestamp is already a formatted string, return it
        if (typeof timestamp === 'string' && timestamp.includes(',')) {
            return timestamp;
        }
        
        // Try to parse as ISO date
        const date = new Date(timestamp);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return timestamp; // Return as-is if not a valid date
        }

        // Format: Dec 18, 2024 14:30
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${month} ${day}, ${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return timestamp || 'N/A';
    }
}

// Escape HTML to prevent XSS
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

// Get action class for styling
function getActionClass(action) {
    if (!action) return '';
    const actionLower = action.toLowerCase();
    if (actionLower.includes('add') || actionLower.includes('create')) return 'create';
    if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('change')) return 'update';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'delete';
    if (actionLower.includes('view') || actionLower.includes('access')) return 'view';
    return '';
}

// Initialize filters
function initializeFilters() {
    const searchInput = document.getElementById('search-input');
    const entityFilter = document.getElementById('entity-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }

    if (entityFilter) {
        entityFilter.addEventListener('change', () => {
            applyFilters();
        });
    }
}

// Apply filters
function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const entityFilter = document.getElementById('entity-filter');
    
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    const entityType = entityFilter ? entityFilter.value : 'all';
    
    filteredLogs = allLogs.filter(log => {
        // Search filter
        const matchesSearch = 
            (log.user && log.user.toLowerCase().includes(term)) ||
            (log.action && log.action.toLowerCase().includes(term)) ||
            (log.entity && log.entity.toLowerCase().includes(term)) ||
            (log.details && log.details.toLowerCase().includes(term));

        // Entity filter
        const matchesEntity = 
            entityType === 'all' || 
            (log.entity && log.entity === entityType);

        return matchesSearch && matchesEntity;
    });
    
    currentPage = 1;
    displayLogs();
    updateStats();
}

// Update pagination
function updatePagination(totalPages) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages || 1;

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Initialize pagination
function initializePagination() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { 
                currentPage--; 
                displayLogs();
                scrollToTop();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
            if (currentPage < totalPages) { 
                currentPage++; 
                displayLogs();
                scrollToTop();
            }
        });
    }
}

// Scroll to top of table
function scrollToTop() {
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Show/hide loading state
function showLoading(show) {
    const loader = document.getElementById('loading-state');
    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
            loader.style.display = 'block';
        } else {
            loader.classList.add('hidden');
            loader.style.display = 'none';
        }
    }
}

// Show/hide empty state
function showEmptyState(show) {
    const empty = document.getElementById('empty-state');
    if (empty) {
        if (show) {
            empty.classList.add('active');
            empty.style.display = 'block';
        } else {
            empty.classList.remove('active');
            empty.style.display = 'none';
        }
    }
}

// Auto-refresh logs every 30 seconds
setInterval(async () => {
    console.log('🔄 Auto-refreshing audit logs...');
    await loadAuditLogs();
    updateStats();
}, 30000);