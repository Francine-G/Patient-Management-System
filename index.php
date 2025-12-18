<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient-Flow</title>
    <link rel="stylesheet" type="text/css" href="assets/css/LandingPage-style.css">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link href="/website/css/uicons-outline-rounded.css"rel="stylesheet">
    <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-straight/css/uicons-solid-straight.css'>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
    <div class="page-wrap">
        <!-- Hero Overlay-->
        <div class="hero-overlay"  style="background: linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%), url('assets/images/Landing.png') no-repeat center center / cover;">
            <div class="hero-content" id="home">
                <div class="hero-tag">Healthcare Management</div>

                <div class="hero-title">
                    Streamline Your Healthcare Practice
                </div>

                <p class="hero-description">
                    Optimize patient management with our modern patient management and intelligent 
                    queuing system for efficient healthcare delivery
                </p>

                <button class="hero-btn" onclick="toggleOverlay()">Learn More</button>
            </div>

        </div>

        <!-- Glass Frame Container -->
        <div class="glass-frame">
            <!-- Navbar -->
            <header class="nav">
                <div class="brand">
                    <h1 class="brand-name">Patient-Flow</h1>
                </div>

                <nav class="links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                    <a href="#team">Team</a>
                    <a href="#contact">Contact</a>
                </nav>
                <a href="#getstarted" class="btn btn-dark">Get Started</a>
            </header>

            <!-- Main Content -->
            <section class="main-content" id="main-dashboard">
                <!-- About Section -->
                <section class="about-section scroll-animate" id="about">
                    <div class="system-preview">
                        <img src="assets/images/System-Prev.png" alt="System Preview">
                    </div>
                    <div class="about-system">
                        <img src="assets/images/Stethoscope.png" alt="Stethoscope Icon" class="about-icon">
                        <div class="content-box">
                            <h2>About Patient-Flow</h2>
                            <p>Patient-Flow is a cutting-edge patient management and queuing system designed to
                                enhance the efficiency of healthcare facilities. By leveraging modern technology, 
                                Patient-Flow streamlines patient check-ins, reduces wait times, and optimizes 
                                resource allocation, ensuring a seamless experience for both patients and healthcare providers.
                            </p>
                        </div>
                        <button class="cta-btn">Explore Features</button>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features-section scroll-animate" id="features">
                    <div class="feature-header">
                        <h2>Key Features</h2>
                        <p>Discover how Patient-Flow revolutionizes patient management and 
                            queuing processes for healthcare providers.
                        </p>
                    </div>
                    
                    <div class="feature-container">
                        <div class="features-track">
                            <!-- Loop 1 -->
                            <div class="feature-card">
                                <img src="assets/images/key features/feature1.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-file-recycle"></i>
                                    <h3>Automated Patient Queues</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature2.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-dashboard-monitor"></i>
                                    <h3>Real-Time Monitoring</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature3.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-smart-watch-calendar"></i>
                                    <h3>Smart Appointment Scheduling</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature4.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-compliance-document"></i>
                                    <h3>Secure Record Management</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature5.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-user-key"></i>
                                    <h3>Role-Based Access</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature6.jpg" alt="Feature Image">
                                <div class="feature-card-overlay"> 
                                    <i class="fi fi-ss-audit"></i>
                                    <h3>Action Tracking</h3>
                                </div>
                            </div>

                            <!-- Loop 2 -->
                            <div class="feature-card">
                                <img src="assets/images/key features/feature1.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-file-recycle"></i>
                                    <h3>Automated Patient Queues</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature2.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-dashboard-monitor"></i>
                                    <h3>Real-Time Monitoring</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature3.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-smart-watch-calendar"></i>
                                    <h3>Smart Appointment Scheduling</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature4.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-compliance-document"></i>
                                    <h3>Secure Record Management</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature5.jpg" alt="Feature Image">
                                <div class="feature-card-overlay">
                                    <i class="fi fi-ss-user-key"></i>
                                    <h3>Role-Based Access</h3>
                                </div>
                            </div>
                            <div class="feature-card">
                                <img src="assets/images/key features/feature6.jpg" alt="Feature Image">
                                <div class="feature-card-overlay"> 
                                    <i class="fi fi-ss-audit"></i>
                                    <h3>Action Tracking</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </section>

                <section class="teams-section scroll-animate" id="team">
                    <div class="team-header">
                        <h2>Meet the Team</h2>
                        <p>Our dedicated team of developers of FIN.exe that are committed to 
                            transforming patient management
                        </p>
                    </div>
                    <div class="team-grid">
                        <img src="assets/images/bg.png" alt="Wave Background" class="team-bg-de">
                        <div class="card-holder">
                            <div class="team-card" 
                                data-name="Ianna Yzabel Beray"
                                data-role="UI/UX Designer, Front-end Developer"
                                data-extra="WVSU CICT - BSIS Student"
                                data-quote="“Design is intelligence made visible.”"
                                data-img="assets/images/modal1.png">
                                <div class="team-card-overlay">
                                    <h3>Ianna Yzabel Beray</h3>
                                    <p>UI/UX Designer, Front-end Developer</p>
                                </div>
                                <img src="assets/images/developer1.png" alt="Developer1">
                            </div>
                             <div class="team-card"
                                data-name="Francine Gabrielle Luces"
                                data-role="Project Leader, Full-stack Developer"
                                data-extra="WVSU CICT - BSIS Student"
                                data-quote="“Coffee is life.”"
                                data-img="assets/images/modal2.png">
                                <div class="team-card-overlay">
                                    <h3>Francine Gabrielle Luces</h3>
                                    <p>Project Leader, Full-stack Developer</p>
                                </div>
                                <img src="assets/images/developer2.png" alt="Developer2">
                            </div>
                            <div class="team-card"
                                data-name="Nash Gonzales"
                                data-role="Back-end Developer, Database Developer"
                                data-extra="WVSU CICT - BSIS Student"
                                data-quote="“Code. Eat. Sleep. Repeat.”"
                                data-img="assets/images/modal3.png">
                                <div class="team-card-overlay">
                                    <h3>Nash Gonzales</h3>
                                    <p>Back-end Developer, Database Developer</p>
                                </div>
                                <img src="assets/images/developer3.png" alt="Developer3">
                            </div>
                        </div>
                    </div>

                     <!-- Modal -->
                    <div class="team-modal" id="teamModal">
                        <div class="modal-content">
                            <img id="modalImage" src="" alt="Developer">
                            <div class="modal-info">
                                <h3 id="modalName"></h3>
                                <p id="modalRole"></p>
                                <p id="modalExtra"></p>
                                <p id="modalQuote" class="quote"></p>
                                <h4>Contact Me</h4>
                                <div class="social-icons">
                                    <a href="#" class="fb"><i class="fa-brands fa-facebook-f"></i></a>
                                    <a href="#" class="ig"><i class="fa-brands fa-instagram"></i></a>
                                    <a href="#" class="gm"><i class="fa-solid fa-envelope"></i></a>
                                </div>
                                <button id="closeModal">Back</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="collab-section scroll-animate">
                    <div class="collab-header">
                        <h3>In Collaboration with</h3>
                    </div>
                    <div class="collab-images">
                        <img src="assets/images/Collab/Collab1.png" alt="West Visayas State University">
                        <img src="assets/images/Collab/Collab2.png" alt="College of Information and Communication Technology">
                        <img src="assets/images/Collab/Collab3.png" alt="FIN.exe">
                    </div>
                </section>


                <!-- Footer -->
                <footer class="site-footer" id="contact">
                    <div class="footer-container">
                        <!-- Brand -->
                        <div class="footer-brand box">
                        <img src="assets/images/Collab/Collab3.png" alt="FIN.exe logo">
                        <p class="brand-name">Patient-Flow</p>
                        <p class="footer-text">Modern Patient Management & Intelligent Queuing System</p>
                        </div>

                        <!-- Links -->
                        <div class="footer-links box">
                        <a href="index.php">Home</a>
                        <a href="#about">About</a>
                        <a href="#features">Features</a>
                        <a href="#team">Team</a>
                        </div>

                        <!-- Social Media -->
                        <div class="footer-socmed box">
                        <a href="mailto:finexe.inc@gmail.com" target="_blank"><i class="bx bxl-gmail"></i></a>
                        <a href="https://www.facebook.com/fin.exe.inc" target="_blank"><i class="bx bxl-facebook"></i></a>
                        <a href="https://www.instagram.com/fin.exe.inc/" target="_blank"><i class="bx bxl-instagram"></i></a>
                        <a href="https://www.linkedin.com/company/fin-exe-inc/" target="_blank"><i class="bx bxl-linkedin"></i></a>
                        </div>
                    </div>

                    <div class="footer-copy">
                        <p>© 2025 Patient-Flow | FIN.exe All rights reserved.</p>
                    </div>
                </footer>
            </section>
        </div>
    </div>

    <script src="assets/js/Landingpage-script.js"></script>
</body>
</html>