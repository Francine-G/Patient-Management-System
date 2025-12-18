// Consolidated navigation and header helpers
document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const currentPage = window.location.pathname.split('/').pop();

    // --- Active link detection ---
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

    // --- Utility: inject ripple/pop styles once ---
    if (!document.getElementById('nav-ui-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'nav-ui-styles';
        styleEl.textContent = `
            .navigation-menu .nav-link,
            .navigation-menu .active { position: relative; overflow: hidden; }
            .ripple-effect { position: absolute; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.5); transform: translate(-50%,-50%) scale(0); animation: ripple-animation 0.6s ease-out; pointer-events:none; }
            @keyframes ripple-animation { to { transform: translate(-50%,-50%) scale(15); opacity: 0; } }
            .navigation-menu .nav-link.pop { transform: translateX(8px) scale(1.04); box-shadow: 0 10px 24px rgba(0,0,0,0.14); transition: transform .18s ease, box-shadow .18s ease; z-index:2 }
        `;
        document.head.appendChild(styleEl);
    }

    // --- Ripple helper ---
    function createRipple(el, clientX, clientY) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (typeof clientX === 'number') ? clientX - rect.left : rect.width / 2;
        const y = (typeof clientY === 'number') ? clientY - rect.top : rect.height / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    }

    // --- Nav link handlers (pop + delayed navigation + ripple) ---
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');
            if (href === 'LogIn.html') { sessionStorage.clear(); return; }
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            link.classList.add('pop');
            setTimeout(() => link.classList.remove('pop'), 320);
            createRipple(link, e.clientX, e.clientY);
            setTimeout(() => { window.location.href = href; }, 300);
        });

        // Add mousedown ripple as fallback
        link.addEventListener('mousedown', function (e) { createRipple(link, e.clientX, e.clientY); });
    });

    // --- Sidebar toggle (create only if missing) ---
    const sidebar = document.querySelector('.sidebar');
    let toggle = document.querySelector('.sidebar-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.setAttribute('aria-label', 'Toggle sidebar');
        toggle.innerHTML = '&#9776;';
        const headerEl = document.querySelector('.header');
        // If page provides a grouped left wrapper, insert toggle there so title sits beside it
        const headerLeft = headerEl && headerEl.querySelector('.header-left');
        if (headerLeft) {
            headerLeft.insertBefore(toggle, headerLeft.firstElementChild || headerLeft.firstChild);
        } else if (headerEl) {
            headerEl.insertBefore(toggle, headerEl.firstElementChild || headerEl.firstChild);
        } else {
            document.body.appendChild(toggle);
        }
    }

    // Load persisted sidebar state
    const persisted = localStorage.getItem('sidebar-collapsed');
    if (persisted === 'true') { body.classList.add('sidebar-collapsed'); if (sidebar) sidebar.classList.add('collapsed'); toggle.setAttribute('aria-pressed', 'true'); }

    toggle.addEventListener('click', function () {
        const collapsed = body.classList.toggle('sidebar-collapsed');
        if (sidebar) sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
        toggle.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    });

    // --- Header-right and notif button insertion ---
    const header = document.querySelector('.header');
    if (header) {
        let headerRight = header.querySelector('.header-right');
        // If header-right not present, create it and move date-badge inside
        if (!headerRight) {
            headerRight = document.createElement('div');
            headerRight.className = 'header-right';
            const dateBadge = header.querySelector('.date-badge');
            if (dateBadge) { headerRight.appendChild(dateBadge); }
            header.appendChild(headerRight);
        }

        // ensure notif button exists and has click handler
        let notifBtn = headerRight.querySelector('.notif-btn');
        if (!notifBtn) {
            notifBtn = document.createElement('button');
            notifBtn.className = 'notif-btn';
            notifBtn.setAttribute('aria-label', 'Notifications');
            notifBtn.innerHTML = '<span class="notif-icon">🔔</span><span class="notif-dot" aria-hidden="true"></span>';
            headerRight.appendChild(notifBtn);
        }

        // Attach click handler (works whether button exists in HTML or created by JS)
        notifBtn.addEventListener('click', function () { window.location.href = 'Notif-Page.html'; });

        // keyboard support
        notifBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = 'Notif-Page.html'; }
        });
    }

    window.closePatientModal = function () { const pm = document.getElementById('patientModal'); if (pm) pm.classList.remove('active'); };
    window.closeModalOnOutsideClick = function (event) { if (event.target && event.target.id === 'patientModal') window.closePatientModal(); };

    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.addEventListener('input', function (e) { console.log('Searching for:', e.target.value); });

    // Add record button with modal opener
    const addRecordBtn = document.querySelector('.add-record-btn');
    if (addRecordBtn) addRecordBtn.addEventListener('click', function () { window.openAddPatientModal && window.openAddPatientModal(); });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', function (e) { e.stopPropagation(); alert('Edit Patient Record'); }));

    // Close modal with Escape
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { window.closePatientModal && window.closePatientModal(); window.closeAddPatientModal && window.closeAddPatientModal(); } });

    // --- Add Patient Modal Functions ---
    window.openAddPatientModal = function () {
        const modal = document.getElementById('addPatientModal');
        if (modal) modal.classList.add('active');
    };

    window.closePatientModal = function () { 
    const pm = document.getElementById('patientModal'); 
    if (pm) {
        pm.classList.remove('active'); 
        pm.style.display = ''; // Clear the inline style so CSS can take over again
    }
};

    window.handleAddPatient = function (event) {
        event.preventDefault();
        alert('Patient record added successfully!');
        window.closeAddPatientModal();
    };

    // --- Notification page helpers ---
    window.markAsRead = function (btn) {
        const card = btn.closest('.notification-card');
        if (!card) return;
        const badge = card.querySelector('.new-badge');
        if (badge) { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 300); }
        btn.style.opacity = '0.5'; btn.disabled = true;
        updateUnreadCount();
    };

    window.deleteNotification = function (btn) {
        const card = btn.closest('.notification-card');
        if (!card) return;
        card.style.transform = 'translateX(100%)'; card.style.opacity = '0';
        setTimeout(() => { card.remove(); updateUnreadCount(); }, 300);
    };

    window.updateUnreadCount = function () {
        const unreadCount = document.querySelectorAll('.new-badge').length;
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            const p = headerText.querySelector('p') || headerText;
            if (unreadCount === 0) p.textContent = 'You have no unread messages';
            else if (unreadCount === 1) p.textContent = 'You have 1 unread message';
            else p.textContent = `You have ${unreadCount} unread messages`;
        }
    };
});

//Queue//
// Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Queue tabs
        document.querySelectorAll('.queue-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.queue-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Queue card click
        document.querySelectorAll('.queue-card').forEach(card => {
            card.addEventListener('click', function() {
                const queueNumber = this.querySelector('.queue-card-number').textContent;
                alert('Loading details for ' + queueNumber);
            });
        });

        // Consult button
        document.querySelector('.consult-btn').addEventListener('click', function() {
            openConsultationModal();
        });

        // Consultation Modal Functions
        function openConsultationModal() {
            document.getElementById('consultationModal').classList.add('active');
        }

        function closeConsultationModal(event) {
            if (!event || event.target.id === 'consultationModal') {
                document.getElementById('consultationModal').classList.remove('active');
                document.getElementById('consultationForm').reset();
            }
        }

        function handleConsultation(event) {
            event.preventDefault();
            alert('Consultation completed successfully!');
            closeConsultationModal();
        }

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeConsultationModal();
            }
        });

        // File items
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', function() {
                const fileName = this.querySelector('.file-name').textContent;
                alert('Opening file: ' + fileName);
            });
        });
