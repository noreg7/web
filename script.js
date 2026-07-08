/**
 * MY HUB // INTERACTIVE DESIGNS (2026 STANDARDS)
 * Vanilla JS features:
 * 1. Navigation Tab Switching (Resources Hub vs Portfolio Content)
 * 2. Dynamic Resources Hub Rendering (Categories, Sections, Cards, Blockquotes, Alerts)
 * 3. Fuzzy search filter with highlighted matching text
 * 4. Magnetic Custom Cursor with Lerp Physics
 * 5. High-Performance Canvas Interactive Particle System
 * 6. 3D Card Tilt + Cursor Glow Tracking
 * 7. Command Palette (Search, Navigation, Arrow key bindings, Resources lookup integration)
 * 8. Portfolio Tag Filter logic with Micro-animations
 * 9. Interactive Contact/Inquiry modal binding
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. TABS SWITCHING LOGIC
    // ==========================================
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active classes
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class
            tab.classList.add('active');
            const targetEl = document.getElementById(`tab-${targetTab}`);
            if (targetEl) {
                targetEl.classList.add('active');
            }
            
            // Re-trigger cursor hover bindings & card tilts for new items
            registerHoverTargets();
            registerCardTilts();
        });
    });


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
        const targets = document.querySelectorAll('.magnet-target, a, button, input, select, textarea, .filter-btn, .blog-item, .category-nav-btn, .resource-card');
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
                
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

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
    const registerCardTilts = () => {
        const cards = document.querySelectorAll('.project-card, .resource-card');
        cards.forEach(card => {
            if (card.dataset.tiltInitialized) return;
            card.dataset.tiltInitialized = "true";
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (centerY - y) / 16;
                const rotateY = (x - centerX) / 16;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
            
            // Handle card clicking for resource cards
            if (card.classList.contains('resource-card')) {
                card.addEventListener('click', (e) => {
                    // Do not navigate if clicking inside auxiliary pill links
                    if (e.target.closest('.aux-link-pill')) return;
                    
                    const titleLink = card.querySelector('.resource-title-link');
                    if (titleLink) {
                        window.open(titleLink.href, '_blank');
                    }
                });
            } else {
                card.addEventListener('click', () => {
                    const url = card.getAttribute('data-url');
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            }
        });
    };
    registerCardTilts();


    // ==========================================
    // 4. RESOURCE HUB CORE RENDERING & SEARCH
    // ==========================================
    const sidebarCategories = document.getElementById('sidebar-categories');
    const mobileCategoriesSelect = document.getElementById('mobile-categories-select');
    const resourcesFeed = document.getElementById('resources-feed');
    const searchInput = document.getElementById('resources-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    
    let activeCategoryId = '';
    
    // Check if resources data is loaded
    const resourcesData = window.RESOURCES_DATA || { categories: [] };
    
    // Pre-calculate items counts and initialize rendering
    const initResourcesHub = () => {
        if (resourcesData.categories.length === 0) return;
        
        // Render Category selectors
        sidebarCategories.innerHTML = '';
        mobileCategoriesSelect.innerHTML = '';
        
        resourcesData.categories.forEach((category, index) => {
            // Count total resource links in category
            let resourceCount = 0;
            category.sections.forEach(sec => {
                sec.items.forEach(item => {
                    if (item.type === 'resource') {
                        resourceCount += item.links.length;
                    }
                });
            });
            category.totalLinksCount = resourceCount;
            
            // Render desktop sidebar button
            const btn = document.createElement('button');
            btn.className = 'category-nav-btn magnet-target';
            btn.setAttribute('data-category', category.id);
            btn.style.setProperty('--category-color', category.color);
            btn.style.setProperty('--category-glow', category.color + '26'); // 15% opacity
            btn.style.setProperty('--category-highlight', category.color + '0d'); // 5% opacity
            
            btn.innerHTML = `
                <div class="category-btn-content">
                    <i data-lucide="${category.icon || 'book-open'}"></i>
                    <span>${category.title}</span>
                </div>
                <span class="category-count-badge">${resourceCount}</span>
            `;
            
            btn.addEventListener('click', () => {
                selectCategory(category.id);
                // Clear search when switching categories
                if (searchInput.value) {
                    searchInput.value = '';
                    searchClearBtn.style.display = 'none';
                }
            });
            sidebarCategories.appendChild(btn);
            
            // Render mobile select option
            const opt = document.createElement('option');
            opt.value = category.id;
            opt.textContent = `${category.title} (${resourceCount})`;
            mobileCategoriesSelect.appendChild(opt);
        });
        
        // Listen to mobile selection changes
        mobileCategoriesSelect.addEventListener('change', (e) => {
            selectCategory(e.target.value);
            if (searchInput.value) {
                searchInput.value = '';
                searchClearBtn.style.display = 'none';
            }
        });
        
        // Default to first category
        selectCategory(resourcesData.categories[0].id);
    };

    // Render helper for auxiliary link icons
    const getAuxLinkIcon = (name) => {
        const text = name.toLowerCase();
        if (text.includes('github')) return 'github';
        if (text.includes('discord')) return 'message-square';
        if (text.includes('reddit') || text.includes('subreddit')) return 'arrow-up-right';
        if (text.includes('guide') || text.includes('wiki')) return 'file-text';
        if (text.includes('download') || text.includes('mirror')) return 'download';
        if (text.includes('extension')) return 'chrome';
        if (text.includes('cli')) return 'terminal';
        return 'external-link';
    };

    // Render category contents
    const renderCategoryFeed = (categoryId) => {
        const category = resourcesData.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        resourcesFeed.innerHTML = '';
        
        // Set CSS variables for theme on parent feed
        resourcesFeed.style.setProperty('--category-color', category.color);
        resourcesFeed.style.setProperty('--category-glow', category.color + '26');
        resourcesFeed.style.setProperty('--category-highlight', category.color + '0d');
        
        // Render Header
        const header = document.createElement('div');
        header.className = 'category-feed-header';
        header.innerHTML = `
            <div class="category-feed-title-wrap">
                <i data-lucide="${category.icon || 'book-open'}"></i>
                <h2 class="category-feed-title">${category.title}</h2>
            </div>
            <p class="category-feed-desc">Comprehensive index of resources compiled from the source wiki database.</p>
        `;
        resourcesFeed.appendChild(header);
        
        // Render Sections
        category.sections.forEach(section => {
            const secWrap = document.createElement('div');
            secWrap.className = 'feed-section';
            
            // Section Title
            const secHeader = document.createElement('div');
            secHeader.className = 'feed-section-header';
            secHeader.innerHTML = `<h3 class="feed-section-title">${section.title}</h3>`;
            secWrap.appendChild(secHeader);
            
            // Grid container for cards
            const grid = document.createElement('div');
            grid.className = 'resources-grid';
            
            section.items.forEach(item => {
                if (item.type === 'resource') {
                    // We render a card for each link inside the resource item
                    // (Some items contain multiple links, we build a unified card per resource)
                    item.links.forEach((link, idx) => {
                        const card = document.createElement('article');
                        card.className = 'resource-card liquid-glass magnet-target';
                        card.style.setProperty('--category-color', category.color);
                        card.style.setProperty('--category-glow', category.color + '26');
                        
                        const titleGroup = document.createElement('div');
                        titleGroup.className = 'resource-title-group';
                        titleGroup.innerHTML = `
                            <a href="${link.url}" target="_blank" class="resource-title-link">${link.name}</a>
                            ${item.starred ? '<svg class="favorite-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' : ''}
                        `;
                        
                        const cardHeader = document.createElement('div');
                        cardHeader.className = 'resource-card-header';
                        cardHeader.appendChild(titleGroup);
                        card.appendChild(cardHeader);
                        
                        if (item.description) {
                            const desc = document.createElement('p');
                            desc.className = 'resource-desc';
                            desc.textContent = item.description;
                            card.appendChild(desc);
                        }
                        
                        // Auxiliary links
                        // If it's the first link, display other main links as auxiliary, and append all item.auxiliary
                        let auxLinks = [];
                        if (idx === 0 && item.links.length > 1) {
                            for (let k = 1; k < item.links.length; k++) {
                                auxLinks.push({ name: item.links[k].name, url: item.links[k].url, altSource: true });
                            }
                        }
                        if (item.auxiliary) {
                            auxLinks.push(...item.auxiliary);
                        }
                        
                        if (auxLinks.length > 0) {
                            const footer = document.createElement('div');
                            footer.className = 'resource-footer';
                            auxLinks.forEach(aux => {
                                const iconName = getAuxLinkIcon(aux.name);
                                footer.innerHTML += `
                                    <a href="${aux.url}" target="_blank" class="aux-link-pill magnet-target" title="${aux.name}">
                                        <i data-lucide="${iconName}"></i>
                                        <span>${aux.name}</span>
                                    </a>
                                `;
                            });
                            card.appendChild(footer);
                        }
                        
                        grid.appendChild(card);
                    });
                } else if (item.type === 'blockquote') {
                    // Blockquotes (questions, tips)
                    const bq = document.createElement('blockquote');
                    bq.className = 'resource-blockquote';
                    bq.textContent = item.content;
                    secWrap.appendChild(bq);
                } else if (item.type === 'alert') {
                    // Notes, warnings
                    const alert = document.createElement('div');
                    alert.className = 'resource-alert';
                    alert.innerHTML = `
                        <svg class="resource-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <p class="resource-alert-text">${item.content}</p>
                    `;
                    secWrap.appendChild(alert);
                } else if (item.type === 'text') {
                    // General explanatory texts
                    const p = document.createElement('p');
                    p.className = 'resource-text';
                    p.innerHTML = item.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    secWrap.appendChild(p);
                }
            });
            
            if (grid.children.length > 0) {
                secWrap.appendChild(grid);
            }
            resourcesFeed.appendChild(secWrap);
        });
        
        // Re-run Lucide and hover state binds
        if (window.lucide) {
            lucide.createIcons();
        }
        registerHoverTargets();
        registerCardTilts();
    };

    // Make category selection active
    const selectCategory = (categoryId) => {
        activeCategoryId = categoryId;
        
        // Update sidebar visual active state
        document.querySelectorAll('.category-nav-btn').forEach(btn => {
            if (btn.getAttribute('data-category') === categoryId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update mobile selector
        mobileCategoriesSelect.value = categoryId;
        
        // Render feed
        renderCategoryFeed(categoryId);
    };

    // ==========================================
    // REAL-TIME SEARCH IMPLEMENTATION
    // ==========================================
    const highlightQueryText = (text, query) => {
        if (!query) return text;
        const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<span class="search-match-highlight">$1</span>');
    };

    const runResourcesSearch = (query) => {
        const cleanQuery = query.trim().toLowerCase();
        
        if (cleanQuery === '') {
            searchClearBtn.style.display = 'none';
            // Render the last selected category normally
            selectCategory(activeCategoryId);
            return;
        }
        
        searchClearBtn.style.display = 'flex';
        resourcesFeed.innerHTML = '';
        
        // Set standard theme values on feed for search mode
        resourcesFeed.style.setProperty('--category-color', 'var(--accent-teal)');
        resourcesFeed.style.setProperty('--category-glow', 'rgba(45, 212, 191, 0.15)');
        resourcesFeed.style.setProperty('--category-highlight', 'rgba(45, 212, 191, 0.05)');

        // Header for search results
        const searchHeader = document.createElement('div');
        searchHeader.className = 'category-feed-header';
        searchHeader.innerHTML = `
            <div class="category-feed-title-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:32px; height:32px; color:var(--accent-teal);">
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h2 class="category-feed-title">Search Results</h2>
            </div>
            <p class="category-feed-desc">Filtering database links matching "${query}"...</p>
        `;
        resourcesFeed.appendChild(searchHeader);
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-container';
        
        let totalMatches = 0;
        
        // Scan categories and find items
        resourcesData.categories.forEach(category => {
            let categoryMatches = [];
            
            category.sections.forEach(section => {
                let sectionMatches = [];
                
                section.items.forEach(item => {
                    if (item.type === 'resource') {
                        // Check if any link name or description matches the query
                        const matchingLinks = item.links.filter(link => 
                            link.name.toLowerCase().includes(cleanQuery)
                        );
                        const descMatches = item.description && item.description.toLowerCase().includes(cleanQuery);
                        
                        if (matchingLinks.length > 0 || descMatches) {
                            // If description matches but links don't, we show all links of this resource card
                            const linksToDisplay = matchingLinks.length > 0 ? matchingLinks : item.links;
                            
                            linksToDisplay.forEach(link => {
                                sectionMatches.push({
                                    type: 'resource',
                                    starred: item.starred,
                                    name: link.name,
                                    url: link.url,
                                    description: item.description,
                                    auxiliary: item.auxiliary || []
                                });
                            });
                        }
                    } else if (item.type === 'blockquote' || item.type === 'alert' || item.type === 'text') {
                        // Check if texts match
                        const textContent = item.content || '';
                        if (textContent.toLowerCase().includes(cleanQuery)) {
                            sectionMatches.push({
                                type: item.type,
                                content: textContent
                            });
                        }
                    }
                });
                
                if (sectionMatches.length > 0) {
                    categoryMatches.push({
                        sectionTitle: section.title,
                        items: sectionMatches
                    });
                    totalMatches += sectionMatches.length;
                }
            });
            
            if (categoryMatches.length > 0) {
                // Render category search grouping
                const catGroup = document.createElement('div');
                catGroup.className = 'search-results-section';
                
                const catHeader = document.createElement('div');
                catHeader.className = 'search-results-section-header';
                catHeader.style.color = category.color;
                catHeader.innerHTML = `
                    <i data-lucide="${category.icon || 'book-open'}"></i>
                    <h4 class="search-results-category-title">${category.title}</h4>
                `;
                catGroup.appendChild(catHeader);
                
                categoryMatches.forEach(secMatch => {
                    const secBlock = document.createElement('div');
                    secBlock.className = 'feed-section';
                    secBlock.innerHTML = `<h5 class="feed-section-title" style="--category-color: ${category.color}">${secMatch.sectionTitle}</h5>`;
                    
                    const grid = document.createElement('div');
                    grid.className = 'resources-grid';
                    
                    secMatch.items.forEach(matchItem => {
                        if (matchItem.type === 'resource') {
                            const card = document.createElement('article');
                            card.className = 'resource-card liquid-glass magnet-target';
                            card.style.setProperty('--category-color', category.color);
                            card.style.setProperty('--category-glow', category.color + '26');
                            
                            const highlightedName = highlightQueryText(matchItem.name, cleanQuery);
                            const highlightedDesc = matchItem.description ? highlightQueryText(matchItem.description, cleanQuery) : '';
                            
                            card.innerHTML = `
                                <div class="resource-card-header">
                                    <div class="resource-title-group">
                                        <a href="${matchItem.url}" target="_blank" class="resource-title-link">${highlightedName}</a>
                                        ${matchItem.starred ? '<svg class="favorite-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' : ''}
                                    </div>
                                </div>
                                ${highlightedDesc ? `<p class="resource-desc">${highlightedDesc}</p>` : ''}
                            `;
                            
                            if (matchItem.auxiliary.length > 0) {
                                const footer = document.createElement('div');
                                footer.className = 'resource-footer';
                                matchItem.auxiliary.forEach(aux => {
                                    const iconName = getAuxLinkIcon(aux.name);
                                    footer.innerHTML += `
                                        <a href="${aux.url}" target="_blank" class="aux-link-pill magnet-target" title="${aux.name}">
                                            <i data-lucide="${iconName}"></i>
                                            <span>${aux.name}</span>
                                        </a>
                                    `;
                                });
                                card.appendChild(footer);
                            }
                            grid.appendChild(card);
                        } else if (matchItem.type === 'blockquote') {
                            const bq = document.createElement('blockquote');
                            bq.className = 'resource-blockquote';
                            bq.style.setProperty('--category-color', category.color);
                            bq.innerHTML = highlightQueryText(matchItem.content, cleanQuery);
                            secBlock.appendChild(bq);
                        } else if (matchItem.type === 'alert') {
                            const alert = document.createElement('div');
                            alert.className = 'resource-alert';
                            alert.innerHTML = `
                                <svg class="resource-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <p class="resource-alert-text">${highlightQueryText(matchItem.content, cleanQuery)}</p>
                            `;
                            secBlock.appendChild(alert);
                        } else if (matchItem.type === 'text') {
                            const p = document.createElement('p');
                            p.className = 'resource-text';
                            p.innerHTML = highlightQueryText(matchItem.content, cleanQuery).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                            secBlock.appendChild(p);
                        }
                    });
                    
                    if (grid.children.length > 0) {
                        secBlock.appendChild(grid);
                    }
                    catGroup.appendChild(secBlock);
                });
                
                resultsContainer.appendChild(catGroup);
            }
        });
        
        if (totalMatches === 0) {
            resultsContainer.innerHTML = `
                <div class="font-mono text-sm text-center py-16 text-emerald-100/40">
                    No resources found matching "${query}"
                </div>
            `;
        }
        
        resourcesFeed.appendChild(resultsContainer);
        
        // Re-run Lucide and hover state binds
        if (window.lucide) {
            lucide.createIcons();
        }
        registerHoverTargets();
        registerCardTilts();
    };

    // Bind real-time search events
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            runResourcesSearch(e.target.value);
        });
        
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            runResourcesSearch('');
        });
    }

    // Load initial resources hub data
    initResourcesHub();


    // ==========================================
    // 5. COMMAND PALETTE (Ctrl+K Menu)
    // ==========================================
    const commandModal = document.getElementById('command-modal');
    const modalSearchInput = document.getElementById('modal-search-input');
    const resultsContainer = document.getElementById('modal-results');
    const searchTrigger = document.getElementById('nav-search-trigger');
    
    let activeIndex = 0;
    let listItems = [];

    // Static registry of pages, commands, and links
    const commandRegistry = [
        { title: 'Contact / Inquire Form', type: 'action', tags: 'email,hire,message,contact', action: () => openContactModal() },
        { title: 'Navigate: Selected Work', type: 'navigation', tags: 'projects,grid,mystuff', action: () => {
            tabs[1].click(); // Click My Stuff
            setTimeout(() => document.getElementById('projects-section').scrollIntoView({ behavior: 'smooth' }), 100);
        }},
        { title: 'Navigate: Writing & Notes', type: 'navigation', tags: 'blog,articles,mystuff', action: () => {
            tabs[1].click(); // Click My Stuff
            setTimeout(() => document.getElementById('writing-section').scrollIntoView({ behavior: 'smooth' }), 100);
        }},
        { title: 'Switch View: Resources Hub', type: 'navigation', tags: 'main,landing,links', action: () => tabs[0].click() },
        { title: 'Switch View: My Stuff Portfolio', type: 'navigation', tags: 'portfolio,projects,about', action: () => tabs[1].click() }
    ];

    const openCommandPalette = () => {
        commandModal.classList.add('active');
        commandModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => modalSearchInput.focus(), 50);
        renderResults('');
    };

    const closeCommandPalette = () => {
        commandModal.classList.remove('active');
        commandModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modalSearchInput.value = '';
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
    
    commandModal.addEventListener('click', (e) => {
        if (e.target === commandModal) {
            closeCommandPalette();
        }
    });

    // Fuzzy search matching logic with integrated resources lookup
    const renderResults = (query) => {
        resultsContainer.innerHTML = '';
        const cleanQuery = query.toLowerCase().trim();
        
        // Filter static registry items
        let filtered = commandRegistry.filter(item => {
            return item.title.toLowerCase().includes(cleanQuery) || 
                   item.tags.toLowerCase().includes(cleanQuery) ||
                   item.type.toLowerCase().includes(cleanQuery);
        });

        // Search dynamic resource items and append matches
        if (cleanQuery !== '') {
            let resourceMatches = [];
            resourcesData.categories.forEach(category => {
                category.sections.forEach(section => {
                    section.items.forEach(item => {
                        if (item.type === 'resource') {
                            item.links.forEach(link => {
                                const titleMatch = link.name.toLowerCase().includes(cleanQuery);
                                const descMatch = item.description && item.description.toLowerCase().includes(cleanQuery);
                                
                                if (titleMatch || descMatch) {
                                    resourceMatches.push({
                                        title: link.name,
                                        type: `Resource // ${category.title}`,
                                        tags: `${category.title} ${section.title}`,
                                        action: () => window.open(link.url, '_blank')
                                    });
                                }
                            });
                        }
                    });
                });
            });
            // Cap matches at 15 to avoid performance/modal size constraints
            filtered.push(...resourceMatches.slice(0, 15));
        }

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
            if (item.type.startsWith('Resource')) {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
            } else if (item.type === 'navigation') {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            } else if (item.type === 'action') {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            } else {
                iconSvg = `<svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
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
    modalSearchInput.addEventListener('input', (e) => {
        activeIndex = 0;
        renderResults(e.target.value);
    });

    // Arrow keys & Enter keyboard navigation logic
    modalSearchInput.addEventListener('keydown', (e) => {
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
    // 6. PORTFOLIO PROJECT TAG FILTERING
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectGridItems = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            projectGridItems.forEach(card => {
                const tagsString = card.getAttribute('data-tags');
                const cardTags = tagsString ? tagsString.split(',') : [];
                
                if (filterValue === 'all' || cardTags.includes(filterValue)) {
                    card.style.display = 'flex';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95) perspective(1000px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) perspective(1000px)';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });


    // ==========================================
    // 7. CONTACT MODAL BINDINGS
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

    if (contactTrigger) contactTrigger.addEventListener('click', openContactModal);
    if (contactClose) contactClose.addEventListener('click', closeContactModal);
    
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeContactModal();
        }
    });

});
