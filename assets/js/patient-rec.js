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

// --- 1. Load Patients ---
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

// --- 2. Create Card HTML ---
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

// --- 3. Open Modal ---
window.openPatientModal = function(patient) {
    const modal = document.getElementById('patientModal');
    if (!modal) return;
    
    // Clear inline styles to ensure CSS class works
    modal.style.display = ''; 
    modal.classList.add('active');

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

// --- 4. Add Patient + Audit Log Function ---
window.handleAddPatient = async (event) => {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newPatientName');
    if (!nameInput || !nameInput.value) {
        alert("Please enter the patient's full name.");
        return;
    }

    try {
        // 1. Get References
        const patientsRef = ref(database, 'patients');
        const auditsRef = ref(database, 'audits');
        
        // 2. Fetch counts for sequential IDs
        const [patientSnap, auditSnap] = await Promise.all([
            get(patientsRef),
            get(auditsRef)
        ]);

        // Calculate Patient ID (p_1, p_2...)
        let nextPatientIdx = 1;
        if (patientSnap.exists()) {
            const keys = Object.keys(patientSnap.val());
            const indices = keys.filter(k => k.startsWith('p_')).map(k => parseInt(k.split('_')[1]));
            nextPatientIdx = indices.length > 0 ? Math.max(...indices) + 1 : keys.length + 1;
        }
        const newPatientId = `p_${nextPatientIdx}`;

        // Calculate Audit ID (a_1, a_2...)
        let nextAuditIdx = 1;
        if (auditSnap.exists()) {
            const keys = Object.keys(auditSnap.val());
            const indices = keys.filter(k => k.startsWith('a_')).map(k => parseInt(k.split('_')[1]));
            nextAuditIdx = indices.length > 0 ? Math.max(...indices) + 1 : keys.length + 1;
        }
        const newAuditId = `a_${nextAuditIdx}`;

        // 3. Get Session Data
        const activeUser = sessionStorage.getItem('username') || 'dr_francine'; 
        const activeRole = sessionStorage.getItem('role') || 'Doctor';

        // --- NEW: Calculate Age Logic ---
        const dobValue = document.getElementById('newDOB').value;
        let calculatedAge = "N/A";
        
        if (dobValue) {
            const birthDate = new Date(dobValue);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            
            // Adjust if birth month hasn't happened yet this year
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            calculatedAge = age.toString();
        }

        // 4. Create Patient Object (Now includes 'age')
        const newPatient = {
            name: nameInput.value,
            birthDate: dobValue,
            age: calculatedAge, // Saved to database
            sex: document.getElementById('newSex').value,
            bloodType: document.getElementById('newBlood').value,
            mobileNum: document.getElementById('newNum').value,
            email: document.getElementById('newemail').value,
            company: document.getElementById('newComp').value.trim(),
            emergencyPers: document.getElementById('newEmergency').value, 
            emergencyCon: "", 
            allergies: document.getElementById('newAllergy').value,
            medHistory: document.getElementById('newMedHistory').value,
            lastVisit: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            lastCheck: "Initial Registration"
        };

        // 5. Create Audit Object
        const newAudit = {
            action: "Add Patient",
            details: `Added patient: ${newPatientId} (${newPatient.name})`,
            entity: newPatientId,
            role: activeRole,
            timestamp: new Date().toLocaleString(),
            user: activeUser
        };

        // 6. Save BOTH to Firebase
        await Promise.all([
            set(ref(database, `patients/${newPatientId}`), newPatient),
            set(ref(database, `audits/${newAuditId}`), newAudit)
        ]);

        alert(`Success! Patient ${newPatientId} added (Age: ${calculatedAge}).`);
        
        // 7. Cleanup
        const form = document.getElementById('patientForm');
        if (form) form.reset();
        
        if (window.closeAddPatientModal) {
            window.closeAddPatientModal(); 
        }
        
        loadPatients(); 

    } catch (error) {
        console.error("Critical Save Error:", error);
        alert('Failed to save. Open Console (F12) to see specific error.');
    }
};
loadPatients();