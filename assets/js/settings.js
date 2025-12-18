import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, get, set, remove, update, query, orderByKey, limitToLast 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
let currentUserData = null;
let personnelList = [];


// Helper to create an audit log entry
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

            if (indices.length > 0) {
                nextIndex = Math.max(...indices) + 1;
            }
        }

        const auditId = `a_${nextIndex}`;
        const auditData = {
            action: action,
            details: details,
            entity: entityId || 'System',
            role: currentUserData.role || 'Admin',
            timestamp: new Date().toLocaleString(),
            user: currentUserData.username
        };

        await set(ref(database, `audits/${auditId}`), auditData);
        console.log(`✅ Audit log created: ${auditId}`);
    } catch (error) {
        console.error('❌ Failed to create audit log:', error);
    }
}

// Check authentication and load user data
document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'LogIn.html';
        return;
    }

    await loadUserData(currentUser);
    initializeHeader();
    initializeTabs();
    initializeModals();
    initializeForms();
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

// Load user data from Firebase
async function loadUserData(username) {
    try {
        console.log('🔄 Loading user data for:', username);
        
        const userRef = ref(database, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
            currentUserData.username = username;
            
            console.log('✅ User data loaded:', currentUserData);
            console.log('✅ User role:', currentUserData.role);
            
            // Update session storage with fresh data
            sessionStorage.setItem('userData', JSON.stringify({
                username: currentUserData.username,
                firstName: currentUserData.firstName,
                lastName: currentUserData.lastName,
                email: currentUserData.email,
                role: currentUserData.role || 'user'
            }));
            
            // Update UI with user data
            updateUserDisplay();
            
            // Control Personnel tab visibility based on role
            const personnelTab = document.getElementById('personnel-tab');
            console.log('🔍 Personnel tab element found:', !!personnelTab);
            
            if (personnelTab) {
                const userRole = (currentUserData.role || '').toLowerCase();
                console.log('🔍 User role (normalized):', userRole);
                
                // Show Personnel tab only for Admin or Doctor
                if (userRole === 'admin' || userRole === 'doctor') {
                    console.log('✅ Showing Personnel tab for role:', userRole);
                    personnelTab.style.display = 'flex';
                    
                    // Load personnel data
                    await loadPersonnel();
                } else {
                    console.log('ℹ️ Hiding Personnel tab for role:', userRole);
                    personnelTab.style.display = 'none';
                }
            } else {
                console.error('❌ Personnel tab element NOT found in DOM!');
            }
        } else {
            console.error('❌ User data not found in Firebase');
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        alert('Failed to load user data. Please try again.');
    }
}

// Update user display in the UI
function updateUserDisplay() {
    if (!currentUserData) return;

    // Sidebar display
    const displayName = document.getElementById('user-display-name');
    const roleElement = document.getElementById('user-role');
    
    if (displayName) {
        displayName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
    }
    
    if (roleElement) {
        const role = currentUserData.role || 'Admin';
        roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    // Profile section
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRoleBadge = document.getElementById('profile-role-badge');

    if (profileAvatar) {
        profileAvatar.textContent = currentUserData.firstName.charAt(0).toUpperCase();
    }

    if (profileName) {
        profileName.textContent = `${currentUserData.firstName} ${currentUserData.lastName}`;
    }

    if (profileEmail) {
        profileEmail.textContent = currentUserData.email;
    }

    if (profileRoleBadge) {
        const role = currentUserData.role || 'admin';
        profileRoleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        profileRoleBadge.className = `role-badge ${role}`;
    }

    // Form fields
    document.getElementById('first-name').value = currentUserData.firstName || '';
    document.getElementById('last-name').value = currentUserData.lastName || '';
    document.getElementById('username').value = currentUserData.username || '';
    document.getElementById('email').value = currentUserData.email || '';

    // Security tab
    const accountCreated = document.getElementById('account-created');
    const lastLogin = document.getElementById('last-login');
    const passwordLastChanged = document.getElementById('password-last-changed');

    if (accountCreated && currentUserData.createdAt) {
        const createdDate = new Date(currentUserData.createdAt);
        accountCreated.textContent = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (accountCreated) {
        accountCreated.textContent = 'Not available';
    }

    if (lastLogin && currentUserData.lastLogin) {
        const loginDate = new Date(currentUserData.lastLogin);
        lastLogin.textContent = loginDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (lastLogin) {
        lastLogin.textContent = 'Not available';
    }

    if (passwordLastChanged && currentUserData.passwordLastChanged) {
        const pwdDate = new Date(currentUserData.passwordLastChanged);
        passwordLastChanged.textContent = `Last changed: ${pwdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
    } else if (passwordLastChanged) {
        passwordLastChanged.textContent = 'Last changed: Never';
    }
}

// Initialize tabs
function initializeTabs() {
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetTab = trigger.getAttribute('data-tab');

            // Remove active class from all triggers and contents
            tabTriggers.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked trigger
            trigger.classList.add('active');

            // Show corresponding content
            const targetContent = document.getElementById(`${targetTab}-tab${targetTab === 'personnel' ? '-content' : ''}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Initialize modals
function initializeModals() {
    // Add Personnel Modal
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const addPersonnelModal = document.getElementById('add-personnel-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelModal = document.getElementById('cancel-modal');

    if (addPersonnelBtn) {
        addPersonnelBtn.addEventListener('click', () => {
            addPersonnelModal.classList.add('active');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            addPersonnelModal.classList.remove('active');
        });
    }

    if (cancelModal) {
        cancelModal.addEventListener('click', () => {
            addPersonnelModal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    if (addPersonnelModal) {
        addPersonnelModal.addEventListener('click', (e) => {
            if (e.target === addPersonnelModal) {
                addPersonnelModal.classList.remove('active');
            }
        });
    }

    // Change Password Modal
    const changePasswordBtn = document.getElementById('change-password-btn');
    const changePasswordModal = document.getElementById('change-password-modal');
    const closePasswordModal = document.getElementById('close-password-modal');
    const cancelPasswordModal = document.getElementById('cancel-password-modal');

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            changePasswordModal.classList.add('active');
        });
    }

    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', () => {
            changePasswordModal.classList.remove('active');
        });
    }

    if (cancelPasswordModal) {
        cancelPasswordModal.addEventListener('click', () => {
            changePasswordModal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) {
                changePasswordModal.classList.remove('active');
            }
        });
    }
}

// Initialize forms
function initializeForms() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Add personnel form
    const addPersonnelForm = document.getElementById('add-personnel-form');
    if (addPersonnelForm) {
        addPersonnelForm.addEventListener('submit', handleAddPersonnel);
    }

    // Change password form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Logout all button
    const logoutAllBtn = document.getElementById('logout-all-btn');
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', handleLogoutAll);
    }

    // Logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            alert('You have been logged out successfully.');
            window.location.href = 'LogIn.html';
        });
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();

    if (!firstName || !lastName) {
        alert('Please fill in all required fields.');
        return;
    }

    try {
        const username = currentUserData.username;
        const updates = {
            firstName: firstName,
            lastName: lastName
        };

        await update(ref(database, `users/${username}`), updates);

        // Update session storage
        currentUserData.firstName = firstName;
        currentUserData.lastName = lastName;
        
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        userData.firstName = firstName;
        userData.lastName = lastName;
        sessionStorage.setItem('userData', JSON.stringify(userData));

        // Update UI
        updateUserDisplay();

        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Load personnel list
async function loadPersonnel() {
    try {
        const personnelRef = ref(database, 'personnel');
        const snapshot = await get(personnelRef);

        personnelList = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            personnelList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }

        displayPersonnel();
    } catch (error) {
        console.error('Error loading personnel:', error);
    }
}

