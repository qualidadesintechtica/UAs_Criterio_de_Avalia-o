export function isInstitutionalEmail(value,allowedDomains=[]){
  const email=String(value??'').trim().toLowerCase();
  if(/\s/.test(email))return false;
  const parts=email.split('@');
  return parts.length===2&&Boolean(parts[0])&&allowedDomains.includes(parts[1]);
}
