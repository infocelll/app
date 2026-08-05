# Central de IA — Estrutura de Arquivos

Estrutura do módulo `modules/central-ia/` (e espelho em `dist/modules/central-ia/`).

```
central-ia/
├── index.html                    # Shell SPA: sidebar, busca global, views, modal
├── assets/
│   └── icon.svg                  # Ícone do módulo (favicon/logo)
├── css/
│   └── central-ia.css            # CSS 100% próprio do módulo (variáveis, temas, responsivo)
├── js/
│   ├── data.js                   # Catálogo de ferramentas + metadados de views (_CIA_TOOLS)
│   ├── store.js                  # Persistência localStorage (CentralAI.Store)
│   ├── ai.js                     # Provedores de IA (CentralAI.AI)
│   └── app.js                    # UI: navegação, rendering, busca, prompts (CentralAI)
├── dashboard/                    # Área genérica do painel (dados da Central)
├── assistente/                   # Área genérica do assistente
├── prompts/                      # Área genérica da biblioteca de prompts
├── documentos/                   # Área genérica de documentos
├── programacao/                  # Área genérica de programação
├── marketing/                    # Área genérica de marketing
├── diagnostico/                  # Área genérica de diagnóstico técnico
├── configuracoes/                # Área genérica de configurações
├── tests/
│   └── RELATORIO_TESTES.md       # Relatório de testes executados
└── docs/
    ├── MANUAL_TECNICO.md         # Referência técnica do módulo
    ├── MANUAL_USUARIO.md         # Guia de uso
    ├── ESTRUTURA_DE_ARQUIVOS.md  # Este arquivo
    └── CHANGELOG.md              # Log de alterações
```

## Arquivos modificados fora do módulo

| Arquivo | Alteração |
|---------|-----------|
| `dashboard.html` | Item de menu Central de IA → `openCentralIAMod()`; modal `centralIAModal`; funções `openCentralIAMod`/`closeCentralIAMod` |
| `dist/dashboard.html` | Espelho das alterações acima |
| `service-worker.js` | `modules/central-ia/**` no `PRECACHE_URLS` |
| `dist/service-worker.js` | idem |
| `pwa/service-worker.js` | idem (versão servidor) |
| `dist/pwa/service-worker.js` | idem |

## Convenções

- Namespace global único: `CentralAI`.
- `data.js` expõe `_CIA_TOOLS` (array) e `_CI_VIEWS` (mapa view→rótulo).
- Sem dependências externas (exceção: chamadas `fetch` de API do provedor).
- CSS isolado: classes prefixadas com `cia-` para não conflitar com o dashboard.