import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let selectedQueueItem = null;
let completedCount = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    loadQueue();
    initializeEventHandlers();
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

// Load queue from Firebase with real-time updates
const loadQueue = () => {
    const queueRef = ref(database, 'queue');
    const container = document.querySelector('.queue-cards-container');

    onValue(queueRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = '';

        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data).sort((a, b) => {
                const numA = parseInt(a.split('_')[1]);
                const numB = parseInt(b.split('_')[1]);
                return numA - numB;
            });

            keys.forEach(key => {
                const item = data[key];
                createQueueCard(key, item, container);
            });

            // Update stats
            updateQueueStats(keys.length);
        } else {
            container.innerHTML = `
                <div class="empty-queue">
                    <i class="fi fi-rr-inbox"></i>
                    <p>No patients in queue</p>
                </div>
            `;
            updateQueueStats(0);
        }
    });
};

// Create queue card with drag and drop
const createQueueCard = (id, data, container) => {
    const idNumber = id.split('_')[1];
    const displayId = `Q-${String(idNumber).padStart(3, '0')}`;
    const isAppt = data.type && data.type.toLowerCase().includes('appt');
    const badgeClass = isAppt ? 'appt' : 'walk-in';
    const badgeText = isAppt ? 'Appointment' : 'Walk-in';

    const card = document.createElement('div');
    card.className = 'queue-card';
    card.setAttribute('data-id', id);
    card.setAttribute('data-patient-id', data.patientId || '');
    card.setAttribute('draggable', 'true');
    
    // Store history data as attributes
    const hist = data.history || {};
    card.setAttribute('data-hist-date', hist.date || '-');
    card.setAttribute('data-hist-weight', hist.weight || '-');
    card.setAttribute('data-hist-diagnosis', hist.diagnosis || '-');
    card.setAttribute('data-hist-meds', hist.medication || '-');
    card.setAttribute('data-hist-notes', hist.notes || '-');
    
    // Calculate age if DOB provided
    let ageDisplay = data.age || 'N/A';
    if (data.birthDate) {
        const birthDate = new Date(data.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        ageDisplay = `${age} years`;
    }
    
    card.innerHTML = `
        <div class="queue-card-header">
            <span class="queue-card-number">${displayId}</span>
            <span class="queue-card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="queue-card-body">
            <div class="queue-card-info">
                <div class="info-row">
                    <i class="fi fi-rr-user"></i>
                    <span>${data.name || 'Unknown'}</span>
                </div>
                <div class="info-row">
                    <i class="fi fi-rr-calendar"></i>
                    <span>Age: ${ageDisplay}</span>
                </div>
                ${data.note ? `
                <div class="info-row notes">
                    <i class="fi fi-rr-document"></i>
                    <span>${data.note}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // Add click handler
    card.addEventListener('click', () => selectQueueItem(id, data, displayId));
    
    // Add drag handlers
    setupDragHandlers(card, id, data, displayId);

    container.appendChild(card);
};

// Setup drag and drop handlers
const setupDragHandlers = (card, id, data, displayId) => {
    // Drag start
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        const payload = {
            id: id,
            queueNumber: displayId,
            name: data.name || 'Unknown',
            age: data.age || 'N/A',
            type: data.type || 'Walk-in',
            note: data.note || '',
            patientId: data.patientId || '',
            history: data.history || {}
        };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    });

    // Drag end
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });
};

