import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update, query, orderByChild, equalTo, orderByKey, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- AUDIT LOG HELPER ---
// --- HELPER: Ensure this function exists at the top of navigation.js ---
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

// --- DOM INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function () {
    const queueContainer = document.querySelector('.queue-cards-container');
    if (queueContainer) initializeQueueLogic();
    initSidebar();
    
    // Connect the "Add Record" button if it exists
    const addRecBtn = document.querySelector('.add-record-btn');
    if(addRecBtn) {
        addRecBtn.addEventListener('click', () => {
            if(window.openAddPatientModal) window.openAddPatientModal();
            else console.error("openAddPatientModal function is missing!");
        });
    }
});

// --- RESTORED: PATIENT MODAL FUNCTIONS ---
// These were missing in your previous file!
window.openAddPatientModal = function () {
    const modal = document.getElementById('addPatientModal');
    if (modal) modal.classList.add('active');
};

window.closeAddPatientModal = function (event) {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        // Close if clicked on overlay (ID match) or close button (class match)
        if (!event || event.target.id === 'addPatientModal' || event.target.closest('.form-close')) {
            modal.classList.remove('active');
            const form = document.getElementById('patientForm');
            if (form) form.reset();
        }
    }
};

window.closePatientModal = function (event) { 
    const pm = document.getElementById('patientModal'); 
    if (pm && (!event || event.target.id === 'patientModal' || event.target.closest('.modal-close'))) {
        pm.classList.remove('active'); 
        pm.style.display = ''; 
    }
};

// --- QUEUE LOGIC ---
function initializeQueueLogic() {
    bindQueueCards();
    setupDetailsPanel();
    setupAddQueueForm(); 

    const container = document.querySelector('.queue-cards-container');
    if (container && window.MutationObserver) {
        new MutationObserver(() => bindQueueCards()).observe(container, { childList: true, subtree: false });
    }
    const addQBtn = document.getElementById('add-queue-btn');
    if(addQBtn) addQBtn.addEventListener('click', () => window.openAddQueueModal());
    
    const getRecBtn = document.getElementById('get-patient-records-btn');
    if(getRecBtn) getRecBtn.addEventListener('click', () => window.openGetPatientRecordsModal());
}

// --- SETUP DETAILS PANEL ---
// --- SETUP DETAILS PANEL (Updated with Better Audit Log) ---
function setupDetailsPanel() {
    const details = document.querySelector('.queue-details');
    if (!details) return;

    // 1. Drag & Drop Logic
    details.ondragover = (e) => { e.preventDefault(); details.classList.add('drag-over'); };
    details.ondragleave = () => details.classList.remove('drag-over');
    
    details.ondrop = async (e) => {
        e.preventDefault();
        details.classList.remove('drag-over');
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!data) return;
            
            // Fill UI from Ticket Data
            details.querySelector('.queue-number').textContent = data.queueNumber;
            details.querySelector('.status-badge').textContent = data.badgeText;
            const rows = details.querySelectorAll('.patient-info-row');
            
            const pid = data.pid;
            details.dataset.currentPid = pid;

            // Fetch Live Patient Data
            if (pid) {
                try {
                    const patientRef = ref(database, `patients/${pid}`);
                    const snapshot = await get(patientRef);
                    
                    if (snapshot.exists()) {
                        const pData = snapshot.val();
                        if(rows[0]) {
                            rows[0].innerHTML = `
                                <span><strong>Name:</strong> ${pData.name}</span> 
                                <span><strong>Sex:</strong> ${pData.sex || '-'}</span>
                                <span><strong>DOB:</strong> ${pData.birthDate || '-'}</span>
                            `;
                        }
                        if(rows[1]) rows[1].innerHTML = `<span><strong>Notes:</strong> ${data.notes}</span>`;

                        const sections = details.querySelectorAll('.section-content');
                        if (sections[0]) sections[0].textContent = pData.allergies || "No known allergies.";
                        if (sections[1]) sections[1].textContent = pData.medHistory || "No medical history recorded.";
                    } else {
                        // Fallback
                        if(rows[0]) rows[0].innerHTML = `<span><strong>Name:</strong> ${data.name}</span>`;
                    }
                } catch (err) { console.error("Fetch error", err); }
            }
            addHistoryEntry(data.name, data.queueNumber, 'Viewed');
        } catch (err) { console.error('Drop error', err); }
    };

    // 2. Consult Button Logic
    const consultBtn = details.querySelector('.consult-btn');
    if (consultBtn) {
        const newBtn = consultBtn.cloneNode(true);
        consultBtn.parentNode.replaceChild(newBtn, consultBtn);
        newBtn.addEventListener('click', () => {
            const pid = details.dataset.currentPid;
            if (!pid) { alert("Please drag a patient card here first."); return; }
            window.openConsultationModal();
        });
    }
    
    // 3. DONE BUTTON LOGIC (Removes Queue & Creates Audit)
    const doneBtn = details.querySelector('.done-btn');
    if (doneBtn) {
        const newDone = doneBtn.cloneNode(true);
        doneBtn.parentNode.replaceChild(newDone, doneBtn);
        
        newDone.addEventListener('click', async function() {
             const qNumEl = details.querySelector('.queue-number');
             const qDisplayId = qNumEl ? qNumEl.textContent.trim() : '';
             
             if(!qDisplayId) return;

             // EXTRACT PATIENT NAME FOR AUDIT
             // We look at the first span in the info row to find the name
             let patientName = "Unknown";
             const nameContainer = details.querySelector('.patient-info-row span:first-child');
             if (nameContainer) {
                 // Removes the bold "Name:" label to get just the text
                 patientName = nameContainer.textContent.replace('Name:', '').trim();
             }

             const idNumber = parseInt(qDisplayId.replace('Q-', ''), 10);
             const dbId = `q_${idNumber}`;

             if(confirm(`Mark ${qDisplayId} (${patientName}) as done?`)) {
                 try {
                     // A. REMOVE FROM DATABASE
                     await set(ref(database, `queue/${dbId}`), null);
                     
                     // B. CREATE DETAILED AUDIT LOG
                     await createAuditLog(
                         "Queue Done", 
                         `Completed appointment for ${patientName} (${qDisplayId})`, 
                         dbId
                     );
                     
                     // C. RESET UI
                     qNumEl.textContent = '';
                     details.querySelector('.status-badge').textContent = '';
                     delete details.dataset.currentPid;
                     
                     const rows = details.querySelectorAll('.patient-info-row');
                     if(rows[0]) rows[0].innerHTML = "<span><strong>Name:</strong> </span><span><strong>Sex:</strong> </span><span><strong>DOB:</strong> </span>";
                     if(rows[1]) rows[1].innerHTML = "<span><strong>Notes:</strong> </span>";
                     
                     const sections = details.querySelectorAll('.section-content');
                     sections.forEach(s => s.textContent = '');

                 } catch(e) { 
                     console.error("Error completing queue:", e); 
                 }
             }
        });
    }
}

