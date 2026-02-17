#!/usr/bin/env node
/* ==========================================================================
   import-g1.js — Importador de notícias do G1 (Globo) para NotíciasHoje
   Busca RSS feeds de: Política, Tecnologia, Mundo, Brasil (geral) e São Paulo
   Uso: node import-g1.js
   ========================================================================== */

const https = require('https');
const http  = require('http');
const zlib  = require('zlib');
const fs    = require('fs');
const path  = require('path');

const ROOT      = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'news.json');

/* ====================== CONFIGURAÇÃO ====================== */

const G1_FEEDS = [
  // Feeds dedicados que funcionam com conteúdo atual
  { name: 'Política',   url: 'https://g1.globo.com/rss/g1/politica/',   portalCat: 'politica' },
  { name: 'Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/', portalCat: 'tecnologia' },
  { name: 'Mundo',      url: 'https://g1.globo.com/rss/g1/mundo/',      portalCat: 'mundo' },
  // Feed principal — vamos filtrar artigos de Brasil e São Paulo
  { name: 'Geral (Brasil + SP)', url: 'https://g1.globo.com/rss/g1/',   portalCat: '_geral' },
  // Feeds adicionais para captar mais notícias de SP
  { name: 'Economia',   url: 'https://g1.globo.com/rss/g1/economia/',   portalCat: 'economia' },
  { name: 'Educação',   url: 'https://g1.globo.com/rss/g1/educacao/',   portalCat: 'educacao' },
  { name: 'Saúde',      url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/', portalCat: 'saude' },
];

const REQUEST_TIMEOUT = 60000; // 60s — feeds G1 podem ser grandes (>500KB)

/* ====================== HELPERS ====================== */

function slugify(text) {
  return (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8211;/g, '–').replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function extractCDATA(text) {
  const m = (text || '').match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : (text || '').replace(/<[^>]+>/g, '').trim();
}

/* ====================== HTTP FETCH ====================== */

function fetchUrlOnce(url) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrlOnce(res.headers.location).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        console.log(`    ⚠️  HTTP ${res.statusCode} para ${url.substring(0, 60)}`);
        resolve(null);
        return;
      }

      // Descomprimir se necessário
      let stream = res;
      const encoding = (res.headers['content-encoding'] || '').toLowerCase();
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', () => resolve(null));
    });
    req.on('error', (e) => { console.log(`    ⚠️  Erro: ${e.message}`); resolve(null); });
    req.on('timeout', () => { console.log(`    ⚠️  Timeout`); req.destroy(); resolve(null); });
  });
}

