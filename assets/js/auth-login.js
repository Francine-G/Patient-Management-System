// auth-login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
});

// Handle form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const usernameOrEmail = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember').checked;

  if (!usernameOrEmail || !password) {
    alert('Please enter your username/email and password');
    return;
  }

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    let username = usernameOrEmail;

    // If email is provided, we need to find the username first
    if (isEmail) {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        let foundUsername = null;

        // Search for user with matching email
        for (const [key, userData] of Object.entries(users)) {
          if (userData.email === usernameOrEmail) {
            foundUsername = key;
            break;
          }
        }

        if (!foundUsername) {
          alert('Invalid email or password');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }

        username = foundUsername;
      } else {
        alert('Invalid email or password');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }
    }

    // Get user data
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
        setTimeout(() => {
          window.location.href = 'Email_Verification.html';
        }, 2000);
        return;
      }

      alert('Invalid username/email or password');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    const userData = userSnapshot.val();

    // Verify password (In production, use proper password hashing!)
    if (userData.password !== password) {
      alert('Invalid username/email or password');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    // Check if user is verified
    if (!userData.verified) {
      alert('Please verify your email first. Check your inbox for the verification code.');
      sessionStorage.setItem('pendingUsername', username);
      sessionStorage.setItem('pendingEmail', userData.email);
      setTimeout(() => {
        window.location.href = 'Email_Verification.html';
      }, 2000);
      return;
    }

    // Login successful
    sessionStorage.setItem('currentUser', username);
    
    // Store user data for the session
    sessionStorage.setItem('userData', JSON.stringify({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role || 'admin'
    }));

    // If remember me is checked, store in localStorage
    if (rememberMe) {
      localStorage.setItem('rememberedUser', username);
    } else {
      localStorage.removeItem('rememberedUser');
    }

    // Update last login time
    const lastLoginRef = ref(database, `users/${username}/lastLogin`);
    await get(lastLoginRef).then(() => {
      // Only update if user has internet connection
      if (navigator.onLine) {
        const loginUpdate = {};
        loginUpdate[`users/${username}/lastLogin`] = new Date().toISOString();
        // Note: In Firebase, you'd use update() instead of get() here
      }
    });

    // Redirect to dashboard
    submitButton.textContent = 'Success! Redirecting...';
    setTimeout(() => {
      window.location.href = 'Dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
    
    // Reset button
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = 'Log In';
  }
});

// Forgot password handler (placeholder)
document.querySelector('.forgot-password').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Password reset functionality will be implemented soon. Please contact support for assistance.');
});

// Auto-fill username if remembered
window.addEventListener('DOMContentLoaded', () => {
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('username').value = rememberedUser;
    document.getElementById('remember').checked = true;
    document.getElementById('password').focus();
  }
});