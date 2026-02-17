/* ============================================================
   NotíciasHoje — Main JavaScript
   Dark mode, LGPD cookies, ticker, scroll, mobile menu, etc.
   ============================================================ */
;(function () {
    'use strict';

    /* ====== DATE ====== */
    function initDate() {
        const el = document.getElementById('currentDate');
        if (!el) return;
        const now = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let str = now.toLocaleDateString('pt-BR', opts);
        str = str.charAt(0).toUpperCase() + str.slice(1);
        el.textContent = str;
    }

    /* ====== GREETING ====== */
    function initGreeting() {
        const el = document.getElementById('greeting');
        if (!el) return;
        const h = new Date().getHours();
        let g = 'Boa noite';
        if (h >= 5 && h < 12) g = 'Bom dia';
        else if (h >= 12 && h < 18) g = 'Boa tarde';
        el.textContent = g + '!';
    }

    /* ====== DARK MODE ====== */
    function initDarkMode() {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const html = document.documentElement;
        const saved = localStorage.getItem('nh-theme');

        // Apply saved preference or system preference
        if (saved) {
            html.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.setAttribute('data-theme', 'dark');
        }

        updateThemeIcon(btn);

        btn.addEventListener('click', function () {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('nh-theme', next);
            updateThemeIcon(btn);
        });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem('nh-theme')) {
                html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                updateThemeIcon(btn);
            }
        });
    }

    function updateThemeIcon(btn) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        btn.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    }

    /* ====== LGPD COOKIE CONSENT ====== */
    function initCookieConsent() {
        const banner = document.getElementById('cookieBanner');
        const acceptBtn = document.getElementById('cookieAccept');
        const rejectBtn = document.getElementById('cookieReject');
        if (!banner) return;

        const consent = localStorage.getItem('nh-cookie-consent');
        if (!consent) {
            setTimeout(function () {
                banner.classList.add('visible');
            }, 1500);
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                localStorage.setItem('nh-cookie-consent', 'accepted');
                banner.classList.remove('visible');
            });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                localStorage.setItem('nh-cookie-consent', 'rejected');
                banner.classList.remove('visible');
            });
        }
    }

    /* ====== BREAKING NEWS TICKER ====== */
    function initTicker() {
        const content = document.getElementById('breakingContent');
        if (!content) return;
        // Duplicate content for infinite scroll illusion
        content.innerHTML += content.innerHTML;
    }

    /* ====== HEADER SCROLL ====== */
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;
        let ticking = false;

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function () {
                    header.classList.toggle('scrolled', window.scrollY > 10);
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ====== BACK TO TOP ====== */
    function initBackToTop() {
        const btn = document.getElementById('btt');
        if (!btn) return;
        let ticking = false;

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function () {
                    btn.classList.toggle('visible', window.scrollY > 500);
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ====== MOBILE MENU ====== */
    function initMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const navList = document.getElementById('navList');
        if (!toggle || !navList) return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);

        function openMenu() {
            navList.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            toggle.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
            navList.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function () {
            navList.classList.contains('open') ? closeMenu() : openMenu();
        });
        overlay.addEventListener('click', closeMenu);

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navList.classList.contains('open')) closeMenu();
        });

        // Close when a nav link is clicked
        navList.querySelectorAll('.nav__link').forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });
    }

    /* ====== SEARCH TOGGLE (MOBILE) ====== */
    function initSearchToggle() {
        const btn = document.getElementById('searchToggle');
        const bar = document.getElementById('searchBar');
        if (!btn || !bar) return;

        btn.addEventListener('click', function () {
            bar.classList.toggle('mobile-open');
            if (bar.classList.contains('mobile-open')) {
                const input = bar.querySelector('input');
                if (input) input.focus();
            }
        });
    }

    /* ====== ACTIVE NAV (Intersection Observer) ====== */
    function initActiveNav() {
        const sections = document.querySelectorAll('.section[id]');
        const links = document.querySelectorAll('.nav__link[data-section]');
        if (!sections.length || !links.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    links.forEach(function (link) {
                        link.classList.toggle('active', link.getAttribute('data-section') === id);
                    });
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px' });

        sections.forEach(function (sec) { observer.observe(sec); });
    }

    /* ====== SMOOTH SCROLL ====== */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 66;
                    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
                    const offset = headerH + navH + 20;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            });
        });
    }

    /* ====== SEARCH DEMO ====== */
    function initSearch() {
        const form = document.getElementById('searchForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const input = document.getElementById('searchInput');
            const q = input ? input.value.trim() : '';
            if (q) {
                alert('Buscando por: "' + q + '"\n\nEsta é uma demonstração. Em produção, conectaria a uma API de busca.');
            }
        });
    }

    /* ====== NEWSLETTER ====== */
    function initNewsletter() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const parent = form.parentElement;
            form.style.display = 'none';
            const small = parent.querySelector('small');
            if (small) small.style.display = 'none';

            const success = document.createElement('div');
            success.className = 'newsletter__success';
            success.innerHTML = '<i class="fas fa-check-circle"></i><strong>Cadastro realizado!</strong><span>Você receberá nossas notícias em breve.</span>';
            parent.appendChild(success);
        });
    }

    /* ====== SCROLL REVEAL ====== */
    function initReveal() {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');

                    // Stagger child animations
                    const children = entry.target.querySelectorAll('.reveal-child');
                    children.forEach(function (child, i) {
                        child.style.transitionDelay = (i * 80) + 'ms';
                    });

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(function (el) { observer.observe(el); });
    }

    /* ====== QUOTE BAR FLASH ====== */
    function initQuoteFlash() {
        const vals = document.querySelectorAll('.quotebar__val');
        if (!vals.length) return;

        setInterval(function () {
            const el = vals[Math.floor(Math.random() * vals.length)];
            el.style.transition = 'opacity .15s';
            el.style.opacity = '.4';
            setTimeout(function () { el.style.opacity = '1'; }, 200);
        }, 4000);
    }

    /* ====== SHARE BUTTONS (Article Page) ====== */
    function initShareButtons() {
        const buttons = document.querySelectorAll('.share-btn');
        if (!buttons.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                const type = this.dataset.share;

                const urls = {
                    whatsapp: 'https://wa.me/?text=' + title + '%20' + url,
                    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
                    twitter: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
                    telegram: 'https://t.me/share/url?url=' + url + '&text=' + title
                };

                if (type === 'copy') {
                    navigator.clipboard.writeText(window.location.href).then(function () {
                        btn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(function () {
                            btn.innerHTML = '<i class="fas fa-link"></i>';
                        }, 2000);
                    });
                } else if (urls[type]) {
                    window.open(urls[type], '_blank', 'width=600,height=400');
                }
            });
        });
    }

    /* ====== CONSOLE BRANDING ====== */
    function initConsole() {
        console.log(
            '%c NotíciasHoje %c Portal de Notícias ',
            'background:#D32F2F;color:#fff;font-size:16px;font-weight:900;padding:6px 12px;border-radius:4px 0 0 4px;',
            'background:#212121;color:#fff;font-size:16px;padding:6px 12px;border-radius:0 4px 4px 0;'
        );
    }

    /* ====== IMAGE LAZY LOAD FALLBACK ====== */
    function initImageFallback() {
        document.querySelectorAll('img').forEach(function (img) {
            img.addEventListener('error', function () {
                this.style.background = 'var(--n-200)';
                this.style.minHeight = '120px';
                this.alt = 'Imagem indisponível';
            });
        });
    }

    /* ====== ADMIN DYNAMIC CONTENT LOADER ====== */

    /* -- Category tag class map -- */
    var catTagMap = {
        politica: 'tag--politics',
        economia: 'tag--economy',
        tecnologia: 'tag--tech',
        saude: 'tag--health',
        esportes: 'tag--sports',
        cultura: 'tag--culture',
        mundo: 'tag--world',
        ciencia: 'tag--science',
        educacao: 'tag--education',
        opiniao: 'tag--opinion'
    };
    var catLabelMap = {
        politica: 'Política', economia: 'Economia', tecnologia: 'Tecnologia',
        saude: 'Saúde', esportes: 'Esportes', cultura: 'Cultura',
        mundo: 'Mundo', ciencia: 'Ciência', educacao: 'Educação', opiniao: 'Opinião'
    };

    function escH(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function slugify(text) {
        return (text || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 80);
    }

    function articleUrl(n) {
        var slug = n.slug || slugify(n.title);
        return slug + '.html';
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        var diff = Date.now() - new Date(dateStr).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Agora';
        if (mins < 60) return 'Há ' + mins + ' min';
        var hours = Math.floor(mins / 60);
        if (hours < 24) return 'Há ' + hours + 'h';
        var days = Math.floor(hours / 24);
        if (days < 30) return 'Há ' + days + 'd';
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }

    /* ====== LOAD IMPORTED NEWS INTO SITE ====== */
    function initNewsLoader() {
        try {
            var news = JSON.parse(localStorage.getItem('nh-news'));
            if (!news || !news.length) return;

            // Only published / featured
            var published = news.filter(function(n) { return n.status === 'published' || n.status === 'featured'; });
            if (!published.length) return;

            var featured = published.filter(function(n) { return n.status === 'featured'; });
            var byCategory = {};
            published.forEach(function(n) {
                var cat = n.category || 'politica';
                if (!byCategory[cat]) byCategory[cat] = [];
                byCategory[cat].push(n);
            });

            // ---- HERO: replace with featured or latest ----
            var heroSection = document.querySelector('.hero');
            if (heroSection) {
                var heroNews = featured.length > 0 ? featured : published;
                var main = heroNews[0];
                var sides = heroNews.slice(1, 4);

                // Main featured
                var heroFeatured = heroSection.querySelector('.hero__featured');
                if (heroFeatured && main) {
                    var tagCls = catTagMap[main.category] || 'tag--politics';
                    var tagLabel = catLabelMap[main.category] || main.category || 'Notícia';
                    heroFeatured.innerHTML =
                        '<a href="' + articleUrl(main) + '" class="hero__featured-link">' +
                            '<div class="hero__featured-img">' +
                                (main.image ? '<img src="' + escH(main.image) + '" alt="' + escH(main.title) + '" loading="eager">' : '') +
                                '<div class="hero__featured-overlay"></div>' +
                            '</div>' +
                            '<div class="hero__featured-body">' +
                                '<span class="tag ' + tagCls + '">' + tagLabel + '</span>' +
                                '<h2>' + escH(main.title) + '</h2>' +
                                '<p>' + escH(main.subtitle || '') + '</p>' +
                                '<div class="hero__featured-meta">' +
                                    '<span class="author">Por <strong>' + escH(main.author || 'Redação') + '</strong></span>' +
                                    '<time><i class="far fa-clock"></i> ' + timeAgo(main.date) + '</time>' +
                                '</div>' +
                            '</div>' +
                        '</a>';
                }

                // Side cards
                var heroSide = heroSection.querySelector('.hero__side');
                if (heroSide && sides.length > 0) {
                    heroSide.innerHTML = sides.map(function(n) {
                        var tagCls = catTagMap[n.category] || 'tag--politics';
                        var tagLabel = catLabelMap[n.category] || n.category || 'Notícia';
                        return '<article class="hero__side-card"><a href="' + articleUrl(n) + '">' +
                            '<div class="hero__side-img">' + (n.image ? '<img src="' + escH(n.image) + '" alt="' + escH(n.title) + '" loading="eager">' : '') + '</div>' +
                            '<div class="hero__side-body">' +
                                '<span class="tag ' + tagCls + '">' + tagLabel + '</span>' +
                                '<h3>' + escH(n.title) + '</h3>' +
                                '<time><i class="far fa-clock"></i> ' + timeAgo(n.date) + '</time>' +
                            '</div>' +
                        '</a></article>';
                    }).join('');
                }
            }

            // ---- ÚLTIMAS NOTÍCIAS ----
            var ultimasGrid = document.querySelector('#ultimas .card-grid');
            if (ultimasGrid && published.length > 0) {
                var latestNews = published.slice(0, 8);
                ultimasGrid.innerHTML = latestNews.map(function(n) {
                    var tagCls = catTagMap[n.category] || 'tag--politics';
                    var tagLabel = catLabelMap[n.category] || n.category || 'Notícia';
                    return '<article class="card reveal-child"><a href="' + articleUrl(n) + '" class="card__link">' +
                        '<div class="card__img">' + (n.image ? '<img src="' + escH(n.image) + '" alt="' + escH(n.title) + '" loading="lazy">' : '') + '<span class="tag ' + tagCls + '">' + tagLabel + '</span></div>' +
                        '<div class="card__body"><h3>' + escH(n.title) + '</h3><time><i class="far fa-clock"></i> ' + timeAgo(n.date) + '</time></div>' +
                    '</a></article>';
                }).join('');
            }

            // ---- CATEGORY SECTIONS ----
            var categoryIds = ['politica', 'economia', 'tecnologia', 'saude', 'esportes', 'cultura', 'mundo', 'ciencia'];
            categoryIds.forEach(function(catId) {
                var section = document.getElementById(catId);
                if (!section) return;
                var items = byCategory[catId];
                if (!items || !items.length) return;

                // Find the feed or card-grid container
                var container = section.querySelector('.feed') || section.querySelector('.card-grid');
                if (!container) return;

                var isFeed = container.classList.contains('feed');

                if (isFeed) {
                    container.innerHTML = items.slice(0, 5).map(function(n) {
                        return '<article class="feed__item reveal-child"><a href="' + articleUrl(n) + '" class="feed__link">' +
                            (n.image ? '<img src="' + escH(n.image) + '" alt="' + escH(n.title) + '" loading="lazy" class="feed__img">' : '') +
                            '<div class="feed__body">' +
                                '<h3>' + escH(n.title) + '</h3>' +
                                '<p>' + escH(n.subtitle || n.description || '') + '</p>' +
                                '<div class="feed__meta">' +
                                    '<span class="feed__author">Por ' + escH(n.author || 'Redação') + '</span>' +
                                    '<time><i class="far fa-clock"></i> ' + timeAgo(n.date) + '</time>' +
                                '</div>' +
                            '</div>' +
                        '</a></article>';
                    }).join('');
                } else {
                    container.innerHTML = items.slice(0, 4).map(function(n) {
                        var tagCls = catTagMap[catId] || 'tag--politics';
                        var tagLabel = catLabelMap[catId] || catId;
                        return '<article class="card reveal-child"><a href="' + articleUrl(n) + '" class="card__link">' +
                            '<div class="card__img">' + (n.image ? '<img src="' + escH(n.image) + '" alt="' + escH(n.title) + '" loading="lazy">' : '') + '<span class="tag ' + tagCls + '">' + tagLabel + '</span></div>' +
                            '<div class="card__body"><h3>' + escH(n.title) + '</h3><p>' + escH((n.subtitle || '').substring(0, 120)) + '</p><time><i class="far fa-clock"></i> ' + timeAgo(n.date) + '</time></div>' +
                        '</a></article>';
                    }).join('');
                }
            });

            // ---- SIDEBAR: MAIS LIDAS ----
            var trendingOl = document.querySelector('.trending');
            if (trendingOl && published.length > 0) {
                var trending = published.slice(0, 10);
                trendingOl.innerHTML = trending.map(function(n, i) {
                    return '<li class="trending__item"><span class="trending__rank">' + (i + 1) + '</span><a href="' + articleUrl(n) + '" class="trending__link">' + escH(n.title) + '</a></li>';
                }).join('');
            }

        } catch(e) {
            console.warn('News loader error:', e);
        }
    }

    /* ====== DYNAMIC ARTICLE PAGE ====== */
    function initArticlePage() {
        try {
            // Only run on noticia.html
            if (!window.location.pathname.match(/noticia\.html/)) return;

            var params = new URLSearchParams(window.location.search);
            var articleId = params.get('id');
            if (!articleId) return;

            var news = JSON.parse(localStorage.getItem('nh-news'));
            if (!news || !news.length) return;

            var article = news.find(function(n) { return n.id === articleId; });
            if (!article) return;

            var tagCls = catTagMap[article.category] || 'tag--politics';
            var tagLabel = catLabelMap[article.category] || article.category || 'Notícia';

            // Update page title
            document.title = article.title + ' — NotíciasHoje';

            // Update meta tags
            var metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', article.subtitle || article.title);
            var ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', article.title);
            var ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', article.subtitle || '');
            var ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage && article.image) ogImage.setAttribute('content', article.image);

            // Update breadcrumb
            var breadcrumb = document.querySelector('.breadcrumb');
            if (breadcrumb) {
                breadcrumb.innerHTML =
                    '<a href="index.html">Início</a><span class="breadcrumb__sep">›</span>' +
                    '<a href="index.html#' + (article.category || 'politica') + '">' + tagLabel + '</a><span class="breadcrumb__sep">›</span>' +
                    '<span>' + escH(article.title.substring(0, 60)) + '...</span>';
            }

            // Update article header
            var header = document.querySelector('.article-header');
            if (header) {
                var tagEl = header.querySelector('.tag');
                if (tagEl) { tagEl.className = 'tag ' + tagCls; tagEl.textContent = tagLabel; }

                var h1 = header.querySelector('h1');
                if (h1) h1.textContent = article.title;

                var subtitle = header.querySelector('.article-subtitle');
                if (subtitle) subtitle.textContent = article.subtitle || '';

                var authorMeta = header.querySelector('.article-meta__author');
                if (authorMeta) {
                    var authorImg = authorMeta.querySelector('img');
                    if (authorImg) authorImg.src = 'https://i.pravatar.cc/80?u=' + encodeURIComponent(article.author || 'redacao');
                    var authorStrong = authorMeta.querySelector('strong');
                    if (authorStrong) authorStrong.textContent = article.author || 'Redação';
                    var authorSpan = authorMeta.querySelector('span');
                    if (authorSpan) authorSpan.textContent = article.source || '';
                }

                var timeEl = header.querySelector('time');
                if (timeEl && article.date) {
                    var d = new Date(article.date);
                    timeEl.innerHTML = '<i class="far fa-clock"></i> ' + d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
            }

            // Update cover image
            var cover = document.querySelector('.article-cover');
            if (cover) {
                if (article.image) {
                    var coverImg = cover.querySelector('img');
                    if (coverImg) {
                        coverImg.src = article.image;
                        coverImg.alt = article.title;
                    }
                    var caption = cover.querySelector('figcaption');
                    if (caption) caption.textContent = (article.source ? 'Foto: ' + article.source : 'Imagem ilustrativa');
                } else {
                    cover.style.display = 'none';
                }
            }

            // Update article content
            var contentEl = document.querySelector('.article-content');
            if (contentEl && article.content) {
                contentEl.innerHTML = article.content;
            }

            // Update tags
            var tagsContainer = document.querySelector('.article-tags');
            if (tagsContainer && article.tags && article.tags.length) {
                tagsContainer.innerHTML = article.tags.map(function(tag) {
                    return '<a href="index.html#' + (article.category || '') + '" class="article-tag">' + escH(tag) + '</a>';
                }).join('');
            }

            // Update related articles
            var relatedSection = document.querySelector('.related .card-grid');
            if (relatedSection) {
                var related = news.filter(function(n) {
                    return n.id !== articleId && (n.status === 'published' || n.status === 'featured');
                }).slice(0, 3);

                if (related.length > 0) {
                    relatedSection.innerHTML = related.map(function(n) {
                        var rTagCls = catTagMap[n.category] || 'tag--politics';
                        var rTagLabel = catLabelMap[n.category] || n.category || 'Notícia';
                        return '<article class="card"><a href="' + articleUrl(n) + '" class="card__link">' +
                            '<div class="card__img">' + (n.image ? '<img src="' + escH(n.image) + '" alt="" loading="lazy">' : '') + '<span class="tag ' + rTagCls + '">' + rTagLabel + '</span></div>' +
                            '<div class="card__body"><h3>' + escH(n.title) + '</h3><time><i class="far fa-clock"></i> ' + timeAgo(n.date) + '</time></div>' +
                        '</a></article>';
                    }).join('');
                }
            }

            // Update sidebar trending
            var trendingOl = document.querySelector('.trending');
            if (trendingOl) {
                var trendingNews = news.filter(function(n) { return n.status === 'published' || n.status === 'featured'; }).slice(0, 5);
                if (trendingNews.length > 0) {
                    trendingOl.innerHTML = trendingNews.map(function(n, i) {
                        return '<li class="trending__item"><span class="trending__rank">' + (i + 1) + '</span><a href="' + articleUrl(n) + '" class="trending__link">' + escH(n.title) + '</a></li>';
                    }).join('');
                }
            }

        } catch(e) {
            console.warn('Article page loader error:', e);
        }
    }

    function initAdminContent() {
        try {
            // ---- Site Settings (logo, brand, favicon) ----
            var site = JSON.parse(localStorage.getItem('nh-site-settings'));
            if (site) {
                // Brand color
                if (site.brandColor) {
                    document.documentElement.style.setProperty('--brand', site.brandColor);
                }
                // Logo mark text
                if (site.logoMark) {
                    document.querySelectorAll('.header__logo-mark span').forEach(function(el) {
                        el.textContent = site.logoMark;
                    });
                }
                // Site name
                if (site.siteName) {
                    document.querySelectorAll('.header__logo-text strong').forEach(function(el) {
                        el.innerHTML = site.siteName;
                    });
                }
                // Slogan
                if (site.slogan) {
                    document.querySelectorAll('.header__logo-text small').forEach(function(el) {
                        el.textContent = site.slogan;
                    });
                }
                // Custom logo image
                if (site.logoUrl) {
                    document.querySelectorAll('.header__logo-mark').forEach(function(el) {
                        el.innerHTML = '<img src="' + site.logoUrl + '" alt="Logo" style="max-height:40px;border-radius:8px;">';
                    });
                }
                // Favicon
                if (site.faviconUrl) {
                    var existingFav = document.querySelector('link[rel="icon"]');
                    if (existingFav) {
                        existingFav.href = site.faviconUrl;
                        existingFav.type = site.faviconUrl.startsWith('data:image/png') ? 'image/png' : 'image/x-icon';
                    }
                }
                // Meta description
                if (site.metaDesc) {
                    var metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute('content', site.metaDesc);
                }
            }

            // ---- Banners / Ads ----
            var banners = JSON.parse(localStorage.getItem('nh-banners'));
            if (banners && banners.length) {
                var activeBanners = banners.filter(function(b) { return b.active === 'true' || b.active === true; });
                activeBanners.forEach(function(banner) {
                    var target;
                    if (banner.position === 'leaderboard') target = document.querySelector('.ad-banner--leaderboard .ad-placeholder');
                    else if (banner.position === 'sidebar') target = document.querySelector('.ad-banner--sidebar .ad-placeholder');
                    else if (banner.position === 'inline-1') {
                        var inlines = document.querySelectorAll('.ad-banner--inline .ad-placeholder');
                        if (inlines[0]) target = inlines[0];
                    }
                    else if (banner.position === 'inline-2') {
                        var inlines2 = document.querySelectorAll('.ad-banner--inline .ad-placeholder');
                        if (inlines2[1]) target = inlines2[1];
                    }

                    if (target) {
                        if (banner.code) {
                            target.innerHTML = banner.code;
                        } else if (banner.image) {
                            var html = '<a href="' + (banner.link || '#') + '" target="' + (banner.target || '_blank') + '" rel="noopener" style="display:block;text-align:center;">';
                            html += '<img src="' + banner.image + '" alt="' + (banner.name || 'Publicidade') + '" style="max-width:100%;border-radius:8px;">';
                            html += '</a>';
                            target.innerHTML = html;
                        }
                    }
                });
            }

            // ---- Breaking News ----
            var breaking = JSON.parse(localStorage.getItem('nh-breaking'));
            if (breaking && breaking.length) {
                var ticker = document.getElementById('breakingContent');
                if (ticker) {
                    ticker.innerHTML = breaking.map(function(item, i) {
                        var sep = i < breaking.length - 1 ? '<span class="breaking__sep">•</span>' : '';
                        return '<a href="' + (item.link || 'noticia.html') + '">' + item.text + '</a>' + sep;
                    }).join('');
                    // Duplicate for infinite scroll
                    ticker.innerHTML += ticker.innerHTML;
                }
            }

            // ---- Cotações ----
            var quotes = JSON.parse(localStorage.getItem('nh-quotes'));
            if (quotes) {
                var quoteItems = document.querySelectorAll('.quotebar__item');
                var quoteData = [
                    { label: 'Dólar', val: quotes.DolarVal, varr: quotes.DolarVar, dir: quotes.DolarDir },
                    { label: 'Euro', val: quotes.EuroVal, varr: quotes.EuroVar, dir: quotes.EuroDir },
                    { label: 'Ibovespa', val: quotes.IbovVal, varr: quotes.IbovVar, dir: quotes.IbovDir },
                    { label: 'Bitcoin', val: quotes.BtcVal, varr: quotes.BtcVar, dir: quotes.BtcDir },
                    { label: 'Selic', val: quotes.SelicVal, varr: quotes.SelicVar, dir: quotes.SelicDir }
                ];
                quoteData.forEach(function(q, i) {
                    if (quoteItems[i] && q.val) {
                        var arrow = q.dir === 'up' ? '<i class="fas fa-caret-up"></i>' : (q.dir === 'down' ? '<i class="fas fa-caret-down"></i>' : '');
                        var cls = q.dir || 'neutral';
                        quoteItems[i].querySelector('.quotebar__val').className = 'quotebar__val ' + cls;
                        quoteItems[i].querySelector('.quotebar__val').innerHTML = q.val + ' ' + arrow + ' ' + (q.varr || '');
                    }
                });
            }

            // ---- Pages content override ----
            var pages = JSON.parse(localStorage.getItem('nh-pages'));
            if (pages) {
                // Detect which page we're on
                var path = window.location.pathname.split('/').pop().replace('.html', '');
                if (pages[path]) {
                    var articleContent = document.querySelector('.article-content');
                    if (articleContent && pages[path].content) {
                        articleContent.innerHTML = pages[path].content;
                    }
                    if (pages[path].title) {
                        var h1 = document.querySelector('.article-header h1');
                        if (h1) h1.textContent = pages[path].title;
                    }
                }
            }

        } catch(e) {
            // Silently fail if localStorage is unavailable
            console.warn('Admin content loader error:', e);
        }
    }

    /* ====== INIT ====== */
    document.addEventListener('DOMContentLoaded', function () {
        initAdminContent();
        initNewsLoader();
        initArticlePage();
        initDate();
        initGreeting();
        initDarkMode();
        initCookieConsent();
        initTicker();
        initHeaderScroll();
        initBackToTop();
        initMobileMenu();
        initSearchToggle();
        initActiveNav();
        initSmoothScroll();
        initSearch();
        initNewsletter();
        initReveal();
        initQuoteFlash();
        initShareButtons();
        initImageFallback();
        initConsole();
    });
})();
