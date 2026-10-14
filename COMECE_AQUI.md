# Publicar os resultados das UAs no GitHub

## Atualização do layout

Para atualizar uma instalação existente, substitua os arquivos no repositório pelos arquivos extraídos deste ZIP. O SQL deste pacote é o mesmo da primeira versão.

Os cartões filtram os resultados por UA; a tabela mantém as colunas solicitadas. A opção **Comentários** agrupa a leitura por UC. **Ver pareceres** abre um painel lateral com os comentários completos e, quando disponíveis, as classificações anteriores. O botão no alto da página alterna os temas claro e escuro.

Este pacote já está organizado para o GitHub Pages: `index.html` na raiz, arquivos de estilo e código ao lado dele e SDK oficial incluído na pasta `vendor`.

## 1. Proteger os dados no Supabase

1. Abra o projeto Supabase que já atende ao BI.
2. Entre em **SQL Editor → New query**.
3. Copie o conteúdo de `supabase/01_PROTEGER_ACESSO_RESULTADOS_UAS.sql`.
4. Clique em **Run**.
5. Confira o resultado: as duas colunas começadas por `anon_pode_ler` devem ser `false`; as duas começadas por `autenticado_pode_ler` devem ser `true`.

Execute esta etapa antes de publicar. As fontes atuais foram consultadas sem uma sessão de usuário durante a verificação. O script cria duas fontes exclusivas do painel com verificação institucional no banco e retira a leitura anônima das fontes originais e de suas dependências. Mantém o acesso autenticado já existente. Não altera avaliações, pareceres ou registros.

O SQL foi preparado a partir dos campos confirmados nas fontes reais, mas ainda não foi executado no banco. Se ocorrer qualquer erro dentro da transação, não publique o site até que seja resolvido.

## 2. Subir os arquivos

1. No GitHub, abra o repositório que receberá esta página ou crie um separado, por exemplo `resultados-avaliacoes-uas`.
2. Extraia o ZIP em seu computador.
3. No repositório, escolha **Add file → Upload files**.
4. Envie os arquivos e pastas extraídos. `index.html` deve ficar na raiz do repositório, e `vendor/supabase.js` deve continuar dentro de `vendor`.
5. Confirme o envio com **Commit changes**.

O site pode usar um repositório público. Para publicar a partir de um repositório privado, a conta precisa de um plano GitHub compatível com essa função. A página do GitHub Pages normalmente fica acessível na internet mesmo quando o repositório é privado; o acesso aos resultados depende da autenticação e das permissões do Supabase.

## 3. Habilitar a página

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta **/ (root)**.
4. Clique em **Save**.
5. Aguarde a publicação e abra o endereço apresentado pelo GitHub. Se disponível, mantenha **Enforce HTTPS** ativado.

## 4. Conferir o acesso

- Entre com o e-mail `@animaeducacao.com.br` e a senha já cadastrados no BI.
- Combine os filtros de esteira, UC, UA, revisor e especialistas.
- Abra **Ver avaliação** para ler os critérios e pareceres completos.
- Clique em **Sair** e confirme que os resultados desaparecem da página.

Não é necessário login no ChatGPT para utilizar esta versão. Não há senha no código nem chave administrativa do Supabase.

## O que foi verificado

Os testes dos cálculos, filtros, vínculos, deduplicação e exportação foram executados. Os campos utilizados foram confirmados nas fontes reais. A execução do SQL, um login institucional completo, a inspeção visual em navegador e a publicação no GitHub ainda dependem do acesso às contas correspondentes.

## Referências

- [Configurar a publicação no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Criar um site no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Proteger views no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
