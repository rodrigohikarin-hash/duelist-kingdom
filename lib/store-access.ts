export const storeId=(req:Request)=>new URL(req.url).searchParams.get('store')||req.headers.get('X-Kingdom-Store')||'';
export async function storeAccess(db:any,req:Request,write=false){
 const user=req.headers.get('oai-authenticated-user-id');if(!user)throw Object.assign(Error('Entre com sua conta.'),{status:401});
 const store=storeId(req);if(!store)return {user,scope:user,role:'owner',store:null};
 const row=await db.prepare('SELECT role FROM store_members WHERE store=? AND user=?').bind(store,user).first();
 if(!row||!['owner','staff','judge'].includes(row.role))throw Object.assign(Error('Sua conta não tem acesso à gestão desta loja.'),{status:403});
 if(write&&!['owner','staff','judge'].includes(row.role))throw Object.assign(Error('Sem permissão para editar.'),{status:403});
 return {user,scope:store,role:row.role,store};
}
