import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 * @param {string} logData.action - The action performed 
 * @param {string} logData.entity_type - The type of entity
 * @param {string} [logData.entity_id] - The ID of the entity affected 
 * @param {string} [logData.details] - Additional details about the action
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function logAction(logData) {
    try {
        // Get current user from session
        const currentUser = sessionStorage.getItem('currentUser');
        const userDataString = sessionStorage.getItem('userData');
        
        if (!currentUser || !userDataString) {
            console.warn('No user session found. Audit log not created.');
            return false;
        }

        const userData = JSON.parse(userDataString);

        // Generate unique log ID
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create audit log object
        const auditLog = {
            timestamp: new Date().toISOString(),
            user_name: `${userData.firstName} ${userData.lastName}`.trim(),
            username: currentUser,
            user_role: userData.role || 'user',
            action: logData.action || 'Unknown Action',
            entity_type: logData.entity_type || 'Unknown',
            entity_id: logData.entity_id || null,
            details: logData.details || 'No additional details',
            ip_address: 'N/A', // Would need server-side to get real IP
            user_agent: navigator.userAgent || 'Unknown'
        };

        // Save to Firebase
        await set(ref(database, `audit_logs/${logId}`), auditLog);
        
        console.log('Audit log created:', auditLog);
        return true;
    } catch (error) {
        console.error('Error creating audit log:', error);
        return false;
    }
}

/**
 * Predefined action types for consistency
 */
export const AuditActions = {
    // Patient actions
    PATIENT_CREATE: 'Created Patient',
    PATIENT_UPDATE: 'Updated Patient',
    PATIENT_DELETE: 'Deleted Patient',
    PATIENT_VIEW: 'Viewed Patient',
    
    // Appointment actions
    APPOINTMENT_CREATE: 'Created Appointment',
    APPOINTMENT_UPDATE: 'Updated Appointment',
    APPOINTMENT_DELETE: 'Deleted Appointment',
    APPOINTMENT_COMPLETE: 'Completed Appointment',
    
    // Queue actions
    QUEUE_ADD: 'Added to Queue',
    QUEUE_UPDATE: 'Updated Queue',
    QUEUE_REMOVE: 'Removed from Queue',
    QUEUE_COMPLETE: 'Completed Queue Entry',
    
    // Schedule actions
    SCHEDULE_CREATE: 'Created Schedule',
    SCHEDULE_UPDATE: 'Updated Schedule',
    SCHEDULE_DELETE: 'Deleted Schedule',
    
    // Personnel actions
    PERSONNEL_ADD: 'Added Personnel',
    PERSONNEL_UPDATE: 'Updated Personnel',
    PERSONNEL_REMOVE: 'Removed Personnel',
    
    // Settings actions
    SETTINGS_UPDATE: 'Updated Settings',
    PASSWORD_CHANGE: 'Changed Password',
    PROFILE_UPDATE: 'Updated Profile',
    
    // Auth actions
    USER_LOGIN: 'User Login',
    USER_LOGOUT: 'User Logout',
    
    // System actions
    SYSTEM_CONFIG: 'System Configuration Change',
    DATA_EXPORT: 'Exported Data',
    DATA_IMPORT: 'Imported Data'
};

/**
 * Entity types for consistency
 */
export const EntityTypes = {
    PATIENT: 'Patient',
    APPOINTMENT: 'Appointment',
    QUEUE: 'Queue',
    SCHEDULE: 'Schedule',
    PERSONNEL: 'Personnel',
    SETTINGS: 'Settings',
    USER: 'User',
    SYSTEM: 'System'
};

// Export default object with all functions and constants
export default {
    logAction,
    AuditActions,
    EntityTypes
};