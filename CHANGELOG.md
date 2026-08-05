# Central de IA — Changelog

## [1.0.0] — 04/08/2026
Lançamento inicial do módulo Central de IA.

### Novo
- Estrutura modular completa em `modules/central-ia/` (e espelho `dist/`).
- Dashboard com contadores, favoritas e últimos prompts.
- Pesquisa global instantânea (ferramentas + prompts salvos).
- **38 ferramentas** em 8 categorias:
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
- PWA: `modules/central-ia/**` adicionado ao precache dos service-workers
  (`service-worker.js`, `pwa/service-worker.js` e espelhos `dist/`).

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