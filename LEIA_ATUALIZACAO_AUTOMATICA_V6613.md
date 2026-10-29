# V6.6.13 — Atualização automática da página

- A cada 10 minutos, enquanto a página está aberta e visível e o usuário está autenticado, o painel consulta novamente o Supabase.
- Ao retornar à aba após 10 minutos, tenta atualizar automaticamente.
- Não inicia atualização durante edição de comentário, download, janela de detalhes aberta ou outra consulta em andamento.
- O limite de cada consulta paginada de responsáveis passou de 10 para 20 segundos; o limite agregado passou de 45 para 110 segundos.
- Os erros reais continuam visíveis. O ajuste **não garante** que `NQ_SOURCE_TIMEOUT` desapareça se a função SQL permanecer lenta; nesse caso, é necessária otimização ou cache no banco.
- A atualização acompanha o ritmo dos agendamentos da Monday: não é instantânea.

## Publicação
Substitua os arquivos do repositório pelos do ZIP e aguarde o GitHub Pages publicar. Atualize a página com Ctrl+F5 e confirme V6.6.13. Não é necessário executar SQL para este ajuste.
