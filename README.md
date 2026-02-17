# NotíciasHoje

Portal de notícias completo no estilo G1, com painel administrativo, importação de RSS e geração de páginas estáticas.

## Funcionalidades

- 🏠 Portal de notícias responsivo com dark mode
- 📰 Seções por categoria (Política, Economia, Tecnologia, etc.)
- 🔧 Painel administrativo completo (login: admin / admin123)
- 📡 Importador de RSS com proxy CORS
- 📄 Geração de páginas estáticas por slug
- 🍪 Banner LGPD / Cookie consent
- 📊 Cotações, breaking news ticker
- 📱 Layout mobile-first

## Estrutura

```
├── index.html          # Página principal
├── noticia.html        # Template de artigo dinâmico
├── sobre.html          # Sobre nós
├── expediente.html     # Expediente
├── privacidade.html    # Política de privacidade
├── termos.html         # Termos de uso
├── etica.html          # Código de ética
├── anuncie.html        # Anuncie
├── css/
│   └── style.css       # Estilos do portal
├── js/
│   └── main.js         # JavaScript principal
└── admin/
    ├── index.html      # Painel administrativo
    ├── css/admin.css    # Estilos do admin
    └── js/admin.js     # Lógica do admin
```

## Como usar

1. Abra `index.html` em um servidor local (ex: `npx http-server -p 8080`)
2. Acesse o painel admin em `admin/index.html`
3. Login: **admin** / **admin123**
4. Importe notícias via RSS ou adicione manualmente
5. Gere páginas estáticas na seção "Gerar Páginas"
