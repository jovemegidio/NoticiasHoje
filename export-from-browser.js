/* ============================================================
   export-from-browser.js
   Cole este script no Console do navegador (F12) na página do admin
   para exportar TODAS as notícias do localStorage para o clipboard.
   Depois salve o conteúdo em data/news.json
   ============================================================ */

(function() {
    var news = JSON.parse(localStorage.getItem('nh-news') || '[]');
    var published = news.filter(function(n) { return n.status === 'published' || n.status === 'featured'; });

    // Ensure all have slugs
    function slugify(text) {
        return (text || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 80);
    }

    published.forEach(function(n) {
        if (!n.slug) n.slug = slugify(n.title);
    });

    var json = JSON.stringify(published, null, 2);

    // Try clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(json).then(function() {
            console.log('✅ ' + published.length + ' notícias copiadas para a área de transferência!');
            console.log('Cole o conteúdo no arquivo data/news.json do projeto.');
        });
    }

    // Also create download
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'news.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('📰 Total de notícias: ' + news.length);
    console.log('📰 Publicadas/Destaque: ' + published.length);
    console.log('💾 Arquivo news.json baixado! Salve em data/news.json e rode: node generate.js');
})();
