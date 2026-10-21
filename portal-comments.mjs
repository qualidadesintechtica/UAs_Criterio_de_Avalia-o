import {text} from './core.mjs?v=v6-6-8-comentarios-download-20261021';

// IDs da fonte continuam estáveis mesmo quando o vínculo ou o nome do material muda.
export function commentSourceKey(record){
  if(record.portalAddition)return record.portal.source_key;
  if(record.inventoryOnly&&record.materialKey)return 'material:'+record.materialKey;
  if(record.raw?.subitem_id!=null)return 'criterio:'+text(record.raw.subitem_id);
  if(record.id?.startsWith('comment:'))return 'parecer:'+record.id.slice(8);
  if(record.sourceEvent)return 'avaliacao:'+record.sourceEvent+':'+(record.criterionKey||'metadata');
  if(record.id&&!record.id.includes(':'))return 'criterio:'+record.id;
  return '';
}

export function applyPortalComments(sections,comments){
  const bySource=new Map();
  for(const c of comments){if(!bySource.has(c.source_key))bySource.set(c.source_key,[]);bySource.get(c.source_key).push(c);}
  const overlayRecord=original=>{
    const overlay=(bySource.get(commentSourceKey(original))||[]).find(c=>c.mode==='source');
    return {...original,...(overlay?{comment:overlay.body,mondayComment:original.comment,portal:overlay}:{}),
      history:(original.history||[]).map(overlayRecord)};
  };
  return Object.fromEntries(Object.entries(sections).map(([kind,section])=>{
    const records=[];
    const attached=new Set();
    for(const original of section.records){
      records.push(overlayRecord(original));
      // Complementos ancorados a uma classificação anterior continuam no material.
      const refs=[original,...(original.history||[])].map(ref=>({key:commentSourceKey(ref),criterion:ref.criterion}));
      if(original.materialKey)refs.push({key:'material:'+original.materialKey,criterion:'Registro do material'});
      for(const ref of refs)for(const note of (bySource.get(ref.key)||[]).filter(c=>c.mode==='addition'||(c.mode==='source'&&c.source_key.startsWith('material:')&&c.source_key!==commentSourceKey(original)))){
        if(attached.has(note.id))continue;attached.add(note.id);
        records.push({...original,
          id:'portal:'+note.id,criterion:'Comentário do professor',question:'Referência: '+ref.criterion,
          comment:note.body,status:'comment',commentOnly:true,metadataOnly:false,
          classification:'Comentário complementar',date:note.updated_at,history:[],
          sourceLabel:'Comentário registrado no painel',portal:note,portalAddition:true
        });
      }
    }
    return [kind,{...section,records}];
  }));
}

export function validateComment(value){
  const body=String(value??'').trim();
  if(!body)return {error:'Escreva um comentário antes de salvar.'};
  if([...body].length>10000)return {error:'O comentário deve ter até 10.000 caracteres.'};
  return {body};
}

export function commentError(error){
  if(/NQ_COMMENT_CONFLICT|NQ_SOURCE_CHANGED/.test(error?.message||''))return 'Este registro mudou enquanto você editava. Seu texto foi mantido. Copie-o, atualize os dados e confira a versão mais recente antes de tentar novamente.';
  if(error?.code==='PGRST202'||error?.code==='42P01'||error?.code==='PGRST205')return 'A edição de comentários ainda não foi instalada. Solicite a execução do SQL 05 no Supabase e atualize os dados.';
  if(error?.code==='42501'||error?.code==='PGRST301'||error?.status===401||error?.status===403)return 'Sua sessão expirou ou sua conta não tem permissão para gravar. Seu texto foi mantido; copie-o antes de entrar novamente.';
  if(/NQ_SOURCE_NOT_FOUND/.test(error?.message||''))return 'O registro de origem não está disponível. Seu texto foi mantido; copie-o e atualize os dados.';
  return 'Não foi possível confirmar a gravação. Seu texto foi mantido. Tente novamente; o histórico evita duplicar uma gravação já concluída.';
}
