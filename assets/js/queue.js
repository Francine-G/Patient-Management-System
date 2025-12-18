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

    // onValue runs once immediately, and again whenever data changes
    onValue(queueRef, (snapshot) => {
        if (!container) return;
        
        // Clear current static cards
        container.innerHTML = '';

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Sort keys to ensure order (q_1, q_2, etc.)
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

// --- Helper to Create Card HTML ---
const createQueueCard = (id, data, container) => {
    // 1. Format ID: "q_1" -> "Q-001"
    const idNumber = id.split('_')[1];
    const displayId = `Q-${String(idNumber).padStart(3, '0')}`;

    // 2. Determine Badge Class (appt vs walk-in)
    // Assumes database 'type' is "appt" or "walk-in"
    const isAppt = data.type && data.type.toLowerCase().includes('appt');
    const badgeClass = isAppt ? 'appt' : 'walk-in';
    const badgeText = isAppt ? 'Appt' : 'Walk-in';

    // 3. Create Element
    const card = document.createElement('div');
    card.className = 'queue-card';
    
    // 4. Build HTML content
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

    // 5. Append to Container
    container.appendChild(card);
};

// Initialize listener when DOM is ready
document.addEventListener('DOMContentLoaded', loadQueue);