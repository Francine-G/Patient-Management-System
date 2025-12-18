import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Check authentication and load user data
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    await loadAuditLogs();
    initializeFilters();
    initializePagination();
});


// Load user data
async function loadUserData(username) {
    try {
        const userDataString = sessionStorage.getItem('userData');
        
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            
            // Update sidebar display
            const displayName = document.getElementById('user-display-name');
            const roleElement = document.getElementById('user-role');
            
            if (displayName) {
                displayName.textContent = `${userData.firstName} ${userData.lastName}`;
            }
            
            if (roleElement) {
                const role = userData.role || 'Admin';
                roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }

    // Logout handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            alert('You have been logged out successfully.');
            window.location.href = 'LogIn.html';
        });
    }
}

// Load audit logs from Firebase
async function loadAuditLogs() {
    try {
        showLoading(true);
        
        const auditRef = ref(database, 'audit_logs');
        const logsQuery = query(auditRef, orderByChild('timestamp'), limitToLast(500));
        const snapshot = await get(logsQuery);

        allLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            allLogs = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            
            // Sort by timestamp descending (most recent first)
            allLogs.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.created_date).getTime();
                const timeB = new Date(b.timestamp || b.created_date).getTime();
                return timeB - timeA;
            });
        }

        filteredLogs = [...allLogs];
        updateStats();
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
    document.getElementById('total-actions').textContent = allLogs.length;
    
    const createdCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add'))
    ).length;
    document.getElementById('created-count').textContent = createdCount;
    
    const updatedCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('edit'))
    ).length;
    document.getElementById('updated-count').textContent = updatedCount;
    
    const deletedCount = allLogs.filter(log => 
        log.action && (log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove'))
    ).length;
    document.getElementById('deleted-count').textContent = deletedCount;
}

// Display logs in table
function displayLogs() {
    const tableBody = document.getElementById('audit-table-body');
    
    if (filteredLogs.length === 0) {
        showEmptyState(true);
        tableBody.innerHTML = '';
        return;
    }

    showEmptyState(false);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const logsToDisplay = filteredLogs.slice(startIndex, endIndex);

    // Generate table rows
    tableBody.innerHTML = logsToDisplay.map(log => `
        <tr>
            <td>
                <div class="timestamp-cell">
                    <i class="fi fi-rr-calendar"></i>
                    ${formatTimestamp(log.timestamp || log.created_date)}
                </div>
            </td>
            <td class="user-cell">${log.user_name || log.username || 'System'}</td>
            <td>
                <span class="role-badge">${log.user_role || log.role || 'Admin'}</span>
            </td>
            <td>
                <span class="action-badge ${getActionClass(log.action)}">${log.action || 'Unknown'}</span>
            </td>
            <td>
                <span class="entity-badge">${log.entity_type || log.entityType || 'N/A'}</span>
            </td>
            <td class="details-cell" title="${log.details || log.description || 'No details'}">
                ${log.details || log.description || 'No details available'}
            </td>
        </tr>
    `).join('');

    // Update pagination
    updatePagination(totalPages);
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = new Date(timestamp);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
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
        return 'N/A';
    }
}

// Get action class for styling
function getActionClass(action) {
    if (!action) return '';
    
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('create') || actionLower.includes('add')) {
        return 'create';
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
        return 'update';
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
        return 'delete';
    } else if (actionLower.includes('view') || actionLower.includes('access')) {
        return 'view';
    }
    
    return '';
}

// Initialize filters
function initializeFilters() {
    const searchInput = document.getElementById('search-input');
    const entityFilter = document.getElementById('entity-filter');

    // Search filter
    searchInput.addEventListener('input', function() {
        applyFilters();
    });

    // Entity type filter
    entityFilter.addEventListener('change', function() {
        applyFilters();
    });
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const entityType = document.getElementById('entity-filter').value;

    filteredLogs = allLogs.filter(log => {
        // Search filter
        const matchesSearch = 
            (log.user_name && log.user_name.toLowerCase().includes(searchTerm)) ||
            (log.username && log.username.toLowerCase().includes(searchTerm)) ||
            (log.action && log.action.toLowerCase().includes(searchTerm)) ||
            (log.entity_type && log.entity_type.toLowerCase().includes(searchTerm)) ||
            (log.entityType && log.entityType.toLowerCase().includes(searchTerm)) ||
            (log.details && log.details.toLowerCase().includes(searchTerm)) ||
            (log.description && log.description.toLowerCase().includes(searchTerm));

        // Entity type filter
        const matchesEntity = 
            entityType === 'all' || 
            log.entity_type === entityType ||
            log.entityType === entityType;

        return matchesSearch && matchesEntity;
    });

    // Reset to first page
    currentPage = 1;
    displayLogs();
}

// Initialize pagination
function initializePagination() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayLogs();
            scrollToTop();
        }
    });

    nextBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayLogs();
            scrollToTop();
        }
    });
}

// Update pagination UI
function updatePagination(totalPages) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;

    // Enable/disable buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Show/hide loading state
function showLoading(show) {
    const loadingState = document.getElementById('loading-state');
    if (show) {
        loadingState.classList.remove('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

// Show/hide empty state
function showEmptyState(show) {
    const emptyState = document.getElementById('empty-state');
    if (show) {
        emptyState.classList.add('active');
    } else {
        emptyState.classList.remove('active');
    }
}

// Scroll to top of table
function scrollToTop() {
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Helper function to create audit log (for use in other pages)
export async function createAuditLog(logData) {
    try {
        const currentUser = sessionStorage.getItem('currentUser');
        const userDataString = sessionStorage.getItem('userData');
        
        let userData = { firstName: 'System', lastName: '', role: 'system' };
        if (userDataString) {
            userData = JSON.parse(userDataString);
        }

        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const auditLog = {
            timestamp: new Date().toISOString(),
            user_name: `${userData.firstName} ${userData.lastName}`.trim(),
            username: currentUser || 'system',
            user_role: userData.role || 'system',
            action: logData.action,
            entity_type: logData.entity_type,
            entity_id: logData.entity_id || null,
            details: logData.details || '',
            ip_address: logData.ip_address || 'N/A',
            user_agent: navigator.userAgent || 'N/A'
        };

        await set(ref(database, `audit_logs/${logId}`), auditLog);
        return true;
    } catch (error) {
        console.error('Error creating audit log:', error);
        return false;
    }
}

// Auto-refresh logs every 30 seconds
setInterval(async () => {
    await loadAuditLogs();
}, 30000);