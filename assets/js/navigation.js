import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- HELPER: Create Audit Log ---
async function createAuditLog(action, details, entityId) {
    try {
        const auditsRef = ref(database, 'audits');
        const snapshot = await get(auditsRef);
        let nextIndex = 1;

        if (snapshot.exists()) {
            const keys = Object.keys(snapshot.val());
            const indices = keys
                .filter(key => key.startsWith('a_'))
                .map(key => parseInt(key.split('_')[1]))
                .filter(num => !isNaN(num));

            if (indices.length > 0) nextIndex = Math.max(...indices) + 1;
        }

        const auditId = `a_${nextIndex}`;
        const user = sessionStorage.getItem('username') || 'dr_francine';
        const role = sessionStorage.getItem('role') || 'Doctor';

        await set(ref(database, `audits/${auditId}`), {
            action: action,
            details: details,
            entity: entityId,
            role: role,
            timestamp: new Date().toLocaleString(),
            user: user
        });
    } catch (error) {
        console.error("Audit Log Error:", error);
    }
}

// --- 1. GLOBAL MODAL FUNCTIONS ---

window.closePatientModal = function (event) { 
    const pm = document.getElementById('patientModal'); 
    if (pm) {
        if (!event || event.target.id === 'patientModal' || event.target.closest('.modal-close')) {
            pm.classList.remove('active'); 
            pm.style.display = ''; 
        }
    }
};

window.openAddPatientModal = function () {
    const modal = document.getElementById('addPatientModal');
    if (modal) modal.classList.add('active');
};

window.closeAddPatientModal = function (event) {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        if (!event || event.target.id === 'addPatientModal' || event.target.closest('.form-close')) {
            modal.classList.remove('active');
            modal.style.display = '';
            const form = document.getElementById('patientForm');
            if (form) form.reset();
        }
    }
};

window.openConsultationModal = function () {
    const modal = document.getElementById('consultationModal');
    if (modal) modal.classList.add('active');
};

window.closeConsultationModal = function (event) {
    const modal = document.getElementById('consultationModal');
    if (!modal) return;
    if (!event || event.target.id === 'consultationModal') {
        modal.classList.remove('active');
        const form = document.getElementById('consultationForm');
        if (form) form.reset();
    }
};

window.handleConsultation = async function (event) {
    event.preventDefault();
    alert('Consultation details saved successfully!');
    window.closeConsultationModal();
};

window.openHistoryModal = function () {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.add('active');
};

window.closeHistoryModal = function (event) {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    if (!event || (event.target.id === 'historyModal' || event.target.closest('.close-btn'))) {
        modal.classList.remove('active');
    }
};

window.openAddQueueModal = function(card = null) {
    const modal = document.getElementById('addQueueModal');
    const form = document.getElementById('addQueueForm');
    const modalTitle = modal.querySelector('.history-modal-header h2');

    if (card) {
        // Edit Mode
        form.dataset.editingId = card.querySelector('.queue-card-number').textContent;
        const name = card.querySelector('.queue-card-info div:nth-child(1)').textContent.replace('Name:', '').trim();
        const age = card.querySelector('.queue-card-info div:nth-child(2)').textContent.replace('Age:', '').trim();
        const notes = card.querySelector('.queue-card-info div:nth-child(3)').textContent.replace('Notes:', '').trim();

        document.getElementById('patientName').value = name;
        document.getElementById('patientAge').value = age;
        document.getElementById('patientNotes').value = notes;
        modalTitle.textContent = 'Edit Queue Entry';
    } else {
        // Add Mode
        delete form.dataset.editingId;
        delete form.dataset.linkedPatientId; // Clear any previous link
        form.reset();
        modalTitle.textContent = 'Add to Queue';
    }
    modal.classList.add('active');
};

window.closeAddQueueModal = function() {
    const modal = document.getElementById('addQueueModal');
    if (modal) modal.classList.remove('active');
};

