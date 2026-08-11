# Central de IA — Changelog

## [1.2.0] — 11/08/2026
Correções e melhorias de robustez após auditoria detalhada.

### Corrigido
- Race condition no registro do histórico: `updateLastHistory(id, patch)` com
  id único (`uid()`) evita sobrescrita quando dois prompts são gerados rápido.
- CSS: variável `--cia` usada no lugar de `--cia-tr` no item de histórico.
- `copyOut()`: toast agora diferencia cópia de **resposta da IA** vs **prompt**.
- Nomenclatura de prompts automáticos: precede `prompts.length + 1`.
- Timeout de 60s nas requisições de IA (`AbortController`) em `openaiCompatRun`
  e `geminiRun`.
- `toggleFavPrompt()`: re-renderiza a view **Favoritas** após desfavoritar.

### Melhorado
- Menu mobile: botão hambúrguer (`#ciaMenuToggle`) + `toggleSidebar`/`closeSidebar`.
- `parseBR()` no fluxo do orçamento (parse mais robusto).
- Validação de inputs limpa hint/borda ao digitar.
- `aria-label="Copiar"` no botão de cópia do histórico.
- Código morto removido: `toolsByCat` (app.js), `deepCopy` (store.js),
  `needKey` (ai.js).
- Prompts salvos agora recebem id gerado por `S.uid('p')`.
- Exclusões (prompt, histórico) confirmadas com `confirm()`.

## [1.1.0] — 11/08/2026
URL personalizada (OpenAI-compatível) para provedores locais/serviços.

### Novo
- Provedor **URL Personalizada (OpenAI-compatível)**: use Ollama, LM Studio,
  OpenRouter ou qualquer API compatível com OpenAI informando o endpoint.
- Campo de endpoint na tela de Configurações (aparece ao selecionar o provedor).
- API Key opcional para este provedor (servidores locais geralmente não exigem).
- Badge de status agora diferencia "URL personalizada pendente" de "conectado".

### Corrigido
- `statusText()` tratava ausência de API key como Modo Offline mesmo quando o
  provedor era custom/URL — agora só considera offline se provider for `offline`.

## [1.0.0] — 04/08/2026
Lançamento inicial do módulo Central de IA.

### Novo
- Estrutura modular completa em `modules/central-ia/` (e espelho `dist/`).
- Dashboard com contadores, favoritas e últimos prompts.
- Pesquisa global instantânea (ferramentas + prompts salvos).
- **37 ferramentas** em 8 categorias:
  - Atendimento (5), Ordem de Serviço (4), Orçamento (3), Garantia (3),
    Marketing (5), Programação (7), Diagnóstico Técnico (5), Documentos (5).
- Biblioteca de Prompts com CRUD completo (criar, editar, excluir, duplicar,
  pesquisar, favoritar, categorias).
- Histórico (últimos 100 prompts) com limpeza.
- Favoritas (ferramentas + prompts).
- Provedores de IA: Groq, Google Gemini, OpenAI-compatível e Modo Offline.
- Tema claro/escuro persistente + toggle.
- Interface responsiva (desktop, tablet, celular).
- Persistência local (localStorage) — compatível com PWA/offline.

### Integração
- Menu lateral do dashboard: item **Central de IA** abre o módulo em modal fullscreen.
- Funções `openCentralIAMod()` / `closeCentralIAMod()`.
- PWA: `modules/central-ia/**` adicionado ao precache do service worker
  (`service-worker.js`).

### Corrigido (durante QA)
- `S.AI.*` → `A.*` (referência incorreta de Store para AI no `app.js`).
- Toggles de favorito (ferramenta/prompt) agora persistem no localStorage.
- Diversos typos de sintaxe no `data.js` (parênteses, aspas e textos quebrados).
- Error de digitação em variável CSS (`--cia-txt2:#475direito`).

### Validado
- Chrome headless: main/dist dashboard 0 erros JS.
- Módulo: render OK, 0 erros de console.
- Fluxos: navegação, busca, modal de ferramenta, geração de prompt, histórico,
  CRUD de prompts, favoritos e duplicação — todos aprovados.