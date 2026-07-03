/**
 * MY HUB // INTERACTIVE DESIGNS (2026 STANDARDS)
 * Vanilla JS features:
 * 1. Magnetic Custom Cursor with Lerp Physics
 * 2. High-Performance Canvas Interactive Particle System
 * 3. 3D Card Tilt + Cursor Glow Tracking
 * 4. Command Palette (Search, Navigation, Arrow key bindings)
 * 5. Tag Filter logic with Micro-animations
 * 6. Interactive Contact/Inquiry modal binding
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MAGNETIC CUSTOM CURSOR
    // ==========================================
    const cursorOuter = document.getElementById('cursor-outer');
    const cursorInner = document.getElementById('cursor-inner');
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    let isHovering = false;
    let isClicking = false;

    // Track mouse coordinates
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant inner dot placement
        if (cursorInner) {
            cursorInner.style.left = `${mouseX}px`;
            cursorInner.style.top = `${mouseY}px`;
        }
    });

    // Outer Cursor Lerp (Smooth Follow Physics)
    function renderCursor() {
        const lerpFactor = 0.15; // Speed of outer outline spring
        cursorX += (mouseX - cursorX) * lerpFactor;
        cursorY += (mouseY - cursorY) * lerpFactor;
        
        if (cursorOuter) {
            cursorOuter.style.left = `${cursorX}px`;
            cursorOuter.style.top = `${cursorY}px`;
        }
        
        requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Hover state hooks
    const updateCursorHoverState = (active) => {
        isHovering = active;
        if (active) {
            document.body.classList.add('cursor-hovering');
        } else {
            document.body.classList.remove('cursor-hovering');
        }
    };

    // Click state hooks
    document.addEventListener('mousedown', () => {
        isClicking = true;
        document.body.classList.add('cursor-clicking');
    });
    document.addEventListener('mouseup', () => {
        isClicking = false;
        document.body.classList.remove('cursor-clicking');
    });

    // Connect event listeners to all interactive items
    const registerHoverTargets = () => {
        const targets = document.querySelectorAll('.magnet-target, a, button, input, textarea, .filter-btn, .blog-item');
        targets.forEach(target => {
            target.removeEventListener('mouseenter', () => updateCursorHoverState(true));
            target.removeEventListener('mouseleave', () => updateCursorHoverState(false));
            target.addEventListener('mouseenter', () => updateCursorHoverState(true));
            target.addEventListener('mouseleave', () => updateCursorHoverState(false));
        });
    };
    registerHoverTargets();


    // ==========================================
    // 2. CANVAS INTERACTIVE PARTICLES
    // ==========================================
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let connectionDistance = 100;
        let numParticles = 60;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Scale particle density based on screen space
            numParticles = Math.min(60, Math.floor((canvas.width * canvas.height) / 25000));
            initParticles();
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.5 + 1;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                // Boundaries rebound
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Mouse interaction / push away
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    this.x -= (dx / dist) * force * 0.8;
                    this.y -= (dy / dist) * force * 0.8;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections first
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < connectionDistance) {
                        const alpha = (1 - (dist / connectionDistance)) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
                
                // Draw line to mouse
                const mouseDist = Math.hypot(particles[i].x - mouseX, particles[i].y - mouseY);
                if (mouseDist < 150) {
                    const alpha = (1 - (mouseDist / 150)) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            // Update & Draw particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animateParticles);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animateParticles();
    }


    // ==========================================
    // 3. 3D CARD TILT + GLOW TRACKING
    // ==========================================
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // CSS Mouse Track variables
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            // 3D rotation angles
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 16;
            const rotateY = (x - centerX) / 16;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
        
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });


    // ==========================================
    // 4. COMMAND PALETTE (Ctrl+K Menu)
    // ==========================================
    const commandModal = document.getElementById('command-modal');
    const searchInput = document.getElementById('modal-search-input');
    const resultsContainer = document.getElementById('modal-results');
    const searchTrigger = document.getElementById('nav-search-trigger');
    
    let activeIndex = 0;
    let listItems = [];

    // Static registry of pages, commands, and links
    const commandRegistry = [
        { title: 'Project Alpha', type: 'project', tags: 'go,backend,api', action: () => window.open('https://github.com/yourusername/project-alpha', '_blank') },
        { title: 'Nexus UI', type: 'project', tags: 'js,css,a11y', action: () => window.open('https://github.com/yourusername/nexus-ui', '_blank') },
        { title: 'HyperDB', type: 'project', tags: 'js,backend', action: () => window.open('https://github.com/yourusername/hyper-db', '_blank') },
        { title: 'The Myth of Clean Code', type: 'writing', tags: 'clean,architecture,code', action: () => window.location.href = '/blog/the-myth-of-clean-code.html' },
        { title: 'Zero-Bullshit Deployment', type: 'writing', tags: 'pages,github,deployment', action: () => window.location.href = '/blog/deploying-on-github-pages.html' },
        { title: 'Contact / Inquire Form', type: 'action', tags: 'email,hire,message,contact', action: () => openContactModal() },
        { title: 'Navigate: Selected Work', type: 'navigation', tags: 'projects,grid', action: () => document.getElementById('projects-section').scrollIntoView({ behavior: 'smooth' }) },
        { title: 'Navigate: Writing & Notes', type: 'navigation', tags: 'blog,articles', action: () => document.getElementById('writing-section').scrollIntoView({ behavior: 'smooth' }) }
    ];

    const openCommandPalette = () => {
        commandModal.classList.add('active');
        commandModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput.focus(), 50);
        renderResults('');
    };

    const closeCommandPalette = () => {
        commandModal.classList.remove('active');
        commandModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        searchInput.value = '';
    };

    // Toggle overlay on Hotkey (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (commandModal.classList.contains('active')) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
        }
        if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });

    searchTrigger.addEventListener('click', openCommandPalette);
    
    // Close when clicking overlay backdrop
    commandModal.addEventListener('click', (e) => {
        if (e.target === commandModal) {
            closeCommandPalette();
        }
    });

    // Fuzzy search matching logic
    const renderResults = (query) => {
        resultsContainer.innerHTML = '';
        const filtered = commandRegistry.filter(item => {
            const cleanQuery = query.toLowerCase();
            return item.title.toLowerCase().includes(cleanQuery) || 
                   item.tags.toLowerCase().includes(cleanQuery) ||
                   item.type.toLowerCase().includes(cleanQuery);
        });

        if (filtered.length === 0) {
            resultsContainer.innerHTML = `
                <div class="font-mono text-xs text-center py-6 text-emerald-100/40">
                    No results found for "${query}"
                </div>
            `;
            listItems = [];
            return;
        }

        filtered.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `result-item magnet-target ${index === activeIndex ? 'selected' : ''}`;
            
            // Icon generation by type
            let iconSvg = '';
            if (item.type === 'project') {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
            } else if (item.type === 'writing') {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
            } else {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            }

            div.innerHTML = `
                <div class="result-info">
                    ${iconSvg}
                    <span class="result-title">${item.title}</span>
                </div>
                <span class="result-badge">${item.type}</span>
            `;
            
            div.addEventListener('click', () => {
                item.action();
                closeCommandPalette();
            });

            resultsContainer.appendChild(div);
        });

        listItems = resultsContainer.querySelectorAll('.result-item');
        registerHoverTargets();
    };

    // Input change binds
    searchInput.addEventListener('input', (e) => {
        activeIndex = 0;
        renderResults(e.target.value);
    });

    // Arrow keys & Enter keyboard navigation logic
    searchInput.addEventListener('keydown', (e) => {
        if (listItems.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            listItems[activeIndex].classList.remove('selected');
            activeIndex = (activeIndex + 1) % listItems.length;
            listItems[activeIndex].classList.add('selected');
            listItems[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            listItems[activeIndex].classList.remove('selected');
            activeIndex = (activeIndex - 1 + listItems.length) % listItems.length;
            listItems[activeIndex].classList.add('selected');
            listItems[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            listItems[activeIndex].click();
        }
    });


    // ==========================================
    // 5. PROJECT TAG FILTERING
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectGridItems = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active style from all
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            projectGridItems.forEach(card => {
                const tagsString = card.getAttribute('data-tags');
                const cardTags = tagsString ? tagsString.split(',') : [];
                
                if (filterValue === 'all' || cardTags.includes(filterValue)) {
                    // Reveal Card
                    card.style.display = 'flex';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95) perspective(1000px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) perspective(1000px)';
                    }, 50);
                } else {
                    // Hide Card
                    card.style.display = 'none';
                }
            });
        });
    });


    // ==========================================
    // 6. CONTACT MODAL BINDINGS
    // ==========================================
    const contactModal = document.getElementById('contact-modal');
    const contactTrigger = document.getElementById('contact-trigger');
    const contactClose = document.getElementById('contact-close');

    const openContactModal = () => {
        contactModal.classList.add('active');
        contactModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('contact-name').focus(), 50);
    };

    const closeContactModal = () => {
        contactModal.classList.remove('active');
        contactModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    contactTrigger.addEventListener('click', openContactModal);
    contactClose.addEventListener('click', closeContactModal);
    
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeContactModal();
        }
    });

});
