# Central de IA — Relatório de Testes

Data: 04/08/2026 · Metodologia: Chrome Headless (`--headless=new --timeout --dump-dom`)
+ harness de teste Inline no DOM.

## Resultados

### 1. Carregamento / Renderização
| Teste | Resultado |
|-------|-----------|
| Carregamento `index.html` sem erros de console | ✅ PASS |
| Dashboard renderizado (hero + stats + seções) | ✅ PASS |
| Dashboard principal (`dashboard.html`) — 0 erros JS | ✅ PASS |
| Dashboard espelho (`dist/dashboard.html`) — 0 erros JS | ✅ PASS |

### 2. Navegação
| Teste | Resultado |
|-------|-----------|
| 13 itens no menu lateral | ✅ PASS |
| Troca de view (Ordem de Serviço) renderiza cards | ✅ PASS (`osTools:4`) |

### 3. Ferramentas
| Teste | Resultado |
|-------|-----------|
| Abertura do modal com campos | ✅ PASS (`modal:4`) |
| Validação + geração de prompt | ✅ PASS (`outShow:true`, `outLen:328`) |
| Registro no histórico | ✅ PASS (`hist:1`) |

### 4. Pesquisa global
| Teste | Resultado |
|-------|-----------|
| Busca "traduzir" retorna resultados | ✅ PASS (`search:1`) |

### 5. Biblioteca de Prompts
| Teste | Resultado |
|-------|-----------|
| Criar prompt (nome + texto) | ✅ PASS (`prompts:1`) |
| Favoritar prompt (persiste) | ✅ PASS (`favStored:1`) |
| Duplicar prompt | ✅ PASS (`afterDup:2`) |
| Excluir / Editar (por código) | ✅ PASS |

### 6. Responsividade e PWA
| Teste | Resultado |
|-------|-----------|
| Layout responsivo (media queries 900px/560px) | ✅ PASS (inspeção CSS) |
| Arquivos no precache dos service-workers | ✅ PASS |
| Funcionamento em `file://` (sem servidor) | ✅ PASS |
| Dados locais offline (localStorage) | ✅ PASS |

## Notas
- O erro anterior "Unsafe attempt to load URL ... #" (navegação por hash em `file://`)
  é benigno e já registrado no changelog do dashboard.
- Correções aplicadas durante QA: `A.*` no `app.js`, persistência dos favoritos no
  `store.js`, e limpeza de typos no `data.js` e no `central-ia.css`.