// Display personnel in the UI
function displayPersonnel() {
    const personnelListContainer = document.getElementById('personnel-list');
    
    if (personnelList.length === 0) {
        personnelListContainer.innerHTML = '<p class="empty-state">No personnel added yet</p>';
        return;
    }

    personnelListContainer.innerHTML = personnelList.map(person => `
        <div class="personnel-item">
            <div class="personnel-info">
                <div class="personnel-avatar">
                    ${person.personnelName ? person.personnelName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div class="personnel-details">
                    <h4>${person.personnelName}</h4>
                    <p>${person.personnelEmail}</p>
                    <div class="personnel-badges">
                        <span class="badge badge-role">${person.personnelRole}</span>
                        ${person.canEditRecords ? '<span class="badge badge-permission">Can Edit</span>' : ''}
                        ${person.canEditSchedule ? '<span class="badge badge-permission">Schedule Edit</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="personnel-actions">
                <button class="btn-icon" onclick="deletePersonnel('${person.id}')" title="Remove personnel">
                    <i class="fi fi-rr-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle add personnel
async function handleAddPersonnel(e) {
    e.preventDefault();

    const personnelName = document.getElementById('personnel-name').value.trim();
    const personnelEmail = document.getElementById('personnel-email').value.trim();
    const personnelRole = document.getElementById('personnel-role').value;
    const canEditRecords = document.getElementById('can-edit-records').checked;
    const canViewSchedule = document.getElementById('can-view-schedule').checked;
    const canEditSchedule = document.getElementById('can-edit-schedule').checked;
    const restrictions = document.getElementById('personnel-restrictions').value.trim();

    if (!personnelName || !personnelEmail || !personnelRole) {
        alert('Please fill in all required fields.');
        return;
    }

    try {
        // Generate unique ID
        const personnelId = `personnel_${Date.now()}`;

        const personnelData = {
            personnelName,
            personnelEmail,
            personnelRole,
            canEditRecords,
            canViewSchedule,
            canEditSchedule,
            restrictions,
            dateAdded: new Date().toISOString(),
            addedBy: currentUserData.username
        };

        await set(ref(database, `personnel/${personnelId}`), personnelData);

        // Reload personnel list
        await loadPersonnel();

        // Close modal and reset form
        document.getElementById('add-personnel-modal').classList.remove('active');
        document.getElementById('add-personnel-form').reset();

        alert('Personnel added successfully!');
    } catch (error) {
        console.error('Error adding personnel:', error);
        alert('Failed to add personnel. Please try again.');
    }
}

// Delete personnel (make it global)
window.deletePersonnel = async function(personnelId) {
    if (!confirm('Are you sure you want to remove this personnel?')) {
        return;
    }

    try {
        await remove(ref(database, `personnel/${personnelId}`));
        await loadPersonnel();
        alert('Personnel removed successfully!');
    } catch (error) {
        console.error('Error removing personnel:', error);
        alert('Failed to remove personnel. Please try again.');
    }
};

// Handle change password
// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validation (Existing logic)
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
    }
    if (currentPassword === newPassword) {
        alert('New password must be different from current password.');
        return;
    }

    try {
        const username = currentUserData.username;
        const userRef = ref(database, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            if (userData.password !== currentPassword) {
                alert('Current password is incorrect.');
                return;
            }

            // Update password
            const updates = {
                password: newPassword,
                passwordLastChanged: new Date().toISOString()
            };

            await update(ref(database, `users/${username}`), updates);

            // --- AUDIT LOG START ---
            await createAuditLog(
                "Change Password", 
                `User ${username} successfully changed their account password.`, 
                username
            );
            // --- AUDIT LOG END ---

            currentUserData.password = newPassword;
            currentUserData.passwordLastChanged = updates.passwordLastChanged;

            updateUserDisplay();

            document.getElementById('change-password-modal').classList.remove('active');
            document.getElementById('change-password-form').reset();

            alert('Password changed successfully!');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password. Please try again.');
    }
}

// Handle logout from all devices
function handleLogoutAll() {
    if (confirm('This will log you out from all devices. Continue?')) {
        sessionStorage.clear();
        localStorage.clear();
        alert('You have been logged out from all devices.');
        window.location.href = 'LogIn.html';
    }
}