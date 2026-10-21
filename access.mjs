import {validateAccessName,validateAccessPassword,validateAccessEmail,accessError} from './access-policy.mjs';

export const PROFILE_LABELS={especialista:'Especialista',revisor:'Revisor',admin:'Admin'};
const ADMIN_EMAILS=new Set(['ligia.neta@animaeducacao.com.br','joao.cane@animaeducacao.com.br','cristina.brito@animaeducacao.com.br']);

export function createAccessController({client,config,createSignupClient,onBlocked,onReady,onNameChanged,onSignedOut}){
  const $=id=>document.getElementById(id);
  let user=null,manager=false,participantsState='none',epoch=0,checkRun=0,listRun=0,offset=0,searchTimer;
  let selected=null,editBusy=false,signupBusy=false,gateBusy=false,gateSaved=false;
  let serviceReady=false,serviceMessage='Verificando o serviço de criação e senha...';
  const message=(id,text,state='')=>{const box=$(id);box.textContent=text;box.dataset.state=state;};
  const fields=id=>$(id).querySelector('fieldset');
  const current=request=>request===epoch&&user;

  function syncParticipants(){
    $('manageUsers').hidden=$('openParticipants').hidden=!user;
    $('usersSearch').disabled=$('usersProfileFilter').disabled=!manager;
    $('usersCreate').disabled=!manager||!serviceReady;
    $('usersRefresh').disabled=!user;
    const note=$('participantsAccessNote');note.hidden=manager;
    if(manager){note.textContent='';return;}
    note.textContent=participantsState==='setup'
      ? 'A gestão de participantes ainda não foi instalada neste projeto. Execute o arquivo supabase/09_USUARIOS_E_ACESSOS.sql e publique a função nq-gerenciar-usuarios. Depois clique em Atualizar.'
      : 'Sua conta não tem autorização para gerenciar participantes. Esta área é restrita a ligia.neta@animaeducacao.com.br, joao.cane@animaeducacao.com.br e cristina.brito@animaeducacao.com.br, com e-mail confirmado e perfil Admin liberado no servidor.';
    if($('userEditorDialog').open)$('userEditorDialog').close();
    $('usersList').replaceChildren();$('usersPrevious').disabled=$('usersNext').disabled=true;
    $('usersPage').textContent='';
  }

  function resetForm(id){
    $(id).reset();
    for(const input of $(id).querySelectorAll('input[type="text"][data-password],input[type="password"]'))input.type='password';
    for(const button of $(id).querySelectorAll('[data-access-toggle]')){button.textContent='Mostrar senhas';button.setAttribute('aria-pressed','false');}
  }
  function clear(){
    epoch++;checkRun++;listRun++;clearTimeout(searchTimer);
    user=null;manager=false;participantsState='none';selected=null;editBusy=false;gateBusy=false;gateSaved=false;serviceReady=false;
    syncParticipants();$('userProfile').textContent='';$('passwordRequired').hidden=true;
    for(const id of ['signupDialog','usersDialog','userEditorDialog'])if($(id).open)$(id).close();
    for(const id of ['signupForm','userEditorForm','requiredForm'])resetForm(id);
    fields('requiredForm').disabled=true;$('usersList').replaceChildren();$('usersSearch').value='';$('usersProfileFilter').value='';offset=0;
    for(const id of ['signupStatus','usersStatus','usersServiceStatus','userEditorStatus','requiredStatus'])message(id,'');
  }
  function showRequired(candidate){
    clear();user=candidate;onBlocked();
    $('login').hidden=true;$('dashboard').hidden=true;$('boot').hidden=true;$('passwordRequired').hidden=false;
    $('requiredEmail').value=user.email||'';
    $('requiredPassword').disabled=$('requiredConfirmation').disabled=false;
    fields('requiredForm').disabled=false;$('requiredSubmit').textContent='Salvar senha pessoal';
    message('requiredStatus','Defina sua senha pessoal para continuar.');$('requiredPassword').focus();
  }
  async function allow(candidate){
    if(user&&user.id!==candidate.id)clear();
    user=candidate;const request=epoch,check=++checkRun;
    const {data,error}=await client.rpc('nq_acesso_estado');
    if(!current(request)||check!==checkRun)return false;
    // Sem SQL novo, contas anteriores continuam usando as permissões existentes.
    // Uma conta marcada como temporária nunca usa esse caminho de compatibilidade.
    if(error?.code==='PGRST202'&&!candidate.app_metadata?.nq_acesso_temporario){
      manager=false;participantsState='setup';serviceReady=false;syncParticipants();$('userProfile').textContent='';return true;
    }
    if(error||data?.versao!==1||typeof data.gestor!=='boolean'||typeof data.senha_temporaria!=='boolean'){
      const failure=new Error('Não foi possível verificar o acesso. Tente novamente; se continuar, avise a administração.');
      failure.code='NQ_ACCESS_STATE';throw failure;
    }
    if(data.senha_temporaria){showRequired(candidate);return false;}
    manager=data.gestor;participantsState=manager?'ready':'denied';
    if(!manager){serviceReady=false;listRun++;if($('userEditorDialog').open)$('userEditorDialog').close();}
    syncParticipants();
    $('userProfile').textContent=PROFILE_LABELS[data.perfil]||'Revisor';
    $('passwordRequired').hidden=true;
    return true;
  }
  function syncEditorService(){
    if(!selected||selected.mode==='name')return;
    $('userEditorSubmit').disabled=!serviceReady;
    if(!serviceReady)message('userEditorStatus',serviceMessage,'error');
    else if(!editBusy)message('userEditorStatus','');
  }
  async function service(){
    if(!manager||!user)return;
    const request=epoch;serviceReady=false;serviceMessage='Verificando o serviço de criação e senha...';
    message('usersServiceStatus',serviceMessage);syncEditorService();syncParticipants();
    try{
      const {data,error}=await client.functions.invoke('nq-gerenciar-usuarios',{body:{action:'status'}});
      if(!current(request)||!manager)return;
      if(error)throw error;
      if(data?.ok!==true||data.versao!==1)throw new Error('service_unavailable');
      serviceReady=true;serviceMessage='Criação de contas e senhas temporárias disponíveis.';
      message('usersServiceStatus',serviceMessage,'success');
    }catch(error){
      const detail=await accessError(error);if(!current(request)||!manager)return;
      serviceMessage=detail;message('usersServiceStatus',detail,'error');
    }
    if(current(request)&&manager){syncEditorService();syncParticipants();}
  }
  async function loadUsers(success=''){
    if(!manager||!user)return;
    const request=epoch,run=++listRun;
    $('usersPrevious').disabled=$('usersNext').disabled=true;$('usersList').replaceChildren();
    message('usersStatus','Carregando contas institucionais...');
    try{
      const {data,error}=await client.rpc('nq_acesso_listar_usuarios',{
        p_busca:$('usersSearch').value.trim(),p_offset:offset,p_limite:101,p_perfil:$('usersProfileFilter').value||null
      });
      if(!current(request)||!manager||run!==listRun)return;
      if(error)throw error;
      const people=Array.isArray(data)?data:[];
      for(const person of people.slice(0,100)){
        const row=document.createElement('article');row.className='users-row';
        const copy=document.createElement('div');copy.className='users-copy';
        const name=document.createElement('strong');name.textContent=person.nome||'Nome não informado';
        const email=document.createElement('small');email.textContent=person.email;
        const role=document.createElement('span');role.className='tag user-role '+(person.perfil==='admin'?'admin':'');role.textContent=PROFILE_LABELS[person.perfil]||'Revisor';
        copy.append(name,email,role);
        if(person.senha_temporaria||!person.confirmado){const status=document.createElement('small');status.textContent=person.senha_temporaria?'Troca de senha pendente':'E-mail ainda não confirmado';copy.append(status);}
        const actions=document.createElement('div');actions.className='users-row-actions';
        for(const [mode,label] of [['name','Editar nome e perfil'],['password','Trocar senha']]){
          const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent=label;
          button.setAttribute('aria-label',label+' de '+(person.nome||person.email));
          button.addEventListener('click',()=>openEditor(mode,person));actions.append(button);
        }
        row.append(copy,actions);$('usersList').append(row);
      }
      if(!people.length){const empty=document.createElement('p');empty.textContent='Nenhuma conta encontrada neste recorte.';$('usersList').append(empty);}
      $('usersPrevious').disabled=offset===0;$('usersNext').disabled=people.length<=100;
      $('usersPage').textContent='Página '+(offset/100+1);
      message('usersStatus',success||Math.min(people.length,100)+' conta(s) nesta página.',success?'success':'');
    }catch(error){
      const detail=await accessError(error);if(!current(request)||run!==listRun)return;
      if(error?.code==='42501'){manager=false;participantsState='denied';serviceReady=false;syncParticipants();if($('userEditorDialog').open)$('userEditorDialog').close();}
      message('usersStatus',detail,'error');
    }
  }
  function adjustAdminOption(){
    const option=$('userEditProfile').querySelector('option[value="admin"]');
    option.disabled=!ADMIN_EMAILS.has($('userEditEmail').value.trim().toLowerCase());
    if(option.disabled&&$('userEditProfile').value==='admin')$('userEditProfile').value='revisor';
    if(selected?.mode==='create'){
      $('userEditProfile').disabled=!option.disabled;
      if(!option.disabled)$('userEditProfile').value='admin';
    }
  }
  function openEditor(mode,person=null){
    if(!manager||!user||editBusy)return;
    selected={mode,person:person?{...person}:null};resetForm('userEditorForm');fields('userEditorForm').disabled=false;
    const isPassword=mode==='password';
    $('userEditorTitle').textContent=mode==='create'?'Criar login':isPassword?'Definir senha temporária':'Editar nome e perfil';
    $('userEditorIntro').textContent=mode==='name'?'O nome e o perfil serão atualizados nesta conta. Os comentários e seus históricos serão preservados.':'Informe os dados e comunique a senha temporária à pessoa. No primeiro acesso, ela deverá escolher outra. A senha não será enviada por e-mail.';
    for(const id of ['userNameLabel','userEditName','userProfileLabel','userEditProfile'])$(id).hidden=isPassword;
    $('userEditName').required=!isPassword;$('userEditName').value=person?.nome||'';
    $('userEditProfile').value=person?.perfil||'revisor';$('userEditProfile').disabled=isPassword;
    $('userEditEmail').value=person?.email||'';$('userEditEmail').readOnly=mode!=='create';adjustAdminOption();
    $('userPasswordFields').hidden=mode==='name';
    for(const id of ['userEditPassword','userEditConfirmation'])$(id).required=mode!=='name';
    $('userEditorSubmit').disabled=false;$('userEditorSubmit').textContent=mode==='create'?'Criar conta':isPassword?'Definir senha temporária':'Salvar nome e perfil';
    message('userEditorStatus','');syncEditorService();$('userEditorDialog').showModal();
    (isPassword?$('userEditPassword'):$('userEditName')).focus();
  }
  $('userEditEmail').addEventListener('input',adjustAdminOption);
  function openParticipants(){
    if(!user)return;
    syncParticipants();$('usersDialog').showModal();
    if(manager){loadUsers();service();}
    else {message('usersStatus','');message('usersServiceStatus','');}
  }
  $('manageUsers').addEventListener('click',openParticipants);
  $('openParticipants').addEventListener('click',openParticipants);
  $('usersCreate').addEventListener('click',()=>{if(serviceReady)openEditor('create');});
  $('usersRefresh').addEventListener('click',async()=>{
    if(!user)return;
    const request=epoch,expected=user.id;$('usersRefresh').disabled=true;
    message('usersStatus','Verificando acesso a participantes...');
    try{
      const {data,error}=await client.auth.getUser();
      if(!current(request))return;
      if(error||!data?.user||data.user.id!==expected){clear();await onSignedOut();return;}
      if(!await allow(data.user))return;
      if(manager){loadUsers();service();}else{message('usersStatus','');message('usersServiceStatus','');}
    }catch{if(current(request))message('usersStatus','Não foi possível verificar sua autorização. Tente Atualizar novamente.','error');}
    finally{if(current(request))$('usersRefresh').disabled=false;}
  });
  $('usersSearch').addEventListener('input',()=>{clearTimeout(searchTimer);listRun++;offset=0;searchTimer=setTimeout(()=>loadUsers(),250);});
  $('usersProfileFilter').addEventListener('change',()=>{offset=0;loadUsers();});
  $('usersPrevious').addEventListener('click',()=>{offset=Math.max(0,offset-100);loadUsers();});
  $('usersNext').addEventListener('click',()=>{offset+=100;loadUsers();});
  $('userEditorDialog').addEventListener('close',()=>{selected=null;resetForm('userEditorForm');});
  $('userEditorForm').addEventListener('submit',async event=>{
    event.preventDefault();if(!manager||!user||!selected||editBusy)return;
    const item={...selected},request=epoch;
    const email=validateAccessEmail($('userEditEmail').value,config.allowedDomains);
    const name=validateAccessName($('userEditName').value);
    const passwordError=validateAccessPassword($('userEditPassword').value,$('userEditConfirmation').value);
    const validation=email.error||(item.mode!=='password'&&name.error)||(item.mode!=='name'&&passwordError);
    if(validation){message('userEditorStatus',validation,'error');return;}
    if(item.mode!=='name'&&!serviceReady){syncEditorService();return;}
    editBusy=true;fields('userEditorForm').disabled=true;message('userEditorStatus','Salvando...');
    try{
      let success;
      if(item.mode==='name'){
        const {data,error}=await client.rpc('nq_acesso_editar_nome',{p_user_id:item.person.user_id,
          p_nome:name.nome,p_nome_anterior:item.person.nome||'',p_perfil:$('userEditProfile').value});
        if(!current(request))return;if(error)throw error;
        if(!data?.[0]?.user_id)throw new Error('missing_saved_user');
        if(item.person.user_id===user.id){
          onNameChanged(name.nome);
          try{await client.auth.refreshSession();}catch{}
        }
        success='Nome e perfil atualizados.';
      }else{
        const {data,error}=await client.functions.invoke('nq-gerenciar-usuarios',{body:{
          action:item.mode==='create'?'create':'password',user_id:item.person?.user_id,
          email:email.email,nome:name.nome,perfil:$('userEditProfile').value,
          password:$('userEditPassword').value,confirmation:$('userEditConfirmation').value
        }});
        if(!current(request))return;if(error)throw error;
        if(data?.ok!==true)throw new Error('missing_saved_user');
        success=item.mode==='create'?'Conta criada. Informe a senha temporária à pessoa; a troca será obrigatória no primeiro acesso.':'Senha temporária definida. A troca será obrigatória no próximo acesso.';
      }
      if(!current(request))return;
      $('userEditorDialog').close();await loadUsers(success);
    }catch(error){
      const detail=await accessError(error);if(current(request))message('userEditorStatus',detail,'error');
    }finally{if(current(request)){editBusy=false;fields('userEditorForm').disabled=false;}}
  });

  $('openSignup').addEventListener('click',()=>{
    if(user||signupBusy)return;
    resetForm('signupForm');fields('signupForm').disabled=false;message('signupStatus','');$('signupDialog').showModal();$('signupName').focus();
  });
  $('signupDialog').addEventListener('close',()=>resetForm('signupForm'));
  $('signupForm').addEventListener('submit',async event=>{
    event.preventDefault();if(signupBusy||user)return;
    const request=epoch,name=validateAccessName($('signupName').value),email=validateAccessEmail($('signupEmail').value,config.allowedDomains);
    const invalid=name.error||email.error||validateAccessPassword($('signupPassword').value,$('signupConfirmation').value);
    if(invalid){message('signupStatus',invalid,'error');return;}
    const profile=$('signupProfile').value;
    if(!['especialista','revisor'].includes(profile)){message('signupStatus','Escolha Especialista ou Revisor.','error');return;}
    signupBusy=true;fields('signupForm').disabled=true;message('signupStatus','Solicitando cadastro...');
    let signup;
    try{
      // Cliente separado e sem persistência: não substitui a sessão da administração.
      signup=createSignupClient();
      const {data,error}=await signup.auth.signUp({email:email.email,password:$('signupPassword').value,
        options:{data:{nome:name.nome,full_name:name.nome,display_name:name.nome,perfil_solicitado:profile},
          emailRedirectTo:new URL('./',location.href).href}});
      if(request!==epoch)return;if(error)throw error;
      if(!data?.user)throw new Error('signup_incomplete');
      $('signupPassword').value=$('signupConfirmation').value='';
      message('signupStatus',data.session?'Cadastro recebido. Feche esta janela e entre com seu e-mail e senha.':'Solicitação recebida. Confira seu e-mail para confirmar o cadastro. Se já possui uma conta, utilize Entrar.','success');
    }catch(error){const detail=await accessError(error);if(request===epoch)message('signupStatus',detail,'error');}
    finally{
      try{await signup?.auth.signOut({scope:'local'});}catch{}
      signupBusy=false;if(request===epoch)fields('signupForm').disabled=false;
    }
  });

  $('requiredForm').addEventListener('submit',async event=>{
    event.preventDefault();if(gateBusy||!user)return;
    if(!gateSaved){const invalid=validateAccessPassword($('requiredPassword').value,$('requiredConfirmation').value);if(invalid){message('requiredStatus',invalid,'error');return;}}
    const request=epoch,expected=user.id;gateBusy=true;fields('requiredForm').disabled=true;
    message('requiredStatus',gateSaved?'Verificando a troca...':'Salvando sua senha pessoal...');
    try{
      const {data:identity,error:identityError}=await client.auth.getUser();
      if(!current(request))return;
      if(identityError||identity?.user?.id!==expected){clear();onSignedOut('Sua sessão foi encerrada ou alterada. Entre novamente.');return;}
      if(!gateSaved){
        const {data,error}=await client.auth.updateUser({password:$('requiredPassword').value});
        if(!current(request))return;if(error)throw error;
        if(data?.user?.id!==expected)throw Object.assign(new Error('session_changed'),{status:401});
        gateSaved=true;$('requiredPassword').value=$('requiredConfirmation').value='';
        $('requiredPassword').disabled=$('requiredConfirmation').disabled=true;$('requiredSubmit').textContent='Verificar troca e continuar';
      }
      const {data:access,error:accessFailure}=await client.rpc('nq_acesso_estado');
      if(!current(request))return;if(accessFailure)throw accessFailure;
      if(access?.senha_temporaria!==false||access?.versao!==1)throw new Error('password_still_required');
      const {data:updated,error:updatedError}=await client.auth.getUser();
      if(!current(request))return;
      if(updatedError||updated?.user?.id!==expected)throw Object.assign(new Error('session_changed'),{status:401});
      await onReady(updated.user);
      if(current(request)){$('passwordRequired').hidden=true;gateSaved=false;}
    }catch(error){
      const detail=await accessError(error);if(current(request))message('requiredStatus',gateSaved?'Sua senha foi salva. Não foi possível confirmar a liberação; clique em Verificar troca e continuar.':detail,'error');
    }finally{if(current(request)){gateBusy=false;fields('requiredForm').disabled=false;}}
  });
  $('requiredLogout').addEventListener('click',async()=>{
    if(gateBusy)return;clear();try{await client.auth.signOut({scope:'local'});}catch{}onSignedOut();
  });
  for(const button of document.querySelectorAll('[data-access-close]'))button.addEventListener('click',()=>{
    const id=button.dataset.accessClose;
    if((id==='userEditorDialog'&&editBusy)||(id==='signupDialog'&&signupBusy))return;
    $(id).close();
  });
  for(const [id,isBusy] of [['userEditorDialog',()=>editBusy],['signupDialog',()=>signupBusy]])$(id).addEventListener('cancel',event=>{if(isBusy())event.preventDefault();});
  for(const button of document.querySelectorAll('[data-access-toggle]'))button.addEventListener('click',()=>{
    const inputs=button.dataset.accessToggle.split(',').map($),visible=inputs[0].type==='password';
    for(const input of inputs){input.type=visible?'text':'password';input.dataset.password='';}
    button.textContent=visible?'Ocultar senhas':'Mostrar senhas';button.setAttribute('aria-pressed',String(visible));
  });
  return {allow,clear};
}
