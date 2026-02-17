#!/usr/bin/env node
/* ============================================================
   generate.js — Gerador de páginas estáticas de artigos
   Lê data/news.json e gera arquivos HTML na raiz do projeto
   Uso: node generate.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'news.json');
const ARTICLES_DIR = path.join(ROOT, 'artigos');

/* ---- Helpers ---- */
function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

/* ---- Category maps ---- */
const catLabels = {
    politica: 'Política', economia: 'Economia', tecnologia: 'Tecnologia',
    saude: 'Saúde', esportes: 'Esportes', cultura: 'Cultura',
    mundo: 'Mundo', ciencia: 'Ciência', educacao: 'Educação', opiniao: 'Opinião'
};

const catTagClasses = {
    politica: 'tag--politics', economia: 'tag--economy', tecnologia: 'tag--tech',
    saude: 'tag--health', esportes: 'tag--sports', cultura: 'tag--culture',
    mundo: 'tag--world', ciencia: 'tag--science', educacao: 'tag--education', opiniao: 'tag--opinion'
};

/* ---- Generate HTML for one article ---- */
function generateArticleHTML(article, allNews) {
    const cat = article.category || 'politica';
    const catLabel = catLabels[cat] || cat;
    const catClass = catTagClasses[cat] || 'tag--politics';
    const d = article.date ? new Date(article.date) : new Date();
    const dateFormatted = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateISO = d.toISOString();

    // Tags
    const tagsHtml = (article.tags || []).map(t =>
        `                        <a href="index.html#${cat}" class="article-tag">${escHtml(t)}</a>`
    ).join('\n');

    // Related articles
    const related = allNews
        .filter(n => n.id !== article.id && (n.status === 'published' || n.status === 'featured'))
        .slice(0, 3);

    const relatedHtml = related.map(n => {
        const rSlug = n.slug || slugify(n.title);
        const rCatClass = catTagClasses[n.category] || 'tag--politics';
        const rCatLabel = catLabels[n.category] || n.category || 'Notícia';
        return `                            <article class="card">
                                <a href="artigos/${rSlug}.html" class="card__link">
                                    <div class="card__img">${n.image ? `<img src="${escHtml(n.image)}" alt="" loading="lazy">` : ''}<span class="tag ${rCatClass}">${rCatLabel}</span></div>
                                    <div class="card__body"><h3>${escHtml(n.title)}</h3></div>
                                </a>
                            </article>`;
    }).join('\n');

    // Trending sidebar
    const trending = allNews
        .filter(n => n.status === 'published' || n.status === 'featured')
        .slice(0, 5);

    const trendingHtml = trending.map((n, i) => {
        const tSlug = n.slug || slugify(n.title);
        return `                            <li class="trending__item"><span class="trending__rank">${i + 1}</span><a href="artigos/${tSlug}.html" class="trending__link">${escHtml(n.title)}</a></li>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escHtml(article.subtitle || article.title)}">
    <meta name="theme-color" content="#D32F2F">
    <meta name="author" content="${escHtml(article.author || 'Redação')}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escHtml(article.title)}">
    <meta property="og:description" content="${escHtml(article.subtitle || '')}">
${article.image ? `    <meta property="og:image" content="${escHtml(article.image)}">` : ''}
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="NotíciasHoje">
    <meta property="article:published_time" content="${dateISO}">
    <meta property="article:section" content="${catLabel}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escHtml(article.title)}">
    <meta name="twitter:description" content="${escHtml(article.subtitle || '')}">
${article.image ? `    <meta name="twitter:image" content="${escHtml(article.image)}">` : ''}
    <title>${escHtml(article.title)} — NotíciasHoje</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%23D32F2F'/><text x='50' y='68' font-family='Arial' font-size='48' font-weight='900' fill='white' text-anchor='middle'>NH</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Source+Serif+4:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/style.css">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": "${escHtml(article.title).replace(/"/g, '\\"')}",
${article.image ? `        "image": "${escHtml(article.image)}",` : ''}
        "datePublished": "${dateISO}",
        "author": { "@type": "Person", "name": "${escHtml(article.author || 'Redação')}" },
        "publisher": { "@type": "Organization", "name": "NotíciasHoje" },
        "description": "${escHtml(article.subtitle || '').replace(/"/g, '\\"')}"
    }
    </script>
</head>
<body>
    <a href="#main-content" class="skip-link">Pular para o conteúdo principal</a>

    <!-- TOPBAR -->
    <div class="topbar">
        <div class="container topbar__inner">
            <div class="topbar__left">
                <span class="topbar__date" id="currentDate"></span>
                <span class="topbar__sep">|</span>
                <span class="topbar__greeting" id="greeting"></span>
            </div>
            <div class="topbar__right">
                <button class="theme-toggle" id="themeToggle" aria-label="Alternar tema escuro"><i class="fas fa-moon"></i></button>
                <a href="../index.html"><i class="far fa-bell"></i> Alertas</a>
                <a href="../index.html"><i class="far fa-envelope"></i> Newsletter</a>
                <a href="#"><i class="far fa-user"></i> Entrar</a>
            </div>
        </div>
    </div>

    <!-- HEADER -->
    <header class="header" id="header">
        <div class="container header__inner">
            <a href="../index.html" class="header__logo" aria-label="NotíciasHoje - Página inicial">
                <div class="header__logo-mark"><span>NH</span></div>
                <div class="header__logo-text"><strong>Notícias<span>Hoje</span></strong><small>Informação com credibilidade</small></div>
            </a>
            <div class="header__search" id="searchBar">
                <form class="header__search-form" id="searchForm" role="search">
                    <input type="text" placeholder="O que você procura?" id="searchInput" autocomplete="off" aria-label="Campo de busca">
                    <button type="submit" aria-label="Buscar"><i class="fas fa-search"></i></button>
                </form>
            </div>
            <div class="header__actions">
                <button class="header__search-toggle" id="searchToggle" aria-label="Abrir busca"><i class="fas fa-search"></i></button>
                <button class="header__menu-toggle" id="menuToggle" aria-label="Abrir menu"><span></span><span></span><span></span></button>
            </div>
        </div>
    </header>

    <!-- NAV -->
    <nav class="nav" id="mainNav" aria-label="Navegação principal">
        <div class="container">
            <ul class="nav__list" id="navList" role="menubar">
                <li role="none"><a href="../index.html" class="nav__link" role="menuitem"><i class="fas fa-home"></i> Início</a></li>
                <li role="none"><a href="../index.html#politica" class="nav__link${cat === 'politica' ? ' active' : ''}" role="menuitem">Política</a></li>
                <li role="none"><a href="../index.html#economia" class="nav__link${cat === 'economia' ? ' active' : ''}" role="menuitem">Economia</a></li>
                <li role="none"><a href="../index.html#tecnologia" class="nav__link${cat === 'tecnologia' ? ' active' : ''}" role="menuitem">Tecnologia</a></li>
                <li role="none"><a href="../index.html#saude" class="nav__link${cat === 'saude' ? ' active' : ''}" role="menuitem">Saúde</a></li>
                <li role="none"><a href="../index.html#esportes" class="nav__link${cat === 'esportes' ? ' active' : ''}" role="menuitem">Esportes</a></li>
                <li role="none"><a href="../index.html#cultura" class="nav__link${cat === 'cultura' ? ' active' : ''}" role="menuitem">Cultura</a></li>
                <li role="none"><a href="../index.html#mundo" class="nav__link${cat === 'mundo' ? ' active' : ''}" role="menuitem">Mundo</a></li>
                <li role="none"><a href="../index.html#ciencia" class="nav__link${cat === 'ciencia' ? ' active' : ''}" role="menuitem">Ciência</a></li>
                <li role="none"><a href="../index.html#opiniao" class="nav__link${cat === 'opiniao' ? ' active' : ''}" role="menuitem">Opinião</a></li>
            </ul>
        </div>
    </nav>

    <!-- MAIN -->
    <main class="main" id="main-content">
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="../index.html">Início</a><span class="breadcrumb__sep">›</span>
                <a href="../index.html#${cat}">${catLabel}</a><span class="breadcrumb__sep">›</span>
                <span>${escHtml(article.title.substring(0, 60))}...</span>
            </nav>

            <div class="layout">
                <article class="layout__main">
                    <!-- ARTICLE HEADER -->
                    <header class="article-header">
                        <span class="tag ${catClass}">${catLabel}</span>
                        <h1>${escHtml(article.title)}</h1>
                        <p class="article-subtitle">${escHtml(article.subtitle || '')}</p>
                        <div class="article-meta">
                            <div class="article-meta__author">
                                <img src="https://i.pravatar.cc/80?u=${encodeURIComponent(article.author || 'redacao')}" alt="${escHtml(article.author || 'Redação')}">
                                <div><strong>${escHtml(article.author || 'Redação')}</strong><span>${escHtml(article.source || '')}</span></div>
                            </div>
                            <time datetime="${dateISO}"><i class="far fa-clock"></i> ${dateFormatted}</time>
                            <div class="article-share">
                                <span>Compartilhar:</span>
                                <button class="share-btn share-btn--whatsapp" data-share="whatsapp" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></button>
                                <button class="share-btn share-btn--facebook" data-share="facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></button>
                                <button class="share-btn share-btn--twitter" data-share="twitter" aria-label="Twitter"><i class="fab fa-x-twitter"></i></button>
                                <button class="share-btn share-btn--telegram" data-share="telegram" aria-label="Telegram"><i class="fab fa-telegram"></i></button>
                                <button class="share-btn share-btn--copy" data-share="copy" aria-label="Copiar link"><i class="fas fa-link"></i></button>
                            </div>
                        </div>
                    </header>

${article.image ? `                    <!-- COVER IMAGE -->
                    <figure class="article-cover">
                        <img src="${escHtml(article.image)}" alt="${escHtml(article.title)}">
                        <figcaption>${article.source ? 'Foto: ' + escHtml(article.source) : 'Imagem ilustrativa'}</figcaption>
                    </figure>
` : ''}
                    <!-- ARTICLE CONTENT -->
                    <div class="article-content">
                        ${article.content || '<p>' + escHtml(article.subtitle || '') + '</p>'}
                    </div>

                    <!-- TAGS -->
                    <div class="article-tags">
${tagsHtml}
                    </div>

                    <!-- SHARE BOTTOM -->
                    <div class="article-meta" style="border-top: 1px solid var(--border); border-bottom: none; margin-top: var(--sp-6);">
                        <div class="article-share" style="margin-left: 0;">
                            <span>Compartilhar esta matéria:</span>
                            <button class="share-btn share-btn--whatsapp" data-share="whatsapp"><i class="fab fa-whatsapp"></i></button>
                            <button class="share-btn share-btn--facebook" data-share="facebook"><i class="fab fa-facebook-f"></i></button>
                            <button class="share-btn share-btn--twitter" data-share="twitter"><i class="fab fa-x-twitter"></i></button>
                            <button class="share-btn share-btn--telegram" data-share="telegram"><i class="fab fa-telegram"></i></button>
                            <button class="share-btn share-btn--copy" data-share="copy"><i class="fas fa-link"></i></button>
                        </div>
                    </div>

                    <!-- RELATED -->
                    <section class="related">
                        <h3>Leia também</h3>
                        <div class="card-grid card-grid--3">
${relatedHtml}
                        </div>
                    </section>
                </article>

                <!-- SIDEBAR -->
                <aside class="sidebar" aria-label="Conteúdo complementar">
                    <div class="widget widget--trending">
                        <h3 class="widget__title"><i class="fas fa-fire-flame-curved"></i> Mais Lidas</h3>
                        <ol class="trending">
${trendingHtml}
                        </ol>
                    </div>
                    <div class="ad-banner ad-banner--sidebar"><div class="ad-placeholder ad-placeholder--tall"><span>Publicidade</span></div></div>
                </aside>
            </div>
        </div>
    </main>

    <!-- FOOTER -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer__top">
                <div class="footer__brand">
                    <a href="../index.html" class="footer__logo"><div class="header__logo-mark"><span>NH</span></div><strong>Notícias<span>Hoje</span></strong></a>
                    <p>Jornalismo sério, imparcial e comprometido com a verdade.</p>
                    <div class="footer__social">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-x-twitter"></i></a>
                        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer__nav">
                    <div class="footer__col"><h4>Editorias</h4><ul><li><a href="../index.html#politica">Política</a></li><li><a href="../index.html#economia">Economia</a></li><li><a href="../index.html#tecnologia">Tecnologia</a></li><li><a href="../index.html#esportes">Esportes</a></li><li><a href="../index.html#cultura">Cultura</a></li><li><a href="../index.html#ciencia">Ciência</a></li></ul></div>
                    <div class="footer__col"><h4>Portal</h4><ul><li><a href="../sobre.html">Sobre o NH</a></li><li><a href="../expediente.html">Expediente</a></li><li><a href="../privacidade.html">Privacidade</a></li><li><a href="../termos.html">Termos de Uso</a></li><li><a href="../etica.html">Código de Ética</a></li><li><a href="../anuncie.html">Anuncie</a></li></ul></div>
                    <div class="footer__col"><h4>Contato</h4><ul><li><a href="mailto:contato@noticiashoje.com.br"><i class="far fa-envelope"></i> contato@noticiashoje.com.br</a></li><li><a href="tel:+551130000000"><i class="fas fa-phone"></i> (11) 3000-0000</a></li></ul></div>
                </div>
            </div>
            <div class="footer__bottom">
                <p>&copy; 2026 NotíciasHoje. Todos os direitos reservados.</p>
                <div class="footer__badges"><span><i class="fas fa-shield-halved"></i> Site Seguro</span><span><i class="fas fa-check-circle"></i> Jornalismo Verificado</span></div>
            </div>
        </div>
    </footer>

    <button class="btt" id="btt" aria-label="Voltar ao topo"><i class="fas fa-arrow-up"></i></button>

    <div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="Aviso de cookies">
        <div class="cookie-banner__inner">
            <div class="cookie-banner__text"><i class="fas fa-cookie-bite"></i><p>Utilizamos cookies. Ao continuar, você concorda com nossa <a href="../privacidade.html">Política de Privacidade</a>.</p></div>
            <div class="cookie-banner__actions"><button class="cookie-btn cookie-btn--accept" id="cookieAccept">Aceitar</button><button class="cookie-btn cookie-btn--reject" id="cookieReject">Rejeitar</button></div>
        </div>
    </div>

    <script src="../js/main.js"></script>
</body>
</html>`;
}

/* ============================================================
   MAIN — Read data/news.json and generate pages
   ============================================================ */
function main() {
    console.log('\n🗞️  NotíciasHoje — Gerador de Páginas Estáticas');
    console.log('═'.repeat(50));

    // Check data file exists
    if (!fs.existsSync(DATA_FILE)) {
        console.error('\n❌ Arquivo data/news.json não encontrado!');
        console.log('\nComo usar:');
        console.log('  1. Exporte suas notícias do painel admin (Exportar JSON)');
        console.log('  2. Salve o arquivo em data/news.json');
        console.log('  3. Execute: node generate.js\n');
        process.exit(1);
    }

    // Read news data
    let news;
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        news = JSON.parse(raw);
    } catch (e) {
        console.error('\n❌ Erro ao ler data/news.json:', e.message);
        process.exit(1);
    }

    if (!Array.isArray(news) || news.length === 0) {
        console.error('\n❌ Nenhuma notícia encontrada em data/news.json');
        process.exit(1);
    }

    // Filter published only
    const published = news.filter(n => n.status === 'published' || n.status === 'featured');
    if (published.length === 0) {
        console.error('\n❌ Nenhuma notícia publicada encontrada.');
        process.exit(1);
    }

    // Ensure slugs
    published.forEach(n => {
        if (!n.slug) n.slug = slugify(n.title);
    });

    // Create artigos directory
    if (!fs.existsSync(ARTICLES_DIR)) {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
    }

    console.log(`\n📰 ${published.length} notícia(s) publicada(s) encontrada(s)\n`);

    let count = 0;
    published.forEach(article => {
        const slug = article.slug || slugify(article.title);
        const filename = slug + '.html';
        const filepath = path.join(ARTICLES_DIR, filename);

        const html = generateArticleHTML(article, news);
        fs.writeFileSync(filepath, html, 'utf-8');

        count++;
        const cat = catLabels[article.category] || article.category || '?';
        console.log(`  ✅ ${count}. artigos/${filename}`);
        console.log(`     📂 ${cat} · ${article.title.substring(0, 60)}${article.title.length > 60 ? '...' : ''}`);
        console.log('');
    });

    console.log('═'.repeat(50));
    console.log(`\n🎉 ${count} página(s) gerada(s) na pasta artigos/`);
    console.log('\nPara visualizar, abra com um servidor local:');
    console.log('  npx http-server -p 8080 -c-1\n');
}

main();
