import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) {
    // User is already logged in, redirect to dashboard
    window.location.href = 'Dashboard.html';
  }

  // Auto-fill username if remembered
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('username').value = rememberedUser;
    document.getElementById('password').focus();
  }
});

// Handle form submission
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!username || !password) {
    alert('Please enter your username and password');
    return;
  }

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    // Check if user exists in verified users
    const userRef = ref(database, `users/${username}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      // Check if user is still in pending_users (not verified)
      const pendingUserRef = ref(database, `pending_users/${username}`);
      const pendingSnapshot = await get(pendingUserRef);

      if (pendingSnapshot.exists()) {
        alert('Please verify your email first. Check your inbox for the verification code.');
        // Store pending info and redirect to verification
        sessionStorage.setItem('pendingUsername', username);
        sessionStorage.setItem('pendingEmail', pendingSnapshot.val().email);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        setTimeout(() => {
          window.location.href = 'Email_Verification.html';
        }, 1500);
        return;
      }

      // User doesn't exist at all
      alert('Invalid username or password');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    const userData = userSnapshot.val();

    // Verify password (Note: In production, use proper password hashing like bcrypt!)
    if (userData.password !== password) {
      alert('Invalid username or password');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    // Check if user is verified (extra safety check)
    if (userData.verified === false) {
      alert('Please verify your email first. Check your inbox for the verification code.');
      sessionStorage.setItem('pendingUsername', username);
      sessionStorage.setItem('pendingEmail', userData.email);
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      setTimeout(() => {
        window.location.href = 'Email_Verification.html';
      }, 1500);
      return;
    }

    // Login successful - store user session
    sessionStorage.setItem('currentUser', username);
    
    // Store user data for the session
    sessionStorage.setItem('userData', JSON.stringify({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role || 'admin'
    }));

    // Remember user for next time (optional feature)
    localStorage.setItem('rememberedUser', username);

    // Update last login time
    try {
      const updates = {};
      updates[`users/${username}/lastLogin`] = new Date().toISOString();
      await update(ref(database), updates);
    } catch (updateError) {
      // Non-critical error, just log it
      console.log('Could not update last login time:', updateError);
    }

    // Redirect to dashboard
    submitButton.textContent = 'Success! Redirecting...';
    setTimeout(() => {
      window.location.href = 'Dashboard.html';
    }, 800);

  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
    
    // Reset button
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Log In';
    }
  }
});

// Forgot password handler
const forgotPasswordLink = document.querySelector('.forgot a');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Password reset functionality will be implemented soon. Please contact support for assistance.');
  });
}

