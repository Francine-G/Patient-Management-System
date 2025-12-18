import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- Real-time Queue Listener ---
const loadQueue = () => {
    const queueRef = ref(database, 'queue');
    const container = document.querySelector('.queue-cards-container');

    onValue(queueRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = ''; // Clear current list

        if (snapshot.exists()) {
            const data = snapshot.val();
            // Sort by ID (q_1, q_2...)
            const keys = Object.keys(data).sort((a, b) => {
                const numA = parseInt(a.split('_')[1]);
                const numB = parseInt(b.split('_')[1]);
                return numA - numB;
            });

            keys.forEach(key => {
                const item = data[key];
                createQueueCard(key, item, container);
            });
        } else {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Queue is empty</p>';
        }
    });
};

const createQueueCard = (id, data, container) => {
    const idNumber = id.split('_')[1];
    const displayId = `Q-${String(idNumber).padStart(3, '0')}`;
    const isAppt = data.type && data.type.toLowerCase().includes('appt');
    const badgeClass = isAppt ? 'appt' : 'walk-in';
    const badgeText = isAppt ? 'Appt' : 'Walk-in';

    // Safely get history or default to empty object
    const hist = data.history || {};

    const card = document.createElement('div');
    card.className = 'queue-card';
    
    // 1. Store Standard Data
    card.setAttribute('data-pid', data.patientId || '');
    
    // 2. *** NEW: Store History Data as Attributes ***
    card.setAttribute('data-hist-date', hist.date || '-');
    card.setAttribute('data-hist-weight', hist.weight || '-');
    card.setAttribute('data-hist-diagnosis', hist.diagnosis || '-');
    card.setAttribute('data-hist-meds', hist.medication || '-');
    card.setAttribute('data-hist-notes', hist.notes || '-');
    
    card.innerHTML = `
        <div class="queue-card-header">
            <span class="queue-card-number">${displayId}</span>
            <span class="queue-card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="queue-card-info">
            <div><strong>Name:</strong> ${data.name || 'Unknown'}</div>
            <div><strong>Age:</strong> ${data.age || 'N/A'}</div>
            <div><strong>Notes:</strong> ${data.note || ''}</div>
        </div>
    `;

    container.appendChild(card);
};

document.addEventListener('DOMContentLoaded', loadQueue);