// --- OPEN CONSULTATION MODAL ---
window.openConsultationModal = async function () {
    const modal = document.getElementById('consultationModal');
    const form = document.getElementById('consultationForm');
    const summaryDiv = modal.querySelector('.consultation-summary');
    const details = document.querySelector('.queue-details');
    const currentPid = details.dataset.currentPid;

    form.reset();
    form.querySelector('input[type="date"]').valueAsDate = new Date();
    modal.classList.add('active');

    if(summaryDiv) {
        const divs = summaryDiv.querySelectorAll('div');
        divs[0].innerHTML = `<strong>Date:</strong> -`;
        divs[1].innerHTML = `<strong>Weight:</strong> -`;
        divs[2].innerHTML = `<strong>Diagnosis:</strong> -`;
        divs[3].innerHTML = `<strong>Notes:</strong> -`;
        divs[4].innerHTML = `<strong>Medication:</strong> -`;
    }

    if (currentPid) {
        try {
            const patientRef = ref(database, `patients/${currentPid}`);
            const snapshot = await get(patientRef);
            if (snapshot.exists()) {
                const pData = snapshot.val();
                if (summaryDiv) {
                    const divs = summaryDiv.querySelectorAll('div');
                    divs[0].innerHTML = `<strong>Date:</strong> ${pData.conDate || '-'}`;
                    divs[1].innerHTML = `<strong>Weight:</strong> ${pData.conWeight || '-'}`;
                    divs[2].innerHTML = `<strong>Diagnosis:</strong> ${pData.conDiag || '-'}`;
                    divs[3].innerHTML = `<strong>Notes:</strong> ${pData.conNotes || '-'}`;
                    divs[4].innerHTML = `<strong>Medication:</strong> ${pData.conMed || '-'}`;
                }
            }
        } catch (error) { console.error("Consult fetch error:", error); }
    }
};

window.closeConsultationModal = () => document.getElementById('consultationModal').classList.remove('active');

// --- SUBMIT CONSULTATION ---
// --- SUBMIT CONSULTATION (With Audit) ---
window.handleConsultation = async function (event) {
    event.preventDefault();
    const form = document.getElementById('consultationForm');
    const inputs = form.elements;
    const details = document.querySelector('.queue-details');
    const currentPid = details.dataset.currentPid;

    if (!currentPid || currentPid === "unknown") {
        alert("Error: No patient linked.");
        return;
    }

    const consultData = {
        conDate: inputs[0].value,
        conWeight: inputs[1].value,
        conDiag: inputs[2].value,
        conNotes: inputs[3].value,
        conMed: inputs[4].value,
        lastVisit: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        lastCheck: "Consultation"
    };

    try {
        // 1. Update the Patient Record
        const patientRef = ref(database, `patients/${currentPid}`);
        await update(patientRef, consultData);

        // 2. Create the Audit Log
        // We include the diagnosis in the log for better tracking
        const auditDetail = `Consultation submitted for ${currentPid}. Diagnosis: ${consultData.conDiag || "None"}`;
        await createAuditLog("Consultation", auditDetail, currentPid);

        alert('Consultation saved successfully!');
        window.closeConsultationModal();
        
        // Optional: Refresh grid if on patient records page
        if (typeof loadPatients === 'function') loadPatients();

    } catch (error) {
        console.error("Save Error:", error);
        alert("Failed to save: " + error.message);
    }
};