// Select queue item to show details
const selectQueueItem = (id, data, displayId) => {
    selectedQueueItem = { id, data, displayId };
    
    // Add to view history
    addHistoryEntry(data.name || 'Unknown', displayId, 'Viewed');
    
    // Remove active class from all cards
    document.querySelectorAll('.queue-card').forEach(c => c.classList.remove('active'));
    
    // Add active class to selected card
    const selectedCard = document.querySelector(`[data-id="${id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Show details panel
    const emptyState = document.querySelector('.empty-queue-state');
    const detailsContent = document.querySelector('.queue-details-content');
    
    if (emptyState) emptyState.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'block';
    
    // Populate details
    const isAppt = data.type && data.type.toLowerCase().includes('appt');
    const badgeText = isAppt ? 'Appointment' : 'Walk-in';
    const badgeClass = isAppt ? 'appt' : 'walk-in';
    
    const queueNumber = document.querySelector('.queue-number');
    const statusBadge = document.querySelector('.status-badge');
    
    if (queueNumber) queueNumber.textContent = displayId;
    if (statusBadge) {
        statusBadge.textContent = badgeText;
        statusBadge.className = `status-badge ${badgeClass}`;
    }
    
    // Update patient info
    document.getElementById('patient-name').textContent = data.name || '-';
    document.getElementById('patient-age').textContent = data.age || '-';
    document.getElementById('patient-type').textContent = badgeText;
    document.getElementById('patient-notes').textContent = data.note || 'No notes';
    
    // Load medical history if available
    loadMedicalHistory(data.patientId);
};

// Load medical history
const loadMedicalHistory = async (patientId) => {
    const historyContent = document.getElementById('medical-history');
    if (!historyContent || !patientId) {
        if (historyContent) {
            historyContent.innerHTML = '<p>No medical history available</p>';
        }
        return;
    }
    
    try {
        const patientRef = ref(database, `patients/${patientId}`);
        const snapshot = await get(patientRef);
        
        if (snapshot.exists()) {
            const patientData = snapshot.val();
            let historyHTML = '';
            
            if (patientData.allergies) {
                historyHTML += `<div class="history-item"><strong>Allergies:</strong> ${patientData.allergies}</div>`;
            }
            
            if (patientData.medHistory) {
                historyHTML += `<div class="history-item"><strong>Medical History:</strong> ${patientData.medHistory}</div>`;
            }
            
            if (historyHTML) {
                historyContent.innerHTML = historyHTML;
            } else {
                historyContent.innerHTML = '<p>No medical history recorded</p>';
            }
        } else {
            historyContent.innerHTML = '<p>Patient record not found</p>';
        }
    } catch (error) {
        console.error('Error loading medical history:', error);
        historyContent.innerHTML = '<p>Error loading medical history</p>';
    }
};

// Initialize event handlers
const initializeEventHandlers = () => {
    // Consult button
    const consultBtn = document.querySelector('.consult-btn');
    if (consultBtn) {
        consultBtn.addEventListener('click', handleConsult);
    }
    
    // Done button
    const doneBtn = document.querySelector('.done-btn');
    if (doneBtn) {
        doneBtn.addEventListener('click', handleDone);
    }
    
    // Add queue button
    const addQueueBtn = document.getElementById('add-queue-btn');
    if (addQueueBtn) {
        addQueueBtn.addEventListener('click', handleAddQueue);
    }
    
    // Setup drag and drop for details panel
    setupDetailsDropZone();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Listen for filter changes
    window.addEventListener('queueFilterChanged', handleFilterChange);
};

// Setup form handlers
const setupFormHandlers = () => {
    // Add Queue Form
    const addQueueForm = document.getElementById('addQueueForm');
    if (addQueueForm) {
        addQueueForm.addEventListener('submit', handleAddQueueSubmit);
    }
    
    // Clear fields button
    const clearBtn = document.getElementById('clear-fields-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('patientName').value = '';
            document.getElementById('patientAge').value = '';
            document.getElementById('patientNotes').value = '';
        });
    }
    
    // Get patient records button
    const getRecordsBtn = document.getElementById('get-patient-records-btn');
    if (getRecordsBtn) {
        getRecordsBtn.addEventListener('click', loadPatientRecords);
    }
    
    // Consultation form
    const consultForm = document.getElementById('consultationForm');
    if (consultForm) {
        consultForm.addEventListener('submit', handleConsultationSubmit);
    }
};

// Handle add queue form submission
const handleAddQueueSubmit = async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value.trim();
    const notes = document.getElementById('patientNotes').value.trim();
    
    if (!name || !age) {
        alert('Please enter patient name and age.');
        return;
    }
    
    try {
        // Get next queue number
        const queueRef = ref(database, 'queue');
        const snapshot = await get(queueRef);
        
        let nextIndex = 1;
        if (snapshot.exists()) {
            const keys = Object.keys(snapshot.val());
            const indices = keys.filter(k => k.startsWith('q_')).map(k => parseInt(k.split('_')[1]));
            nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : keys.length + 1;
        }
        
        const newQueueId = `q_${nextIndex}`;
        const displayQueueId = `Q-${String(nextIndex).padStart(3, '0')}`;
        
        const queueData = {
            name: name,
            age: age,
            note: notes,
            type: 'Walk-in',
            timestamp: new Date().toISOString(),
            addedBy: currentUserData ? currentUserData.username : 'system'
        };
        
        await set(ref(database, `queue/${newQueueId}`), queueData);
        
        // Create audit log
        await createAuditLog(
            'Add Queue',
            displayQueueId,
            `Added ${name} to queue as ${displayQueueId}`
        );
        
        alert('Patient added to queue successfully!');
        
        // Close modal and reset form
        document.getElementById('addQueueModal').classList.remove('active');
        document.getElementById('addQueueForm').reset();
        
    } catch (error) {
        console.error('Error adding to queue:', error);
        alert('Failed to add patient to queue. Please try again.');
    }
};

// Load patient records for selection
const loadPatientRecords = async () => {
    const modal = document.getElementById('getPatientRecordsModal');
    const listContainer = document.getElementById('patientRecordsList');
    
    if (!listContainer) return;
    
    modal.classList.add('active');
    listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Loading patient records...</p>';
    
    try {
        const patientsRef = ref(database, 'patients');
        const snapshot = await get(patientsRef);
        
        if (snapshot.exists()) {
            const patients = snapshot.val();
            const patientArray = Object.keys(patients).map(key => ({
                id: key,
                ...patients[key]
            }));
            
            listContainer.innerHTML = '';
            
            patientArray.forEach(patient => {
                const item = document.createElement('div');
                item.className = 'patient-record-item';
                item.textContent = `${patient.name} (${patient.age || 'N/A'})`;
                item.onclick = () => {
                    document.getElementById('patientName').value = patient.name;
                    document.getElementById('patientAge').value = patient.age || '';
                    document.getElementById('getPatientRecordsModal').classList.remove('active');
                };
                listContainer.appendChild(item);
            });
        } else {
            listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No patient records found</p>';
        }
    } catch (error) {
        console.error('Error loading patient records:', error);
        listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#ff0000;">Error loading patient records</p>';
    }
};

// Handle consultation form submission
const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedQueueItem) return;
    
    const consultData = {
        date: document.getElementById('consultDate').value,
        weight: document.getElementById('consultWeight').value,
        diagnosis: document.getElementById('consultDiagnosis').value,
        notes: document.getElementById('consultNotes').value,
        medication: document.getElementById('consultMedication').value,
        consultedBy: currentUserData ? currentUserData.username : 'system',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Save consultation to patient history
        const patientId = selectedQueueItem.data.patientId;
        if (patientId) {
            const historyId = `hist_${Date.now()}`;
            await set(ref(database, `patients/${patientId}/consultations/${historyId}`), consultData);
        }
        
        // Update queue item with consultation data
        await set(ref(database, `queue/${selectedQueueItem.id}/history`), consultData);
        
        // Create audit log
        await createAuditLog(
            'Consultation',
            selectedQueueItem.displayId,
            `Completed consultation for ${selectedQueueItem.displayId} - ${selectedQueueItem.data.name}`
        );
        
        // Add to history
        addHistoryEntry(selectedQueueItem.data.name, selectedQueueItem.displayId, 'Consulted');
        
        alert('Consultation saved successfully!');
        
        // Close modal
        document.getElementById('consultationModal').classList.remove('active');
        document.getElementById('consultationForm').reset();
        
        // Optionally mark as done
        if (confirm('Mark this patient as done and remove from queue?')) {
            await handleDone();
        }
        
    } catch (error) {
        console.error('Error saving consultation:', error);
        alert('Failed to save consultation. Please try again.');
    }
};

// Handle filter change
const handleFilterChange = (e) => {
    const filters = e.detail || [];
    const cards = document.querySelectorAll('.queue-card');
    
    if (filters.length === 0) {
        // Show all cards
        cards.forEach(card => card.style.display = 'block');
    } else {
        // Filter cards
        cards.forEach(card => {
            const badge = card.querySelector('.queue-card-badge');
            const badgeClass = badge ? badge.className : '';
            
            let shouldShow = false;
            filters.forEach(filter => {
                if (badgeClass.includes(filter)) {
                    shouldShow = true;
                }
            });
            
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }
};

// Add history entry
let historyEntries = [];
const addHistoryEntry = (patientName, queueNumber, action) => {
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    historyEntries.unshift({
        time: time,
        patient: patientName,
        queueNumber: queueNumber,
        action: action,
        timestamp: Date.now()
    });
    
    // Update history modal
    updateHistoryModal();
};

// Update history modal
const updateHistoryModal = () => {
    const historyBody = document.getElementById('historyModalBody');
    if (!historyBody) return;
    
    if (historyEntries.length === 0) {
        historyBody.innerHTML = `
            <div class="history-item">
                <span class="history-time">-</span>
                <span class="history-patient">No history yet</span>
                <span class="history-status">-</span>
            </div>
        `;
        return;
    }
    
    historyBody.innerHTML = historyEntries.map(entry => `
        <div class="history-item">
            <span class="history-time">${entry.time}</span>
            <span class="history-patient">${entry.patient} (${entry.queueNumber})</span>
            <span class="history-status">${entry.action}</span>
        </div>
    `).join('');
};

// Setup details panel as drop zone
const setupDetailsDropZone = () => {
    const detailsPanel = document.querySelector('.queue-details');
    if (!detailsPanel) return;

    // Prevent default drag behavior
    detailsPanel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        detailsPanel.classList.add('drag-over');
    });

    detailsPanel.addEventListener('dragleave', (e) => {
        if (e.target === detailsPanel) {
            detailsPanel.classList.remove('drag-over');
        }
    });

    detailsPanel.addEventListener('drop', (e) => {
        e.preventDefault();
        detailsPanel.classList.remove('drag-over');
        
        let payload = null;
        try {
            payload = JSON.parse(e.dataTransfer.getData('application/json'));
        } catch (err) {
            try {
                payload = JSON.parse(e.dataTransfer.getData('text/plain'));
            } catch (e2) {
                console.error('Failed to parse drop data');
                return;
            }
        }
        
        if (!payload || !payload.id) return;
        
        // Populate details from dragged card
        populateDetailsFromDrag(payload);
    });
};

// Populate details from drag data
const populateDetailsFromDrag = (payload) => {
    selectedQueueItem = {
        id: payload.id,
        data: {
            name: payload.name,
            age: payload.age,
            type: payload.type,
            note: payload.note,
            patientId: payload.patientId,
            history: payload.history || {}
        },
        displayId: payload.queueNumber
    };
    
    // Remove active class from all cards
    document.querySelectorAll('.queue-card').forEach(c => c.classList.remove('active'));
    
    // Add active class to dragged card
    const selectedCard = document.querySelector(`[data-id="${payload.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Show details panel
    const emptyState = document.querySelector('.empty-queue-state');
    const detailsContent = document.querySelector('.queue-details-content');
    
    if (emptyState) emptyState.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'block';
    
    // Populate details
    const isAppt = payload.type && payload.type.toLowerCase().includes('appt');
    const badgeText = isAppt ? 'Appointment' : 'Walk-in';
    const badgeClass = isAppt ? 'appt' : 'walk-in';
    
    const queueNumber = document.querySelector('.queue-number');
    const statusBadge = document.querySelector('.status-badge');
    
    if (queueNumber) queueNumber.textContent = payload.queueNumber;
    if (statusBadge) {
        statusBadge.textContent = badgeText;
        statusBadge.className = `status-badge ${badgeClass}`;
    }
    
    // Update patient info
    document.getElementById('patient-name').textContent = payload.name || '-';
    document.getElementById('patient-age').textContent = payload.age || '-';
    document.getElementById('patient-type').textContent = badgeText;
    document.getElementById('patient-notes').textContent = payload.note || 'No notes';
    
    // Load medical history if available
    loadMedicalHistory(payload.patientId);
};

// Handle consult button
const handleConsult = () => {
    if (!selectedQueueItem) {
        alert('Please select a patient from the queue first.');
        return;
    }
    
    // Open consultation modal
    const modal = document.getElementById('consultationModal');
    if (modal) {
        // Populate consultation summary
        document.getElementById('consult-patient-name').textContent = selectedQueueItem.data.name || '-';
        document.getElementById('consult-queue-number').textContent = selectedQueueItem.displayId || '-';
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('consultDate').value = today;
        
        modal.classList.add('active');
    }
};

// Handle done button
const handleDone = async () => {
    if (!selectedQueueItem) {
        alert('Please select a patient from the queue first.');
        return;
    }
    
    if (!confirm(`Mark ${selectedQueueItem.data.name} as done?`)) {
        return;
    }
    
    try {
        // Add to history before removing
        addHistoryEntry(selectedQueueItem.data.name, selectedQueueItem.displayId, 'Done');
        
        // Remove from queue
        await remove(ref(database, `queue/${selectedQueueItem.id}`));
        
        // Create audit log
        await createAuditLog(
            'Mark as Done',
            selectedQueueItem.displayId,
            `Completed consultation for ${selectedQueueItem.displayId} - ${selectedQueueItem.data.name}`
        );
        
        // Update completed count
        completedCount++;
        updateCompletedStats();
        
        // Clear selection
        selectedQueueItem = null;
        
        // Hide details panel
        const emptyState = document.querySelector('.empty-queue-state');
        const detailsContent = document.querySelector('.queue-details-content');
        
        if (emptyState) emptyState.style.display = 'flex';
        if (detailsContent) detailsContent.style.display = 'none';
        
        alert('Patient marked as done successfully!');
    } catch (error) {
        console.error('Error marking as done:', error);
        alert('Failed to update queue. Please try again.');
    }
};

// Handle add queue
const handleAddQueue = () => {
    const modal = document.getElementById('addQueueModal');
    if (modal) {
        modal.classList.add('active');
    }
};

// Update queue stats
const updateQueueStats = (count) => {
    const totalInQueue = document.getElementById('total-in-queue');
    if (totalInQueue) {
        totalInQueue.textContent = count;
    }
};

// Update completed stats
const updateCompletedStats = () => {
    const totalCompleted = document.getElementById('total-completed');
    if (totalCompleted) {
        totalCompleted.textContent = completedCount;
    }
};

// Create audit log
async function createAuditLog(action, entityType, details) {
    if (!currentUserData) return;
    
    try {
        const auditsRef = ref(database, 'audits');
        const snapshot = await get(auditsRef);
        
        let nextIndex = 1;
        if (snapshot.exists()) {
            const keys = Object.keys(snapshot.val());
            const indices = keys.filter(k => k.startsWith('a_')).map(k => parseInt(k.split('_')[1]));
            nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : keys.length + 1;
        }
        
        const newAuditId = `a_${nextIndex}`;
        
        const auditLog = {
            timestamp: new Date().toLocaleString(),
            user: currentUserData.username,
            role: currentUserData.role || 'User',
            action: action,
            entity: entityType,
            details: details
        };

        await set(ref(database, `audits/${newAuditId}`), auditLog);
        console.log('✅ Audit log created:', auditLog);
    } catch (error) {
        console.error('❌ Error creating audit log:', error);
    }
}

// Initialize
loadQueue();