// --- FIX: Logic to open "Get from Patient Records" Modal and Fetch Data ---
window.openGetPatientRecordsModal = async function() {
    const modal = document.getElementById('getPatientRecordsModal');
    const listContainer = modal.querySelector('.patient-records-list');
    
    // Clear list and show loading
    listContainer.innerHTML = '<p style="padding:10px; color:#666;">Loading patients...</p>';
    modal.classList.add('active');

    try {
        const patientsRef = ref(database, 'patients');
        const snapshot = await get(patientsRef);

        if (snapshot.exists()) {
            listContainer.innerHTML = ''; // Clear loading message
            const data = snapshot.val();
            
            // Generate list items from database
            Object.keys(data).forEach(key => {
                const patient = data[key];
                const birthYear = patient.birthDate ? new Date(patient.birthDate).getFullYear() : null;
                const currentYear = new Date().getFullYear();
                const age = birthYear ? currentYear - birthYear : 'N/A';

                const item = document.createElement('div');
                item.className = 'patient-record-item';
                item.setAttribute('data-id', key); // Store ID (p_1, p_2)
                item.setAttribute('data-name', patient.name);
                item.setAttribute('data-age', age);
                
                // Display Name and ID
                item.innerHTML = `<strong>${patient.name}</strong> <span style="font-size:0.8em; color:#666;">(${key})</span>`;
                
                // Click handler to select this patient
                item.onclick = function() {
                    const form = document.getElementById('addQueueForm');
                    
                    document.getElementById('patientName').value = patient.name;
                    document.getElementById('patientAge').value = age;
                    
                    // Store the linked ID on the form
                    form.dataset.linkedPatientId = key; 
                    
                    window.closeGetPatientRecordsModal();
                };

                listContainer.appendChild(item);
            });
        } else {
            listContainer.innerHTML = '<p style="padding:10px;">No patients found.</p>';
        }
    } catch (error) {
        console.error("Error fetching patients:", error);
        listContainer.innerHTML = '<p style="padding:10px; color:red;">Error loading data.</p>';
    }
};

window.closeGetPatientRecordsModal = function() {
    const modal = document.getElementById('getPatientRecordsModal');
    if (modal) modal.classList.remove('active');
};

window.closeModalOnOutsideClick = function (event) { 
    if (event.target.id === 'patientModal') window.closePatientModal(event);
    if (event.target.id === 'addPatientModal') window.closeAddPatientModal(event);
    if (event.target.id === 'consultationModal') window.closeConsultationModal(event);
    if (event.target.id === 'historyModal') window.closeHistoryModal(event);
    if (event.target.id === 'getPatientRecordsModal') window.closeGetPatientRecordsModal();
};

// --- 2. DOM CONTENT LOADED ---
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();

    const navLinks = Array.from(document.querySelectorAll('.navigation-menu .nav-link'));
    navLinks.forEach(l => {
        l.classList.remove('active');
        const href = l.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'Dashboard.html')) {
            setTimeout(() => l.classList.add('active'), 50);
        }
    });

    const queueContainer = document.querySelector('.queue-cards-container');
    if (queueContainer) {
        initializeQueueLogic();
    }

    const addRecordBtn = document.querySelector('.add-record-btn');
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', () => window.openAddPatientModal());
    }

    initSidebar();
});

// --- 3. QUEUE LOGIC HELPER ---
function initializeQueueLogic() {
    bindQueueCards();

    const container = document.querySelector('.queue-cards-container');
    if (container && window.MutationObserver) {
        const mo = new MutationObserver(() => bindQueueCards());
        mo.observe(container, { childList: true, subtree: false });
    }

    const addQueueBtn = document.getElementById('add-queue-btn');
    if (addQueueBtn) {
        addQueueBtn.addEventListener('click', () => window.openAddQueueModal());
    }

    const consultBtn = document.querySelector('.consult-btn');
    if (consultBtn) {
        consultBtn.addEventListener('click', () => window.openConsultationModal());
    }

    // Connect the "Get from Patient Records" button
    const getRecordsBtn = document.getElementById('get-patient-records-btn');
    if (getRecordsBtn) {
        getRecordsBtn.addEventListener('click', () => window.openGetPatientRecordsModal());
    }

    // --- ADD QUEUE FORM SUBMIT (with Linking) ---
    const addQueueForm = document.getElementById('addQueueForm');
    if (addQueueForm) {
        addQueueForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const pName = document.getElementById('patientName').value.trim();
            const pAge = document.getElementById('patientAge').value.trim();
            const pNotes = document.getElementById('patientNotes').value.trim();
            
            // Retrieve the linked ID if it was set
            const linkedId = this.dataset.linkedPatientId || ""; 

            if (!pName) return;

            try {
                const queueRef = ref(database, 'queue');
                const snapshot = await get(queueRef);
                let nextIndex = 1;

                if (snapshot.exists()) {
                    const keys = Object.keys(snapshot.val());
                    const indices = keys
                        .filter(key => key.startsWith('q_'))
                        .map(key => parseInt(key.split('_')[1]))
                        .filter(num => !isNaN(num));

                    if (indices.length > 0) nextIndex = Math.max(...indices) + 1;
                }

                const newId = `q_${nextIndex}`;
                const newQueueItem = {
                    name: pName,
                    age: pAge,
                    note: pNotes,
                    type: "walk-in",
                    timestamp: new Date().toISOString(),
                    patientId: linkedId // Save the link (e.g., "p_1") or empty string
                };

                // 1. Save to Queue
                await set(ref(database, `queue/${newId}`), newQueueItem);

                // 2. Audit
                const details = linkedId 
                    ? `Added linked patient (${linkedId}) ${pName} to queue.` 
                    : `Added walk-in ${pName} to queue.`;
                
                await createAuditLog("Add to Queue", details, newId);

                alert(`Successfully added ${pName} to the queue!`);
                window.closeAddQueueModal();

            } catch (error) {
                console.error("Queue Add Error:", error);
                alert("Failed to add to queue.");
            }
        });
    }

    // --- DONE BUTTON LOGIC ---
    const doneBtn = document.querySelector('.done-btn');
    if (doneBtn) {
        doneBtn.addEventListener('click', async function() {
            const detailsPanel = document.querySelector('.queue-details');
            const qNumEl = detailsPanel.querySelector('.queue-number');
            const qDisplayId = qNumEl ? qNumEl.textContent.trim() : '';
            
            const nameEl = detailsPanel.querySelector('.patient-info-row span:first-child');
            const patientName = nameEl ? nameEl.textContent.replace('Name:', '').trim() : 'Unknown';
            
            if (!qDisplayId) return;

            const idNumber = parseInt(qDisplayId.replace('Q-', ''), 10);
            const dbId = `q_${idNumber}`;

            if (confirm(`Mark ${patientName} (${qDisplayId}) as done?`)) {
                try {
                    await set(ref(database, `queue/${dbId}`), null);
                    await createAuditLog("Queue Done", `Marked ${patientName} (${qDisplayId}) as completed.`, dbId);
                    
                    qNumEl.textContent = '';
                    detailsPanel.querySelector('.status-badge').textContent = '';
                    const spans = detailsPanel.querySelectorAll('.patient-info-row span');
                    if(spans[0]) spans[0].innerHTML = '<strong>Name:</strong> ';
                    if(spans[1]) spans[1].innerHTML = '<strong>Sex:</strong> ';
                    
                    detailsPanel.querySelectorAll('.section-content').forEach(el => el.textContent = '');
                    const files = detailsPanel.querySelector('.files-list');
                    if(files) files.innerHTML = '';

                } catch (error) {
                    console.error("Queue Remove Error:", error);
                    alert("Failed to update queue.");
                }
            }
        });
    }
}

