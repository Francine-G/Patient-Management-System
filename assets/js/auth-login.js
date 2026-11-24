const USERS_STORAGE_KEY = 'patientFlowUsers';

function getUsers() {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  const users = storedUsers ? JSON.parse(storedUsers) : {};

  if (!users.admin) {
    users.admin = {
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@patientflow.local',
      password: 'admin123',
      role: 'admin'
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  return users;
}

window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('currentUser')) {
    window.location.href = 'Dashboard.html';
    return;
  }

  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('username').value = rememberedUser;
    document.getElementById('password').focus();
  }
});

document.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitButton = event.target.querySelector('button[type="submit"]');

  if (!username || !password) {
    alert('Please enter your username and password');
    return;
  }

  const userData = getUsers()[username];
  if (!userData || userData.password !== password) {
    alert('Invalid username or password');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Success! Redirecting...';
  sessionStorage.setItem('currentUser', username);
  sessionStorage.setItem('userData', JSON.stringify({
    username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role || 'user'
  }));
  localStorage.setItem('rememberedUser', username);

  setTimeout(() => {
    window.location.href = 'Dashboard.html';
  }, 300);
});

const forgotPasswordLink = document.querySelector('.forgot a');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (event) => {
    event.preventDefault();
    alert('Please contact an administrator to reset your password.');
  });
}
