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

// Global variables
let currentUserData = null;
let allPatients = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    await loadPatients();
    initializeSearch();
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

// Helper to safely get input value
const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
};

// Load patients from Firebase
const loadPatients = async () => {
    const patientsRef = ref(database, 'patients');
    const patientGrid = document.querySelector('.patient-grid');
    if (!patientGrid) return;

    try {
        const snapshot = await get(patientsRef);
        allPatients = [];
        
        if (snapshot.exists()) {
            patientGrid.innerHTML = '';
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const patient = data[key];
                patient.id = key;
                allPatients.push(patient);
            });
            
            // Sort by ID descending (newest first)
            allPatients.sort((a, b) => {
                const numA = parseInt(a.id.split('_')[1]);
                const numB = parseInt(b.id.split('_')[1]);
                return numB - numA;
            });
            
            displayPatients(allPatients);
        } else {
            patientGrid.innerHTML = '<div class="empty-state"><i class="fi fi-rr-user"></i><p>No patient records found</p></div>';
        }
    } catch (error) {
        console.error("Error fetching patients:", error);
        patientGrid.innerHTML = '<div class="empty-state"><p>Error loading patient records</p></div>';
    }
};

// Display patients in grid
const displayPatients = (patients) => {
    const patientGrid = document.querySelector('.patient-grid');
    if (!patientGrid) return;
    
    if (patients.length === 0) {
        patientGrid.innerHTML = '<div class="empty-state"><i class="fi fi-rr-search"></i><p>No patients match your search</p></div>';
        return;
    }
    
    patientGrid.innerHTML = '';
    patients.forEach(patient => createPatientCard(patient));
};

// Create patient card HTML
const createPatientCard = (patient) => {
    const patientGrid = document.querySelector('.patient-grid');
    if (!patientGrid) return;

    const firstLetter = patient.name ? patient.name.charAt(0).toUpperCase() : '?';
    const card = document.createElement('div');
    card.className = 'patient-card';
    card.onclick = () => openPatientModal(patient);

    // Calculate age if birthDate exists
    let ageText = 'N/A';
    if (patient.age) {
        ageText = `${patient.age} years`;
    } else if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        ageText = `${age} years`;
    }

    card.innerHTML = `
        <div class="patient-card-header">
            <div class="patient-avatar">${firstLetter}</div>
            <button class="edit-btn" onclick="event.stopPropagation(); editPatient('${patient.id}')">
                <i class="fi fi-rr-edit"></i>
            </button>
        </div>
        <div class="patient-info">
            <h3>${patient.name}</h3>
            <div class="patient-detail">
                <i class="fi fi-rr-id-badge"></i>
                <span>${patient.id}</span>
            </div>
            <div class="patient-detail">
                <i class="fi fi-rr-calendar"></i>
                <span>Age: ${ageText}</span>
            </div>
            <div class="patient-detail">
                <i class="fi fi-rr-time-past"></i>
                <span>Last Visit: ${patient.lastVisit || 'N/A'}</span>
            </div>
        </div>
    `;
    patientGrid.appendChild(card);
};

// Initialize search functionality
const initializeSearch = () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            displayPatients(allPatients);
            return;
        }
        
        const filtered = allPatients.filter(patient => 
            (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
            (patient.id && patient.id.toLowerCase().includes(searchTerm)) ||
            (patient.mobileNum && patient.mobileNum.includes(searchTerm))
        );
        
        displayPatients(filtered);
    });
};

// Open patient details modal
window.openPatientModal = function(patient) {
    const modal = document.getElementById('patientModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.classList.add('active');

    // Safe setters
    const setHtml = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) el.innerHTML = val; 
    };
    
    const setText = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) el.textContent = val; 
    };

    setHtml('patientName', `<strong>Name:</strong> ${patient.name || 'N/A'}`);
    setHtml('patientID', `<strong>Patient ID:</strong> ${patient.id || 'N/A'}`);
    setHtml('patientSex', `<strong>Sex:</strong> ${patient.sex || 'N/A'}`);
    setHtml('patientDOB', `<strong>DOB:</strong> ${patient.birthDate || 'N/A'}`);
    setHtml('patientBlood', `<strong>Blood Type:</strong> ${patient.bloodType || 'N/A'}`);

    setText('patientEmail', patient.email || 'N/A');
    setText('patientMobile', patient.mobileNum || 'N/A');
    setText('emergencyPers', patient.emergencyPers || 'N/A');
    setText('emergencyCon', patient.emergencyCon || 'N/A');
    setText('lastVisitDate', patient.lastVisit || 'N/A');
    setText('lastCheckType', patient.lastCheck || 'N/A');
};

