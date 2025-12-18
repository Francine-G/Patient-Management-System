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

// Patient Details Modal
window.closePatientModal = function (event) { 
    const pm = document.getElementById('patientModal'); 
    if (pm) {
        if (!event || event.target.id === 'patientModal' || event.target.closest('.modal-close')) {
            pm.classList.remove('active'); 
            pm.style.display = ''; 
        }
    }
};

// Add Patient Modal
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

// Queue & Consultation Modals
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

window.openHistoryModal = function () {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.add('active');
};

window.closeHistoryModal = function (event) {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    // Close if clicked outside the content box or on the close button
    if (!event || (event.target.id === 'historyModal' || event.target.closest('.close-btn'))) {
        modal.classList.remove('active');
    }
};

window.openAddQueueModal = function(card = null) {
    const modal = document.getElementById('addQueueModal');
    const form = document.getElementById('addQueueForm');
    const modalTitle = modal.querySelector('.history-modal-header h2');

    // If card provided, we are editing; otherwise adding new
    if (card) {
        // Store reference to card being edited on the form element itself
        form.dataset.editingId = card.querySelector('.queue-card-number').textContent;
        
        // Extract data
        const nameDiv = card.querySelector('.queue-card-info div:nth-child(1)');
        const ageDiv = card.querySelector('.queue-card-info div:nth-child(2)');
        const notesDiv = card.querySelector('.queue-card-info div:nth-child(3)');

        const name = nameDiv ? nameDiv.textContent.replace('Name:', '').trim() : '';
        const age = ageDiv ? ageDiv.textContent.replace('Age:', '').trim() : '';
        const notes = notesDiv ? notesDiv.textContent.replace('Notes:', '').trim() : '';

        document.getElementById('patientName').value = name;
        document.getElementById('patientAge').value = age;
        document.getElementById('patientNotes').value = notes;
        modalTitle.textContent = 'Edit Queue Entry';
    } else {
        delete form.dataset.editingId;
        form.reset();
        modalTitle.textContent = 'Add to Queue';
    }
    modal.classList.add('active');
};

window.closeAddQueueModal = function() {
    const modal = document.getElementById('addQueueModal');
    if (modal) modal.classList.remove('active');
};

// Global Click Outside Handler
window.closeModalOnOutsideClick = function (event) { 
    if (event.target.id === 'patientModal') window.closePatientModal(event);
    if (event.target.id === 'addPatientModal') window.closeAddPatientModal(event);
    if (event.target.id === 'consultationModal') window.closeConsultationModal(event);
    if (event.target.id === 'historyModal') window.closeHistoryModal(event);
};

// --- 2. DOM CONTENT LOADED ---
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();

    // A. Navigation Highlight
    const navLinks = Array.from(document.querySelectorAll('.navigation-menu .nav-link'));
    navLinks.forEach(l => {
        l.classList.remove('active');
        const href = l.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'Dashboard.html')) {
            setTimeout(() => l.classList.add('active'), 50);
        }
    });

    // B. Queue Specific Logic (Only runs if Queue elements exist)
    const queueContainer = document.querySelector('.queue-cards-container');
    if (queueContainer) {
        initializeQueueLogic();
    }

    // C. Add Record Button (Patient Records Page)
    const addRecordBtn = document.querySelector('.add-record-btn');
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', () => window.openAddPatientModal());
    }

    // D. Sidebar Toggle
    initSidebar();
});

