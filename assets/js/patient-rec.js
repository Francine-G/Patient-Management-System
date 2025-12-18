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
window.handleAddPatient = async (event) => {
    // 1. Stop the form from reloading the page
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newPatientName');
    if (!nameInput || !nameInput.value) {
        alert("Please enter the patient's full name.");
        return;
    }

    try {
        const patientsRef = ref(database, 'patients');
        const snapshot = await get(patientsRef);
        let nextIndex = 1;

        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            
            // Filter for IDs following the p_ format and find the highest number
            const indices = keys
                .filter(key => key.startsWith('p_'))
                .map(key => parseInt(key.split('_')[1]))
                .filter(num => !isNaN(num));

            if (indices.length > 0) {
                nextIndex = Math.max(...indices) + 1;
            } else {
                nextIndex = keys.length + 1;
            }
        }

        const newId = `p_${nextIndex}`;

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

        // Use the sequential ID as the database path instead of push()
        await set(ref(database, `patients/${newId}`), newPatient);

        alert(`Patient record added successfully as ${newId}!`);
        
        // Reset and close
        const form = document.getElementById('patientForm');
        if (form) form.reset();

        if (window.closeAddPatientModal) {
            window.closeAddPatientModal();
        }

        // Refresh the list immediately
        loadPatients(); 
        
    } catch (error) {
        console.error("Firebase Save Error:", error);
        alert('Failed to save to database. Check console (F12).');
    }
};
// Initialize the loading process
loadPatients();