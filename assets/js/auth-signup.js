const USERS_STORAGE_KEY = 'patientFlowUsers';

function showMessage(message, type = 'info') {
  const existingMessage = document.querySelector('.status-message');
  if (existingMessage) existingMessage.remove();

  const messageElement = document.createElement('div');
  messageElement.className = `status-message ${type}`;
  messageElement.textContent = message;
  messageElement.style.cssText = 'padding:15px;margin:15px 0;border-radius:8px;text-align:center;font-size:14px;font-weight:500;';
  messageElement.style.backgroundColor = type === 'error' ? '#fee' : '#efe';
  messageElement.style.color = type === 'error' ? '#c33' : '#383';
  document.querySelector('form').before(messageElement);
}

document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    showMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores', 'error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

<<<<<<< Updated upstream
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
      password: password, // In production, hash this password!
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
      
      // Don't clean up pending user data - they can try to resend from verification page
      // Just redirect them to verification page anyway
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
=======
  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
  if (users[username]) {
    showMessage('Username already exists. Please choose a different username.', 'error');
    return;
>>>>>>> Stashed changes
  }

  if (Object.values(users).some((user) => user.email === email)) {
    showMessage('Email already registered. Please use a different email or login.', 'error');
    return;
  }

  users[username] = { username, firstName, lastName, email, password, role: 'user' };
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  showMessage('Account created! Redirecting to login...');
  setTimeout(() => {
    window.location.href = 'LogIn.html';
  }, 700);
});
