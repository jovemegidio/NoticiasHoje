#!/usr/bin/env node
/* ==========================================================================
   import-diario.js — Importador completo do site O Diário de Mogi
   Busca TODAS as categorias via RSS com paginação e salva em data/news.json
   Uso: node import-diario.js
   ========================================================================== */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'news.json');

/* ====================== CONFIGURAÇÃO ====================== */

// Todas as 32 categorias descobertas via category-sitemap.xml
const CATEGORY_FEEDS = [
  { slug: 'alto-tiete', feedUrl: '/alto-tiete/feed/', portalCat: 'politica' },
  { slug: 'esportes', feedUrl: '/esportes/feed/', portalCat: 'esportes' },
  { slug: 'canal/viver-bem', feedUrl: '/canal/viver-bem/feed/', portalCat: 'saude' },
  { slug: 'brasil-e-mundo', feedUrl: '/brasil-e-mundo/feed/', portalCat: 'mundo' },
  { slug: 'cultura', feedUrl: '/cultura/feed/', portalCat: 'cultura' },
  { slug: 'mogi', feedUrl: '/mogi/feed/', portalCat: 'politica' },
  { slug: 'suzano', feedUrl: '/suzano/feed/', portalCat: 'politica' },
  { slug: 'canal/educacao', feedUrl: '/canal/educacao/feed/', portalCat: 'educacao' },
  { slug: 'canal/saude', feedUrl: '/canal/saude/feed/', portalCat: 'saude' },
  { slug: 'canal/opiniao', feedUrl: '/canal/opiniao/feed/', portalCat: 'opiniao' },
  { slug: 'canal/diario-pet', feedUrl: '/canal/diario-pet/feed/', portalCat: 'tecnologia' },
  { slug: 'canal/diario-empresarial', feedUrl: '/canal/diario-empresarial/feed/', portalCat: 'economia' },
  { slug: 'canal/diario-imoveis', feedUrl: '/canal/diario-imoveis/feed/', portalCat: 'economia' },
  { slug: 'canal/diario-de-viagem', feedUrl: '/canal/diario-de-viagem/feed/', portalCat: 'cultura' },
  { slug: 'canal/acao-em-rede', feedUrl: '/canal/acao-em-rede/feed/', portalCat: 'politica' },
  { slug: 'canal/akimatsuri', feedUrl: '/canal/akimatsuri/feed/', portalCat: 'cultura' },
  { slug: 'conteudo-de-marca', feedUrl: '/conteudo-de-marca/feed/', portalCat: 'economia' },
  { slug: 'canal/copa-alabarce', feedUrl: '/canal/copa-alabarce/feed/', portalCat: 'esportes' },
  { slug: 'canal/dd', feedUrl: '/canal/dd/feed/', portalCat: 'tecnologia' },
  { slug: 'canal/e-o-bicho', feedUrl: '/canal/e-o-bicho/feed/', portalCat: 'tecnologia' },
  { slug: 'canal/eleicoes', feedUrl: '/canal/eleicoes/feed/', portalCat: 'politica' },
  { slug: 'canal/eu-escolhi-mogi', feedUrl: '/canal/eu-escolhi-mogi/feed/', portalCat: 'cultura' },
  { slug: 'canal/festa-do-divino', feedUrl: '/canal/festa-do-divino/feed/', portalCat: 'cultura' },
  { slug: 'canal/guia-diario', feedUrl: '/canal/guia-diario/feed/', portalCat: 'cultura' },
  { slug: 'historico', feedUrl: '/historico/feed/', portalCat: 'politica' },
  { slug: 'canal/inspire-se', feedUrl: '/canal/inspire-se/feed/', portalCat: 'cultura' },
  { slug: 'canal/jogos-interescolares', feedUrl: '/canal/jogos-interescolares/feed/', portalCat: 'esportes' },
  { slug: 'canal/plugado', feedUrl: '/canal/plugado/feed/', portalCat: 'tecnologia' },
  { slug: 'publicidade', feedUrl: '/publicidade/feed/', portalCat: 'economia' },
  { slug: 'canal/retrospectiva', feedUrl: '/canal/retrospectiva/feed/', portalCat: 'politica' },
  { slug: 'canal/tres-pontos', feedUrl: '/canal/tres-pontos/feed/', portalCat: 'esportes' },
];

