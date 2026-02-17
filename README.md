<h1 align="center">📰 NoticiasHoje — Portal de Noticias</h1>

<p align="center">
  Portal de noticias completo inspirado no G1, com painel administrativo, importacao de RSS automatizada, geracao de paginas estaticas e mais de 3.300 artigos publicados.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Artigos-3.300+-blue?style=for-the-badge" alt="Artigos">
  <img src="https://img.shields.io/badge/Status-Concluido-brightgreen?style=for-the-badge" alt="Status">
</p>

---

## Sobre o Projeto

O **NoticiasHoje** e um portal de noticias full-stack desenvolvido do zero, inspirado no layout e funcionalidades do G1 (Globo). O projeto demonstra habilidades em **desenvolvimento web completo**, **automacao de conteudo**, **SEO** e **arquitetura de sistemas de gerenciamento de conteudo (CMS)**.

Com mais de **3.300 artigos** gerados e organizados por categoria, o projeto simula um portal de noticias real em producao.

## Funcionalidades Principais

### Portal (Front-end)
- **Layout responsivo** inspirado no G1 com mobile-first design
- **Dark mode** integrado
- **Secoes por categoria**: Politica, Economia, Tecnologia, Esportes, Entretenimento, Saude, Ciencia, Educacao
- **Breaking news ticker** com noticias em destaque
- **Cotacoes em tempo real** (dolar, euro, bitcoin)
- **Sistema de busca** de artigos
- **Banner LGPD / Cookie consent**
- **Paginas institucionais**: Sobre, Expediente, Privacidade, Termos, Etica, Anuncie

### Painel Administrativo (CMS)
- **Dashboard** com metricas e estatisticas
- **CRUD completo** de artigos (criar, editar, excluir)
- **Editor de conteudo** com formatacao
- **Gerenciamento de categorias**
- **Upload de imagens**
- **Importador de RSS** com proxy CORS (fontes: G1, Globo e outros)
- **Geracao de paginas estaticas** por slug
- **Sistema de autenticacao** (login/senha)

### Automacao e Ferramentas
- **`import-g1.js`** — Importacao automatica de noticias do G1 via RSS
- **`import-diario.js`** — Importacao diaria programada
- **`generate.js`** — Gerador de paginas estaticas HTML
- **`fix-categories.js`** — Correcao e normalizacao de categorias
- **`export-from-browser.js`** — Exportacao de dados pelo navegador

## Tecnologias Utilizadas

| Tecnologia | Aplicacao |
|---|---|
| **HTML5** | Estrutura semantica do portal e artigos |
| **CSS3** | Layout responsivo, dark mode, grid/flexbox |
| **JavaScript (ES6+)** | Logica do portal, CMS, importacao RSS |
| **Node.js** | Scripts de automacao e geracao de conteudo |
| **LocalStorage/JSON** | Persistencia de dados e artigos |
| **RSS/XML** | Importacao automatizada de fontes de noticias |
| **CORS Proxy** | Requisicoes cross-origin para feeds RSS |

## Estrutura do Projeto

```
NoticiasHoje/
|-- index.html              # Pagina principal do portal
|-- noticia.html            # Template de artigo dinamico
|-- sobre.html              # Sobre nos
|-- expediente.html         # Expediente editorial
|-- privacidade.html        # Politica de privacidade
|-- termos.html             # Termos de uso
|-- etica.html              # Codigo de etica
|-- anuncie.html            # Pagina comercial
|-- css/
|   |-- style.css           # Estilos do portal
|-- js/
|   |-- main.js             # JavaScript principal
|-- admin/
|   |-- index.html          # Painel administrativo
|   |-- css/                # Estilos do admin
|   |-- js/                 # Logica do CMS
|-- artigos/                # 3.300+ artigos gerados (HTML estatico)
|-- data/                   # Dados e configuracoes
|-- import-g1.js            # Importador RSS do G1
|-- import-diario.js        # Importacao diaria automatizada
|-- generate.js             # Gerador de paginas estaticas
|-- fix-categories.js       # Normalizador de categorias
|-- export-from-browser.js  # Exportador de dados
```

## Como Executar

```bash
# Clone o repositorio
git clone https://github.com/jovemegidio/NoticiasHoje.git

# Acesse a pasta
cd NoticiasHoje

# Inicie um servidor local
npx http-server -p 8080

# Acesse o portal
# http://localhost:8080

# Acesse o painel admin
# http://localhost:8080/admin
# Login: admin / admin123
```

### Importar Noticias via RSS

```bash
# Importacao do G1
node import-g1.js

# Importacao diaria
node import-diario.js

# Gerar paginas estaticas
node generate.js
```

## Numeros do Projeto

| Metrica | Valor |
|---|---|
| Artigos publicados | 3.300+ |
| Categorias | 8+ |
| Paginas institucionais | 6 |
| Scripts de automacao | 5 |
| Arquivos no projeto | 3.347+ |

## Destaques Tecnicos

- **CMS completo** construido do zero sem frameworks
- **Automacao de conteudo** com importacao RSS e geracao estatica
- **Arquitetura escalavel** — suporta milhares de artigos
- **SEO otimizado** com URLs amigaveis (slugs)
- **Performance** — paginas estaticas pre-geradas para carregamento rapido
- **Responsivo** — funciona em desktop, tablet e mobile

## Licenca

Este projeto foi desenvolvido para fins de portfolio e demonstracao de habilidades em desenvolvimento web full-stack.

## Autor

**Antonio Egidio Neto**

[![GitHub](https://img.shields.io/badge/GitHub-jovemegidio-181717?style=flat-square&logo=github)](https://github.com/jovemegidio)
[![Instagram](https://img.shields.io/badge/Instagram-egidiocode-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/egidiocode)
