// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCxok6-e-GB8fdmSD8_Wpa-0_jYwK77eHk",
    authDomain: "patientflow-26dc1.firebaseapp.com",
    projectId: "patientflow-26dc1",
    storageBucket: "patientflow-26dc1.firebasestorage.app",
    messagingSenderId: "124429931982",
    appId: "1:124429931982:web:024d2d9c660d3f43a5079f"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  //inputs
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  //submit
  const submit = document.getElementById('submit');
  submit.addEventListener("click", function (event) {
    event.preventDefault()
    alert(5)
  })