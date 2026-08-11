# Central de IA — Manual do Usuário

Bem-vindo à Central de IA do InfoCell Dashboard. Este módulo reúne todas as ferramentas de
inteligência artificial da sua loja em um único lugar: atendimento, ordens de serviço,
orçamentos, garantia, marketing, programação, diagnóstico técnico e documentos.

## Como abrir

1. Abra o **InfoCell Dashboard**.
2. No menu lateral, clique em **Central de IA** (ícone 🧠).
3. A Central abre em tela cheia dentro do painel.

## Dashboard

A tela inicial mostra:

- **Ferramentas favoritas** — as que você marcou com ⭐.
- **Últimos prompts utilizados** — seu histórico recente, com botão de copiar.
- **Contadores** — ferramentas, prompts salvos, favoritas e itens no histórico.

## Pesquisa global

No topo, digite qualquer coisa: "traduzir", "garantia", "anúncio", "HTML"…
Resultados de ferramentas e prompts salvos aparecem instantaneamente. Clique para abrir.

## Usar uma ferramenta

1. Escolha uma categoria no menu (ex.: **Atendimento**).
2. Clique no card da ferramenta desejada.
3. Preencha os campos (os obrigatórios têm *).
4. Clique em **Gerar prompt** para criar o texto pronto.
5. Use **📋 Copiar** para levar ao ChatGPT/Gemini/Groq de sua preferência,
   ou **⚡ Gerar + Enviar à IA** para usar o provedor configurado (veja Configurações).

> Ao copiar, a Central avisa o que foi para a área de transferência: **"Prompt copiado!"**
> (o texto gerado) ou **"Resposta copiada!"** (a resposta da IA, quando já chegou).

> **Modo Offline**: sem chave de API configurada, a Central gera o prompt perfeito e você
> cola em qualquer IA. Com uma chave configurada, as respostas chegam direto aqui.

## Biblioteca de Prompts

Salve prompts reutilizáveis:

- **＋ Novo prompt** — cria um prompt manual.
- **💾 Salvar prompt** (dentro de uma ferramenta) — salva o resultado gerado.
- **✏️ Editar**, **📑 Duplicar**, **🗑️ Excluir**, **⭐ Favoritar** — em cada item.
  Ao excluir, a Central pede confirmação antes de apagar.
- A busca da biblioteca filtra instantaneamente.

## Favoritas

Reúne ferramentas ⭐ e prompts ⭐ favoritos em um só lugar.
Favoritar ou desfavoritar um prompt aqui atualiza a lista na hora.

## Histórico

Registra data, hora, ferramenta, prompt e, quando gerada, a **resposta da IA**.
O botão **Limpar histórico** apaga tudo — após confirmar a ação.

## Configurações

- **Provedor**: Groq (recomendado), Google Gemini, OpenAI ou Modo Offline.
- **API Key**: cole sua chave e opcionalmente escolha o modelo.
- **Aparência**: tema Escuro ou Claro (também pelo botão ☀️/🌙 na barra lateral).

> Sua chave fica salva apenas neste dispositivo (localStorage) e é usada direto do
> seu navegador para o provedor — nunca passa pelo servidor.

## Dica: valores no Orçamento

No campo de valores (peças e mão de obra), você pode digitar de dois jeitos — ambos
são entendidos corretamente:
- com vírgula decimal: `R$ 1.234,56`
- com ponto decimal: `1234.56`

## Dispositivos

A Central é totalmente responsiva: funciona em desktop, notebook, tablet, Android e iPhone.
No celular, a barra lateral vira um menu lateral (botão **☰** no topo): toque nele para abrir
e escolher a categoria; o menu fecha sozinho ao navegar ou tocar fora.