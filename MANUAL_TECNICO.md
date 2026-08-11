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
├── docs/                 # Esta documentação
├── verificacao.txt       # Relatório de verificação (resumo)
└── verificacao_detalhada.txt  # Relatório detalhado completo
```

## Fluxo de Dados

1. O usuário abre uma ferramenta → campos do formulário.
2. `data.js` → `tool.prompt(values)` monta o prompt final.
3. `app.js` registra no histórico e exibe o resultado.
4. Opcionalmente `ai.js:run(prompt)` envia ao provedor configurado.
5. `store.js` persiste tudo localmente (favoritos, histórico, prompts salvos, config).

### Notas de implementação (v12 — atualizado em 11/08/2026)

- **Histórico com resposta**: `addHistory` gera `id` único via `uid()` (timestamp base36 +
  contador + aleatório) e `updateLastHistory(id, patch)` atualiza **apenas o registro com
  aquele id** — evita race condition quando duas ferramentas são usadas em sequência rápida
  (a resposta da 1ª não sobrescreve o histórico da 2ª).
- **IDs de prompts**: criação/duplicação usam `S.uid('p')` (mesmo gerador do histórico) —
  sem colisão no mesmo milissegundo.
- **Menu mobile**: em `<=560px` a sidebar vira overlay controlado por `toggleSidebar()` /
  `closeSidebar()` (botão `#ciaMenuToggle`, keyframe `ciaSlideR`). Fecha ao navegar ou
  tocar fora.
- **Validação em tempo real**: `openTool` registra listener `input` nos campos obrigatórios
  para limpar hint/borda vermelha ao corrigir.
- **Confirmação**: `deletePrompt` e `clearHistory` usam `confirm()`.
- **Cópia**: `copyOut` diferencia prompt vs resposta (toast "Prompt copiado!" / "Resposta
  copiada!").
- **`toggleFavPrompt`**: re-renderiza a view correta conforme `currentView` (`favoritas` ou
  `prompts`).
- **Orçamento**: `orc_gerar` usa `parseBR()` interno — aceita `R$ 1.234,56` e `1234.56`.
- **Provedores**: `openaiCompatRun`/`geminiRun` têm timeout de 60s via `AbortController`
  (mensagem "Timeout" em vez de ficar carregando).
- **Código morto removido**: `toolsByCat` (app.js), `deepCopy` (store.js), `needKey` (ai.js).

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
| `cia_history` | Últimos 100 prompts gerados (+ resposta da IA via `resp`) |
| `cia_prompts` | Biblioteca de prompts salvos |
| `cia_favPrompts` | IDs de prompts favoritos |
| `cia_config` | `{provider, apiKey, model, customUrl}` |
| `cia_theme` | `dark` \| `light` |

## Namespace Global

- `CentralAI.Store` — persistência (inclui `uid(prefix)` para gerar ids únicos).
- `CentralAI.AI` — execução de prompts e cópia (`run`, `copy`, `statusText`, `PROV`).
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