# Atualizar para V6.6.3 — progresso em todas as abas

## 1. Atualizar os arquivos da página

1. Extraia o ZIP.
2. No GitHub, abra **qualidadesintechtica/UAs_Criterio_de_Avalia-o**.
3. Em **Add file → Upload files**, envie todo o conteúdo extraído e substitua os arquivos na raiz publicada. Não envie somente o ZIP nem coloque os arquivos em uma pasta extra.
4. Confirme em **Commit changes** e aguarde a publicação.
5. Pressione **Ctrl + F5** e confira **V6.6.3 · 21/10/2026**.

## 2. Ver o progresso de cada material

As abas **Planilha de entrada, UA, BDQ e UC** mostram uma barra abaixo do nome de cada material, na tabela, na lista de Comentários e no detalhe. Na tabela da UC, cada unidade tem seu próprio percentual de indicadores respondidos. As colunas existentes foram mantidas.

Sem critérios sincronizados, aparece uma barra cinza com **—**, sem inventar 0% ou 100%. O percentual mede preenchimento dos critérios disponíveis, considerando o recorte atual. Comentários complementares não contam como respostas.

O aviso da imagem indica **nome da UC pendente**, com a consulta concluída. Nesta versão, expanda **Ver registros** para conferir a referência, os IDs e **Ver detalhes**. O diagnóstico distingue planilhas do quadro e formulários sem vínculo. Nomes são recuperados por vínculo exato quando disponíveis; nomes ausentes ou ambíguos ainda precisam ser corrigidos na origem sincronizada. Consulte **LEIA_PROGRESSO_TODAS_ABAS_E_NOMES.md**.

**Esta atualização não exige SQL novo.** Se os scripts 09 e 10 e a função de usuários já funcionam, mantenha a instalação existente.

## 3. Abrir Participantes

Use **Participantes**, no menu lateral ou junto de **Atualizar dados**, no cabeçalho. A área permite criar login, editar nome/perfil e trocar a senha temporária quando a conta tem autorização no servidor.

Se aparecer **gestão ainda não instalada**, execute todo o arquivo **supabase/09_USUARIOS_E_ACESSOS.sql** no projeto Supabase da página e publique a função **nq-gerenciar-usuarios**, usando todo o arquivo **supabase/functions/nq-gerenciar-usuarios/index.ts**. Mantenha JWT ativado. Depois, volte a Participantes e clique em **Atualizar**.

**SQL 10 não substitui o SQL 09 nem publica a função de usuários.** O GitHub publica a interface; a criação e a troca de senhas dependem do servidor configurado.

A gestão permanece restrita a **ligia.neta@animaeducacao.com.br**, **joao.cane@animaeducacao.com.br** e **cristina.brito@animaeducacao.com.br**, com e-mail confirmado e perfil Admin. Outras contas veem a explicação da restrição e não conseguem listar ou alterar participantes.

Leia **LEIA_PARTICIPANTES_E_PROGRESSO_UA.md** para os passos completos. Se a gestão já está instalada e disponível, não repita os scripts.

## O que permanece

SQL 01 a 10, correção de leitura de critérios, função de gestão de usuários, autenticação, perfis, troca obrigatória de senha, fontes da Monday, filtros, contagens, status, leitura UA/UC, BDQ A1/A2/A3, comentários e versões, CSV e temas foram mantidos.

Passaram **127 testes de lógica**, a regressão das quatro abas e a conferência visual em navegador com dados de teste. As 131 verificações anteriores do controlador de acessos continuam documentadas; esse controlador foi preservado. O código está pronto para atualização; não foi publicado automaticamente no GitHub ou no banco real.
