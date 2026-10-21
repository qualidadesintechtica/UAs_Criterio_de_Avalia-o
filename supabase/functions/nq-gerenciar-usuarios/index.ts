import {createClient} from 'npm:@supabase/supabase-js@2';

function envKey(map: string, legacy: string) {
  const keys = Deno.env.get(map);
  return (keys ? JSON.parse(keys).default : '') || Deno.env.get(legacy) || '';
}
const institutional = (email: unknown) => typeof email === 'string' &&
  /^[^@\s]+@(animaeducacao\.com\.br|ulife\.com\.br)$/i.test(email.trim());
const validName = (value: unknown) => typeof value === 'string' &&
  value.trim().length > 0 && [...value.trim()].length <= 150 && !/[\u0000-\u001f\u007f]/.test(value);
const adminEmails = new Set(['ligia.neta@animaeducacao.com.br','joao.cane@animaeducacao.com.br','cristina.brito@animaeducacao.com.br']);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  const allowed = (Deno.env.get('NQ_ORIGINS') || 'https://qualidadesintechtica.github.io')
    .split(',').map(x => x.trim()).filter(Boolean);
  const headers: Record<string,string> = {'Content-Type':'application/json','Cache-Control':'no-store',
    'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info'};
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (status: number, code: string, message: string, extra = {}) =>
    new Response(JSON.stringify({ok:status === 200,code,message,...extra}), {status,headers});
  if (origin && !allowed.includes(origin)) return reply(403,'NQ_ORIGIN','Endereço do site não autorizado.');
  if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (req.method !== 'POST') return reply(405,'NQ_METHOD','Use POST.');
  const authorization = req.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/i.test(authorization)) return reply(401,'NQ_SESSION','Entre novamente no painel.');
  if (!req.headers.get('Content-Type')?.includes('application/json'))
    return reply(415,'NQ_BODY','Formato inválido.');
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 4096) return reply(413,'NQ_BODY','Solicitação muito grande.');
    let body;
    try {body = JSON.parse(text);} catch {return reply(400,'NQ_BODY','Solicitação inválida.');}
    if (!body || !['status','create','password'].includes(body.action))
      return reply(400,'NQ_ACTION','Operação inválida.');
    const url = Deno.env.get('SUPABASE_URL') || '';
    const publicKey = envKey('SUPABASE_PUBLISHABLE_KEYS','SUPABASE_ANON_KEY');
    const serverKey = envKey('SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !publicKey || !serverKey) return reply(503,'NQ_SERVER_SETUP','Configuração do servidor incompleta.');
    const options = {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
    const client = createClient(url,publicKey,{...options,global:{headers:{Authorization:authorization}}});
    const {data:identity,error:identityError} = await client.auth.getUser(authorization.replace(/^Bearer /i,''));
    if (identityError || !identity?.user) return reply(401,'NQ_SESSION','Sua sessão expirou. Entre novamente.');
    const {data:state,error:stateError} = await client.rpc('nq_acesso_estado');
    if (stateError || state?.versao !== 1) return reply(503,'NQ_SQL_SETUP','Instale o SQL 09 da gestão de acessos.');
    if (state.gestor !== true || state.senha_temporaria !== false)
      return reply(403,'NQ_PERMISSION','Sua conta não tem autorização para administrar acessos.');
    if (body.action === 'status') return reply(200,'NQ_READY','Serviço disponível.',{versao:1});
    if (!institutional(body.email) || body.email.length > 320)
      return reply(400,'NQ_EMAIL','Use e-mail @animaeducacao.com.br ou @ulife.com.br.');
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128
        || !body.password.trim() || body.password !== body.confirmation)
      return reply(400,'NQ_PASSWORD','Informe e confirme uma senha de 8 a 128 caracteres.');
    if (body.action === 'create' && !validName(body.nome))
      return reply(400,'NQ_NAME','Informe o nome completo com até 150 caracteres.');
    if (body.action === 'create' && !['especialista','revisor','admin'].includes(body.perfil))
      return reply(400,'NQ_PROFILE','Escolha Especialista, Revisor ou Admin.');
    if (body.action === 'create' && body.perfil === 'admin' && !adminEmails.has(body.email.trim().toLowerCase()))
      return reply(403,'NQ_PROFILE','O perfil Admin é restrito aos três e-mails autorizados.');
    if (body.action === 'create' && adminEmails.has(body.email.trim().toLowerCase()) && body.perfil !== 'admin')
      return reply(400,'NQ_PROFILE','Use o perfil Admin para um dos três e-mails autorizados.');
    const server = createClient(url,serverKey,options);
    const email = body.email.trim().toLowerCase();
    const marker = {pedido:crypto.randomUUID(),administrador:identity.user.id,email};
    let result;
    if (body.action === 'create') {
      const nome = body.nome.trim().replace(/\s+/g,' ');
      // Cadastro provisionado por gestor autorizado: e-mail confirmado pela equipe.
      // O trigger registra a troca obrigatória na mesma transação da criação.
      result = await server.auth.admin.createUser({email,password:body.password,email_confirm:true,
        user_metadata:{nome,full_name:nome,display_name:nome,perfil_solicitado:body.perfil},
        app_metadata:{nq_acesso_temporario:marker}});
    } else {
      if (typeof body.user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id))
        return reply(400,'NQ_TARGET','Conta inválida. Atualize a lista.');
      if (identity.user.id === body.user_id)
        return reply(409,'NQ_SELF','Outro gestor autorizado deve redefinir a senha da sua conta.');
      const {data:target,error:targetError} = await server.auth.admin.getUserById(body.user_id);
      if (targetError || !target?.user) return reply(404,'NQ_USER_MISSING','Conta não encontrada. Atualize a lista.');
      if (target.user.email?.toLowerCase() !== email)
        return reply(409,'NQ_TARGET_CHANGED','O e-mail mudou. Atualize a lista antes de continuar.');
      result = await server.auth.admin.updateUserById(body.user_id,
        {password:body.password,app_metadata:{nq_acesso_temporario:marker}});
    }
    const {data,error} = result;
    if (error || !data?.user?.id || data.user.email?.toLowerCase() !== email
        || (body.action === 'password' && data.user.id !== body.user_id)) {
      if (['email_exists','user_already_exists'].includes(error?.code))
        return reply(409,'NQ_EMAIL_EXISTS','Já existe uma conta para este e-mail. Localize-a na lista.');
      if (error?.code === 'weak_password') return reply(400,'NQ_WEAK_PASSWORD','Use uma senha mais forte, conforme as regras do projeto.');
      if (error?.code === 'same_password') return reply(400,'NQ_SAME_PASSWORD','Escolha uma senha diferente da atual.');
      if (error?.status === 429) return reply(429,'NQ_RATE','Muitas tentativas. Aguarde e tente novamente.');
      return reply(409,'NQ_SAVE_FAILED','Não foi possível salvar. Confira sua permissão e o cadastro; aguarde um minuto antes de repetir.');
    }
    return reply(200,'NQ_SAVED',body.action === 'create'
      ? 'Conta criada com senha temporária. A pessoa deverá escolher outra no primeiro acesso.'
      : 'Senha temporária definida. A pessoa deverá escolher outra no próximo acesso.',
      {user_id:data.user.id,email:data.user.email});
  } catch {
    // Nenhuma senha, chave, sessão ou corpo da requisição é registrado em logs.
    return reply(500,'NQ_SERVICE','Falha no serviço de acessos. Tente novamente.');
  }
});
