/* ============================================================
   NotíciasHoje — Admin Panel JavaScript
   Login, CRUD de notícias, banners, configurações, etc.
   Todos os dados são persistidos via localStorage.
   ============================================================ */
;(function () {
    'use strict';

    /* ============ STORAGE KEYS ============ */
    const KEYS = {
        auth:     'nh-admin-auth',
        site:     'nh-site-settings',
        news:     'nh-news',
        banners:  'nh-banners',
        breaking: 'nh-breaking',
        quotes:   'nh-quotes',
        pages:    'nh-pages'
    };

    /* ============ HELPERS ============ */
    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
    function getStore(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } }
    function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
    function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function slugify(text) {
        return (text || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 80);
    }
    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' +
               d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    }

    /* ============ TOAST ============ */
    function toast(msg, type) {
        type = type || 'success';
        const container = $('#toastContainer');
        const el = document.createElement('div');
        el.className = 'toast toast--' + type;
        const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle' };
        el.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '"></i> ' + msg;
        container.appendChild(el);
        setTimeout(function() {
            el.classList.add('removing');
            setTimeout(function() { el.remove(); }, 300);
        }, 3000);
    }

    /* ============ FILE TO BASE64 ============ */
    function fileToBase64(file, cb) {
        const reader = new FileReader();
        reader.onload = function(e) { cb(e.target.result); };
        reader.readAsDataURL(file);
    }

    /* ============ LOGIN ============ */
    function initLogin() {
        const loginScreen = $('#loginScreen');
        const adminPanel = $('#adminPanel');
        const form = $('#loginForm');
        const errorEl = $('#loginError');
        const logoutBtn = $('#logoutBtn');

        // Default credentials
        const VALID_USER = 'admin';
        const VALID_PASS = 'admin123';

        // Check if already logged in
        if (getStore(KEYS.auth)) {
            loginScreen.style.display = 'none';
            adminPanel.style.display = 'flex';
            return;
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = $('#loginUser').value.trim();
            const pass = $('#loginPass').value;

            if (user === VALID_USER && pass === VALID_PASS) {
                setStore(KEYS.auth, { user: user, time: Date.now() });
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'flex';
                errorEl.classList.remove('show');
                toast('Bem-vindo ao painel!');
            } else {
                errorEl.classList.add('show');
                $('#loginPass').value = '';
                $('#loginPass').focus();
            }
        });

        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem(KEYS.auth);
            loginScreen.style.display = 'flex';
            adminPanel.style.display = 'none';
            form.reset();
        });
    }

    /* ============ NAVIGATION ============ */
    function initNavigation() {
        const links = $$('.admin-nav__link');
        const sections = $$('.admin-section');
        const titleEl = $('#sectionTitle');

        const titles = {
            'dashboard': 'Dashboard',
            'site-settings': 'Configurações do Site',
            'news-manager': 'Gerenciar Notícias',
            'banners': 'Publicidade / Banners',
            'breaking-news': 'Breaking News',
            'quotes': 'Cotações do Mercado',
            'pages': 'Páginas do Portal',
            'import-sites': 'Importar de Sites',
            'generate-pages': 'Gerar Páginas de Artigos'
        };

        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sec = this.getAttribute('data-section');

                links.forEach(function(l) { l.classList.remove('active'); });
                this.classList.add('active');

                sections.forEach(function(s) { s.classList.remove('active'); });
                var target = $('#sec-' + sec);
                if (target) target.classList.add('active');

                titleEl.textContent = titles[sec] || 'Dashboard';

                // Close mobile sidebar
                $('#adminSidebar').classList.remove('open');
            });
        });

        // Mobile sidebar toggle
        $('#sidebarToggle').addEventListener('click', function() {
            $('#adminSidebar').classList.toggle('open');
        });
        $('#sidebarClose').addEventListener('click', function() {
            $('#adminSidebar').classList.remove('open');
        });
    }

    /* ============ SITE SETTINGS ============ */
    function initSiteSettings() {
        const fields = {
            siteName: '#cfgSiteName', slogan: '#cfgSlogan', logoMark: '#cfgLogoMark',
            brandColor: '#cfgBrandColor', logoUrl: '#cfgLogoUrl', faviconUrl: '#cfgFaviconUrl',
            facebook: '#cfgFacebook', instagram: '#cfgInstagram', twitter: '#cfgTwitter',
            youtube: '#cfgYoutube', tiktok: '#cfgTiktok', telegram: '#cfgTelegram',
            metaDesc: '#cfgMetaDesc', ogImage: '#cfgOgImage'
        };

        // Load saved settings
        var saved = getStore(KEYS.site) || {};
        Object.keys(fields).forEach(function(key) {
            var el = $(fields[key]);
            if (el && saved[key]) el.value = saved[key];
        });

        // Logo preview
        if (saved.logoUrl) {
            $('#logoPreview').innerHTML = '<img src="' + escHtml(saved.logoUrl) + '" alt="Logo">';
        }
        if (saved.faviconUrl) {
            $('#faviconPreview').innerHTML = '<img src="' + escHtml(saved.faviconUrl) + '" alt="Favicon" style="max-width:48px">';
        }

        // File uploads
        $('#cfgLogoFile').addEventListener('change', function(e) {
            if (e.target.files[0]) {
                fileToBase64(e.target.files[0], function(data) {
                    $('#cfgLogoUrl').value = data;
                    $('#logoPreview').innerHTML = '<img src="' + data + '" alt="Logo">';
                });
            }
        });
        $('#cfgFaviconFile').addEventListener('change', function(e) {
            if (e.target.files[0]) {
                fileToBase64(e.target.files[0], function(data) {
                    $('#cfgFaviconUrl').value = data;
                    $('#faviconPreview').innerHTML = '<img src="' + data + '" alt="Favicon" style="max-width:48px">';
                });
            }
        });

        // Save
        $('#saveSiteSettings').addEventListener('click', function() {
            var data = {};
            Object.keys(fields).forEach(function(key) {
                var el = $(fields[key]);
                if (el) data[key] = el.value.trim();
            });
            setStore(KEYS.site, data);
            toast('Configurações salvas com sucesso!');

            // Update previews
            if (data.logoUrl) $('#logoPreview').innerHTML = '<img src="' + escHtml(data.logoUrl) + '" alt="Logo">';
            if (data.faviconUrl) $('#faviconPreview').innerHTML = '<img src="' + escHtml(data.faviconUrl) + '" alt="Favicon" style="max-width:48px">';
        });
    }

    /* ============ NEWS MANAGER ============ */
    function initNewsManager() {
        var news = getStore(KEYS.news) || [];

        function saveNews() { setStore(KEYS.news, news); updateDashboard(); }

        function renderNewsList() {
            var tbody = $('#newsTableBody');
            var table = $('#newsTable');
            var empty = $('#newsEmpty');
            var search = ($('#newsSearch').value || '').toLowerCase();
            var catFilter = $('#newsFilterCat').value;

            var filtered = news.filter(function(n) {
                var matchSearch = !search || n.title.toLowerCase().includes(search) || (n.subtitle || '').toLowerCase().includes(search);
                var matchCat = !catFilter || n.category === catFilter;
                return matchSearch && matchCat;
            });

            if (filtered.length === 0) {
                table.style.display = 'none';
                empty.style.display = 'block';
                return;
            }

            table.style.display = 'table';
            empty.style.display = 'none';

            tbody.innerHTML = filtered.map(function(n) {
                var statusClass = n.status === 'published' ? 'published' : (n.status === 'featured' ? 'featured' : 'draft');
                var statusText = n.status === 'published' ? 'Publicado' : (n.status === 'featured' ? 'Destaque' : 'Rascunho');
                return '<tr>' +
                    '<td>' + (n.image ? '<img src="' + escHtml(n.image) + '" class="thumb" alt="">' : '<div class="thumb" style="background:#e2e8f0;"></div>') + '</td>' +
                    '<td><strong>' + escHtml(n.title) + '</strong></td>' +
                    '<td><span class="cat-badge cat-badge--' + n.category + '">' + escHtml(n.category) + '</span></td>' +
                    '<td><span class="badge badge--' + statusClass + '">' + statusText + '</span></td>' +
                    '<td>' + formatDate(n.date) + '</td>' +
                    '<td><button class="btn btn--outline btn--sm edit-news" data-id="' + n.id + '"><i class="fas fa-edit"></i></button> <button class="btn btn--danger btn--sm del-news" data-id="' + n.id + '"><i class="fas fa-trash"></i></button></td>' +
                    '</tr>';
            }).join('');

            // Bind edit/delete
            $$('.edit-news').forEach(function(btn) {
                btn.addEventListener('click', function() { editNewsItem(this.dataset.id); });
            });
            $$('.del-news').forEach(function(btn) {
                btn.addEventListener('click', function() { deleteNewsItem(this.dataset.id); });
            });
        }

        function showNewsForm(item) {
            $('#newsFormPanel').style.display = 'block';
            if (item) {
                $('#newsFormTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Notícia';
                $('#newsEditId').value = item.id;
                $('#newsTitle').value = item.title || '';
                $('#newsCategory').value = item.category || 'politica';
                $('#newsSubtitle').value = item.subtitle || '';
                $('#newsContent').value = item.content || '';
                $('#newsImage').value = item.image || '';
                $('#newsAuthor').value = item.author || '';
                $('#newsTags').value = (item.tags || []).join(', ');
                $('#newsDate').value = item.date || '';
                $('#newsStatus').value = item.status || 'published';
                if (item.image) {
                    $('#newsImagePreview').innerHTML = '<img src="' + escHtml(item.image) + '" alt="Preview">';
                }
            } else {
                $('#newsFormTitle').innerHTML = '<i class="fas fa-plus"></i> Nova Notícia';
                $('#newsEditId').value = '';
                $('#newsTitle').value = '';
                $('#newsSubtitle').value = '';
                $('#newsContent').value = '';
                $('#newsImage').value = '';
                $('#newsAuthor').value = '';
                $('#newsTags').value = '';
                $('#newsDate').value = new Date().toISOString().slice(0, 16);
                $('#newsStatus').value = 'published';
                $('#newsImagePreview').innerHTML = '';
            }
            $('#newsFormPanel').scrollIntoView({ behavior: 'smooth' });
        }

        function hideNewsForm() {
            $('#newsFormPanel').style.display = 'none';
        }

        function editNewsItem(id) {
            var item = news.find(function(n) { return n.id === id; });
            if (item) showNewsForm(item);
        }

        function deleteNewsItem(id) {
            if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
            news = news.filter(function(n) { return n.id !== id; });
            saveNews();
            renderNewsList();
            toast('Notícia excluída!', 'warning');
        }

        // Buttons
        $('#addNewsBtn').addEventListener('click', function() { showNewsForm(null); });
        $('#closeNewsForm').addEventListener('click', hideNewsForm);
        $('#cancelNewsBtn').addEventListener('click', hideNewsForm);

        // Image upload
        $('#newsImageFile').addEventListener('change', function(e) {
            if (e.target.files[0]) {
                fileToBase64(e.target.files[0], function(data) {
                    $('#newsImage').value = data;
                    $('#newsImagePreview').innerHTML = '<img src="' + data + '" alt="Preview">';
                });
            }
        });

        // Save news
        $('#saveNewsBtn').addEventListener('click', function() {
            var title = $('#newsTitle').value.trim();
            if (!title) { toast('Preencha o título!', 'error'); return; }

            var editId = $('#newsEditId').value;
            var item = {
                id: editId || genId(),
                title: title,
                category: $('#newsCategory').value,
                subtitle: $('#newsSubtitle').value.trim(),
                content: $('#newsContent').value,
                image: $('#newsImage').value.trim(),
                author: $('#newsAuthor').value.trim(),
                tags: $('#newsTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean),
                date: $('#newsDate').value,
                status: $('#newsStatus').value,
                updatedAt: new Date().toISOString()
            };

            if (editId) {
                var idx = news.findIndex(function(n) { return n.id === editId; });
                if (idx !== -1) news[idx] = item;
            } else {
                news.unshift(item);
            }

            saveNews();
            renderNewsList();
            hideNewsForm();
            toast(editId ? 'Notícia atualizada!' : 'Notícia criada!');
        });

        // Search/filter
        $('#newsSearch').addEventListener('input', renderNewsList);
        $('#newsFilterCat').addEventListener('change', renderNewsList);

        // Import news
        $('#importNewsFile').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var imported = JSON.parse(ev.target.result);
                    if (!Array.isArray(imported)) imported = [imported];
                    imported.forEach(function(item) {
                        if (!item.id) item.id = genId();
                        if (!item.date) item.date = new Date().toISOString().slice(0, 16);
                        if (!item.status) item.status = 'published';
                        news.unshift(item);
                    });
                    saveNews();
                    renderNewsList();
                    toast(imported.length + ' notícia(s) importada(s)!');
                } catch(err) {
                    toast('Erro ao importar: formato JSON inválido', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // Export news
        $('#exportNewsBtn').addEventListener('click', function() {
            downloadJSON(news, 'noticias-nh.json');
            toast('Notícias exportadas!');
        });

        renderNewsList();
    }

    /* ============ BANNERS ============ */
    function initBanners() {
        var banners = getStore(KEYS.banners) || [];

        function saveBanners() { setStore(KEYS.banners, banners); updateDashboard(); }

        var posLabels = {
            'leaderboard': 'Topo (Leaderboard)',
            'inline-1': 'Meio do Conteúdo 1',
            'inline-2': 'Meio do Conteúdo 2',
            'sidebar': 'Sidebar'
        };

        function renderBanners() {
            var tbody = $('#bannersTableBody');
            var table = $('#bannersTable');
            var empty = $('#bannersEmpty');

            if (banners.length === 0) {
                table.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            table.style.display = 'table';
            empty.style.display = 'none';

            tbody.innerHTML = banners.map(function(b) {
                return '<tr>' +
                    '<td>' + (b.image ? '<img src="' + escHtml(b.image) + '" class="thumb" alt="" style="width:60px;height:36px;">' : '—') + '</td>' +
                    '<td><strong>' + escHtml(b.name || 'Sem nome') + '</strong></td>' +
                    '<td>' + (posLabels[b.position] || b.position) + '</td>' +
                    '<td><span class="badge badge--' + (b.active === 'true' || b.active === true ? 'active' : 'inactive') + '">' + (b.active === 'true' || b.active === true ? 'Ativo' : 'Inativo') + '</span></td>' +
                    '<td><button class="btn btn--outline btn--sm edit-banner" data-id="' + b.id + '"><i class="fas fa-edit"></i></button> <button class="btn btn--danger btn--sm del-banner" data-id="' + b.id + '"><i class="fas fa-trash"></i></button></td>' +
                    '</tr>';
            }).join('');

            $$('.edit-banner').forEach(function(btn) {
                btn.addEventListener('click', function() { editBanner(this.dataset.id); });
            });
            $$('.del-banner').forEach(function(btn) {
                btn.addEventListener('click', function() { deleteBanner(this.dataset.id); });
            });
        }

        function showBannerForm(item) {
            $('#bannerFormPanel').style.display = 'block';
            if (item) {
                $('#bannerFormTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Banner';
                $('#bannerEditId').value = item.id;
                $('#bannerName').value = item.name || '';
                $('#bannerPosition').value = item.position || 'leaderboard';
                $('#bannerImage').value = item.image || '';
                $('#bannerLink').value = item.link || '';
                $('#bannerTarget').value = item.target || '_blank';
                $('#bannerActive').value = String(item.active);
                $('#bannerCode').value = item.code || '';
                if (item.image) $('#bannerImagePreview').innerHTML = '<img src="' + escHtml(item.image) + '" alt="">';
            } else {
                $('#bannerFormTitle').innerHTML = '<i class="fas fa-plus"></i> Novo Banner';
                $('#bannerEditId').value = '';
                $('#bannerName').value = '';
                $('#bannerImage').value = '';
                $('#bannerLink').value = '';
                $('#bannerCode').value = '';
                $('#bannerImagePreview').innerHTML = '';
            }
            $('#bannerFormPanel').scrollIntoView({ behavior: 'smooth' });
        }

        function hideBannerForm() { $('#bannerFormPanel').style.display = 'none'; }
        function editBanner(id) {
            var item = banners.find(function(b) { return b.id === id; });
            if (item) showBannerForm(item);
        }
        function deleteBanner(id) {
            if (!confirm('Excluir este banner?')) return;
            banners = banners.filter(function(b) { return b.id !== id; });
            saveBanners();
            renderBanners();
            toast('Banner excluído!', 'warning');
        }

        $('#addBannerBtn').addEventListener('click', function() { showBannerForm(null); });
        $('#closeBannerForm').addEventListener('click', hideBannerForm);
        $('#cancelBannerBtn').addEventListener('click', hideBannerForm);

        $('#bannerImageFile').addEventListener('change', function(e) {
            if (e.target.files[0]) {
                fileToBase64(e.target.files[0], function(data) {
                    $('#bannerImage').value = data;
                    $('#bannerImagePreview').innerHTML = '<img src="' + data + '" alt="">';
                });
            }
        });

        $('#saveBannerBtn').addEventListener('click', function() {
            var image = $('#bannerImage').value.trim();
            var code = $('#bannerCode').value.trim();
            if (!image && !code) { toast('Adicione uma imagem ou código do banner!', 'error'); return; }

            var editId = $('#bannerEditId').value;
            var item = {
                id: editId || genId(),
                name: $('#bannerName').value.trim(),
                position: $('#bannerPosition').value,
                image: image,
                link: $('#bannerLink').value.trim(),
                target: $('#bannerTarget').value,
                active: $('#bannerActive').value,
                code: code
            };

            if (editId) {
                var idx = banners.findIndex(function(b) { return b.id === editId; });
                if (idx !== -1) banners[idx] = item;
            } else {
                banners.push(item);
            }

            saveBanners();
            renderBanners();
            hideBannerForm();
            toast(editId ? 'Banner atualizado!' : 'Banner criado!');
        });

        renderBanners();
    }

    /* ============ BREAKING NEWS ============ */
    function initBreakingNews() {
        var items = getStore(KEYS.breaking) || [
            { text: 'Governo anuncia pacote de investimentos de R$ 120 bilhões em infraestrutura para os próximos 4 anos', link: 'noticia.html' },
            { text: 'Seleção Brasileira é convocada para as eliminatórias da Copa do Mundo 2026', link: 'noticia.html' },
            { text: 'Dólar fecha em queda e atinge menor valor em 6 meses: R$ 4,87', link: 'noticia.html' }
        ];

        function renderBreaking() {
            var container = $('#breakingList');
            container.innerHTML = items.map(function(item, i) {
                return '<div class="breaking-item">' +
                    '<input type="text" value="' + escHtml(item.text) + '" class="breaking-text" data-idx="' + i + '" placeholder="Texto da notícia urgente">' +
                    '<input type="text" value="' + escHtml(item.link || '') + '" class="breaking-link" data-idx="' + i + '" placeholder="Link" style="max-width:200px;">' +
                    '<button class="btn btn--danger btn--icon del-breaking" data-idx="' + i + '"><i class="fas fa-times"></i></button>' +
                    '</div>';
            }).join('');

            $$('.del-breaking').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    items.splice(parseInt(this.dataset.idx), 1);
                    renderBreaking();
                });
            });
        }

        $('#addBreakingBtn').addEventListener('click', function() {
            items.push({ text: '', link: 'noticia.html' });
            renderBreaking();
            var inputs = $$('.breaking-text');
            if (inputs.length) inputs[inputs.length - 1].focus();
        });

        $('#saveBreakingBtn').addEventListener('click', function() {
            items = [];
            $$('.breaking-item').forEach(function(el) {
                var text = el.querySelector('.breaking-text').value.trim();
                var link = el.querySelector('.breaking-link').value.trim();
                if (text) items.push({ text: text, link: link || 'noticia.html' });
            });
            setStore(KEYS.breaking, items);
            updateDashboard();
            toast('Breaking news salvas!');
        });

        renderBreaking();
    }

    /* ============ QUOTES ============ */
    function initQuotes() {
        var saved = getStore(KEYS.quotes) || {};

        var fields = ['DolarVal','DolarVar','DolarDir','EuroVal','EuroVar','EuroDir',
                      'IbovVal','IbovVar','IbovDir','BtcVal','BtcVar','BtcDir',
                      'SelicVal','SelicVar','SelicDir'];

        fields.forEach(function(f) {
            var el = $('#q' + f);
            if (el && saved[f]) el.value = saved[f];
        });

        $('#saveQuotesBtn').addEventListener('click', function() {
            var data = {};
            fields.forEach(function(f) {
                var el = $('#q' + f);
                if (el) data[f] = el.value.trim();
            });
            setStore(KEYS.quotes, data);
            toast('Cotações salvas!');
        });
    }

    /* ============ PAGES ============ */
    function initPages() {
        var pages = getStore(KEYS.pages) || {};

        $$('.page-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var slug = this.dataset.page;
                var saved = pages[slug] || {};
                $('#pageEditSlug').value = slug;
                $('#pageTitle').value = saved.title || this.querySelector('h4').textContent;
                $('#pageContent').value = saved.content || '';
                $('#pageEditorTitle').innerHTML = '<i class="fas fa-edit"></i> Editando: ' + escHtml(this.querySelector('h4').textContent);
                $('#pageEditorPanel').style.display = 'block';
                $('#pageEditorPanel').scrollIntoView({ behavior: 'smooth' });
            });
        });

        $('#closePageEditor').addEventListener('click', function() { $('#pageEditorPanel').style.display = 'none'; });
        $('#cancelPageBtn').addEventListener('click', function() { $('#pageEditorPanel').style.display = 'none'; });

        $('#savePageBtn').addEventListener('click', function() {
            var slug = $('#pageEditSlug').value;
            pages[slug] = {
                title: $('#pageTitle').value.trim(),
                content: $('#pageContent').value
            };
            setStore(KEYS.pages, pages);
            toast('Página "' + slug + '" salva!');
        });
    }

    /* ============ DASHBOARD ============ */
    function updateDashboard() {
        var news = getStore(KEYS.news) || [];
        var banners = (getStore(KEYS.banners) || []).filter(function(b) { return b.active === 'true' || b.active === true; });
        var breaking = getStore(KEYS.breaking) || [];

        var statNews = $('#statNews');
        var statBanners = $('#statBanners');
        var statBreaking = $('#statBreaking');
        if (statNews) statNews.textContent = news.length;
        if (statBanners) statBanners.textContent = banners.length;
        if (statBreaking) statBreaking.textContent = breaking.length;
    }

    /* ============ EXPORT / IMPORT / RESET ============ */
    function downloadJSON(data, filename) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function initExportImport() {
        // Export all
        $('#exportBtn').addEventListener('click', function() {
            var allData = {};
            Object.keys(KEYS).forEach(function(k) {
                if (k !== 'auth') allData[k] = getStore(KEYS[k]);
            });
            downloadJSON(allData, 'noticiashoje-backup.json');
            toast('Backup exportado!');
        });

        // Import all
        $('#importBtn').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var data = JSON.parse(ev.target.result);
                    Object.keys(KEYS).forEach(function(k) {
                        if (k !== 'auth' && data[k] !== undefined) {
                            setStore(KEYS[k], data[k]);
                        }
                    });
                    toast('Dados importados! Recarregando...');
                    setTimeout(function() { location.reload(); }, 1000);
                } catch(err) {
                    toast('Erro ao importar: JSON inválido', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // Reset
        $('#resetBtn').addEventListener('click', function() {
            if (!confirm('Tem certeza? TODOS os dados do painel serão apagados!')) return;
            Object.keys(KEYS).forEach(function(k) {
                if (k !== 'auth') localStorage.removeItem(KEYS[k]);
            });
            toast('Dados resetados! Recarregando...', 'warning');
            setTimeout(function() { location.reload(); }, 1000);
        });
    }

    /* ============ IMPORT FROM SITES ============ */
    function initImporter() {
        var PROXIES = [
            { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'text' },
            { url: 'https://corsproxy.io/?url=', type: 'text' },
            { url: 'https://api.allorigins.win/raw?url=', type: 'text' },
            { url: 'https://api.allorigins.win/get?url=', type: 'json' }
        ];
        var importResults = [];
        var scrapedArticle = null;

        /* ---- Fetch through CORS proxy with fallbacks ---- */
        function proxyFetch(url) {
            var idx = 0;
            function tryProxy() {
                if (idx >= PROXIES.length) {
                    return Promise.reject(new Error('Todos os proxies falharam. Tente novamente mais tarde.'));
                }
                var p = PROXIES[idx++];
                var fetchUrl = p.url + encodeURIComponent(url);
                return fetch(fetchUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined })
                    .then(function(r) {
                        if (!r.ok) throw new Error('HTTP ' + r.status);
                        if (p.type === 'json') {
                            return r.json().then(function(data) {
                                if (!data.contents) throw new Error('Sem conteúdo');
                                return data.contents;
                            });
                        }
                        return r.text();
                    })
                    .then(function(content) {
                        if (!content || content.length < 50) throw new Error('Conteúdo vazio');
                        return content;
                    })
                    .catch(function(err) {
                        console.warn('Proxy ' + idx + ' falhou:', err.message);
                        return tryProxy();
                    });
            }
            return tryProxy();
        }

        /* ---- Show / hide loading ---- */
        function showLoading(show) {
            $('#importLoading').style.display = show ? 'block' : 'none';
        }

        /* ---- Parse RSS/Atom XML ---- */
        function parseRSS(xmlString) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(xmlString, 'text/xml');
            var items = [];

            // Try RSS 2.0 <item>
            var rssItems = doc.querySelectorAll('item');
            if (rssItems.length > 0) {
                rssItems.forEach(function(item) {
                    var title = getTagText(item, 'title');
                    var link = getTagText(item, 'link');
                    var desc = getTagText(item, 'description');
                    var pubDate = getTagText(item, 'pubDate');
                    var author = getTagText(item, 'dc\\:creator') || getTagText(item, 'author');
                    var category = getTagText(item, 'category');

                    // Try to find image
                    var image = '';
                    var enclosure = item.querySelector('enclosure[type^="image"]');
                    if (enclosure) image = enclosure.getAttribute('url') || '';
                    if (!image) {
                        var mediaThumbnail = item.querySelector('thumbnail') || item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
                        if (mediaThumbnail) image = mediaThumbnail.getAttribute('url') || '';
                    }
                    if (!image) {
                        var mediaContent = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0];
                        if (mediaContent) image = mediaContent.getAttribute('url') || '';
                    }
                    if (!image) {
                        // Try content:encoded
                        var contentEncoded = getTagText(item, 'content\\:encoded') || '';
                        if (!contentEncoded) {
                            var ceNodes = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded');
                            if (ceNodes && ceNodes[0]) contentEncoded = ceNodes[0].textContent || '';
                        }
                        var ceImgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (ceImgMatch) image = ceImgMatch[1];
                    }
                    if (!image) {
                        // Extract first image from description HTML
                        var imgMatch = (desc || '').match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (imgMatch) image = imgMatch[1];
                    }

                    // Extract full content from content:encoded for article body
                    var fullContent = '';
                    var ceForContent = getTagText(item, 'content\\:encoded') || '';
                    if (!ceForContent) {
                        var ceNodes2 = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded');
                        if (ceNodes2 && ceNodes2[0]) ceForContent = ceNodes2[0].textContent || '';
                    }
                    if (ceForContent) {
                        // Clean up: keep paragraphs, headings, lists, blockquotes
                        fullContent = ceForContent
                            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                            .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
                            .replace(/class="[^"]*"/gi, '')
                            .replace(/style="[^"]*"/gi, '')
                            .replace(/id="[^"]*"/gi, '');
                    }

                    // Clean HTML from description
                    var cleanDesc = desc ? desc.replace(/<[^>]+>/g, '').trim() : '';

                    if (title) {
                        items.push({
                            title: title,
                            link: link,
                            description: cleanDesc.substring(0, 300),
                            fullContent: fullContent,
                            image: image,
                            date: pubDate ? new Date(pubDate).toISOString().slice(0, 16) : '',
                            author: author,
                            category: category,
                            source: ''
                        });
                    }
                });
            } else {
                // Try Atom <entry>
                var entries = doc.querySelectorAll('entry');
                entries.forEach(function(entry) {
                    var title = getTagText(entry, 'title');
                    var linkEl = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link');
                    var link = linkEl ? (linkEl.getAttribute('href') || '') : '';
                    var summary = getTagText(entry, 'summary') || getTagText(entry, 'content');
                    var published = getTagText(entry, 'published') || getTagText(entry, 'updated');
                    var author = '';
                    var authorEl = entry.querySelector('author name');
                    if (authorEl) author = authorEl.textContent || '';
                    var category = '';
                    var catEl = entry.querySelector('category');
                    if (catEl) category = catEl.getAttribute('term') || catEl.textContent || '';

                    var image = '';
                    var mediaThumbnail = entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
                    if (mediaThumbnail) image = mediaThumbnail.getAttribute('url') || '';
                    if (!image) {
                        var imgMatch = (summary || '').match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (imgMatch) image = imgMatch[1];
                    }

                    var cleanDesc = summary ? summary.replace(/<[^>]+>/g, '').trim() : '';

                    if (title) {
                        items.push({
                            title: title,
                            link: link,
                            description: cleanDesc.substring(0, 300),
                            image: image,
                            date: published ? new Date(published).toISOString().slice(0, 16) : '',
                            author: author,
                            category: category,
                            source: ''
                        });
                    }
                });
            }

            // Detect source name from feed
            var feedTitle = getTagText(doc.documentElement, 'title') || 'Fonte externa';
            items.forEach(function(item) { item.source = feedTitle; });

            return items;
        }

        function getTagText(parent, tagName) {
            var el = parent.querySelector(tagName);
            if (!el) return '';
            return (el.textContent || '').trim();
        }

        /* ---- Parse OG tags from HTML ---- */
        function parseOG(htmlString, sourceUrl) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(htmlString, 'text/html');
            var meta = {};

            doc.querySelectorAll('meta').forEach(function(m) {
                var prop = m.getAttribute('property') || m.getAttribute('name') || '';
                var content = m.getAttribute('content') || '';
                if (prop && content) meta[prop.toLowerCase()] = content;
            });

            var title = meta['og:title'] || meta['twitter:title'] || '';
            if (!title) {
                var titleEl = doc.querySelector('title');
                if (titleEl) title = titleEl.textContent.trim();
            }

            var description = meta['og:description'] || meta['twitter:description'] || meta['description'] || '';
            var image = meta['og:image'] || meta['twitter:image'] || '';
            var siteName = meta['og:site_name'] || '';
            var author = meta['author'] || meta['article:author'] || '';
            var publishedTime = meta['article:published_time'] || '';

            // Try to extract article body text
            var contentText = '';
            var articleEl = doc.querySelector('article') || doc.querySelector('[role="main"]') || doc.querySelector('.article-body') || doc.querySelector('.content-text') || doc.querySelector('.post-content');
            if (articleEl) {
                // Remove scripts, styles, navs, etc.
                var cloned = articleEl.cloneNode(true);
                cloned.querySelectorAll('script, style, nav, footer, aside, .ad, .advertisement, .social-share, .related').forEach(function(el) { el.remove(); });

                // Get paragraphs
                var paras = cloned.querySelectorAll('p');
                if (paras.length > 0) {
                    var paragraphs = [];
                    paras.forEach(function(p) {
                        var text = p.textContent.trim();
                        if (text.length > 30) paragraphs.push('<p>' + escHtml(text) + '</p>');
                    });
                    contentText = paragraphs.join('\n');
                } else {
                    contentText = '<p>' + escHtml(cloned.textContent.trim().substring(0, 2000)) + '</p>';
                }
            }

            // Detect source from URL
            if (!siteName) {
                try {
                    var urlObj = new URL(sourceUrl);
                    siteName = urlObj.hostname.replace('www.', '');
                } catch(e) { siteName = 'Fonte externa'; }
            }

            return {
                title: title,
                description: description.substring(0, 400),
                image: image,
                content: contentText,
                author: author,
                date: publishedTime ? new Date(publishedTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                source: siteName,
                link: sourceUrl
            };
        }

        /* ---- Auto-detect category ---- */
        function guessCategory(text) {
            var lower = (text || '').toLowerCase();
            var map = {
                'politica': /politic|govern|presiden|deputad|senad|congresso|stf|eleic|ministr|lula|bolsonaro/,
                'economia': /econom|inflac|pib|mercado|dolar|euro|ibovespa|bolsa|juros|selic|bc\b|bacen|finance/,
                'tecnologia': /tecnolog|tech|apple|google|microsoft|ia\b|intelig.ncia artificial|app\b|software|startup|digital|ciberseg|hack/,
                'saude': /saude|sa.de|vacina|hospital|medic|covid|pandemia|doenca|doen.a|cancer|c.ncer|oms|sus\b|tratament/,
                'esportes': /esport|futebol|gol\b|selec|campeonat|copa\b|olimp|nba|fla\b|corinthians|palmeiras|f.rmula|mma|ufc/,
                'cultura': /cultur|cinema|filme|serie|music|show|festival|arte\b|teatro|livro|netflix|disney|oscar/,
                'mundo': /mund|internacional|eua|estados unidos|china|europa|guerra|otan|onu\b|trump|biden|ucr.nia|russia|isra/,
                'ciencia': /cienci|ciência|nasa|espac|planeta|discover|pesquisa|estudo\b|universidade|cientis/,
                'educacao': /educa|escola|universidade|enem|vestibular|professor|aluno|ensino|mec\b/
            };
            for (var cat in map) {
                if (map[cat].test(lower)) return cat;
            }
            return 'politica';
        }

        /* ---- Render import results ---- */
        function renderResults() {
            var panel = $('#importResultsPanel');
            var list = $('#importResultsList');
            var countEl = $('#importResultsCount');

            if (importResults.length === 0) {
                panel.style.display = 'none';
                return;
            }

            panel.style.display = 'block';
            countEl.textContent = importResults.length;

            list.innerHTML = importResults.map(function(item, i) {
                return '<div class="import-item" data-idx="' + i + '">' +
                    '<div class="import-item__check"><i class="fas fa-check"></i></div>' +
                    (item.image ? '<div class="import-item__thumb"><img src="' + escHtml(item.image) + '" alt="" onerror="this.parentElement.style.display=\'none\'"></div>' : '') +
                    '<div class="import-item__info">' +
                        '<div class="import-item__title">' + escHtml(item.title) + '</div>' +
                        '<div class="import-item__desc">' + escHtml(item.description || '') + '</div>' +
                        '<div class="import-item__meta">' +
                            (item.source ? '<span><i class="fas fa-globe"></i> ' + escHtml(item.source) + '</span>' : '') +
                            (item.author ? '<span><i class="fas fa-user"></i> ' + escHtml(item.author) + '</span>' : '') +
                            (item.date ? '<span><i class="fas fa-clock"></i> ' + formatDate(item.date) + '</span>' : '') +
                            (item.category ? '<span><i class="fas fa-tag"></i> ' + escHtml(item.category) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');

            // Click to toggle selection
            $$('.import-item').forEach(function(el) {
                el.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    updateSelectedCount();
                });
            });

            updateSelectedCount();
            panel.scrollIntoView({ behavior: 'smooth' });
        }

        function updateSelectedCount() {
            var count = $$('.import-item.selected').length;
            $('#importSelectedCount').textContent = count;
        }

        /* ---- Auto-detect RSS feed from plain site URL ---- */
        function detectFeedUrl(siteUrl) {
            // If already looks like a feed URL, return as-is
            if (/\/(feed|rss|atom)\/?$/i.test(siteUrl)) {
                return Promise.resolve(siteUrl);
            }

            var base = siteUrl.replace(/\/+$/, '');
            var candidates = [
                base + '/feed/',
                base + '/feed',
                base + '/rss',
                base + '/feed/rss/',
                base + '/atom.xml',
                base + '/rss.xml'
            ];

            var idx = 0;

            function tryNext() {
                if (idx >= candidates.length) {
                    return Promise.reject(new Error('Nenhum feed RSS encontrado para este site. Tente informar o URL do feed diretamente.'));
                }
                var candidate = candidates[idx++];
                return proxyFetch(candidate).then(function(content) {
                    // Check if the content looks like RSS/Atom XML
                    if (content && (/<rss/i.test(content) || /<feed/i.test(content) || /<channel/i.test(content))) {
                        return candidate;
                    }
                    return tryNext();
                }).catch(function() {
                    return tryNext();
                });
            }

            return tryNext();
        }

        /* ---- Fetch RSS (with auto-detect) ---- */
        function fetchRSS(url) {
            if (!url) { toast('Cole ou selecione uma URL de feed RSS', 'warning'); return; }

            showLoading(true);
            $('#importResultsPanel').style.display = 'none';
            importResults = [];

            // Check if URL looks like a site URL (not a direct feed)
            var needsDetect = !/\/(feed|rss|atom)(\/|\.xml)?$/i.test(url);

            var feedPromise = needsDetect
                ? (toast('Detectando feed RSS do site...'), detectFeedUrl(url))
                : Promise.resolve(url);

            feedPromise.then(function(feedUrl) {
                if (feedUrl !== url) {
                    toast('Feed encontrado: ' + feedUrl);
                    $('#rssFeedUrl').value = feedUrl;
                }
                return proxyFetch(feedUrl);
            }).then(function(xmlString) {
                showLoading(false);
                importResults = parseRSS(xmlString);

                if (importResults.length === 0) {
                    toast('Nenhuma notícia encontrada neste feed. Verifique a URL.', 'warning');
                    return;
                }

                toast(importResults.length + ' notícias encontradas!');
                renderResults();
            }).catch(function(err) {
                showLoading(false);
                console.error('RSS fetch error:', err);
                toast('Erro ao buscar feed: ' + (err.message || 'Verifique a URL'), 'error');
            });
        }

        /* ---- Scrape single URL ---- */
        function scrapeURL(url) {
            if (!url) { toast('Cole a URL do artigo', 'warning'); return; }

            showLoading(true);
            $('#scrapeResultPanel').style.display = 'none';
            scrapedArticle = null;

            proxyFetch(url).then(function(htmlString) {
                showLoading(false);
                scrapedArticle = parseOG(htmlString, url);

                if (!scrapedArticle.title) {
                    toast('Não foi possível extrair dados desta URL. Tente outra.', 'warning');
                    return;
                }

                // Auto-detect category
                var detectedCat = guessCategory(scrapedArticle.title + ' ' + scrapedArticle.description);
                $('#scrapeCategory').value = detectedCat;
                $('#scrapeStatus').value = 'draft';

                // Render preview
                var preview = $('#scrapePreview');
                preview.innerHTML =
                    (scrapedArticle.image ? '<div class="scrape-preview__img"><img src="' + escHtml(scrapedArticle.image) + '" alt=""></div>' : '') +
                    '<div class="scrape-preview__content">' +
                        '<h4>' + escHtml(scrapedArticle.title) + '</h4>' +
                        '<p>' + escHtml(scrapedArticle.description) + '</p>' +
                        '<small><i class="fas fa-globe"></i> ' + escHtml(scrapedArticle.source) +
                        (scrapedArticle.author ? ' &nbsp;|&nbsp; <i class="fas fa-user"></i> ' + escHtml(scrapedArticle.author) : '') +
                        '</small>' +
                    '</div>';

                $('#scrapeResultPanel').style.display = 'block';
                $('#scrapeResultPanel').scrollIntoView({ behavior: 'smooth' });
                toast('Artigo extraído com sucesso!');
            }).catch(function(err) {
                showLoading(false);
                console.error('Scrape error:', err);
                toast('Erro ao acessar a URL: ' + (err.message || 'Verifique o endereço'), 'error');
            });
        }

        /* ---- Get custom source / author overrides ---- */
        function getCustomOverrides() {
            var srcEl = $('#importCustomSource');
            var authEl = $('#importCustomAuthor');
            return {
                source: srcEl ? srcEl.value.trim() : '',
                author: authEl ? authEl.value.trim() : ''
            };
        }

        /* ---- Import selected RSS items to news ---- */
        function importSelected() {
            var selected = $$('.import-item.selected');
            if (selected.length === 0) { toast('Selecione ao menos uma notícia para importar', 'warning'); return; }

            var overrides = getCustomOverrides();
            var news = getStore(KEYS.news) || [];
            var count = 0;

            selected.forEach(function(el) {
                var idx = parseInt(el.dataset.idx);
                var item = importResults[idx];
                if (!item) return;

                var finalSource = overrides.source || item.source || '';
                var finalAuthor = overrides.author || item.author || item.source || '';
                var detectedCat = guessCategory(item.title + ' ' + item.description + ' ' + (item.category || ''));

                // Build article content: prefer fullContent from RSS, fallback to description
                var articleBody = '';
                if (item.fullContent) {
                    articleBody = item.fullContent;
                } else {
                    articleBody = '<p>' + escHtml(item.description || '') + '</p>';
                }
                if (item.link) {
                    articleBody += '\n<p><em>Fonte original: <a href="' + escHtml(item.link) + '" target="_blank" rel="noopener">' + escHtml(finalSource || item.link) + '</a></em></p>';
                }

                news.unshift({
                    id: genId(),
                    slug: slugify(item.title),
                    title: item.title,
                    category: detectedCat,
                    subtitle: item.description || '',
                    content: articleBody,
                    image: item.image || '',
                    author: finalAuthor,
                    tags: [finalSource || 'importado', detectedCat].filter(Boolean),
                    date: item.date || new Date().toISOString().slice(0, 16),
                    status: 'published',
                    source: finalSource,
                    sourceUrl: item.link || '',
                    updatedAt: new Date().toISOString()
                });
                count++;
            });

            setStore(KEYS.news, news);
            updateDashboard();
            toast(count + ' notícia(s) importada(s) e publicada(s)! Veja no site.', 'success');

            // Reset
            importResults = [];
            $('#importResultsPanel').style.display = 'none';
        }

        /* ---- Import ALL items at once ---- */
        function importAll() {
            if (importResults.length === 0) { toast('Nenhuma notícia para importar. Busque um feed primeiro.', 'warning'); return; }

            var overrides = getCustomOverrides();
            var news = getStore(KEYS.news) || [];
            var count = 0;

            importResults.forEach(function(item) {
                var finalSource = overrides.source || item.source || '';
                var finalAuthor = overrides.author || item.author || item.source || '';
                var detectedCat = guessCategory(item.title + ' ' + item.description + ' ' + (item.category || ''));

                var articleBody = '';
                if (item.fullContent) {
                    articleBody = item.fullContent;
                } else {
                    articleBody = '<p>' + escHtml(item.description || '') + '</p>';
                }
                if (item.link) {
                    articleBody += '\n<p><em>Fonte original: <a href="' + escHtml(item.link) + '" target="_blank" rel="noopener">' + escHtml(finalSource || item.link) + '</a></em></p>';
                }

                news.unshift({
                    id: genId(),
                    slug: slugify(item.title),
                    title: item.title,
                    category: detectedCat,
                    subtitle: item.description || '',
                    content: articleBody,
                    image: item.image || '',
                    author: finalAuthor,
                    tags: [finalSource || 'importado', detectedCat].filter(Boolean),
                    date: item.date || new Date().toISOString().slice(0, 16),
                    status: 'published',
                    source: finalSource,
                    sourceUrl: item.link || '',
                    updatedAt: new Date().toISOString()
                });
                count++;
            });

            setStore(KEYS.news, news);
            updateDashboard();
            toast(count + ' notícia(s) importada(s) e publicada(s)! Veja no site.', 'success');

            // Reset
            importResults = [];
            $('#importResultsPanel').style.display = 'none';
        }

        /* ---- Import scraped article ---- */
        function importScraped() {
            if (!scrapedArticle || !scrapedArticle.title) { toast('Nenhum artigo para importar', 'warning'); return; }

            var overrides = getCustomOverrides();
            var news = getStore(KEYS.news) || [];
            var cat = $('#scrapeCategory').value;
            var status = $('#scrapeStatus').value;

            var finalSource = overrides.source || scrapedArticle.source || '';
            var finalAuthor = overrides.author || scrapedArticle.author || scrapedArticle.source || '';

            news.unshift({
                id: genId(),
                slug: slugify(scrapedArticle.title),
                title: scrapedArticle.title,
                subtitle: scrapedArticle.description || '',
                content: (scrapedArticle.content || '<p>' + escHtml(scrapedArticle.description || '') + '</p>') +
                         (scrapedArticle.link ? '\n<p><em>Fonte: <a href="' + escHtml(scrapedArticle.link) + '" target="_blank" rel="noopener">' + escHtml(finalSource || scrapedArticle.link) + '</a></em></p>' : ''),
                image: scrapedArticle.image || '',
                author: finalAuthor,
                tags: [finalSource || 'importado', cat].filter(Boolean),
                date: scrapedArticle.date || new Date().toISOString().slice(0, 16),
                status: status,
                source: finalSource,
                sourceUrl: scrapedArticle.link || '',
                updatedAt: new Date().toISOString()
            });

            setStore(KEYS.news, news);
            updateDashboard();
            toast('Artigo importado como ' + (status === 'published' ? 'Publicado' : status === 'featured' ? 'Destaque' : 'Rascunho') + '!');

            // Reset
            scrapedArticle = null;
            $('#scrapeResultPanel').style.display = 'none';
            $('#scrapeUrl').value = '';
        }

        /* ---- EVENT BINDINGS ---- */

        // Fetch RSS button
        $('#fetchRssBtn').addEventListener('click', function() {
            fetchRSS($('#rssFeedUrl').value.trim());
        });

        // RSS input enter key
        $('#rssFeedUrl').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); fetchRSS(this.value.trim()); }
        });

        // Popular feed chips
        $$('.feed-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                var feedUrl = this.dataset.feed;
                $('#rssFeedUrl').value = feedUrl;
                $$('.feed-chip').forEach(function(c) { c.classList.remove('active'); });
                this.classList.add('active');
                fetchRSS(feedUrl);
            });
        });

        // Select all
        $('#selectAllImport').addEventListener('click', function() {
            var items = $$('.import-item');
            var allSelected = items.every(function(el) { return el.classList.contains('selected'); });
            items.forEach(function(el) {
                if (allSelected) el.classList.remove('selected');
                else el.classList.add('selected');
            });
            updateSelectedCount();
        });

        // Import selected
        $('#importSelectedBtn').addEventListener('click', importSelected);

        // Import ALL at once
        $('#importAllBtn').addEventListener('click', function() {
            if (importResults.length === 0) {
                toast('Busque um feed primeiro antes de importar', 'warning');
                return;
            }
            var overrides = getCustomOverrides();
            var sourceLabel = overrides.source ? ' como "' + overrides.source + '"' : '';
            if (confirm('Importar TODAS as ' + importResults.length + ' notícias' + sourceLabel + '?')) {
                importAll();
            }
        });

        // Scrape URL button
        $('#scrapeUrlBtn').addEventListener('click', function() {
            scrapeURL($('#scrapeUrl').value.trim());
        });

        // Scrape URL enter key
        $('#scrapeUrl').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); scrapeURL(this.value.trim()); }
        });

        // Import scraped article
        $('#importScrapeBtn').addEventListener('click', importScraped);

        // Close/cancel scrape
        $('#closeScrapeResult').addEventListener('click', function() { $('#scrapeResultPanel').style.display = 'none'; });
        $('#cancelScrapeBtn').addEventListener('click', function() { $('#scrapeResultPanel').style.display = 'none'; });
    }

    /* ============ GENERATE STATIC ARTICLE PAGES ============ */
    function generateArticleHTML(article) {
        var catLabels = {
            politica: 'Política', economia: 'Economia', tecnologia: 'Tecnologia',
            saude: 'Saúde', esportes: 'Esportes', cultura: 'Cultura',
            mundo: 'Mundo', ciencia: 'Ciência', educacao: 'Educação', opiniao: 'Opinião'
        };
        var catTagClasses = {
            politica: 'tag--politics', economia: 'tag--economy', tecnologia: 'tag--tech',
            saude: 'tag--health', esportes: 'tag--sports', cultura: 'tag--culture',
            mundo: 'tag--world', ciencia: 'tag--science', educacao: 'tag--education', opiniao: 'tag--opinion'
        };
        var cat = article.category || 'politica';
        var catLabel = catLabels[cat] || cat;
        var catClass = catTagClasses[cat] || 'tag--politics';
        var d = article.date ? new Date(article.date) : new Date();
        var dateFormatted = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        var dateISO = d.toISOString();
        var tagsHtml = (article.tags || []).map(function(t) {
            return '                        <a href="index.html#' + cat + '" class="article-tag">' + escHtml(t) + '</a>';
        }).join('\n');

        // Related articles
        var allNews = getStore(KEYS.news) || [];
        var related = allNews.filter(function(n) {
            return n.id !== article.id && (n.status === 'published' || n.status === 'featured');
        }).slice(0, 3);
        var relatedHtml = related.map(function(n) {
            var rSlug = n.slug || slugify(n.title);
            var rCatClass = catTagClasses[n.category] || 'tag--politics';
            var rCatLabel = catLabels[n.category] || n.category || 'Notícia';
            return '                            <article class="card">\n' +
                '                                <a href="' + rSlug + '.html" class="card__link">\n' +
                '                                    <div class="card__img">' + (n.image ? '<img src="' + escHtml(n.image) + '" alt="" loading="lazy">' : '') + '<span class="tag ' + rCatClass + '">' + rCatLabel + '</span></div>\n' +
                '                                    <div class="card__body"><h3>' + escHtml(n.title) + '</h3><time><i class="far fa-clock"></i> ' + formatDate(n.date) + '</time></div>\n' +
                '                                </a>\n' +
                '                            </article>';
        }).join('\n');

        return '<!DOCTYPE html>\n' +
'<html lang="pt-BR" data-theme="light">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <meta name="description" content="' + escHtml(article.subtitle || article.title) + '">\n' +
'    <meta name="theme-color" content="#D32F2F">\n' +
'    <meta name="author" content="' + escHtml(article.author || 'Redação') + '">\n' +
'    <meta property="og:type" content="article">\n' +
'    <meta property="og:title" content="' + escHtml(article.title) + '">\n' +
'    <meta property="og:description" content="' + escHtml(article.subtitle || '') + '">\n' +
(article.image ? '    <meta property="og:image" content="' + escHtml(article.image) + '">\n' : '') +
'    <meta property="og:locale" content="pt_BR">\n' +
'    <meta property="og:site_name" content="NotíciasHoje">\n' +
'    <meta property="article:published_time" content="' + dateISO + '">\n' +
'    <meta property="article:section" content="' + catLabel + '">\n' +
'    <meta name="twitter:card" content="summary_large_image">\n' +
'    <meta name="twitter:title" content="' + escHtml(article.title) + '">\n' +
'    <meta name="twitter:description" content="' + escHtml(article.subtitle || '') + '">\n' +
(article.image ? '    <meta name="twitter:image" content="' + escHtml(article.image) + '">\n' : '') +
'    <title>' + escHtml(article.title) + ' — NotíciasHoje</title>\n' +
'    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' rx=\'18\' fill=\'%23D32F2F\'/><text x=\'50\' y=\'68\' font-family=\'Arial\' font-size=\'48\' font-weight=\'900\' fill=\'white\' text-anchor=\'middle\'>NH</text></svg>">\n' +
'    <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Source+Serif+4:wght@600;700;800&display=swap" rel="stylesheet">\n' +
'    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
'    <link rel="stylesheet" href="css/style.css">\n' +
'    <script type="application/ld+json">\n' +
'    {\n' +
'        "@context": "https://schema.org",\n' +
'        "@type": "NewsArticle",\n' +
'        "headline": "' + escHtml(article.title).replace(/"/g, '\\"') + '",\n' +
(article.image ? '        "image": "' + escHtml(article.image) + '",\n' : '') +
'        "datePublished": "' + dateISO + '",\n' +
'        "author": { "@type": "Person", "name": "' + escHtml(article.author || 'Redação') + '" },\n' +
'        "publisher": { "@type": "Organization", "name": "NotíciasHoje" },\n' +
'        "description": "' + escHtml(article.subtitle || '').replace(/"/g, '\\"') + '"\n' +
'    }\n' +
'    </script>\n' +
'</head>\n' +
'<body>\n' +
'    <a href="#main-content" class="skip-link">Pular para o conteúdo principal</a>\n' +
'\n' +
'    <div class="topbar">\n' +
'        <div class="container topbar__inner">\n' +
'            <div class="topbar__left">\n' +
'                <span class="topbar__date" id="currentDate"></span>\n' +
'                <span class="topbar__sep">|</span>\n' +
'                <span class="topbar__greeting" id="greeting"></span>\n' +
'            </div>\n' +
'            <div class="topbar__right">\n' +
'                <button class="theme-toggle" id="themeToggle" aria-label="Alternar tema escuro"><i class="fas fa-moon"></i></button>\n' +
'                <a href="index.html"><i class="far fa-bell"></i> Alertas</a>\n' +
'                <a href="index.html"><i class="far fa-envelope"></i> Newsletter</a>\n' +
'                <a href="#"><i class="far fa-user"></i> Entrar</a>\n' +
'            </div>\n' +
'        </div>\n' +
'    </div>\n' +
'\n' +
'    <header class="header" id="header">\n' +
'        <div class="container header__inner">\n' +
'            <a href="index.html" class="header__logo" aria-label="NotíciasHoje - Página inicial">\n' +
'                <div class="header__logo-mark"><span>NH</span></div>\n' +
'                <div class="header__logo-text"><strong>Notícias<span>Hoje</span></strong><small>Informação com credibilidade</small></div>\n' +
'            </a>\n' +
'            <div class="header__search" id="searchBar">\n' +
'                <form class="header__search-form" id="searchForm" role="search">\n' +
'                    <input type="text" placeholder="O que você procura?" id="searchInput" autocomplete="off" aria-label="Campo de busca">\n' +
'                    <button type="submit" aria-label="Buscar"><i class="fas fa-search"></i></button>\n' +
'                </form>\n' +
'            </div>\n' +
'            <div class="header__actions">\n' +
'                <button class="header__search-toggle" id="searchToggle" aria-label="Abrir busca"><i class="fas fa-search"></i></button>\n' +
'                <button class="header__menu-toggle" id="menuToggle" aria-label="Abrir menu"><span></span><span></span><span></span></button>\n' +
'            </div>\n' +
'        </div>\n' +
'    </header>\n' +
'\n' +
'    <nav class="nav" id="mainNav" aria-label="Navegação principal">\n' +
'        <div class="container">\n' +
'            <ul class="nav__list" id="navList" role="menubar">\n' +
'                <li role="none"><a href="index.html" class="nav__link" role="menuitem"><i class="fas fa-home"></i> Início</a></li>\n' +
'                <li role="none"><a href="index.html#politica" class="nav__link" role="menuitem">Política</a></li>\n' +
'                <li role="none"><a href="index.html#economia" class="nav__link" role="menuitem">Economia</a></li>\n' +
'                <li role="none"><a href="index.html#tecnologia" class="nav__link" role="menuitem">Tecnologia</a></li>\n' +
'                <li role="none"><a href="index.html#saude" class="nav__link" role="menuitem">Saúde</a></li>\n' +
'                <li role="none"><a href="index.html#esportes" class="nav__link" role="menuitem">Esportes</a></li>\n' +
'                <li role="none"><a href="index.html#cultura" class="nav__link" role="menuitem">Cultura</a></li>\n' +
'                <li role="none"><a href="index.html#mundo" class="nav__link" role="menuitem">Mundo</a></li>\n' +
'                <li role="none"><a href="index.html#ciencia" class="nav__link" role="menuitem">Ciência</a></li>\n' +
'                <li role="none"><a href="index.html#opiniao" class="nav__link" role="menuitem">Opinião</a></li>\n' +
'            </ul>\n' +
'        </div>\n' +
'    </nav>\n' +
'\n' +
'    <main class="main" id="main-content">\n' +
'        <div class="container">\n' +
'            <nav class="breadcrumb" aria-label="Breadcrumb">\n' +
'                <a href="index.html">Início</a><span class="breadcrumb__sep">›</span>\n' +
'                <a href="index.html#' + cat + '">' + catLabel + '</a><span class="breadcrumb__sep">›</span>\n' +
'                <span>' + escHtml(article.title.substring(0, 60)) + '...</span>\n' +
'            </nav>\n' +
'\n' +
'            <div class="layout">\n' +
'                <article class="layout__main">\n' +
'                    <header class="article-header">\n' +
'                        <span class="tag ' + catClass + '">' + catLabel + '</span>\n' +
'                        <h1>' + escHtml(article.title) + '</h1>\n' +
'                        <p class="article-subtitle">' + escHtml(article.subtitle || '') + '</p>\n' +
'                        <div class="article-meta">\n' +
'                            <div class="article-meta__author">\n' +
'                                <img src="https://i.pravatar.cc/80?u=' + encodeURIComponent(article.author || 'redacao') + '" alt="' + escHtml(article.author || 'Redação') + '">\n' +
'                                <div><strong>' + escHtml(article.author || 'Redação') + '</strong><span>' + escHtml(article.source || '') + '</span></div>\n' +
'                            </div>\n' +
'                            <time datetime="' + dateISO + '"><i class="far fa-clock"></i> ' + dateFormatted + '</time>\n' +
'                            <div class="article-share">\n' +
'                                <span>Compartilhar:</span>\n' +
'                                <button class="share-btn share-btn--whatsapp" data-share="whatsapp" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></button>\n' +
'                                <button class="share-btn share-btn--facebook" data-share="facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></button>\n' +
'                                <button class="share-btn share-btn--twitter" data-share="twitter" aria-label="Twitter"><i class="fab fa-x-twitter"></i></button>\n' +
'                                <button class="share-btn share-btn--telegram" data-share="telegram" aria-label="Telegram"><i class="fab fa-telegram"></i></button>\n' +
'                                <button class="share-btn share-btn--copy" data-share="copy" aria-label="Copiar link"><i class="fas fa-link"></i></button>\n' +
'                            </div>\n' +
'                        </div>\n' +
'                    </header>\n' +
'\n' +
(article.image ?
'                    <figure class="article-cover">\n' +
'                        <img src="' + escHtml(article.image) + '" alt="' + escHtml(article.title) + '">\n' +
'                        <figcaption>' + (article.source ? 'Foto: ' + escHtml(article.source) : 'Imagem ilustrativa') + '</figcaption>\n' +
'                    </figure>\n' : '') +
'\n' +
'                    <div class="article-content">\n' +
                         (article.content || '<p>' + escHtml(article.subtitle || '') + '</p>') + '\n' +
'                    </div>\n' +
'\n' +
'                    <div class="article-tags">\n' +
                         tagsHtml + '\n' +
'                    </div>\n' +
'\n' +
'                    <div class="article-meta" style="border-top: 1px solid var(--border); border-bottom: none; margin-top: var(--sp-6);">\n' +
'                        <div class="article-share" style="margin-left: 0;">\n' +
'                            <span>Compartilhar esta matéria:</span>\n' +
'                            <button class="share-btn share-btn--whatsapp" data-share="whatsapp"><i class="fab fa-whatsapp"></i></button>\n' +
'                            <button class="share-btn share-btn--facebook" data-share="facebook"><i class="fab fa-facebook-f"></i></button>\n' +
'                            <button class="share-btn share-btn--twitter" data-share="twitter"><i class="fab fa-x-twitter"></i></button>\n' +
'                            <button class="share-btn share-btn--telegram" data-share="telegram"><i class="fab fa-telegram"></i></button>\n' +
'                            <button class="share-btn share-btn--copy" data-share="copy"><i class="fas fa-link"></i></button>\n' +
'                        </div>\n' +
'                    </div>\n' +
'\n' +
'                    <section class="related">\n' +
'                        <h3>Leia também</h3>\n' +
'                        <div class="card-grid card-grid--3">\n' +
                             relatedHtml + '\n' +
'                        </div>\n' +
'                    </section>\n' +
'                </article>\n' +
'\n' +
'                <aside class="sidebar" aria-label="Conteúdo complementar">\n' +
'                    <div class="widget widget--trending">\n' +
'                        <h3 class="widget__title"><i class="fas fa-fire-flame-curved"></i> Mais Lidas</h3>\n' +
'                        <ol class="trending" id="sidebarTrending"></ol>\n' +
'                    </div>\n' +
'                    <div class="ad-banner ad-banner--sidebar"><div class="ad-placeholder ad-placeholder--tall"><span>Publicidade</span></div></div>\n' +
'                </aside>\n' +
'            </div>\n' +
'        </div>\n' +
'    </main>\n' +
'\n' +
'    <footer class="footer" role="contentinfo">\n' +
'        <div class="container">\n' +
'            <div class="footer__top">\n' +
'                <div class="footer__brand">\n' +
'                    <a href="index.html" class="footer__logo"><div class="header__logo-mark"><span>NH</span></div><strong>Notícias<span>Hoje</span></strong></a>\n' +
'                    <p>Jornalismo sério, imparcial e comprometido com a verdade.</p>\n' +
'                </div>\n' +
'                <div class="footer__nav">\n' +
'                    <div class="footer__col"><h4>Editorias</h4><ul><li><a href="index.html#politica">Política</a></li><li><a href="index.html#economia">Economia</a></li><li><a href="index.html#tecnologia">Tecnologia</a></li><li><a href="index.html#esportes">Esportes</a></li><li><a href="index.html#cultura">Cultura</a></li><li><a href="index.html#ciencia">Ciência</a></li></ul></div>\n' +
'                    <div class="footer__col"><h4>Portal</h4><ul><li><a href="sobre.html">Sobre</a></li><li><a href="privacidade.html">Privacidade</a></li><li><a href="termos.html">Termos</a></li><li><a href="etica.html">Ética</a></li></ul></div>\n' +
'                </div>\n' +
'            </div>\n' +
'            <div class="footer__bottom">\n' +
'                <p>&copy; 2026 NotíciasHoje. Todos os direitos reservados.</p>\n' +
'            </div>\n' +
'        </div>\n' +
'    </footer>\n' +
'\n' +
'    <button class="btt" id="btt" aria-label="Voltar ao topo"><i class="fas fa-arrow-up"></i></button>\n' +
'\n' +
'    <div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="Aviso de cookies">\n' +
'        <div class="cookie-banner__inner">\n' +
'            <div class="cookie-banner__text"><i class="fas fa-cookie-bite"></i><p>Utilizamos cookies. Ao continuar, você concorda com nossa <a href="privacidade.html">Política de Privacidade</a>.</p></div>\n' +
'            <div class="cookie-banner__actions"><button class="cookie-btn cookie-btn--accept" id="cookieAccept">Aceitar</button><button class="cookie-btn cookie-btn--reject" id="cookieReject">Rejeitar</button></div>\n' +
'        </div>\n' +
'    </div>\n' +
'\n' +
'    <script src="js/main.js"></script>\n' +
'</body>\n' +
'</html>';
    }

    function initGeneratePages() {
        var btn = $('#generateAllPagesBtn');
        if (!btn) return;

        btn.addEventListener('click', function() {
            var news = getStore(KEYS.news) || [];
            var published = news.filter(function(n) { return n.status === 'published' || n.status === 'featured'; });

            if (published.length === 0) {
                toast('Nenhuma notícia publicada para gerar páginas.', 'warning');
                return;
            }

            // Ensure all articles have slugs
            var updated = false;
            news.forEach(function(n) {
                if (!n.slug) { n.slug = slugify(n.title); updated = true; }
            });
            if (updated) setStore(KEYS.news, news);
            published = news.filter(function(n) { return n.status === 'published' || n.status === 'featured'; });

            var statusEl = $('#generatePagesStatus');
            var listEl = $('#generatedPagesList');
            statusEl.textContent = 'Gerando ' + published.length + ' página(s)...';

            var generated = [];

            published.forEach(function(article) {
                var slug = article.slug || slugify(article.title);
                var filename = slug + '.html';
                var html = generateArticleHTML(article);

                // Create downloadable blob
                var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                var url = URL.createObjectURL(blob);

                generated.push({
                    filename: filename,
                    title: article.title,
                    url: url,
                    image: article.image
                });
            });

            // Display generated files with download links
            listEl.innerHTML = '<h4 style="margin-bottom:.75rem;"><i class="fas fa-check-circle" style="color:var(--success);"></i> ' + generated.length + ' página(s) gerada(s):</h4>' +
                '<div style="display:flex;flex-direction:column;gap:.5rem;">' +
                generated.map(function(g) {
                    return '<div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--n-50);border-radius:8px;">' +
                        (g.image ? '<img src="' + escHtml(g.image) + '" style="width:60px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'">' : '') +
                        '<div style="flex:1;min-width:0;">' +
                            '<strong style="display:block;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(g.title) + '</strong>' +
                            '<code style="font-size:.75rem;color:var(--n-500);">' + escHtml(g.filename) + '</code>' +
                        '</div>' +
                        '<a href="' + g.url + '" download="' + escHtml(g.filename) + '" class="btn btn--primary btn--sm"><i class="fas fa-download"></i> Baixar</a>' +
                    '</div>';
                }).join('') +
                '</div>' +
                '<div style="margin-top:1rem;">' +
                    '<button class="btn btn--success" id="downloadAllPages"><i class="fas fa-file-archive"></i> Baixar Todas de Uma Vez</button>' +
                '</div>';

            statusEl.textContent = 'Pronto! ' + generated.length + ' página(s) gerada(s).';
            toast(generated.length + ' página(s) HTML gerada(s) com sucesso!', 'success');

            // Download all at once
            $('#downloadAllPages').addEventListener('click', function() {
                var delay = 0;
                generated.forEach(function(g) {
                    setTimeout(function() {
                        var a = document.createElement('a');
                        a.href = g.url;
                        a.download = g.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, delay);
                    delay += 300;
                });
                toast('Baixando ' + generated.length + ' arquivo(s)...', 'success');
            });
        });
    }

    /* ============ INIT ============ */
    document.addEventListener('DOMContentLoaded', function() {
        initLogin();
        initNavigation();
        initSiteSettings();
        initNewsManager();
        initBanners();
        initBreakingNews();
        initQuotes();
        initPages();
        initImporter();
        initGeneratePages();
        initExportImport();
        updateDashboard();
    });
})();