// Helper: Bind Draggable Events to Cards
function bindQueueCards() {
    const cards = document.querySelectorAll('.queue-card');
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.onclick = (e) => {
            if (!card.classList.contains('dragging')) window.openAddQueueModal(card);
        };

        card.ondragstart = (e) => {
            card.classList.add('dragging');
            const qNum = card.querySelector('.queue-card-number').textContent;
            const badge = card.querySelector('.queue-card-badge').textContent;
            const infoDivs = card.querySelectorAll('.queue-card-info div');
            const name = infoDivs[0].textContent.replace('Name:', '').trim();
            const age = infoDivs[1].textContent.replace('Age:', '').trim();
            const notes = infoDivs[2].textContent.replace('Notes:', '').trim();

            const data = { queueNumber: qNum, badgeText: badge, name, age, notes };
            e.dataTransfer.setData('application/json', JSON.stringify(data));
        };

        card.ondragend = () => card.classList.remove('dragging');
    });

    const details = document.querySelector('.queue-details');
    if (details) {
        details.ondragover = (e) => { e.preventDefault(); details.classList.add('drag-over'); };
        details.ondragleave = () => details.classList.remove('drag-over');
        details.ondrop = (e) => {
            e.preventDefault();
            details.classList.remove('drag-over');
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data) populateDetails(data);
            } catch (err) { console.error('Drop error', err); }
        };
    }
}

function populateDetails(payload) {
    const details = document.querySelector('.queue-details');
    details.querySelector('.queue-number').textContent = payload.queueNumber;
    details.querySelector('.status-badge').textContent = payload.badgeText;
    
    const rows = details.querySelectorAll('.patient-info-row');
    if (rows[0]) {
        const spans = rows[0].querySelectorAll('span');
        if (spans[0]) spans[0].innerHTML = `<strong>Name:</strong> ${payload.name}`;
        if (spans[1]) spans[1].innerHTML = `<strong>Age:</strong> ${payload.age}`;
    }
    if (rows[1]) {
        rows[1].innerHTML = `<span><strong>Notes:</strong> ${payload.notes}</span>`;
    }
}

// --- 4. SIDEBAR HELPER ---
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    let toggle = document.querySelector('.sidebar-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '&#9776;';
        const header = document.querySelector('.header');
        if (header) header.insertBefore(toggle, header.firstChild);
        else document.body.appendChild(toggle);
    }

    const persisted = localStorage.getItem('sidebar-collapsed');
    if (persisted === 'true') { 
        document.body.classList.add('sidebar-collapsed'); 
        if (sidebar) sidebar.classList.add('collapsed'); 
    }

    toggle.onclick = () => {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        if (sidebar) sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    };
}