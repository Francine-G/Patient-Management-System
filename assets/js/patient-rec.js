import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
            // Clear the static placeholder cards
            patientGrid.innerHTML = '';

            const data = snapshot.val();
            
            // Loop through each patient record
            Object.keys(data).forEach(key => {
                const patient = data[key];
                // Add the ID to the patient object for the modal to use
                patient.id = key; 
                
                createPatientCard(patient);
            });
        } else {
            console.log("No data available");
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
    
    // We pass the entire patient object as a stringified JSON for the modal
    card.onclick = () => openPatientModal(patient);

    card.innerHTML = `
        <div class="patient-avatar">${firstLetter}</div>
        <div class="patient-info">
            <h3>${patient.name}</h3>
            <div class="patient-detail"><strong>Patient ID:</strong> ${patient.id}</div>
            <div class="patient-detail"><strong>Last Visit:</strong> ${patient['last visit'] || 'N/A'}</div>
        </div>
        <button class="edit-btn" onclick="event.stopPropagation();">✏️</button>
    `;

    patientGrid.appendChild(card);
};

// --- 3. Updated Modal Function ---
window.openPatientModal = function(patient) {
    const modal = document.getElementById('patientModal');
    modal.classList.add('active'); // Or however you show your modal
    modal.style.display = 'flex';

    // Information Section
    document.getElementById('patientName').innerHTML = `<strong>Name:</strong> ${patient.name}`;
    document.getElementById('patientID').innerHTML = `<strong>Patient ID:</strong> ${patient.id}`;
    document.getElementById('patientSex').innerHTML = `<strong>Sex:</strong> ${patient.sex}`;
    document.getElementById('patientDOB').innerHTML = `<strong>DOB:</strong> ${patient.birthDate}`;
    document.getElementById('patientBlood').innerHTML = `<strong>Blood Type:</strong> ${patient.bloodType}`;

    // Contacts
    document.getElementById('patientEmail').innerText = patient.email;
    document.getElementById('patientMobile').innerText = patient.mobileNum;

    // Emergency
    document.getElementById('emergencyPers').innerText = patient.emergencyPers;
    document.getElementById('emergencyCon').innerText = patient.emergencyCon;

    // Last Visit
    document.getElementById('lastVisitDate').innerText = patient.lastVisit || 'N/A';
    document.getElementById('lastCheckType').innerText = patient.lastCheck || 'N/A';
};

// Initialize the loading process
loadPatients();

window.handleAddPatient = async () => {
    const nameInput = document.getElementById('newPatientName');
    if (!nameInput || !nameInput.value) {
        alert("Please enter the patient's full name.");
        return;
    }

    // Capture data using exact matches for your IDs and Firebase structure
    const newPatient = {
        name: nameInput.value,
        birthDate: document.getElementById('newDOB').value,
        sex: document.getElementById('newSex').value,
        bloodType: document.getElementById('newBlood').value,
        mobileNum: document.getElementById('newNum').value,
        email: document.getElementById('newemail').value,
        company: document.getElementById('newComp').value.trim(), // Fixed space issue
        emergencyPers: document.getElementById('newEmgergency').value,
        emergencyCon: "", // Placeholder to match your DB image structure
        allergies: document.getElementById('newAllergy').value,
        medHistory: document.getElementById('newMedHistory').value, // Matches DB Image
        lastVisit: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), // Matches "December 24 2025"
        lastCheck: "Initial Registration"
    };

    try {
        const patientsRef = ref(database, 'patients');
        const newPatientRef = push(patientsRef); 
        
        await set(newPatientRef, newPatient); 

        alert('Patient record added successfully!');
        
        // Ensure form resets and modal closes
        const form = document.getElementById('patientForm');
        if (form) form.reset();

        if (window.closeAddPatientModal) {
            window.closeAddPatientModal();
        }

        loadPatients(); 
        
    } catch (error) {
        console.error("Firebase Save Error:", error);
        alert('Failed to save to database. Check console for details.');
    }
};