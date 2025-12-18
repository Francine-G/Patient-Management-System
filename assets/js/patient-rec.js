import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- 1. Function to Load All Patients from Firebase ---
const loadPatients = async () => {
    const patientsRef = ref(database, 'patients');
    const patientGrid = document.querySelector('.patient-grid');

    try {
        const snapshot = await get(patientsRef);
        if (snapshot.exists()) {
            patientGrid.innerHTML = '';
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const patient = data[key];
                patient.id = key; 
                createPatientCard(patient);
            });
        } else {
            patientGrid.innerHTML = '<p>No records found.</p>';
        }
    } catch (error) {
        console.error("Error fetching patients:", error);
    }
};

// --- 2. Function to Generate the HTML Card ---
const createPatientCard = (patient) => {
    const patientGrid = document.querySelector('.patient-grid');
    const firstLetter = patient.name ? patient.name.charAt(0) : '?';

    const card = document.createElement('div');
    card.className = 'patient-card';
    card.onclick = () => openPatientModal(patient);

    card.innerHTML = `
        <div class="patient-avatar">${firstLetter}</div>
        <div class="patient-info">
            <h3>${patient.name}</h3>
            <div class="patient-detail"><strong>Patient ID:</strong> ${patient.id}</div>
            <div class="patient-detail"><strong>Last Visit:</strong> ${patient.lastVisit || 'N/A'}</div>
        </div>
        <button class="edit-btn" onclick="event.stopPropagation();">✏️</button>
    `;

    patientGrid.appendChild(card);
};

// --- 3. Updated Modal Function ---
window.openPatientModal = function(patient) {
    const modal = document.getElementById('patientModal');
    modal.classList.add('active');
    // Removed modal.style.display = 'flex' to prevent conflicts with CSS close logic

    document.getElementById('patientName').innerHTML = `<strong>Name:</strong> ${patient.name}`;
    document.getElementById('patientID').innerHTML = `<strong>Patient ID:</strong> ${patient.id}`;
    document.getElementById('patientSex').innerHTML = `<strong>Sex:</strong> ${patient.sex}`;
    document.getElementById('patientDOB').innerHTML = `<strong>DOB:</strong> ${patient.birthDate}`;
    document.getElementById('patientBlood').innerHTML = `<strong>Blood Type:</strong> ${patient.bloodType}`;

    document.getElementById('patientEmail').innerText = patient.email || 'N/A';
    document.getElementById('patientMobile').innerText = patient.mobileNum || 'N/A';

    document.getElementById('emergencyPers').innerText = patient.emergencyPers || 'N/A';
    document.getElementById('emergencyCon').innerText = patient.emergencyCon || 'N/A';

    document.getElementById('lastVisitDate').innerText = patient.lastVisit || 'N/A';
    document.getElementById('lastCheckType').innerText = patient.lastCheck || 'N/A';
};

// --- 4. Updated Function to Add New Patient with Sequential IDs ---
// --- Updated Function to Add Patient AND Audit Log ---
// --- Updated Function to Add Patient AND Audit Log using Session Data ---
window.handleAddPatient = async (event) => {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newPatientName');
    if (!nameInput || !nameInput.value) {
        alert("Please enter the patient's full name.");
        return;
    }

    try {
        // 1. Determine Sequential IDs for both Patient and Audit
        const patientsRef = ref(database, 'patients');
        const auditsRef = ref(database, 'audits');
        
        const [patientSnap, auditSnap] = await Promise.all([
            get(patientsRef),
            get(auditsRef)
        ]);

        // Sequential Patient ID Logic (p_1, p_2...)
        let nextPatientIdx = 1;
        if (patientSnap.exists()) {
            const pKeys = Object.keys(patientSnap.val());
            const pIndices = pKeys.filter(k => k.startsWith('p_')).map(k => parseInt(k.split('_')[1]));
            nextPatientIdx = pIndices.length > 0 ? Math.max(...pIndices) + 1 : pKeys.length + 1;
        }
        const newPatientId = `p_${nextPatientIdx}`;

        // Sequential Audit ID Logic (a_1, a_2...)
        let nextAuditIdx = 1;
        if (auditSnap.exists()) {
            const aKeys = Object.keys(auditSnap.val());
            const aIndices = aKeys.filter(k => k.startsWith('a_')).map(k => parseInt(k.split('_')[1]));
            nextAuditIdx = aIndices.length > 0 ? Math.max(...aIndices) + 1 : aKeys.length + 1;
        }
        const newAuditId = `a_${nextAuditIdx}`;

        // 2. Retrieve User and Role from Session Storage
        // Fallback to 'Unknown' if session data isn't set yet
        const activeUser = sessionStorage.getItem('username') || 'dr_francine'; 
        const activeRole = sessionStorage.getItem('role') || 'Doctor';

        // 3. Prepare Data Objects
        const newPatient = {
            name: nameInput.value,
            birthDate: document.getElementById('newDOB').value,
            sex: document.getElementById('newSex').value,
            bloodType: document.getElementById('newBlood').value,
            mobileNum: document.getElementById('newNum').value,
            email: document.getElementById('newemail').value,
            company: document.getElementById('newComp').value.trim(),
            emergencyPers: document.getElementById('newEmgergency').value,
            emergencyCon: "", 
            allergies: document.getElementById('newAllergy').value,
            medHistory: document.getElementById('newMedHistory').value,
            lastVisit: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            lastCheck: "Initial Registration"
        };

        const newAudit = {
            action: "Add Patient",
            details: `Added patient: ${newPatientId} (${newPatient.name})`,
            entity: newPatientId,
            role: activeRole,
            timestamp: new Date().toLocaleString(),
            user: activeUser
        };

        // 4. Atomic Write to Firebase
        await Promise.all([
            set(ref(database, `patients/${newPatientId}`), newPatient),
            set(ref(database, `audits/${newAuditId}`), newAudit)
        ]);

        alert(`Record saved! Patient: ${newPatientId}, Audit: ${newAuditId}`);
        
        // Reset UI
        const form = document.getElementById('patientForm');
        if (form) form.reset();
        if (window.closeAddPatientModal) window.closeAddPatientModal();
        loadPatients(); 

    } catch (error) {
        console.error("Critical Save Error:", error);
        alert('Failed to save. Check database connection.');
    }
};
// Initialize the loading process
loadPatients();