// --- ADD QUEUE FORM ---
function setupAddQueueForm() {
    const addQueueForm = document.getElementById('addQueueForm');
    if (!addQueueForm) return;

    addQueueForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const pName = document.getElementById('patientName').value.trim();
        const pAge = document.getElementById('patientAge').value.trim();
        const pNotes = document.getElementById('patientNotes').value.trim();
        const linkedId = this.dataset.linkedPatientId || ""; 

        if (!pName) return;

        try {
            const queueRef = ref(database, 'queue');
            const snap = await get(queueRef);
            let nextIndex = 1;
            if (snap.exists()) {
                const indices = Object.keys(snap.val()).filter(k => k.startsWith('q_')).map(k => parseInt(k.split('_')[1])).filter(n => !isNaN(n));
                if (indices.length > 0) nextIndex = Math.max(...indices) + 1;
            }
            
            await set(ref(database, `queue/q_${nextIndex}`), {
                name: pName, age: pAge, note: pNotes, type: "walk-in",
                timestamp: new Date().toISOString(), patientId: linkedId
            });
            
            await createAuditLog("Add to Queue", `Added ${pName}`, `q_${nextIndex}`);
            alert(`Added to queue!`);
            window.closeAddQueueModal();
        } catch (error) { console.error(error); alert("Error adding to queue."); }
    });
}

function bindQueueCards() {
    document.querySelectorAll('.queue-card').forEach(card => {
        if (card.dataset.bound === "true") return;
        card.dataset.bound = "true";
        card.setAttribute('draggable', 'true');
        card.onclick = (e) => { if(!card.classList.contains('dragging')) window.openAddQueueModal(card); };
        card.ondragstart = (e) => {
            card.classList.add('dragging');
            const data = {
                queueNumber: card.querySelector('.queue-card-number').textContent,
                badgeText: card.querySelector('.queue-card-badge').textContent,
                name: card.querySelector('.queue-card-info div:nth-child(1)').textContent.replace('Name:', '').trim(),
                age: card.querySelector('.queue-card-info div:nth-child(2)').textContent.replace('Age:', '').trim(),
                notes: card.querySelector('.queue-card-info div:nth-child(3)').textContent.replace('Notes:', '').trim(),
                pid: card.getAttribute('data-pid') || ""
            };
            e.dataTransfer.setData('application/json', JSON.stringify(data));
        };
        card.ondragend = () => card.classList.remove('dragging');
    });
}

function addHistoryEntry(name, qnum, status) {
    const body = document.querySelector('.history-modal .history-modal-body');
    if(!body) return;
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<span class="history-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><span class="history-patient">${name}</span><span class="history-status">${status}</span>`;
    body.insertBefore(div, body.firstChild);
}

// Modal Helpers
window.openAddQueueModal = (c) => { 
    document.getElementById('addQueueModal').classList.add('active'); 
    if(!c) { document.getElementById('addQueueForm').reset(); delete document.getElementById('addQueueForm').dataset.linkedPatientId; }
};
window.closeAddQueueModal = () => document.getElementById('addQueueModal').classList.remove('active');
window.openHistoryModal = () => document.getElementById('historyModal').classList.add('active');
window.closeHistoryModal = () => document.getElementById('historyModal').classList.remove('active');

window.openGetPatientRecordsModal = async () => {
    const modal = document.getElementById('getPatientRecordsModal');
    const list = modal.querySelector('.patient-records-list');
    list.innerHTML = 'Loading...';
    modal.classList.add('active');
    try {
        const snap = await get(ref(database, 'patients'));
        if(snap.exists()){
            list.innerHTML = '';
            const d = snap.val();
            Object.keys(d).forEach(k => {
                const div = document.createElement('div');
                div.className = 'patient-record-item';
                div.innerText = `${d[k].name} (${k})`;
                div.onclick = () => {
                    document.getElementById('patientName').value = d[k].name;
                    let age = d[k].age || "N/A";
                    document.getElementById('patientAge').value = age;
                    document.getElementById('addQueueForm').dataset.linkedPatientId = k;
                    document.getElementById('getPatientRecordsModal').classList.remove('active');
                };
                list.appendChild(div);
            });
        } else { list.innerHTML = "No patients found"; }
    } catch(e) { list.innerHTML = "Error loading"; }
};
window.closeGetPatientRecordsModal = () => document.getElementById('getPatientRecordsModal').classList.remove('active');
window.closeModalOnOutsideClick = (e) => {
    if(e.target.classList.contains('add-queue-modal') || e.target.classList.contains('consultation-modal') || e.target.classList.contains('history-modal')) e.target.classList.remove('active');
};
window.initSidebar = function() { /* Sidebar Logic */ };