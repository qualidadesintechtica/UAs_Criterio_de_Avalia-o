# Conferência das contagens — V6.6.6

Na imagem enviada, os quatro cartões somam 377 planilhas: Liberada 14, Em validação 0, Requer análise do design 27 e Validadas 336. Outros status somam 78: A liberar 30, N/A 2 e Pausado 46. Assim, 377 + 78 = 455 planilhas. Os 2 formulários sem vínculo ficam fora desse total. Os 599 registros detalhados misturavam critérios, inventário e formulários e não representavam 599 planilhas.

## O que mudou

- Total no recorte e sua composição ficam explícitos acima dos filtros nas quatro abas.
- Outros status pode ser selecionado para abrir os respectivos materiais.
- Conferir totais por status Monday abre a tabela de status originais e grupos do painel.
- Exportar materiais desta conferência gera uma linha por material elegível, sem expandir critérios ou comentários. A Planilha de entrada mantém a identidade pelo ID exato do item de validação, mesmo quando dois itens têm os mesmos códigos.
- A descrição da tabela mostra materiais e registros sem vínculo separadamente. A paginação continua contando as linhas exibidas, incluindo unidades da UC.
- O CSV detalhado anterior permanece disponível na tabela, com os registros do status selecionado.

Menu lateral, cartões, total, conferência e exportações consideram os filtros, a busca, Somente com comentários e o status selecionado. Clicar em um cartão recalcula todos esses números. O menu lateral aplica a seleção atual em cada aba. Ao trocar de aba, a seleção permanece. Uma consulta de PE indisponível continua sinalizada sem substituir o total por zero; BDQ parcial continua com aviso.

## Conferir com a Monday

1. Clique em Atualizar dados e anote a data da sincronização mostrada na página.
2. Clique em Limpar filtros para comparar o quadro inteiro, ou aplique os mesmos filtros nos dois lados. Desative Somente com comentários caso não faça parte do recorte.
3. Abra Conferir totais por status Monday e baixe o CSV de materiais.
4. Na aba Planilha de entrada, compare IDs exatos dos itens de validação, categoria Plano de Produção e status da coluna. Nome do grupo físico da Monday não substitui o status da coluna.
5. Se houver diferença, compare os IDs presentes em apenas um dos lados e os status de cada ID. Alterações mais recentes que a sincronização ainda podem não estar no painel.

Esta atualização corrige o recálculo das contagens pelos filtros e mantém a conferência por status. Sem consultar o quadro real ou sua exportação equivalente, não é possível confirmar divergências na sincronização nem afirmar um novo total da Monday.

## Atualização e preservação

Substitua todos os arquivos na raiz publicada do GitHub; confirme V6.6.6 · 21/10/2026 após Ctrl + F5. Não há SQL nem função nova nesta versão. Os scripts 01 a 11 e as funções existentes foram mantidos, assim como downloads, autenticação, participantes, perfis, progresso, comentários, histórico, nomes, filtros e temas.

Validação local: 151 testes, regressão do aplicativo com o recorte da imagem (455 planilhas, 599 registros e 2 formulários sem vínculo), exportações e navegação entre as quatro abas. A conferência visual usa dados fictícios. O pacote não foi publicado automaticamente no GitHub nem aplicado ao banco real.