// --- 3. QUEUE LOGIC HELPER ---
function initializeQueueLogic() {
    // Bind Drag & Drop for existing cards
    bindQueueCards();

    // MutationObserver to bind new cards automatically
    const container = document.querySelector('.queue-cards-container');
    if (container && window.MutationObserver) {
        const mo = new MutationObserver(() => bindQueueCards());
        mo.observe(container, { childList: true, subtree: false });
    }

    // Add Queue Button
    const addQueueBtn = document.getElementById('add-queue-btn');
    if (addQueueBtn) {
        addQueueBtn.addEventListener('click', () => window.openAddQueueModal());
    }

    // Add Queue Form Submit
    const addQueueForm = document.getElementById('addQueueForm');
    if (addQueueForm) {
        addQueueForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const pName = document.getElementById('patientName').value.trim();
            const pAge = document.getElementById('patientAge').value.trim();
            const pNotes = document.getElementById('patientNotes').value.trim();

            if (!pName) return;

            const editingId = this.dataset.editingId; // Check if we are editing

            if (editingId) {
                // Find existing card
                const cards = Array.from(document.querySelectorAll('.queue-card'));
                const card = cards.find(c => c.querySelector('.queue-card-number').textContent === editingId);
                
                if (card) {
                    const infoDivs = card.querySelectorAll('.queue-card-info div');
                    if (infoDivs[0]) infoDivs[0].innerHTML = `<strong>Name:</strong> ${pName}`;
                    if (infoDivs[1]) infoDivs[1].innerHTML = `<strong>Age:</strong> ${pAge}`;
                    if (infoDivs[2]) infoDivs[2].innerHTML = `<strong>Notes:</strong> ${pNotes}`;
                }
            } else {
                // Create New Card
                const numbers = Array.from(document.querySelectorAll('.queue-card-number'))
                    .map(el => parseInt(el.textContent.replace('Q-', ''), 10))
                    .filter(n => !isNaN(n));
                const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
                const qId = `Q-${String(nextNum).padStart(3, '0')}`;

                const newCard = document.createElement('div');
                newCard.className = 'queue-card';
                newCard.innerHTML = `
                    <div class="queue-card-header">
                        <span class="queue-card-number">${qId}</span>
                        <span class="queue-card-badge">Walk-in</span>
                    </div>
                    <div class="queue-card-info">
                        <div><strong>Name:</strong> ${pName}</div>
                        <div><strong>Age:</strong> ${pAge}</div>
                        <div><strong>Notes:</strong> ${pNotes}</div>
                    </div>
                `;
                document.querySelector('.queue-cards-container').appendChild(newCard);
            }
            window.closeAddQueueModal();
        });
    }

    // Done Button Logic
    const doneBtn = document.querySelector('.done-btn');
    if (doneBtn) {
        doneBtn.addEventListener('click', function() {
            const detailsPanel = document.querySelector('.queue-details');
            const qNumEl = detailsPanel.querySelector('.queue-number');
            const qnum = qNumEl ? qNumEl.textContent.trim() : '';
            
            if (!qnum) return;

            // Remove card from list
            const cards = Array.from(document.querySelectorAll('.queue-card'));
            const target = cards.find(c => c.querySelector('.queue-card-number').textContent.trim() === qnum);
            if (target) target.remove();

            // Clear Details Panel
            qNumEl.textContent = '';
            detailsPanel.querySelector('.status-badge').textContent = '';
            const spans = detailsPanel.querySelectorAll('.patient-info-row span');
            if(spans[0]) spans[0].innerHTML = '<strong>Name:</strong> ';
            if(spans[1]) spans[1].innerHTML = '<strong>Sex:</strong> ';
            if(spans[2]) spans[2].innerHTML = '<strong>DOB:</strong> ';
            
            // Clear extra sections
            detailsPanel.querySelectorAll('.section-content').forEach(el => el.textContent = '');
            const files = detailsPanel.querySelector('.files-list');
            if(files) files.innerHTML = '';
        });
    }

    // Consultation Form
    const consultForm = document.getElementById('consultationForm');
    if (consultForm) {
        consultForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Consultation saved successfully!');
            window.closeConsultationModal();
        });
    }
}

// Helper: Bind Draggable Events to Cards
function bindQueueCards() {
    const cards = document.querySelectorAll('.queue-card');
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        // Click to Edit
        card.onclick = (e) => {
            // Only open if not dragging
            if (!card.classList.contains('dragging')) window.openAddQueueModal(card);
        };

        // Drag Start
        card.ondragstart = (e) => {
            // e.stopPropagation(); // Optional depending on CSS
            card.classList.add('dragging');
            
            // Extract Data
            const qNum = card.querySelector('.queue-card-number').textContent;
            const badge = card.querySelector('.queue-card-badge').textContent;
            const infoDivs = card.querySelectorAll('.queue-card-info div');
            const name = infoDivs[0].textContent.replace('Name:', '').trim();
            const age = infoDivs[1].textContent.replace('Age:', '').trim();
            const notes = infoDivs[2].textContent.replace('Notes:', '').trim();

            const data = { queueNumber: qNum, badgeText: badge, name, age, notes };
            e.dataTransfer.setData('application/json', JSON.stringify(data));
        };

        // Drag End
        card.ondragend = () => card.classList.remove('dragging');
    });

    // Drop Zone (Details Panel)
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
        if (spans[1]) spans[1].innerHTML = `<strong>Sex:</strong> ${payload.age}`; // Mapping Age to Sex slot based on your HTML structure
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