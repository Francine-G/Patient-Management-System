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

// Close Patient Details Modal
window.closePatientModal = function (event) { 
    const pm = document.getElementById('patientModal'); 
    if (pm) {
        // Close if function called directly, OR if target is overlay/button
        if (!event || event.target.id === 'patientModal' || event.target.closest('.modal-close')) {
            pm.classList.remove('active'); 
            pm.style.display = ''; // IMPORTANT: Clears any inline styles set by other scripts
        }
    }
};

// Open Add Patient Modal
window.openAddPatientModal = function () {
    const modal = document.getElementById('addPatientModal');
    if (modal) modal.classList.add('active');
};

// Close Add Patient Modal
window.closeAddPatientModal = function (event) {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        if (!event || event.target.id === 'addPatientModal' || event.target.closest('.form-close')) {
            modal.classList.remove('active');
            modal.style.display = ''; 
            
            // Optional: Reset form fields
            const form = document.getElementById('patientForm');
            if (form) form.reset();
        }
    }
};

// Global Click Outside Handler
window.closeModalOnOutsideClick = function (event) { 
    if (event.target.id === 'patientModal') window.closePatientModal(event);
    if (event.target.id === 'addPatientModal') window.closeAddPatientModal(event);
};


// --- 2. DOM LOAD EVENTS ---
document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const currentPage = window.location.pathname.split('/').pop();

    // Active Link Highlighting
    const navLinks = Array.from(document.querySelectorAll('.navigation-menu .nav-link'));
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
        const href = l.getAttribute('href');
        if (
            href === currentPage ||
            (currentPage === '' && href === 'Dashboard.html') ||
            (currentPage === 'index.html' && href === 'Dashboard.html')
        ) {
            setTimeout(() => l.classList.add('active'), 50);
        }
    });

    // Add Record Button Listener (+)
    const addRecordBtn = document.querySelector('.add-record-btn');
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', function () { 
            window.openAddPatientModal(); 
        });
    }

    // Notification Button Logic
    const header = document.querySelector('.header');
    if (header) {
        let headerRight = header.querySelector('.header-right');
        if (!headerRight) {
            headerRight = document.createElement('div');
            headerRight.className = 'header-right';
            const dateBadge = header.querySelector('.date-badge');
            if (dateBadge) headerRight.appendChild(dateBadge);
            header.appendChild(headerRight);
        }

        let notifBtn = headerRight.querySelector('.notif-btn');
        if (!notifBtn) {
            notifBtn = document.createElement('button');
            notifBtn.className = 'notif-btn';
            notifBtn.innerHTML = '<span class="notif-icon">🔔</span><span class="notif-dot"></span>';
            headerRight.appendChild(notifBtn);
        }
        
        // Remove old listeners to prevent duplicates, add new one
        const newBtn = notifBtn.cloneNode(true);
        notifBtn.parentNode.replaceChild(newBtn, notifBtn);
        newBtn.addEventListener('click', () => window.location.href = 'Notif-Page.html');
    }

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    let toggle = document.querySelector('.sidebar-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '&#9776;';
        const headerEl = document.querySelector('.header');
        if (headerEl) headerEl.insertBefore(toggle, headerEl.firstChild);
        else document.body.appendChild(toggle);
    }

    const persisted = localStorage.getItem('sidebar-collapsed');
    if (persisted === 'true') { 
        body.classList.add('sidebar-collapsed'); 
        if (sidebar) sidebar.classList.add('collapsed'); 
    }

    toggle.addEventListener('click', function () {
        const collapsed = body.classList.toggle('sidebar-collapsed');
        if (sidebar) sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    });
});