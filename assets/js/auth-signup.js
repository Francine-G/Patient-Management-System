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
  const email = document.getElementById('email').value.trim().toLowerCase();
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

  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Creating Account...';

  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    const normalizedUsername = username.toLowerCase();

    if (Object.keys(users).some((key) => key.toLowerCase() === normalizedUsername)) {
      showMessage('Username already exists. Please choose a different username.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    if (Object.values(users).some((user) => user.email?.toLowerCase() === email)) {
      showMessage('Email already registered. Please use a different email or login.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    users[username] = { username, firstName, lastName, email, password, role: 'user' };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    showMessage('Account created! Redirecting to login...');
    setTimeout(() => {
      window.location.href = 'LogIn.html';
    }, 700);
  } catch (error) {
    console.error('Signup error:', error);
    showMessage('Unable to create the account in this browser. Please try again.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});
