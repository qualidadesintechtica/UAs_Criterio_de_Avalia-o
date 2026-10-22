import {isInstitutionalEmail} from './auth-policy.mjs?v=v6-6-10-responsaveis-monday-20261022';

export function validateAccessName(value){
  if(typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value))return {error:'Informe um nome válido.'};
  const nome=value.trim().replace(/\s+/g,' ');
  return !nome||[...nome].length>150?{error:'Informe o nome completo com até 150 caracteres.'}:{nome};
}
export function validateAccessPassword(password,confirmation){
  if(typeof password!=='string'||password.length<8||password.length>128||!password.trim())return 'Use uma senha de 8 a 128 caracteres.';
  if(password!==confirmation)return 'As senhas não conferem.';
  return '';
}
export function validateAccessEmail(value,domains){
  const email=String(value||'').trim().toLowerCase();
  return email.length>320||!isInstitutionalEmail(email,domains)?{error:'Use e-mail @animaeducacao.com.br ou @ulife.com.br.'}:{email};
}
export async function accessError(error){
  let detail;const context=error?.context;
  try{detail=await (context?.clone?context.clone():context)?.json();}catch{}
  const code=detail?.code||error?.code;
  const status=context?.status||error?.status;
  if(code==='NOT_FOUND'||(status===404&&!String(code||'').startsWith('NQ_')))return 'O serviço de criação e senha não foi publicado. Publique a função nq-gerenciar-usuarios no Supabase.';
  if(/FunctionsFetchError|FunctionsRelayError/.test(error?.name||'')||/failed to send.*edge function|failed to fetch|network/i.test(error?.message||''))return 'Não foi possível conectar ao serviço de acessos. Confira se a função nq-gerenciar-usuarios foi publicada e se o endereço deste site está autorizado em NQ_ORIGINS.';
  if(code==='PGRST202'||code==='NQ_SQL_SETUP')return 'A gestão de acessos ainda não foi instalada. Execute o SQL 09 no Supabase.';
  if(code==='40001')return 'Este nome foi alterado por outra pessoa. Feche a edição e atualize a lista.';
  if(code==='42501'||status===403)return 'Sua conta não tem autorização para administrar acessos. Atualize a página.';
  if(code==='NQ_SESSION'||status===401)return 'Sua sessão expirou. Entre novamente no painel.';
  if(code==='same_password')return 'Escolha uma senha diferente da senha temporária.';
  if(code==='weak_password')return 'A senha não atende às regras do projeto. Escolha uma senha mais forte.';
  if(code==='signup_disabled')return 'O cadastro de novas contas está desativado. Solicite o acesso a um gestor autorizado.';
  if(['user_already_exists','email_exists'].includes(code))return 'Use a opção Entrar se já possui uma conta para este e-mail.';
  if(status===429||code==='over_email_send_rate_limit')return 'Muitas tentativas. Aguarde alguns minutos antes de repetir.';
  if(String(code||'').startsWith('NQ_')&&typeof detail?.message==='string')return detail.message.slice(0,350);
  return 'Não foi possível concluir. Confira sua conexão e tente novamente. Se continuar, informe o erro à administração.';
}
