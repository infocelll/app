param([string]$filePath)
$ErrorActionPreference = 'Stop'

$content = Get-Content $filePath -Raw
$match = [regex]::Match($content, 'var _MANUAL_B64="(.*?)"(?:\s*;|\s*$)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if(!$match.Success) { Write-Host "NO MATCH"; exit 1 }

$b64 = $match.Groups[1].Value
$bytes = [System.Convert]::FromBase64String($b64)
$decoded = [System.Text.Encoding]::UTF8.GetString($bytes)

$fixed = $decoded

# Apply fixes sequentially
$fixed = $fixed -replace 'Inteligencia', 'Inteligência'
$fixed = $fixed -replace 'sugestoes', 'sugestões'
$fixed = $fixed -replace 'iMédiatamente', 'imediatamente'
$fixed = $fixed -replace 'Após o primeiro', 'após o primeiro'
$fixed = $fixed -replace '^após o login', 'Após o login'
$fixed = $fixed -replace 'metricas importantes', 'métricas importantes'
$fixed = $fixed -replace 'aparencia', 'aparência'
$fixed = $fixed -replace 'rodape da sidebar', 'rodapé da sidebar'
$fixed = $fixed -replace 'exibé', 'exibe'
$fixed = $fixed -replace 'ultimas ordens', 'últimas ordens'
$fixed = $fixed -replace 'botao', 'botão'
$fixed = $fixed -replace 'execucao', 'execução'
$fixed = $fixed -replace 'automáticamente', 'automaticamente'
$fixed = $fixed -replace 'automáticamenté', 'automaticamente'
$fixed = $fixed -replace 'Cartao Credito', 'Cartão de Crédito'
$fixed = $fixed -replace 'Debito,Boleto', 'Débito, Boleto'
$fixed = $fixed -replace 'periodo', 'período'
$fixed = $fixed -replace 'Preco', 'Preço'
$fixed = $fixed -replace 'mes anterior', 'mês anterior'
$fixed = $fixed -replace 'Comissoes', 'Comissões'
$fixed = $fixed -replace '(?<!Co)missoes', 'comissões'
$fixed = $fixed -replace 'comissao', 'comissão'
$fixed = $fixed -replace 'Após confirmAção', 'após confirmação'
$fixed = $fixed -replace 'durAção', 'duração'
$fixed = $fixed -replace 'ha X dias', 'há X dias'
$fixed = $fixed -replace 'politica', 'política'
$fixed = $fixed -replace 'saida', 'saída'
$fixed = $fixed -replace 'Estisticas', 'Estatísticas'
$fixed = $fixed -replace 'provaveis', 'prováveis'
$fixed = $fixed -replace 'necessarias', 'necessárias'
$fixed = $fixed -replace 'Protecao', 'Proteção'
$fixed = $fixed -replace 'sensiveis', 'sensíveis'
$fixed = $fixed -replace 'Exclusao', 'Exclusão'
$fixed = $fixed -replace 'Personalizé', 'Personalize'
$fixed = $fixed -replace 'Configuraveis', 'Configuráveis'
$fixed = $fixed -replace 'Simbolo', 'Símbolo'
$fixed = $fixed -replace 'esta disponivel', 'está disponível'
$fixed = $fixed -replace 'funcao', 'função'
$fixed = $fixed -replace 'Solucao', 'Solução'
$fixed = $fixed -replace 'conexao', 'conexão'
$fixed = $fixed -replace 'todos obrigatorios', 'todos os campos obrigatórios'
$fixed = $fixed -replace 'estágios do Pipeline', 'Estágios do Pipeline'
$fixed = $fixed -replace '<th>estágio</th>', '<th>Estágio</th>'
$fixed = $fixed -replace 'NegociAção', 'Negociação'
$fixed = $fixed -replace 'ClassificAção', 'Classificação'
$fixed = $fixed -replace 'AvaliAção', 'Avaliação'
$fixed = $fixed -replace 'aniversários de clientes', 'Aniversários de clientes'
$fixed = $fixed -replace 'distribuidos', 'distribuídos'

# Fix all VisualizAção -> Visualização
$fixed = $fixed -replace 'VisualizA([çc])', 'Visualiza$1'

# Fix all confirmAção -> confirmação
$fixed = $fixed -replace 'confirmA([çc])', 'confirma$1'

# Fix suGestão -> sugestão
$fixed = $fixed -replace 'suGestão', 'sugestão'
$fixed = $fixed -replace 'SuGestão', 'Sugestão'

# Re-encode to UTF-8 then base64
$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($fixed)
$newB64 = [System.Convert]::ToBase64String($utf8Bytes)

# Replace in file
$newContent = $content -replace [regex]::Escape($b64), $newB64
Set-Content -Path $filePath -Value $newContent -Encoding UTF8

Write-Host "Manual fixed and encoded. Old length: $($b64.Length), New length: $($newB64.Length)"
