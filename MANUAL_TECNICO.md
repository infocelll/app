# Central de IA — Manual Técnico

Módulo independente de inteligência do **InfoCell Dashboard** (v12).

## Visão Geral

A Central de IA é um hub de ferramentas e prompts de IA. Ela **não possui IA própria**: organiza,
gera e executa prompts por meio de provedores externos (Groq, Google Gemini, OpenAI-compatível)
ou os prepara para copiar/colar em qualquer assistente (Modo Offline).

## Tecnologias

- **HTML5 / CSS3 / JavaScript ES6+** puros, sem dependências externas.
- Persistência local via `localStorage` (funciona offline — compatível com a PWA do dashboard).
- Integração com provedores de IA via `fetch` (Chat Completions e Google Generative Language).

## Arquitetura

```
modules/central-ia/
├── index.html            # SPA: shell, sidebar, busca global, views e modal
├── css/central-ia.css    # CSS próprio do módulo (tema claro/escuro, responsivo)
├── js/data.js            # Catálogo de ferramentas (prompts por campo)
├── js/store.js           # Camada de persistência (favoritos, histórico, prompts, config)
├── js/ai.js              # Provedores de IA (Groq, OpenAI, Gemini, Offline)
├── js/app.js             # Navegação, renderização, busca, modal, CRUD de prompts
├── assets/icon.svg       # Ícone do módulo
├── dashboard/            # (área) dados do painel
├── assistente/           # (área)
├── prompts/              # (área) biblioteca de prompts
├── documentos/           # (área)
├── programacao/          # (área)
├── marketing/            # (área)
├── diagnostico/          # (área)
├── configuracoes/        # (área)
├── tests/                # Relatório de testes
└── docs/                 # Esta documentação
```

## Fluxo de Dados

1. O usuário abre uma ferramenta → campos do formulário.
2. `data.js` → `tool.prompt(values)` monta o prompt final.
3. `app.js` registra no histórico e exibe o resultado.
4. Opcionalmente `ai.js:run(prompt)` envia ao provedor configurado.
5. `store.js` persiste tudo localmente (favoritos, histórico, prompts salvos, config).

### Provedores suportados (ai.js)

| Provedor | Endpoint | Modelo padrão |
|----------|----------|---------------|
| Groq     | `https://api.groq.com/openai/v1/chat/completions` | `llama-3.3-70b-versatile` |
| OpenAI   | `https://api.openai.com/v1/chat/completions` | `gpt-4o-mini` |
| Gemini   | `https://generativelanguage.googleapis.com/v1beta/models` | `gemini-2.0-flash` |
| Offline  | — | geração de prompt + cópia |

A chave de API **nunca é enviada ao servidor do ERP**: fica apenas no `localStorage` do navegador.

## Chaves de `localStorage`

| Chave | Conteúdo |
|-------|----------|
| `cia_favorites` | IDs de ferramentas favoritas |
| `cia_history` | Últimos 100 prompts gerados |
| `cia_prompts` | Biblioteca de prompts salvos |
| `cia_favPrompts` | IDs de prompts favoritos |
| `cia_config` | `{provider, apiKey, model}` |
| `cia_theme` | `dark` \| `light` |

## Namespace Global

- `CentralAI.Store` — persistência.
- `CentralAI.AI` — execução de prompts e cópia.
- `CentralAI.openTool`, `CentralAI.runTool`, `CentralAI.saveConfig`, etc. — ações da UI.

## Integração com o Dashboard

- Item de menu lateral **Central de IA** → `openCentralIAMod()`.
- Abre o modal fullscreen `centralIAModal` com o iframe `modules/central-ia/index.html`.
- Funções: `openCentralIAMod()` / `closeCentralIAMod()` (adicionadas ao sidecar do dashboard).
- PWA: arquivos do módulo adicionados ao `PRECACHE_URLS` de `service-worker.js`,
  `pwa/service-worker.js` e espelhos em `dist/`.

## Como Rodar

Basta servir a pasta `v12/` (ou abrir `modules/central-ia/index.html` diretamente via `file://`).
Nenhuma build é necessária.