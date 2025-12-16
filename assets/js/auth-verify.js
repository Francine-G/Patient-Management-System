// auth-verify.js (FIXED VERSION)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize EmailJS
(function() {
  emailjs.init("d7suPKSZb_xM3L28c");
})();

// Global variables
let verificationAttempts = 0;
const maxAttempts = 5;

// Check if user has pending verification
window.addEventListener('DOMContentLoaded', () => {
  const pendingUsername = sessionStorage.getItem('pendingUsername');
  const pendingEmail = sessionStorage.getItem('pendingEmail');

  if (!pendingUsername || !pendingEmail) {
    // No pending verification, redirect to signup
    alert('No pending verification found. Please sign up first.');
    window.location.href = 'SignUp.html';
    return;
  }

  // Display the email in the verification message
  const emailText = document.querySelector('.verification-text b');
  if (emailText) {
    emailText.textContent = pendingEmail;
  }

  // Auto-focus first input
  const firstInput = document.querySelector('.code-input');
  if (firstInput) {
    firstInput.focus();
  }
});

// Handle code input auto-focus and validation
const codeInputs = document.querySelectorAll('.code-input');

codeInputs.forEach((input, index) => {
  // Input event - handle typing
  input.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.target.value = '';
      return;
    }

    // Ensure only one digit
    if (value.length > 1) {
      e.target.value = value.charAt(0);
      return;
    }

    // Move to next input if value is entered
    if (value && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }

    // Auto-submit if all fields are filled
    if (index === codeInputs.length - 1 && value) {
      const allFilled = Array.from(codeInputs).every(input => input.value.length === 1);
      if (allFilled) {
        // Small delay to show the last digit
        setTimeout(() => {
          document.getElementById('code-form').requestSubmit();
        }, 300);
      }
    }
  });

  // Keydown event - handle backspace and arrow keys
  input.addEventListener('keydown', (e) => {
    // Backspace
    if (e.key === 'Backspace') {
      if (!e.target.value && index > 0) {
        // Move to previous input if current is empty
        codeInputs[index - 1].focus();
        codeInputs[index - 1].value = '';
      }
    }

    // Left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      codeInputs[index - 1].focus();
    }

    // Right arrow
    if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }
  });

  // Paste event - handle pasting 6-digit code
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\s/g, '');
    
    // Check if pasted data is valid 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      // Fill all inputs with pasted digits
      pastedData.split('').forEach((digit, i) => {
        if (codeInputs[i]) {
          codeInputs[i].value = digit;
        }
      });
      // Focus last input
      codeInputs[5].focus();
      
      // Auto-submit after paste
      setTimeout(() => {
        document.getElementById('code-form').requestSubmit();
      }, 300);
    } else {
      showMessage('Please paste a valid 6-digit code', 'error');
    }
  });

  // Focus event - select all text
  input.addEventListener('focus', (e) => {
    e.target.select();
  });
});

// Show message to user
function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMsg = document.querySelector('.verification-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `verification-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    padding: 10px 15px;
    margin: 15px 0;
    border-radius: 5px;
    text-align: center;
    font-size: 14px;
    animation: slideDown 0.3s ease;
  `;

  if (type === 'error') {
    messageDiv.style.backgroundColor = '#fee';
    messageDiv.style.color = '#c33';
    messageDiv.style.border = '1px solid #fcc';
  } else if (type === 'success') {
    messageDiv.style.backgroundColor = '#efe';
    messageDiv.style.color = '#3c3';
    messageDiv.style.border = '1px solid #cfc';
  } else {
    messageDiv.style.backgroundColor = '#eef';
    messageDiv.style.color = '#33c';
    messageDiv.style.border = '1px solid #ccf';
  }

  // Insert message before form
  const form = document.getElementById('code-form');
  form.parentNode.insertBefore(messageDiv, form);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Resend verification code
document.querySelector('.resend-link').addEventListener('click', async (e) => {
  e.preventDefault();
  
  const resendLink = e.target;
  const originalText = resendLink.textContent;

  // Prevent multiple clicks
  if (resendLink.classList.contains('disabled')) {
    return;
  }

  const pendingUsername = sessionStorage.getItem('pendingUsername');
  const pendingEmail = sessionStorage.getItem('pendingEmail');

  if (!pendingUsername) {
    showMessage('Session expired. Please sign up again.', 'error');
    setTimeout(() => {
      window.location.href = 'SignUp.html';
    }, 2000);
    return;
  }

  try {
    // Disable link and show loading
    resendLink.classList.add('disabled');
    resendLink.textContent = 'Sending...';
    resendLink.style.pointerEvents = 'none';

    console.log('Resending code for user:', pendingUsername);

    // Get user data from pending_users
    const userRef = ref(database, `pending_users/${pendingUsername}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      showMessage('User data not found. Please sign up again.', 'error');
      setTimeout(() => {
        window.location.href = 'SignUp.html';
      }, 2000);
      return;
    }

    const userData = snapshot.val();
    
    // Generate new verification code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('New verification code:', newCode);
    
    // Update verification code in database
    await set(ref(database, `pending_users/${pendingUsername}/verificationCode`), newCode);
    console.log('Updated code in database');

    // Send new verification email
    const templateParams = {
      to_email: pendingEmail,
      to_name: userData.firstName,
      verification_code: newCode,
      from_name: "Patient Flow"
    };

    console.log('Sending email with params:', templateParams);

    const response = await emailjs.send(
      "service_jk7apqo", 
      "template_vsydg5o",
      templateParams
    );

    console.log('Email sent successfully:', response);
    showMessage('A new verification code has been sent to your email!', 'success');
    
    // Clear existing input values
    codeInputs.forEach(input => input.value = '');
    codeInputs[0].focus();

    // Reset verification attempts
    verificationAttempts = 0;

    // Re-enable link after 60 seconds
    let countdown = 60;
    const countdownInterval = setInterval(() => {
      countdown--;
      resendLink.textContent = `Resend Code (${countdown}s)`;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        resendLink.textContent = originalText;
        resendLink.classList.remove('disabled');
        resendLink.style.pointerEvents = 'auto';
      }
    }, 1000);

  } catch (error) {
    console.error('Resend error:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    
    if (error.status === 422) {
      showMessage('Email configuration error. Please check EmailJS settings.', 'error');
    } else {
      showMessage('Failed to resend code. Please try again.', 'error');
    }
    
    // Reset link
    resendLink.textContent = originalText;
    resendLink.classList.remove('disabled');
    resendLink.style.pointerEvents = 'auto';
  }
});

