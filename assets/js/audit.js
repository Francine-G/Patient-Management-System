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

document.addEventListener('DOMContentLoaded', async function() {
    // Check if audit-table-body exists before running
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return;

    await loadAuditLogs();
    initializeFilters();
    initializePagination();
});

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
                    ${log.timestamp || 'N/A'}
                </div>
            </td>
            <td class="user-cell">${log.user || 'System'}</td>
            <td>
                <span class="role-badge">${log.role || 'N/A'}</span>
            </td>
            <td>
                <span class="action-badge ${getActionClass(log.action)}">${log.action || 'Unknown'}</span>
            </td>
            <td>
                <span class="entity-badge">${log.entity || 'N/A'}</span>
            </td>
            <td class="details-cell">
                ${log.details || 'No details available'}
            </td>
        </tr>
    `).join('');

    updatePagination(totalPages);
}

// Get action class for styling
function getActionClass(action) {
    if (!action) return '';
    const actionLower = action.toLowerCase();
    if (actionLower.includes('add') || actionLower.includes('create')) return 'create';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'update';
    if (actionLower.includes('delete')) return 'delete';
    return 'view';
}

function initializeFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            filteredLogs = allLogs.filter(log => 
                (log.user && log.user.toLowerCase().includes(term)) ||
                (log.action && log.action.toLowerCase().includes(term)) ||
                (log.details && log.details.toLowerCase().includes(term))
            );
            currentPage = 1;
            displayLogs();
        });
    }
}

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

function initializePagination() {
    document.getElementById('prev-btn')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; displayLogs(); }
    });
    document.getElementById('next-btn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; displayLogs(); }
    });
}

function showLoading(show) {
    const loader = document.getElementById('loading-state');
    if (loader) loader.style.display = show ? 'block' : 'none';
}

function showEmptyState(show) {
    const empty = document.getElementById('empty-state');
    if (empty) empty.style.display = show ? 'block' : 'none';
}