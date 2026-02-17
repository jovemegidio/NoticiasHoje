/**
 * fix-categories.js
 * Reclassifica artigos com categorias incorretas e ordena por data.
 * 
 * Regras:
 * 1. Artigos de "politica" que são claramente educação → educacao
 * 2. Artigos de "politica" que são claramente saúde → saude
 * 3. Artigos de "politica" que são claramente esportes → esportes
 * 4. Artigos de "politica" que são claramente economia → economia
 * 5. Artigos de "politica" que são claramente tecnologia → tecnologia
 * 6. Artigos de "saude" que são horóscopo/astrologia → cultura
 * 7. Artigos de "saude" que são pet/animais → cultura
 * 8. Artigos de "saude" que são culinária/lifestyle → cultura
 * 9. Artigos com keywords de ciência → ciencia
 * 10. Ordena tudo por data (mais recente primeiro)
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'news.json');
const news = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

console.log(`\n📊 Total de artigos: ${news.length}`);
console.log('Distribuição ANTES:');
printDistribution(news);

let changes = 0;
const log = [];

// ============================================================
// REGRAS DE RECLASSIFICAÇÃO
// ============================================================

// --- De "politica" para outras categorias ---
const rules_from_politica = [
  {
    target: 'educacao',
    regex: /\b(escola|escolar|aluno|aluna|professor|professora|ensino|educação|universidade|faculdade|vestibular|ENEM|Enem|matrícula|aula|creche|merenda|kit escolar|uniforme escolar|rede municipal de ensino|rede estadual|Pé-de-Meia)\b/i
  },
  {
    target: 'saude',
    regex: /\b(hospital|saúde|médic|doença|vagin|tratamento|covid|pandemia|vacina|UBS|UPA|SAMU|dengue|surto|epidemia|gripe|farmácia|cirurgia|leito|SUS|AME|pronto-socorro)\b/i
  },
  {
    target: 'esportes',
    regex: /\b(futebol|gol|campeonato|torneio|atleta|vôlei|basquete|natação|olimpíada|Superliga|Copa|jogo de estrelas|karatê|judô|maratona|corrida|copa Alabarce|Suzano Vôlei|Corinthians|São Paulo FC|Palmeiras)\b/i
  },
  {
    target: 'economia',
    regex: /\b(economia|inflação|PIB|mercado financeiro|dólar|bolsa de valores|emprego|vaga[s]? de emprego|desemprego|Feira de Empregos|licitação|concurso público|IPTU|imposto|tribut|orçamento municipal|receita|déficit|superávit|empreendedor|MEI|CNPJ)\b/i
  },
  {
    target: 'tecnologia',
    regex: /\b(tecnologia|inteligência artificial|app\b|software|internet|digital|startup|inovação|dados|cibersegurança|blockchain|5G|fibra óptica|smart city)\b/i
  },
  {
    target: 'cultura',
    regex: /\b(festival|carnaval|Festa do Divino|Akimatsuri|desfile|bloco|samba|música|teatro|cinema|museu|exposição|show|artista|cultural|arte|dança|fotografia|patrimônio histórico|biblioteca)\b/i
  },
  {
    target: 'mundo',
    regex: /\b(Trump|Biden|EUA|Estados Unidos|China|Rússia|Ucrânia|guerra|ONU|OTAN|Papa|Vaticano|Israel|Gaza|Hamas|internacional|exterior|diplomacia|acordo internacional)\b/i
  }
];

news.forEach(n => {
  if (n.category === 'politica') {
    for (const rule of rules_from_politica) {
      if (rule.regex.test(n.title) || rule.regex.test(n.subtitle || '')) {
        const old = n.category;
        n.category = rule.target;
        changes++;
        log.push(`[${old} → ${rule.target}] ${n.title.substring(0, 80)}`);
        break; // aplica só a primeira regra que casar
      }
    }
  }
});

// --- De "saude" para "cultura" (horóscopo/astrologia) ---
const astroRegex = /\b(horóscopo|tarot|signo|baralho cigano|astrolog|zodíac|previsão para os.*signos?|mercúrio em|missão de vida|lua hoje|fase lunar|mapa astral|ascendente)\b/i;
news.forEach(n => {
  if (n.category === 'saude' && astroRegex.test(n.title)) {
    n.category = 'cultura';
    changes++;
    log.push(`[saude → cultura/astro] ${n.title.substring(0, 80)}`);
  }
});

// --- De "saude" para "cultura" (pet/animais) ---
const petRegex = /\b(cachorro|gato|pet[s]?\b|animal de estimação|cão\b|felino|ração|raça.*cão|raça.*gato|Diário Pet|fantasia.*cachorro|cachorro.*fantasia)\b/i;
news.forEach(n => {
  if (n.category === 'saude' && (petRegex.test(n.title) || (n.tags && n.tags.includes('Diário Pet')))) {
    n.category = 'cultura';
    changes++;
    log.push(`[saude → cultura/pet] ${n.title.substring(0, 80)}`);
  }
});

// --- De "saude" para "cultura" (culinária/gastronomia/lifestyle) ---
const lifestyleRegex = /\b(receita|vinhos?|cerveja|culinária|gastronomia|cozinha|chef|ingrediente|decoração|revestimento|reforma|jardim|DIY|moda|tendência.*2026|coloração de cabelo|organiz|limpeza|dica.*casa)\b/i;
news.forEach(n => {
  if (n.category === 'saude' && lifestyleRegex.test(n.title)) {
    n.category = 'cultura';
    changes++;
    log.push(`[saude → cultura/lifestyle] ${n.title.substring(0, 80)}`);
  }
});

// --- Criar artigos em "ciencia" a partir de tecnologia/mundo ---
const sciRegex = /\b(NASA|espaço sideral|planeta|asteroide|foguete|genética|DNA|fóssil|astronomia|biologia|telescópio|satélite|universo|galáxia|lunar|Marte\b|Júpiter|cometa|teoria|pesquisadores?\b.*descobr|estudo.*cientí|cientistas?\b|laboratório|experimento)\b/i;
news.forEach(n => {
  if ((n.category === 'tecnologia' || n.category === 'mundo') && sciRegex.test(n.title)) {
    const old = n.category;
    n.category = 'ciencia';
    changes++;
    log.push(`[${old} → ciencia] ${n.title.substring(0, 80)}`);
  }
});

// ============================================================
// ORDENAR POR DATA (mais recente primeiro)
// ============================================================
news.sort((a, b) => b.date.localeCompare(a.date));

// ============================================================
// REASSIGNAR IDs sequenciais
// ============================================================
news.forEach((n, i) => {
  n.id = (i + 1).toString();
});

// ============================================================
// RELATÓRIO
// ============================================================
console.log(`\n✅ ${changes} artigos reclassificados:`);
log.forEach(l => console.log('  ' + l));

console.log(`\nDistribuição DEPOIS:`);
printDistribution(news);

// Salvar
fs.writeFileSync(FILE, JSON.stringify(news, null, 2), 'utf-8');
console.log(`\n💾 Salvo em ${FILE}`);

function printDistribution(data) {
  const cats = {};
  data.forEach(n => { cats[n.category] = (cats[n.category] || 0) + 1; });
  Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => {
      const bar = '█'.repeat(Math.round(v / 20));
      console.log(`  ${k.padEnd(12)} ${v.toString().padStart(4)} ${bar}`);
    });
}
