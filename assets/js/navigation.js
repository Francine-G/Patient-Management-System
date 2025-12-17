document.addEventListener('DOMContentLoaded', function() {

    const currentPage = window.location.pathname.split('/').pop();
    
    const navLinks = document.querySelectorAll('.navigation-menu .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPage || 
            (currentPage === '' && href === 'Dashboard.html') ||
            (currentPage === 'index.html' && href === 'Dashboard.html')) {
            
            setTimeout(() => {
                link.classList.add('active');
            }, 50);
        }
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === 'LogIn.html') {
                sessionStorage.clear();
                return;
            }
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            
            this.classList.add('active');
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.navigation-menu .nav-link, .navigation-menu .active');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            // Get click position
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Set ripple position
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            // Add ripple to link
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple effect styles dynamically
const style = document.createElement('style');
style.textContent = `
    .navigation-menu .nav-link,
    .navigation-menu .active {
        position: relative;
        overflow: hidden;
    }
    
    .ripple-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%) scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: translate(-50%, -50%) scale(15);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);