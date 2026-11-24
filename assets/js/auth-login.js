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

document.querySelector('form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');

  if (!username || !password) {
    alert('Please enter your username and password');
    return;
  }

  let users;
  try {
    users = getUsers();
  } catch (error) {
    console.error('Could not read locally stored accounts:', error);
    alert('Unable to read saved accounts in this browser. Please clear the site data and sign up again.');
    return;
  }

  let matchedUsername = Object.keys(users).find((key) => key.toLowerCase() === username.toLowerCase());
  let userData = matchedUsername ? users[matchedUsername] : null;

  // Older verified accounts were stored in Firebase. Keep those accounts
  // usable while new signups use the browser store shared with this login page.
  if (!userData) {
    submitButton.disabled = true;
    submitButton.textContent = 'Checking account...';
    try {
      const [{ initializeApp }, { getDatabase, ref, get }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js')
      ]);
      const app = initializeApp({
        apiKey: 'AIzaSyCxok6-e-GB8fdmSD8_Wpa-0_jYwK77eHk',
        authDomain: 'patientflow-26dc1.firebaseapp.com',
        databaseURL: 'https://patientflow-26dc1-default-rtdb.firebaseio.com',
        projectId: 'patientflow-26dc1',
        storageBucket: 'patientflow-26dc1.firebasestorage.app',
        messagingSenderId: '124429931982',
        appId: '1:124429931982:web:ef44ca54332b9fcca5079f'
      }, 'login');
      const snapshot = await Promise.race([
        get(ref(getDatabase(app), `users/${username}`)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Account lookup timed out')), 8000))
      ]);
      if (snapshot.exists()) {
        userData = snapshot.val();
        matchedUsername = userData.username || username;
      }
    } catch (error) {
      console.error('Could not check the legacy account store:', error);
    }
  }

  if (!userData || userData.password !== password) {
    submitButton.disabled = false;
    submitButton.textContent = 'Log In';
    alert('Invalid username or password');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Opening dashboard...';
  sessionStorage.setItem('currentUser', matchedUsername || username);
  sessionStorage.setItem('userData', JSON.stringify({
    username: matchedUsername || username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role || 'user'
  }));
  localStorage.setItem('rememberedUser', username);

  window.location.assign('Dashboard.html');
});

const forgotPasswordLink = document.querySelector('.forgot a');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (event) => {
    event.preventDefault();
    alert('Please contact an administrator to reset your password.');
  });
}
