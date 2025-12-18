import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize EmailJS with your public key
(function() {
  emailjs.init("d7suPKSZb_xM3L28c");
})();

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email using EmailJS
async function sendVerificationEmail(email, code, firstName) {
  try {
    console.log('Attempting to send email to:', email);
    console.log('Verification code:', code);
    
    const templateParams = {
      to_email: email,
      to_name: firstName,
      verification_code: code,
      from_name: "Patient Flow"
    };

    console.log('Template params:', templateParams);

    const response = await emailjs.send(
      "service_jk7apqo", 
      "template_vsydg5o",
      templateParams
    );
    
    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error("Email sending failed - Full error:", error);
    console.error("Error status:", error.status);
    console.error("Error text:", error.text);
    
    // Check for specific error types
    if (error.status === 422) {
      console.error("422 Error - Possible causes:");
      console.error("1. Email template doesn't exist or has wrong ID");
      console.error("2. Template variables don't match");
      console.error("3. Service ID is incorrect");
      console.error("4. EmailJS account has issues");
      
      alert(`Email configuration error. Please check:
1. EmailJS Service ID: service_jk7apqo
2. Template ID: template_vsydg5o
3. Template variables must include:
   - {{to_email}}
   - {{to_name}}
   - {{verification_code}}
   - {{from_name}}
   
Error details: ${error.text || 'Unknown error'}`);
    } else if (error.status === 404) {
      alert('EmailJS service or template not found. Please verify your EmailJS configuration.');
    } else {
      alert(`Failed to send verification email: ${error.text || 'Unknown error'}`);
    }
    
    return false;
  }
}

// Show a status message to the user
function showMessage(message, type = 'info') {
  const existingMsg = document.querySelector('.status-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `status-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    padding: 15px;
    margin: 15px 0;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  `;

  if (type === 'error') {
    messageDiv.style.backgroundColor = '#fee';
    messageDiv.style.color = '#c33';
    messageDiv.style.border = '2px solid #fcc';
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = '#efe';
    messageDiv.style.color = '#3c3';
    messageDiv.style.border = '2px solid #cfc';
  } else {
    messageDiv.style.backgroundColor = '#eef';
    messageDiv.style.color = '#33c';
    messageDiv.style.border = '2px solid #ccf';
  }

  const form = document.querySelector('form');
  form.parentNode.insertBefore(messageDiv, form);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Handle form submission
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation
  if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error');
    return;
  }

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    showMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores', 'error');
    return;
  }

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    console.log('Starting signup process for:', username);

    // Check if username already exists in pending_users
    const usernameRef = ref(database, `pending_users/${username}`);
    const usernameSnapshot = await get(usernameRef);
    
    if (usernameSnapshot.exists()) {
      showMessage('Username already exists. Please choose a different username.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    // Check in verified users as well
    const verifiedUserRef = ref(database, `users/${username}`);
    const verifiedSnapshot = await get(verifiedUserRef);
    
    if (verifiedSnapshot.exists()) {
      showMessage('Username already exists. Please choose a different username.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    // Check if email already exists
    const allUsersRef = ref(database, 'users');
    const allUsersSnapshot = await get(allUsersRef);
    
    if (allUsersSnapshot.exists()) {
      const users = allUsersSnapshot.val();
      for (const [key, userData] of Object.entries(users)) {
        if (userData.email === email) {
          showMessage('Email already registered. Please use a different email or login.', 'error');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
      }
    }

    console.log('Username and email available');

    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log('Generated verification code:', verificationCode);
    
    // Store user data temporarily with verification code
    const pendingUserData = {
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password, 
      verificationCode: verificationCode,
      createdAt: new Date().toISOString(),
      verified: false
    };

    console.log('Saving to Firebase...');
    await set(ref(database, `pending_users/${username}`), pendingUserData);
    console.log('Saved to Firebase successfully');

    // Update button text
    submitButton.textContent = 'Sending Verification Code...';
    showMessage('Account created! Sending verification code...', 'info');

    // Send verification email
    console.log('Attempting to send email...');
    const emailSent = await sendVerificationEmail(email, verificationCode, firstName);

    if (emailSent) {
      console.log('Email sent successfully!');
      showMessage('Verification code sent! Redirecting...', 'success');
      
      // Store username and email in sessionStorage for the verification page
      sessionStorage.setItem('pendingUsername', username);
      sessionStorage.setItem('pendingEmail', email);
      
      // Redirect to email verification page
      setTimeout(() => {
        window.location.href = 'Email_Verification.html';
      }, 1500);
    } else {
      console.error('Email sending failed');
      showMessage('Failed to send verification email. Please try again or contact support.', 'error');
      
    
      showMessage('You can try resending the code from the verification page...', 'info');
      
      sessionStorage.setItem('pendingUsername', username);
      sessionStorage.setItem('pendingEmail', email);
      
      setTimeout(() => {
        window.location.href = 'Email_Verification.html';
      }, 2000);
    }

  } catch (error) {
    console.error('Signup error:', error);
    showMessage('An error occurred during signup. Please try again.', 'error');
    
    // Reset button
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = 'Sign Up';
  }
});