async function fetchUrl(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const result = await fetchUrlOnce(url);
    if (result) return result;
    if (i < retries - 1) {
      console.log(`    🔄 Tentativa ${i + 2}/${retries}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

/* ====================== XML PARSING ====================== */

function extractTagContent(xml, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}[^>]*${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function parseG1RSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const rawTitle = extractTagContent(block, 'title');
    const title = stripHtml(extractCDATA(rawTitle)).replace(/\s+/g, ' ').trim();

    // Link pode estar como tag <link> ou <guid>
    let link = '';
    const linkMatch = block.match(/<link>(https?:\/\/[^<]+)<\/link>/i);
    if (linkMatch) link = linkMatch[1].trim();
    if (!link) {
      const guidMatch = block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i);
      if (guidMatch) link = guidMatch[1].trim();
    }

    // Subtitle (atom:subtitle)
    const rawSubtitle = extractTagContent(block, 'atom:subtitle');
    const subtitle = stripHtml(extractCDATA(rawSubtitle));

    // Description (contém imagem + texto)
    const rawDesc = extractTagContent(block, 'description');
    const descHtml = extractCDATA(rawDesc);
    const descText = stripHtml(descHtml);

    // Imagem via <media:content>
    let image = extractAttr(block, 'media:content', 'url');
    if (!image) {
      // Tentar extrair do description
      const imgMatch = descHtml.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
      if (imgMatch) image = imgMatch[1];
    }

    // Data
    const pubDate = extractTagContent(block, 'pubDate').trim();
    let dateStr = '';
    if (pubDate) {
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 16);
        }
      } catch (e) {}
    }

    // Usar subtitle como resumo, ou cortar description
    const finalSubtitle = subtitle || descText.substring(0, 300);

    // Conteúdo — usar description HTML ou texto
    const content = descHtml || descText;

    if (title && link) {
      items.push({ title, link, subtitle: finalSubtitle, content, image, date: dateStr });
    }
  }

  return items;
}

/* ====================== CLASSIFICAÇÃO G1 ====================== */

/**
 * Determina a categoria portal com base na URL e conteúdo do artigo G1
 */
function classifyG1Article(link, title) {
  const url = (link || '').toLowerCase();
  const t = (title || '').toLowerCase();

  // Descartar artigos que são apenas playlists de vídeo, telejornais ao vivo, etc.
  if (url.includes('/playlist/') || url.includes('/ao-vivo/') ||
      url.includes('/videos-') || t.startsWith('vídeos:') ||
      t.startsWith('assista ao') || t.startsWith('assista aos') ||
      t.match(/^eptv\d/i) || t.match(/^bom dia/i) && !t.includes('?')) {
    return null; // skip
  }

  // São Paulo
  if (url.includes('/sp/')) return 'politica';
  // Política
  if (url.includes('/politica/')) return 'politica';
  // Tecnologia / Inovação
  if (url.includes('/tecnologia/') || url.includes('/inovacao/')) return 'tecnologia';
  // Mundo
  if (url.includes('/mundo/')) return 'mundo';
  // Economia
  if (url.includes('/economia/') || url.includes('/trabalho-e-carreira/')) return 'economia';
  // Educação
  if (url.includes('/educacao/')) return 'educacao';
  // Saúde / Ciência
  if (url.includes('/ciencia-e-saude/') || url.includes('/bemestar/')) return 'saude';
  // Ciência
  if (url.includes('/ciencia/')) return 'ciencia';
  // Cultura / Entretenimento
  if (url.includes('/pop-arte/') || url.includes('/musica/') || url.includes('/carnaval/')) return 'cultura';
  // Esportes
  if (url.includes('/futebol/') || url.includes('/esporte/') || url.includes('/olimpiadas/')) return 'esportes';
  // Fato ou Fake → tecnologia (desinformação/IA)
  if (url.includes('/fato-ou-fake/')) return 'tecnologia';

  // Notícias regionais brasileiras → politica
  if (url.match(/\/[a-z]{2}\/[a-z-]+\//)) return 'politica';

  // Default
  return 'politica';
}

/* ====================== GERAÇÃO DE TAGS ====================== */

function generateTags(title, category) {
  const t = (title || '').toLowerCase();
  const tags = ['g1', 'notícias'];

  const tagRules = [
    { keywords: ['lula', 'pt ', 'planalto'], tag: 'lula' },
    { keywords: ['bolsonaro', 'pl '], tag: 'bolsonaro' },
    { keywords: ['stf', 'supremo'], tag: 'stf' },
    { keywords: ['congresso', 'câmara', 'senado'], tag: 'congresso' },
    { keywords: ['trump', 'eua', 'estados unidos'], tag: 'eua' },
    { keywords: ['rússia', 'ucrânia', 'putin'], tag: 'rússia' },
    { keywords: ['china', 'chinês', 'chinesa'], tag: 'china' },
    { keywords: ['irã', 'iran'], tag: 'irã' },
    { keywords: ['ia ', 'inteligência artificial', 'chatgpt', 'grok'], tag: 'inteligência artificial' },
    { keywords: ['google', 'meta', 'facebook'], tag: 'big tech' },
    { keywords: ['musk', 'tesla', 'spacex', 'starlink'], tag: 'elon musk' },
    { keywords: ['são paulo', ' sp'], tag: 'são paulo' },
    { keywords: ['carnaval', 'desfile', 'sapucaí', 'bloco'], tag: 'carnaval' },
    { keywords: ['saúde', 'vacinaç', 'sus '], tag: 'saúde' },
    { keywords: ['educaç', 'escola', 'enem', 'universidade'], tag: 'educação' },
    { keywords: ['economia', 'inflação', 'pib', 'dólar'], tag: 'economia' },
    { keywords: ['violência', 'crime', 'polícia', 'preso'], tag: 'segurança' },
    { keywords: ['olimpíad', 'medalha'], tag: 'olimpíadas' },
    { keywords: ['master', 'toffoli', 'moraes'], tag: 'judiciário' },
    { keywords: ['epstein'], tag: 'caso epstein' },
  ];

  for (const rule of tagRules) {
    if (rule.keywords.some(kw => t.includes(kw))) {
      tags.push(rule.tag);
    }
  }

  tags.push(category);
  // Remover duplicatas e limitar
  return [...new Set(tags)].slice(0, 6);
}

/* ====================== MAIN ====================== */

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   IMPORTADOR G1 (Globo) → NotíciasHoje                    ║');
  console.log('║   Categorias: Brasil, Tecnologia, Política, Mundo, SP      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Carregar artigos existentes
  let existingNews = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      existingNews = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log(`📂 Artigos existentes: ${existingNews.length}`);
    } catch (e) {
      console.log('⚠️  Erro ao ler news.json, criando novo');
    }
  }

  // Set de URLs e títulos para deduplicação
  const existingUrls = new Set(existingNews.map(n => n.sourceUrl).filter(Boolean));
  const existingTitles = new Set(existingNews.map(n => n.title.toLowerCase().trim()));
  console.log(`🔗 URLs existentes: ${existingUrls.size}\n`);

  const allNewArticles = [];
  const stats = { feeds: 0, fetched: 0, added: 0, skipped: 0, duplicates: 0, errors: 0 };

  // 2. Buscar cada feed
  for (const feed of G1_FEEDS) {
    console.log(`\n📡 Buscando: ${feed.name}`);
    console.log('─'.repeat(50));

    const xml = await fetchUrl(feed.url);
    if (!xml || !xml.includes('<item>')) {
      console.log(`  ❌ Falha ao buscar ou feed vazio`);
      stats.errors++;
      continue;
    }

    stats.feeds++;
    const items = parseG1RSSItems(xml);
    console.log(`  📰 ${items.length} itens encontrados`);

    let feedAdded = 0;
    let feedSkipped = 0;
    let feedDuplicates = 0;

    for (const item of items) {
      stats.fetched++;

      // Deduplicação por URL
      if (existingUrls.has(item.link)) { feedDuplicates++; stats.duplicates++; continue; }
      // Deduplicação por título
      if (existingTitles.has(item.title.toLowerCase().trim())) { feedDuplicates++; stats.duplicates++; continue; }

      // Classificar categoria
      let category;
      if (feed.portalCat === '_geral') {
        // Feed geral — classificar pela URL
        category = classifyG1Article(item.link, item.title);
        if (!category) { feedSkipped++; stats.skipped++; continue; }
      } else {
        category = feed.portalCat;
      }

      // Verificar se a data é recente o suficiente (últimos 2 anos)
      if (item.date) {
        const artDate = new Date(item.date);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        if (artDate < twoYearsAgo) { feedSkipped++; stats.skipped++; continue; }
      }

      const slug = slugify(item.title);
      const tags = generateTags(item.title, category);

      // Montar artigo no formato do portal
      const article = {
        id: existingNews.length + allNewArticles.length + 1,
        slug,
        title: item.title,
        category,
        subtitle: item.subtitle || '',
        content: item.content || `<p>${item.subtitle}</p>`,
        image: item.image || '',
        author: 'G1',
        tags,
        date: item.date || new Date().toISOString().slice(0, 16),
        status: 'published',
        source: 'G1 - Globo',
        sourceUrl: item.link
      };

      allNewArticles.push(article);
      existingUrls.add(item.link);
      existingTitles.add(item.title.toLowerCase().trim());
      feedAdded++;
      stats.added++;
    }

    console.log(`  ✅ +${feedAdded} novos | ⏭️ ${feedSkipped} ignorados | 🔁 ${feedDuplicates} duplicados`);
  }

  // 3. Mesclar e salvar
  if (allNewArticles.length === 0) {
    console.log('\n⚠️  Nenhum artigo novo para importar.');
    return;
  }

  const merged = [...existingNews, ...allNewArticles];

  // Ordenar por data (mais recentes primeiro)
  merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Reindexar IDs
  merged.forEach((art, i) => art.id = i + 1);

  // Salvar
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');

  // 4. Estatísticas finais
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO G1');
  console.log('═'.repeat(60));
  console.log(`  Feeds processados:  ${stats.feeds}`);
  console.log(`  Itens encontrados:  ${stats.fetched}`);
  console.log(`  Artigos adicionados: ${stats.added}`);
  console.log(`  Ignorados (vídeo/antigos): ${stats.skipped}`);
  console.log(`  Duplicados:         ${stats.duplicates}`);
  console.log(`  Erros de feed:      ${stats.errors}`);
  console.log(`  Total em news.json: ${merged.length}`);
  console.log('═'.repeat(60));

  // Distribuição por categoria
  const catCount = {};
  for (const a of merged) {
    catCount[a.category] = (catCount[a.category] || 0) + 1;
  }
  console.log('\n📈 Distribuição por categoria:');
  Object.entries(catCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  console.log(`\n🎉 Importação concluída! ${stats.added} notícias do G1 adicionadas.`);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
