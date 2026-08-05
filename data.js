/**
 * Central de IA - InfoCelll
 * Catálogo de ferramentas da Central de IA.
 * Cada ferramenta: id, view, nome, desc, icon, tags, cat, campos (fields) e gerador de prompt (prompt).
 */
(function(){
  window._CIA_TOOLS=[
    /* ============ ATENDIMENTO ============ */
    {
      id:'atd_mensagem', view:'atendimento', nome:'Criar mensagem', desc:'Escreve uma mensagem profissional para o cliente.', icon:'💬',
      tags:['atendimento','mensagem','cliente','texto'], cat:'Atendimento',
      fields:[{k:'contexto',l:'Contexto',t:'textarea',ph:'Ex.: cliente perguntando se o iPhone 12 já ficou pronto',r:true}],
      prompt:function(v){
        return 'Escreva uma mensagem profissional e cordial para um cliente de assistência técnica de celulares e computadores. Contexto: "'+(v.contexto||'')+'". '+
          'Use linguagem clara, amigável e direta. Se for uma pergunta, responda com promessa de retorno em até 2 horas.';
      }
    },
    {
      id:'atd_corrigir', view:'atendimento', nome:'Corrigir português', desc:'Reescreve texto corrigindo erros de português.', icon:'✅',
      tags:['atendimento','corrigir','portugues','gramatica','revisao'], cat:'Atendimento',
      fields:[{k:'texto',l:'Texto original',t:'textarea',ph:'Cole aqui o texto com erros...'}],
      prompt:function(v){
        return 'Corrija os erros de português (concordância, ortografia, pontuação e clareza) do texto a seguir, mantendo o tom e o significado. Retorne apenas o texto corrigido.\n\nTEXTO:\n'+(v.texto||'');
      }
    },
    {
      id:'atd_reescrever', view:'atendimento', nome:'Reescrever mensagem', desc:'Reescreve mensagens com tom mais profissional ou amigável.', icon:'✍️',
      tags:['atendimento','reescrever','tom','texto'], cat:'Atendimento',
      fields:[
        {k:'texto',l:'Mensagem atual',t:'textarea'},
        {k:'tom',l:'Novo tom',t:'select',op:['Profissional','Amigável','Formal','Eficiente','Empático','Curto e direto']}
      ],
      prompt:function(v){
        return 'Reescreva a mensagem a seguir com tom '+((v.tom||'Profissional').toLowerCase())+'. Mantenha todas as informações importantes. Retorne apenas a nova mensagem.\n\nMENSAGEM:\n'+(v.texto||'');
      }
    },
    {
      id:'atd_resumir', view:'atendimento', nome:'Resumir texto', desc:'Cria um resumo objetivo de conversas ou observações.', icon:'📉',
      tags:['atendimento','resumo','texto','conversa'], cat:'Atendimento',
      fields:[{k:'texto',l:'Texto para resumir',t:'textarea',ph:'Cole a conversa ou observação...'}],
      prompt:function(v){
        return 'Faça um resumo objetivo do texto a seguir com os pontos principais. Use entre 3 e 5 marcadores.\n\nTEXTO:\n'+(v.texto||'');
      }
    },
    {
      id:'atd_traduzir', view:'atendimento', nome:'Traduzir texto', desc:'Traduz texto para outro idioma.', icon:'🌍',
      tags:['atendimento','traducao','idioma','ingles','espanhol'], cat:'Atendimento',
      fields:[
        {k:'texto',l:'Texto',t:'textarea'},
        {k:'idioma',l:'Idioma de destino',t:'select',op:['Inglês','Espanhol','Francês','Italiano','Alemão','Português']}
      ],
      prompt:function(v){
        return 'Traduza o texto a seguir para '+((v.idioma||'Inglês').toLowerCase())+'. Retorne apenas a tradução, sem comentários.\n\nTEXTO:\n'+(v.texto||'');
      }
    },

    /* ============ ORDEM DE SERVIÇO ============ */
    {
      id:'os_gerar', view:'os', nome:'Gerar Ordem de Serviço', desc:'Cria a estrutura completa de uma OS com defeitos e serviços.', icon:'📋',
      tags:['os','ordem','servico','documento'], cat:'Ordem de Serviço',
      fields:[
        {k:'cliente',l:'Nome do cliente',t:'text'},
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'defeito',l:'Defeito relatado',t:'textarea',r:true},
        {k:'servicos',l:'Serviços a executar',t:'textarea'}
      ],
      prompt:function(v){
        return 'Gere uma Ordem de Serviço para assistência técnica.\nCliente: '+(v.cliente||'—')+'\nAparelho: '+(v.aparelho||'—')+'\nDefeito relatado: '+(v.defeito||'—')+'\nServiços: '+(v.servicos||'segue padrão da loja')+'\n\n'+
          'Monte o documento com: cabeçalho com dados, teste de recebimento, diagnóstico, serviços executados, peças utilizadas, garantia e termos de responsabilidade.';
      }
    },
    {
      id:'os_descricao', view:'os', nome:'Criar descrição técnica', desc:'Gera descrição técnica detalhada do serviço realizado.', icon:'🧰',
      tags:['os','descricao','tecnica','laudo'], cat:'Ordem de Serviço',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'servico',l:'Serviço realizado',t:'textarea'},
        {k:'pecas',l:'Peças utilizadas',t:'textarea'}
      ],
      prompt:function(v){
        return 'Escreva uma descrição técnica profissional de um serviço de assistência técnica.\nAparelho: '+(v.aparelho||'—')+'\nServiço realizado: '+(v.servico||'—')+'\nPeças: '+(v.pecas||'Nenhuma')+'\n\n'+
          'Detalhe a execução, materiais e peças, estado inicial, estado final e laudo. Linguagem técnica e clara.';
      }
    },
    {
      id:'os_obs', view:'os', nome:'Criar observações', desc:'Gera observações para constar na OS.', icon:'📝',
      tags:['os','observacoes','termo','responsabilidade'], cat:'Ordem de Serviço',
      fields:[{k:'nota',l:'Nota / pedido extra',t:'textarea'}],
      prompt:function(v){
        return 'Crie observações profissionais para constar na Ordem de Serviço de uma assistência técnica, incluindo: '+(v.nota||'sem pedidos extras')+'. '+
          'Aborde: garantia de peças e serviço, cuidados com o aparelho, condição do equipamento, prazo de retirada e responsabilidade sobre dados.';
      }
    },
    {
      id:'os_parecer', view:'os', nome:'Criar parecer técnico', desc:'Parecer técnico formal sobre o estado do aparelho.', icon:'🔬',
      tags:['os','parecer','laudo','tecnico'], cat:'Ordem de Serviço',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'conclusao',l:'Conclusão',t:'textarea',ph:'Ex.: não compensa reparo / reparável / perda total'}
      ],
      prompt:function(v){
        return 'Escreva um parecer técnico formal para a assistência técnica.\nAparelho: '+(v.aparelho||'—')+'\n'+
          'Estruture: identificação do equipamento, condições identificadas, procedimentos adotados e conclusão: '+(v.conclusao||'—')+'.';
      }
    },

    /* ============ ORÇAMENTO ============ */
    {
      id:'orc_gerar', view:'orcamento', nome:'Gerar orçamento', desc:'Orçamento detalhado com itens, mão de obra e valores.', icon:'💲',
      tags:['orcamento','valor','preco','servico'], cat:'Orçamento',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'itens',l:'Itens/serviços',t:'textarea',ph:'Ex.: display, bateria, formatação...'},
        {k:'pecas',l:'Valor peças (R$)',t:'text'},
        {k:'mod',l:'Mão de obra (R$)',t:'text'}
      ],
      prompt:function(v){
        var pecas=parseFloat((v.pecas||'0').replace('R$','').replace(/\./g,'').replace(',','.'))||0;
        var mod=parseFloat((v.mod||'0').replace('R$','').replace(/\./g,'').replace(',','.'))||0;
        return 'Monte um orçamento profissional para a assistência técnica.\nAparelho: '+(v.aparelho||'—')+'\nItens/serviços: '+(v.itens||'—')+'\nValor das peças: R$ '+pecas.toFixed(2)+'\nMão de obra: R$ '+mod.toFixed(2)+'\n\n'+
          'Estruture em tabela: item, descrição, valor. Informe subtotal de peças, mão de obra e total. Inclua validade do orçamento e forma de pagamento.';
      }
    },
    {
      id:'orc_melhorar', view:'orcamento', nome:'Melhorar orçamento', desc:'Revisa e melhora a apresentação de um orçamento existente.', icon:'✨',
      tags:['orcamento','melhorar','revisar'], cat:'Orçamento',
      fields:[{k:'orc',l:'Orçamento atual (cole aqui)',t:'textarea'}],
      prompt:function(v){
        return 'Melhore o orçamento a seguir de uma assistência técnica: organize os itens, formate em tabela com peças + mão de obra + total, e adicione observações claras. Retorne o orçamento melhorado.\n\nORÇAMENTO ATUAL:\n'+(v.orc||'');
      }
    },
    {
      id:'orc_explicar', view:'orcamento', nome:'Explicar orçamento ao cliente', desc:'Mensagem simples explicando o orçamento para o cliente.', icon:'🤝',
      tags:['orcamento','explicar','cliente','mensagem'], cat:'Orçamento',
      fields:[{k:'orc',l:'Itens do orçamento',t:'textarea'}],
      prompt:function(v){
        return 'Explique de forma simples e amigável para o cliente de uma assistência técnica o orçamento a seguir, em linguagem leiga, destacando a garantia do serviço.\n\nORÇAMENTO:\n'+(v.orc||'');
      }
    },

    /* ============ GARANTIA ============ */
    {
      id:'gar_criar', view:'garantia', nome:'Criar garantia', desc:'Redige texto padrão da garantia de serviço.', icon:'🛡️',
      tags:['garantia','termo','servico'], cat:'Garantia',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'meses',l:'Qtd. de meses',t:'text'},
        {k:'servicos',l:'Serviços cobertos',t:'textarea'}
      ],
      prompt:function(v){
        return 'Gere um termo de garantia para um serviço de assistência técnica.\nAparelho: '+(v.aparelho||'—')+'\nDuração: '+(v.meses||'3')+' meses\nServiços cobertos: '+(v.servicos||'o reparo executado')+'\n\n'+
          'Estruture com: dados do serviço, período, cobertura, exclusões e disposições gerais.';
      }
    },
    {
      id:'gar_termo', view:'garantia', nome:'Gerar termo', desc:'Termo de garantia formal para assinatura.', icon:'📜',
      tags:['garantia','termo','assinatura'], cat:'Garantia',
      fields:[
        {k:'cliente',l:'Cliente',t:'text'},
        {k:'os',l:'Nº da OS',t:'text'},
        {k:'meses',l:'Meses',t:'text'}
      ],
      prompt:function(v){
        return 'Escreva um termo de garantia formal, em português do Brasil, para assinatura do cliente e da assistência técnica. Cliente: '+(v.cliente||'—')+', OS nº '+(v.os||'—')+', validade de '+(v.meses||'3')+' meses a partir da entrega.\n'+
          'Inclua: objeto, cobertura, exclusões, procedimento de acionamento e campos de assinatura.';
      }
    },
    {
      id:'gar_revisar', view:'garantia', nome:'Revisar garantia', desc:'Verifica se o texto da garantia está completo e claro.', icon:'🔍',
      tags:['garantia','revisar','termo'], cat:'Garantia',
      fields:[{k:'texto',l:'Texto da garantia',t:'textarea'}],
      prompt:function(v){
        return 'Revise o texto de garantia a seguir: verifique clareza, abrangência de cobertura, exclusões e prazos. Aponte melhorias e entregue uma versão revisada.\n\nTEXTO:\n'+(v.texto||'');
      }
    },

    /* ============ MARKETING ============ */
    {
      id:'mkt_anuncio', view:'marketing', nome:'Criar anúncio', desc:'Anúncio com chamada para o serviço da loja.', icon:'📣',
      tags:['marketing','anuncio','promocao'], cat:'Marketing',
      fields:[
        {k:'oferta',l:'O que promover',t:'textarea',ph:'Ex.: formatação de celular com bônus'},
        {k:'publ',l:'Público-alvo',t:'text'}
      ],
      prompt:function(v){
        return 'Crie um anúncio persuasivo para a loja de assistência técnica InfoCell sobre: '+(v.oferta||'')+' para o público '+(v.publ||'clientes da região')+'. '+
          'Entregue 2 versões: uma curta para stories e uma completa para feed, cada uma com headline, corpo e chamada para ação.';
      }
    },
    {
      id:'mkt_promocao', view:'marketing', nome:'Criar promoção', desc:'Promoção criativa mantendo margem saudável.', icon:'🏷️',
      tags:['marketing','promocao','preco','oferta'], cat:'Marketing',
      fields:[
        {k:'servo',l:'Serviço/produto',t:'text'},
        {k:'preco',l:'Valor',t:'text'},
        {k:'validade',l:'Validade',t:'text'}
      ],
      prompt:function(v){
        return 'Crie uma campanha de promoção atrativa para uma assistência técnica. Serviço/produto: '+(v.servo||'')+', valor '+(v.preco||'R$ 0')+', válida por '+(v.validade||'7 dias')+'. '+
          'Gere: nome da promoção, argumentos de venda, condições e chamada para ação.';
      }
    },
    {
      id:'mkt_legenda', view:'marketing', nome:'Criar legenda', desc:'Legenda para posts de Instagram e Facebook.', icon:'🖼️',
      tags:['marketing','legenda','instagram','redes'], cat:'Marketing',
      fields:[
        {k:'tema',l:'Sobre o que é o post',t:'textarea'},
        {k:'cta',l:'Chamada para ação',t:'select',op:['Chamar no WhatsApp','Chamar no direct','Visitar a loja','Ligar para a loja']}
      ],
      prompt:function(v){
        return 'Crie legenda com hashtags para publicação da loja de assistência técnica sobre: '+(v.tema||'')+' com chamada para ação "'+(v.cta||'Chamar no WhatsApp')+'". '+
          'Use bullets, emojis moderados e 3 a 5 hashtags locais.';
      }
    },
    {
      id:'mkt_slogan', view:'marketing', nome:'Criar slogan', desc:'Slogans rápidos e marcantes.', icon:'💡',
      tags:['marketing','slogan','marca','identidade'], cat:'Marketing',
      fields:[{k:'nicho',l:'Segmento',t:'text'}],
      prompt:function(v){
        return 'Gere 5 sugestões de slogans curtos e marcantes para: '+(v.nicho||'assistência técnica de celulares')+'. Cada um em uma linha, prontos para uso em logo e redes sociais.';
      }
    },
    {
      id:'mkt_postagem', view:'marketing', nome:'Criar postagem', desc:'Postagem completa com texto e sugestão de arte.', icon:'📰',
      tags:['marketing','postagem','conteudo','instagram'], cat:'Marketing',
      fields:[
        {k:'tema',l:'Tema',t:'textarea'},
        {k:'rede',l:'Rede',t:'select',op:['Instagram','Facebook','WhatsApp Status','LinkedIn']}
      ],
      prompt:function(v){
        return 'Crie uma postagem completa para '+(v.rede||'Instagram')+' sobre: '+(v.tema||'')+'. Estruture: gancho, desenvolvimento, chamada para ação e sugestão de visual/arte.';
      }
    },

    /* ============ PROGRAMAÇÃO ============ */
    {
      id:'pro_html', view:'programacao', nome:'Gerar HTML', desc:'Gera código HTML5 pronto para uso.', icon:'🔧',
      tags:['programacao','html','codigo','web'], cat:'Programação',
      fields:[{k:'desc',l:'Descreva o que precisa',t:'textarea',r:true}],
      prompt:function(v){
        return 'Gere código HTML5 pronto para uso, em bloco único, com comentários nas seções principais. Requisito: '+(v.desc||'')+'.';
      }
    },
    {
      id:'pro_css', view:'programacao', nome:'Gerar CSS', desc:'Gera estilos CSS modernos.', icon:'🎨',
      tags:['programacao','css','estilo','design'], cat:'Programação',
      fields:[
        {k:'desc',l:'Descreva o estilo',t:'textarea'},
        {k:'cor',l:'Cor principal',t:'text'}
      ],
      prompt:function(v){
        return 'Gere CSS moderno com variáveis, tema claro/escuro e responsividade para: '+(v.desc||'')+'. Cor principal: '+(v.cor||'#0ea5e9')+'.';
      }
    },
    {
      id:'pro_js', view:'programacao', nome:'Gerar JavaScript', desc:'Gera funções e trechos JS úteis.', icon:'⚙️',
      tags:['programacao','javascript','js','funcao'], cat:'Programação',
      fields:[{k:'desc',l:'O que o código deve fazer',t:'textarea',r:true}],
      prompt:function(v){
        return 'Gere código JavaScript ES6 limpo, sem bibliotecas externas quando possível. Requisito: '+(v.desc||'')+'.';
      }
    },
    {
      id:'pro_revisar', view:'programacao', nome:'Revisar código', desc:'Analisa bugs e melhorias no código.', icon:'🕵️',
      tags:['programacao','revisao','codigo','review'], cat:'Programação',
      fields:[
        {k:'cod',l:'Código',t:'textarea',r:true},
        {k:'lang',l:'Linguagem',t:'text'}
      ],
      prompt:function(v){
        return 'Revise o código '+(v.lang||'')+' a seguir: aponte bugs, problemas de segurança, performance e boas práticas. Sugira correções organizadas.\n\nCÓDIGO:\n'+(v.cod||'');
      }
    },
    {
      id:'pro_corrigir', view:'programacao', nome:'Corrigir bugs', desc:'Encontra e sugere correção de erros.', icon:'🐞',
      tags:['programacao','bug','corrigir','erro'], cat:'Programação',
      fields:[
        {k:'cod',l:'Código com erro',t:'textarea',r:true},
        {k:'erro',l:'Mensagem de erro (se houver)',t:'text'}
      ],
      prompt:function(v){
        return 'Encontre a causa dos bugs no código a seguir e entregue a versão corrigida, explicando brevemente cada correção.\nErro reportado: '+(v.erro||'não informado')+'\n\nCÓDIGO:\n'+(v.cod||'');
      }
    },
    {
      id:'pro_otimizar', view:'programacao', nome:'Otimizar código', desc:'Melhora performance e legibilidade.', icon:'🚀',
      tags:['programacao','otimizar','performance','refatorar'], cat:'Programação',
      fields:[{k:'cod',l:'Código',t:'textarea'}],
      prompt:function(v){
        return 'Otimize o código a seguir quanto a performance, legibilidade e boas práticas. Mantenha o comportamento idêntico.\n\nCÓDIGO:\n'+(v.cod||'');
      }
    },
    {
      id:'pro_explicar', view:'programacao', nome:'Explicar código', desc:'Explica código passo a passo.', icon:'📖',
      tags:['programacao','explicar','codigo','aprender'], cat:'Programação',
      fields:[{k:'cod',l:'Código',t:'textarea'}],
      prompt:function(v){
        return 'Explique o código a seguir passo a passo, em linguagem simples, indicando o que cada bloco faz. Responda em português.\n\nCÓDIGO:\n'+(v.cod||'');
      }
    },

    /* ============ DIAGNÓSTICO TÉCNICO ============ */
    {
      id:'diag_gerar', view:'diagnostico', nome:'Gerar diagnóstico', desc:'Diagnóstico provável a partir dos sintomas.', icon:'🩺',
      tags:['diagnostico','sintomas','aparelho','celular'], cat:'Diagnóstico Técnico',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'sintomas',l:'Sintomas',t:'textarea',r:true}
      ],
      prompt:function(v){
        return 'Um(a) '+(v.aparelho||'aparelho')+' apresenta: '+(v.sintomas||'')+'. '+
          'Liste as causas mais prováveis em ordem de probabilidade, os sintomas de confirmação e o primeiro passo do diagnóstico.';
      }
    },
    {
      id:'diag_defeitos', view:'diagnostico', nome:'Possíveis defeitos', desc:'Levanta hipóteses de defeito.', icon:'🧲',
      tags:['diagnostico','defeitos','hipotese'], cat:'Diagnóstico Técnico',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'sintoma',l:'Sintoma',t:'textarea'}
      ],
      prompt:function(v){
        return 'Liste os possíveis defeitos de '+(v.aparelho||'um aparelho')+' que apresenta: '+(v.sintoma||'')+'. '+
          'Para cada um, indique a probabilidade (alta/média/baixa) e como confirmar o defeito.';
      }
    },
    {
      id:'diag_solucoes', view:'diagnostico', nome:'Soluções', desc:'Procedimento de reparo passo a passo.', icon:'🛠️',
      tags:['diagnostico','solucao','reparo','procedimento'], cat:'Diagnóstico Técnico',
      fields:[{k:'defeito',l:'Defeito identificado',t:'textarea'}],
      prompt:function(v){
        return 'Para o defeito: '+(v.defeito||'')+', apresente o passo a passo completo do reparo, ferramentas necessárias, cuidados, tempo estimado e pontos de atenção.';
      }
    },
    {
      id:'diag_checklist', view:'diagnostico', nome:'Checklist', desc:'Checklist de diagnóstico completo.', icon:'☑️',
      tags:['diagnostico','checklist','verificacao'], cat:'Diagnóstico Técnico',
      fields:[{k:'tipo',l:'Tipo de diagnóstico',t:'select',op:['Entrada de celular','Entrada de computador','Troca de tela','Formatação','Troca de bateria']}],
      prompt:function(v){
        return 'Crie um checklist de diagnóstico para: '+(v.tipo||'entrada de celular')+'. '+
          'Organize em categorias (recebimento, funcionamento, botões, wifi, câmeras, carga, testes) em formato de checkboxes.';
      }
    },
    {
      id:'diag_proced', view:'diagnostico', nome:'Procedimentos', desc:'Cria procedimentos internos padronizados.', icon:'🧭',
      tags:['diagnostico','procedimento','padrao','fluxo'], cat:'Diagnóstico Técnico',
      fields:[{k:'tipo',l:'Tipo de serviço',t:'text'}],
      prompt:function(v){
        return 'Crie o procedimento interno padrão (SOP) para o serviço: '+(v.tipo||'troca de bateria')+'. '+
          'Inclua preparação, fluxo de execução, verificações e pós-reparo.';
      }
    },

    /* ============ DOCUMENTOS ============ */
    {
      id:'doc_pdf', view:'documentos', nome:'Gerar PDF', desc:'Monta conteúdo formatado para exportar em PDF.', icon:'📄',
      tags:['documentos','pdf','exportar'], cat:'Documentos',
      fields:[
        {k:'titulo',l:'Título do documento',t:'text'},
        {k:'conteudo',l:'Conteúdo',t:'textarea'}
      ],
      prompt:function(v){
        return 'Formate o conteúdo a seguir como um documento profissional para exportação em PDF, com título "'+(v.titulo||'Documento da assistência')+'" e formatação limpa: cabeçalho, seções e margens adequadas.\n\nCONTEÚDO:\n'+(v.conteudo||'');
      }
    },
    {
      id:'doc_relatorio', view:'documentos', nome:'Gerar relatório', desc:'Cria relatório técnico ou administrativo.', icon:'📊',
      tags:['documentos','relatorio','tecnico'], cat:'Documentos',
      fields:[
        {k:'tipo',l:'Tipo de relatório',t:'select',op:['Relatório técnico','Relatório de serviço','Relatório diário','Relatório mensal']},
        {k:'tema',l:'Tema/campo',t:'textarea'}
      ],
      prompt:function(v){
        return 'Crie um '+(v.tipo||'relatório técnico')+' sobre: '+(v.tema||'')+' com introdução, dados, análise, considerações e recomendação, estruturado em seções.';
      }
    },
    {
      id:'doc_laudo', view:'documentos', nome:'Gerar laudo', desc:'Laudo técnico formal.', icon:'⚖️',
      tags:['documentos','laudo','pericia'], cat:'Documentos',
      fields:[
        {k:'aparelho',l:'Aparelho',t:'text'},
        {k:'achados',l:'Achados',t:'textarea'}
      ],
      prompt:function(v){
        return 'Escreva um laudo técnico formal sobre: '+(v.aparelho||'—')+'\nAchados: '+(v.achados||'')+'\n'+
          'Estruture com: introdução, exames realizados, achados, conclusão e campo de responsável técnico.';
      }
    },
    {
      id:'doc_recibo', view:'documentos', nome:'Gerar recibo', desc:'Recibo de pagamento profissional.', icon:'🧾',
      tags:['documentos','recibo','pagamento'], cat:'Documentos',
      fields:[
        {k:'cliente',l:'Nome do cliente',t:'text'},
        {k:'valor',l:'Valor',t:'text'},
        {k:'desc',l:'Serviço',t:'text'}
      ],
      prompt:function(v){
        return 'Gere um recibo de pagamento profissional, com: valor por extenso, nome do cliente '+(v.cliente||'—')+', valor '+(v.valor||'—')+', serviço '+(v.desc||'—')+', data, e assinatura do profissional. Inclua a declaração de que nada mais há a tratar.';
      }
    },
    {
      id:'doc_retirada', view:'documentos', nome:'Termo de retirada', desc:'Termo de retirada de equipamento.', icon:'📦',
      tags:['documentos','termo','retirada','entrega'], cat:'Documentos',
      fields:[
        {k:'cliente',l:'Cliente',t:'text'},
        {k:'os',l:'Nº da OS',t:'text'},
        {k:'aparelho',l:'Aparelho',t:'text'}
      ],
      prompt:function(v){
        return 'Escreva um TERMO DE RETIRADA DE EQUIPAMENTO para assistência técnica: declare que o cliente '+(v.cliente||'—')+' retirou, na OS nº '+(v.os||'—')+', o aparelho '+(v.aparelho||'—')+'. '+
          'Inclua: conferência do aparelho, acessórios, garantia restante, teste em conjunto, renúncia a reclamações futuras e campos de assinatura.';
      }
    }
  ];

  window._CI_VIEWS={
    atendimento:'Atendimento', os:'Ordem de Serviço', orcamento:'Orçamento', garantia:'Garantia',
    marketing:'Marketing', programacao:'Programação', diagnostico:'Diagnóstico Técnico', documentos:'Documentos'
  };
})();