<html> 
    <head>
        <title>Patient-Flow</title>
        <link rel="stylesheet" type="text/css" href="assets/css/landingPage-style.css">
    </head>

    <body>
        <div class="header">
            <div class="navbar">
                <div class="logo">
                    <h2>Patient-Flow</h2>
                </div>
                <div class="nav-links">
                    <ul>
                        <li><a href="#">About</a></li>
                        <li><a href="#">Team</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="get-started-content">
                <img src="assets/images/Landing-Page-img.png" alt="image1">
                <div class="text">
                    <h1>Streamline Your Healthcare Practice</h1>
                    <p>Optimize patient management with our modern patient management and 
                        intelligent queuing system for efficient healthcare delivery</p>
                </div>
            </div>

            <div class="about-content scroll-animate">
                <div class="system-prev">
                    <img src="assets/images/System-Prev.png" alt="image2">
                </div>
                <div class="about-system">
                    <div class="content-box">
                        <h2>About Patient-Flow </h2>
                        <p>Patient-Flow is a cutting-edge patient management and queuing system designed to 
                            enhance the efficiency of healthcare facilities. By leveraging modern technology, 
                            Patient-Flow streamlines patient check-ins, reduces wait times, and optimizes 
                            resource allocation, ensuring a seamless experience for both patients and healthcare providers.
                        </p>
                    </div>
                    <button>Learn More</button>
                </div>
            </div>
        </div>

        <script>
            const sections = document.querySelectorAll('.scroll-animate');

            function handleScroll() {
                sections.forEach(section => {
                    const top = section.getBoundingClientRect().top;
                    const bottom = section.getBoundingClientRect().bottom;
                    const screenHeight = window.innerHeight;

                    if (top < screenHeight * 0.85 && bottom > screenHeight * 0.15) {
                        section.classList.add('show');
                    } else {
                        section.classList.remove('show');
                    }
                });
            }

            window.addEventListener('scroll', handleScroll);
            handleScroll();
        </script>
    </body>
</html>