// Close patient modal
window.closePatientModal = function(event) {
    if (event) {
        const modal = document.getElementById('patientModal');
        if (event.target === modal || event.target.closest('.modal-close')) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }
};

// Open add patient modal
window.openAddPatientModal = function() {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
};

// Close add patient modal
window.closeAddPatientModal = function(event) {
    const modal = document.getElementById('addPatientModal');
    if (!modal) return;
    
    if (event && (event.target === modal || event.target.closest('.form-close') || event.target.closest('.cancel-btn'))) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        const form = document.getElementById('patientForm');
        if (form) form.reset();
    } else if (!event) {
        // Called without event (programmatic close)
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        const form = document.getElementById('patientForm');
        if (form) form.reset();
    }
};

// Create audit log entry
async function createAuditLog(action, entityType, details) {
    if (!currentUserData) return;
    
    try {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const auditLog = {
            timestamp: new Date().toISOString(),
            user_name: `${currentUserData.firstName} ${currentUserData.lastName}`.trim(),
            username: currentUserData.username,
            user_role: currentUserData.role || 'user',
            action: action,
            entity_type: entityType,
            entity_id: currentUserData.username,
            details: details,
            ip_address: 'N/A',
            user_agent: navigator.userAgent || 'Unknown'
        };

        await set(ref(database, `audit_logs/${logId}`), auditLog);
        console.log('✅ Audit log created:', auditLog);
    } catch (error) {
        console.error('❌ Error creating audit log:', error);
    }
}

// Add patient with audit log
window.handleAddPatient = async (event) => {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newPatientName');
    if (!nameInput || !nameInput.value.trim()) {
        alert("Please enter the patient's full name.");
        return;
    }

    try {
        const patientsRef = ref(database, 'patients');
        const patientSnap = await get(patientsRef);

        let nextPatientIdx = 1;
        if (patientSnap.exists()) {
            const keys = Object.keys(patientSnap.val());
            const indices = keys.filter(k => k.startsWith('p_')).map(k => parseInt(k.split('_')[1]));
            nextPatientIdx = indices.length > 0 ? Math.max(...indices) + 1 : keys.length + 1;
        }
        const newPatientId = `p_${nextPatientIdx}`;

        // Calculate Age
        const dobValue = getVal('newDOB');
        let calculatedAge = "N/A";
        if (dobValue) {
            const birthDate = new Date(dobValue);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            calculatedAge = age.toString();
        }

        // Create patient object
        const newPatient = {
            name: nameInput.value.trim(),
            birthDate: dobValue,
            age: calculatedAge, 
            sex: getVal('newSex'),
            bloodType: getVal('newBlood'),
            mobileNum: getVal('newNum'),
            email: getVal('newemail'),
            company: getVal('newComp'),
            emergencyPers: getVal('newEmergency'), 
            emergencyCon: "", 
            allergies: getVal('newAllergy'),
            medHistory: getVal('newMedHistory'),
            lastVisit: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            lastCheck: "Initial Registration",
            createdAt: new Date().toISOString(),
            createdBy: currentUserData ? currentUserData.username : 'system'
        };

        // Save to Firebase
        await set(ref(database, `patients/${newPatientId}`), newPatient);

        // Create audit log
        await createAuditLog(
            'Created Patient',
            'Patient',
            `Added new patient: ${newPatientId} - ${newPatient.name}`
        );

        alert(`Success! Patient ${newPatientId} added successfully.`);
        
        // Reset form and close modal
        const form = document.getElementById('patientForm');
        if (form) form.reset();
        
        window.closeAddPatientModal(); 
        
        // Reload patients
        await loadPatients();

    } catch (error) {
        console.error("Critical Save Error:", error);
        alert('Failed to save patient record. Please try again.');
    }
};

// Edit patient (placeholder)
window.editPatient = function(patientId) {
    alert(`Edit functionality for patient ${patientId} coming soon!`);
    // TODO: Implement edit functionality
};

// Initialize
loadPatients();