const BASE_URL = 'https://www.odiariodemogi.net.br';
const MAX_PAGES_PER_FEED = 15;  // Máximo de páginas por feed (10 artigos/página = ~150 artigos/cat)
const REQUEST_DELAY = 800;       // Delay entre requisições em ms (ser gentil com o servidor)
const REQUEST_TIMEOUT = 20000;   // 20 segundos de timeout

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

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 5);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCDATA(text) {
  const m = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : text.replace(/<[^>]+>/g, '').trim();
}

/* ====================== HTTP FETCH ====================== */

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { 
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NoticiasHoje/1.0; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    }, (res) => {
      // Seguir redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        // Se redirect vai para ad tracker, descartar
        if (loc.includes('clvrads') || loc.includes('rubiconproject') || loc.includes('doubleclick')) {
          resolve(null);
          return;
        }
        fetchUrl(loc).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/* ====================== XML PARSING ====================== */

function extractTagContent(xml, tag) {
  // Suporta namespace (ex: content:encoded, dc:creator)
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)</${escapedTag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractAllTags(xml, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)</${escapedTag}>`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

function extractImage(html) {
  // Strategy 1: Look for <img> with src containing odiariodemogi or common image patterns
  const imgPatterns = [
    /src="(https?:\/\/static\d*\.odiariodemogi\.net\.br\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*?)"/i,
    /src="(https?:\/\/www\.odiariodemogi\.net\.br\/wp-content\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*?)"/i,
    /src="(https?:\/\/[^"]+\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*?)"/i,
    /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"[^>]*(?:width="(?:[5-9]\d{2}|[1-9]\d{3,})"|class="[^"]*size-(?:large|full))/i,
    /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/i,
  ];
  
  for (const pattern of imgPatterns) {
    const m = html.match(pattern);
    if (m && m[1] && !m[1].includes('20px') && !m[1].includes('image-3.png') && 
        !m[1].includes('image-4.png') && !m[1].includes('Design-sem-nome')) {
      // Preferir imagens 1024 se disponíveis, senão pegar como está
      return m[1];
    }
  }
  
  return '';
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const title = extractCDATA(extractTagContent(itemXml, 'title'));
    const link = extractTagContent(itemXml, 'link').trim();
    const description = extractCDATA(extractTagContent(itemXml, 'description'));
    const contentEncoded = extractCDATA(extractTagContent(itemXml, 'content:encoded'));
    const creator = extractCDATA(extractTagContent(itemXml, 'dc:creator'));
    const pubDate = extractTagContent(itemXml, 'pubDate').trim();
    const categories = extractAllTags(itemXml, 'category').map(c => extractCDATA(c));
    
    // Usar content:encoded (conteúdo completo) ou description como fallback
    const content = contentEncoded || description || '';
    const image = extractImage(content);
    
    // Parse date
    let dateStr = '';
    if (pubDate) {
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 16); // "2026-02-17T12:20"
        }
      } catch (e) {}
    }
    
    // Subtitle: primeiro ~300 chars do texto sem HTML
    const plainText = stripHtml(description || content);
    const subtitle = plainText.substring(0, 300);
    
    if (title && link) {
      items.push({
        title,
        link,
        content,
        subtitle,
        image,
        author: creator || 'O Diário de Mogi',
        date: dateStr,
        categories,
      });
    }
  }
  
  return items;
}

/* ====================== MAIN IMPORT LOGIC ====================== */

async function fetchCategoryFeed(catConfig, page) {
  const url = `${BASE_URL}${catConfig.feedUrl}${page > 1 ? '?paged=' + page : ''}`;
  console.log(`  📥 Buscando: ${url}`);
  
  const xml = await fetchUrl(url);
  if (!xml) return [];
  
  // Verificar se é realmente XML RSS
  if (!xml.includes('<rss') && !xml.includes('<item>')) {
    return [];
  }
  
  return parseRSSItems(xml);
}

async function importAllFeeds() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   IMPORTADOR - O Diário de Mogi → NotíciasHoje            ║');
  console.log('║   Importando TODAS as categorias com paginação             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Carregar artigos existentes
  let existingNews = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      existingNews = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log(`📂 Artigos existentes em news.json: ${existingNews.length}`);
    } catch (e) {
      console.log('⚠️  Erro ao ler news.json, criando novo arquivo');
    }
  }
  
  // Criar set de URLs existentes para deduplicação
  const existingUrls = new Set(existingNews.map(n => n.sourceUrl).filter(Boolean));
  console.log(`🔗 URLs únicas existentes: ${existingUrls.size}\n`);
  
  const allNewArticles = [];
  const stats = { feeds: 0, pages: 0, articles: 0, duplicates: 0, errors: 0 };
  
  for (const catConfig of CATEGORY_FEEDS) {
    console.log(`\n📁 Categoria: ${catConfig.slug} → ${catConfig.portalCat}`);
    console.log('─'.repeat(50));
    
    let emptyPages = 0;
    let catArticles = 0;
    
    for (let page = 1; page <= MAX_PAGES_PER_FEED; page++) {
      try {
        const items = await fetchCategoryFeed(catConfig, page);
        stats.pages++;
        
        if (items.length === 0) {
          emptyPages++;
          if (emptyPages >= 2) {
            console.log(`  ⏭️  Sem mais artigos na página ${page}, pulando...`);
            break;
          }
          continue;
        }
        
        emptyPages = 0; // Reset se encontrou artigos
        
        for (const item of items) {
          // Deduplicar por URL
          if (existingUrls.has(item.link)) {
            stats.duplicates++;
            continue;
          }
          
          // Marcar como processado
          existingUrls.add(item.link);
          
          const article = {
            id: generateId(),
            slug: slugify(item.title),
            title: item.title,
            category: catConfig.portalCat,
            subtitle: item.subtitle,
            content: item.content + `\n\n<p><em>Fonte original: <a href="${item.link}" target="_blank" rel="noopener">O Diário de Mogi</a></em></p>`,
            image: item.image,
            author: item.author.replace(/\s+Conteúdo$/i, '').trim() || 'O Diário de Mogi',
            tags: ['O Diário de Mogi', catConfig.portalCat, ...item.categories.slice(0, 3)],
            date: item.date || new Date().toISOString().slice(0, 16),
            status: 'published',
            source: 'O Diário de Mogi',
            sourceUrl: item.link,
            updatedAt: new Date().toISOString(),
          };
          
          // Deduplique tags
          article.tags = [...new Set(article.tags)];
          
          allNewArticles.push(article);
          catArticles++;
          stats.articles++;
        }
        
        console.log(`  ✅ Página ${page}: ${items.length} encontrados, ${catArticles} novos até agora`);
        
      } catch (err) {
        console.log(`  ❌ Erro na página ${page}: ${err.message}`);
        stats.errors++;
        break;
      }
      
      // Delay entre requisições
      await delay(REQUEST_DELAY);
    }
    
    stats.feeds++;
    console.log(`  📊 Total categoria: ${catArticles} novos artigos`);
  }
  
  // Relatório final
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('═'.repeat(60));
  console.log(`  Categorias processadas: ${stats.feeds}`);
  console.log(`  Páginas buscadas:       ${stats.pages}`);
  console.log(`  Artigos novos:          ${stats.articles}`);
  console.log(`  Duplicados ignorados:   ${stats.duplicates}`);
  console.log(`  Erros:                  ${stats.errors}`);
  console.log(`  Artigos existentes:     ${existingNews.length}`);
  console.log(`  Total final:            ${existingNews.length + allNewArticles.length}`);
  console.log('═'.repeat(60));
  
  if (allNewArticles.length === 0) {
    console.log('\n⚠️  Nenhum artigo novo encontrado. news.json não alterado.');
    return;
  }
  
  // Merge: novos + existentes (novos primeiro = mais recentes no topo)
  const merged = [...allNewArticles, ...existingNews];
  
  // Garantir diretório data existe
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Salvar
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`\n✅ Salvo ${merged.length} artigos em data/news.json`);
  console.log(`   (${allNewArticles.length} novos + ${existingNews.length} existentes)`);
  console.log('\n🔄 Agora execute: node generate.js');
}

/* ====================== RUN ====================== */
importAllFeeds().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