// Handle form submission
document.getElementById('code-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const pendingUsername = sessionStorage.getItem('pendingUsername');

  if (!pendingUsername) {
    showMessage('Session expired. Please sign up again.', 'error');
    setTimeout(() => {
      window.location.href = 'SignUp.html';
    }, 2000);
    return;
  }

  // Check if max attempts reached
  if (verificationAttempts >= maxAttempts) {
    showMessage('Too many failed attempts. Please request a new code.', 'error');
    codeInputs.forEach(input => {
      input.value = '';
      input.disabled = true;
    });
    document.querySelector('.verify').disabled = true;
    return;
  }

  // Get the entered code
  const enteredCode = Array.from(codeInputs)
    .map(input => input.value)
    .join('');

  if (enteredCode.length !== 6) {
    showMessage('Please enter the complete 6-digit code', 'error');
    return;
  }

  try {
    // Disable inputs and button during verification
    const verifyButton = document.querySelector('.verify');
    const originalButtonText = verifyButton.textContent;
    verifyButton.disabled = true;
    verifyButton.textContent = 'Verifying...';
    codeInputs.forEach(input => input.disabled = true);

    console.log('Verifying code for user:', pendingUsername);
    console.log('Entered code:', enteredCode);

    // Get user data from pending_users
    const userRef = ref(database, `pending_users/${pendingUsername}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      showMessage('User data not found. Please sign up again.', 'error');
      setTimeout(() => {
        window.location.href = 'SignUp.html';
      }, 2000);
      return;
    }

    const userData = snapshot.val();
    console.log('Expected code:', userData.verificationCode);

    // Verify the code
    if (enteredCode === userData.verificationCode) {
      // Code is correct
      console.log('Code verified successfully!');
      showMessage('Verification successful! Redirecting...', 'success');
      
      // Move user to verified users
      const verifiedUserData = {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password, // In production, ensure this is hashed
        verified: true,
        verifiedAt: new Date().toISOString(),
        role: 'admin', // Default role for patient management system
        createdAt: userData.createdAt
      };

      // Save to users collection
      await set(ref(database, `users/${userData.username}`), verifiedUserData);
      console.log('User moved to verified users');

      // Remove from pending_users
      await remove(userRef);
      console.log('Removed from pending users');

      // Store session info
      sessionStorage.setItem('currentUser', userData.username);
      sessionStorage.removeItem('pendingUsername');
      sessionStorage.removeItem('pendingEmail');

      // Redirect to success verification page
      setTimeout(() => {
        window.location.href = 'Success_Verification.html';
      }, 1000);

    } else {
      // Incorrect code
      verificationAttempts++;
      const remainingAttempts = maxAttempts - verificationAttempts;
      
      console.log('Incorrect code. Attempts:', verificationAttempts);
      
      if (remainingAttempts > 0) {
        showMessage(`Invalid code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`, 'error');
      } else {
        showMessage('Too many failed attempts. Please request a new code.', 'error');
        document.querySelector('.verify').disabled = true;
      }

      // Clear the inputs and re-enable
      codeInputs.forEach(input => {
        input.value = '';
        input.disabled = remainingAttempts > 0 ? false : true;
      });
      
      if (remainingAttempts > 0) {
        codeInputs[0].focus();
        verifyButton.disabled = false;
        verifyButton.textContent = originalButtonText;
      }
    }

  } catch (error) {
    console.error('Verification error:', error);
    showMessage('An error occurred during verification. Please try again.', 'error');
    
    // Re-enable inputs and button
    codeInputs.forEach(input => input.disabled = false);
    document.querySelector('.verify').disabled = false;
    document.querySelector('.verify').textContent = 'Verify';
    codeInputs[0].focus();
  }
});