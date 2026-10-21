# Contagens conforme os filtros — V6.6.6

## Regra da tela

Os números do menu lateral, cartões, Total no recorte, conferência e exportações usam a seleção atual. Esteira, lote, UC, UA/material, revisor e especialista são combinados. Busca, Somente com comentários e status também participam da seleção. O aviso de nomes pendentes na Planilha de entrada considera somente os registros desse recorte.

O menu calcula a quantidade de materiais de cada aba com essa mesma seleção, inclusive nas abas que não estão abertas. Trocar de aba mantém a seleção; não zera os filtros automaticamente. Um filtro de material específico pode retornar zero nas abas em que ele não existe.

Os cartões continuam clicáveis mesmo com zero, para permitir trocar o status. Selecionar Validadas, por exemplo, restringe a tabela, o total, a conferência, as exportações e os números do menu a materiais validados. Os demais cartões ficam com zero nesse recorte. Clique novamente no cartão ou use Limpar filtros para retirar a seleção de status.

## Conferência rápida depois de publicar

1. Confirme V6.6.6 · 21/10/2026 e clique em Atualizar dados.
2. Selecione uma esteira ou um lote. Menu, cartões e Total no recorte devem mudar junto da tabela.
3. Acrescente UC ou responsável para restringir mais a seleção. Uma combinação sem materiais deve mostrar zero, sem reutilizar os totais gerais.
4. Troque entre Planilha de entrada, UA, BDQ e UC. A seleção deve continuar aplicada e o número da aba aberta deve corresponder ao Total no recorte.
5. Selecione um status. A conferência e o CSV de materiais devem conter somente esse status.
6. Clique em Limpar filtros. Os números disponíveis da base inteira devem reaparecer.

Uma planilha continua sendo contada uma vez por ID exato de validação. Formulários sem vínculo ficam acessíveis em Todos, fora do total de planilhas. Linhas de unidades da UC e registros detalhados de critérios podem ser mais numerosos que os materiais. Fontes indisponíveis continuam sinalizadas; não são apresentadas como uma contagem real igual a zero.

## Atualização

Extraia o ZIP e substitua todo o conteúdo na raiz publicada do GitHub. Não envie apenas o ZIP nem coloque a página em uma pasta extra. Depois de publicar, use Ctrl + F5. Esta atualização não exige SQL novo nem republicar funções que já estão funcionando.

A base é a V6.6.5 com os recursos anteriores preservados: downloads, autenticação, participantes, comentários e histórico, filtros, progresso nas quatro abas e temas. Não é uma substituição pelos arquivos antigos da V6.6.2.

Validação: 151 testes de lógica e serviço, regressão das quatro abas e 24 combinações entre os seis filtros e quatro abas, além de status, busca, comentários, exportação, limpar, recorte vazio e saída. Conferência visual realizada com dados fictícios. A atualização não altera os dados sincronizados da Monday e não foi publicada automaticamente no GitHub.
