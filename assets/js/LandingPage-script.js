document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.querySelector('.hero-overlay');
    const btn = document.querySelector('.hero-btn');

    // Initial state: overlay visible, body scroll disabled
    overlay.classList.remove('slide-up');
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Toggle overlay function
    window.toggleOverlay = function () {
        if (overlay.classList.contains('slide-up')) {
            // Slide back up to show hero
            overlay.classList.remove('slide-up');
            btn.textContent = "Learn More";
            document.body.style.overflow = 'hidden';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {

            // Slide down to hide hero and show main content
            overlay.classList.add('slide-up');
            btn.textContent = "Back";
            document.body.style.overflow = 'auto';
            
            const target = document.getElementById('main-dashboard');
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    };


    // Scroll animations for content sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedSections = document.querySelectorAll('.scroll-animate');
    animatedSections.forEach((section) => {
        observer.observe(section);
    });

    // Handle features grid animation
    const featuresGrid = document.querySelector('.features-grid');
    if (featuresGrid) {
        const gridObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    const cards = entry.target.querySelectorAll('.feature-card');
                    cards.forEach((card, index) => {
                        card.style.setProperty('--card-index', index);
                    });
                    gridObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        gridObserver.observe(featuresGrid);
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#home') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target && overlay.classList.contains('slide-up')) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    const exploreBtn = document.querySelector('.cta-btn');
    const featuresSection = document.querySelector('.features-section');

    if (exploreBtn && featuresSection) {
        exploreBtn.addEventListener('click', () => {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // === TEAM MODAL FUNCTIONALITY ===
    const modal = document.getElementById('teamModal');
    const modalImg = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalRole = document.getElementById('modalRole');
    const modalExtra = document.getElementById('modalExtra');
    const modalQuote = document.getElementById('modalQuote');
    const closeModal = document.getElementById('closeModal');

    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', () => {
            modal.classList.add('show');
            modalImg.src = card.dataset.img;
            modalName.textContent = card.dataset.name;
            modalRole.textContent = card.dataset.role;
            modalExtra.textContent = card.dataset.extra;
            modalQuote.textContent = card.dataset.quote;
            document.body.style.overflow = 'hidden';
        });
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
});