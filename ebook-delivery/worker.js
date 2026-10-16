// Private EPUB delivery for Cloudflare Workers, D1 and R2.
// DO NOT DEPLOY before real R2 keys, Mercado Pago credentials and sandbox tests.
const CATALOG = Object.freeze({
  "a-estrategia-do-invisivel": {title:"A Estratégia do Invisível",cents:2490,key:"ebooks/a-estrategia-do-invisivel.epub"},
  "posicione-se-e-venca-pela-fe": {title:"Posicione-se e Vença pela Fé",cents:1490,key:"ebooks/posicione-se-e-venca-pela-fe.epub"},
  "corolla-cross-hybrid-13-problemas": {title:"Corolla Cross Hybrid + 13 Problemas",cents:990,key:"ebooks/corolla-cross-hybrid-13-problemas.epub"},
  "quando-o-dia-termina": {title:"Quando o Dia Termina",cents:2490,key:"ebooks/quando-o-dia-termina.epub"}
});
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,"0")).join("");
const hex=arr=>Array.from(new Uint8Array(arr)).map(b=>b.toString(16).padStart(2,"0")).join("");
const err=(message,status=400)=>json({error:message},status);
const valid=(s,lim=200)=>typeof s==="string"&&s.length>0&&s.length<=lim;
function configured(env){return !!(env.ORDERS&&env.PRIVATE_EBOOKS&&env.MP_ACCESS_TOKEN&&env.MP_WEBHOOK_SECRET&&env.PUBLIC_SITE&&env.PUBLIC_API);}
function secureOrigin(request,env){return request.headers.get("origin")===env.PUBLIC_SITE;}
function cors(response,env){const h=new Headers(response.headers);h.set("Access-Control-Allow-Origin",env.PUBLIC_SITE);h.set("Vary","Origin");return new Response(response.body,{status:response.status,headers:h});}
function getPath(req){return new URL(req.url).pathname;}
async function readOrder(env,id,claim){if(!valid(id,64)||!valid(claim,128))return null;const order=await env.ORDERS.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();return order&&order.claim_hash===await sha(claim)?order:null;}
async function parseBody(req){if(Number(req.headers.get("content-length")||0)>4096)throw Error("large");const t=await req.text();if(t.length>4096)throw Error("large");return JSON.parse(t);}
async function mpRequest(url,env,options={}){
 const r=await fetch(url,{...options,headers:{"Authorization":"Bearer "+env.MP_ACCESS_TOKEN,"Content-Type":"application/json",...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error("mercadopago "+r.status);return data;
}
async function verifyWebhook(req,env,id){
 const raw=req.headers.get("x-signature")||"";const requestId=req.headers.get("x-request-id")||"";
 const parts=Object.fromEntries(raw.split(",").map(p=>p.trim().split("=")));
 if(!valid(parts.ts,32)||!valid(parts.v1,128)||!valid(requestId,128))return false;
 if(Math.abs(Date.now()/1000-Number(parts.ts))>600)return false;
 const manifest="id:"+id.toLowerCase()+";request-id:"+requestId+";ts:"+parts.ts+";";
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.MP_WEBHOOK_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const actual=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(manifest)));
 if(actual.length!==parts.v1.length)return false;
 let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^parts.v1.charCodeAt(i);
 return diff===0;
}
async function checkout(req,env){
 if(!secureOrigin(req,env))return err("Origem não autorizada",403);
 const body=await parseBody(req);
 const id=body.bookId,email=String(body.email||"").trim().toLowerCase();
 if(!Object.hasOwn(CATALOG,id)||!valid(email,254)||!/^.+@[^@\s]+\.[^@\s]+$/.test(email))return err("Livro ou e-mail inválido");
 if(!(String(env.ENABLED_BOOKS||"").split(",").includes(id)))return err("Livro ainda indisponível",409);
 const book=CATALOG[id];if(!await env.PRIVATE_EBOOKS.head(book.key))return err("Arquivo final não cadastrado",409);
 const orderId=crypto.randomUUID(),claim=crypto.randomUUID()+crypto.randomUUID(),hash=await sha(claim),now=Date.now();
 await env.ORDERS.prepare("INSERT INTO orders(id,book_id,email,amount_cents,currency,claim_hash,status,created_at,updated_at,download_count) VALUES(?,?,?,?,?,?,'pending',?,?,0)").bind(orderId,id,email,book.cents,"BRL",hash,now,now).run();
 try{
   const pref=await mpRequest("https://api.mercadopago.com/checkout/preferences",env,{method:"POST",headers:{"X-Idempotency-Key":orderId},body:JSON.stringify({
     items:[{id,title:book.title,quantity:1,currency_id:"BRL",unit_price:book.cents/100}],
     payer:{email},external_reference:orderId,notification_url:env.PUBLIC_API+"/api/mp-webhook",
     back_urls:{success:env.PUBLIC_SITE+"/livros/compra/?pedido="+encodeURIComponent(orderId),failure:env.PUBLIC_SITE+"/livros/compra/?pedido="+encodeURIComponent(orderId),pending:env.PUBLIC_SITE+"/livros/compra/?pedido="+encodeURIComponent(orderId)}
   })});
   if(!pref.id||!pref.init_point)throw Error("No checkout");
   await env.ORDERS.prepare("UPDATE orders SET preference_id=?,updated_at=? WHERE id=?").bind(String(pref.id),Date.now(),orderId).run();
   return json({orderId,claim,checkoutUrl:pref.init_point});
 }catch(e){await env.ORDERS.prepare("UPDATE orders SET status='checkout_error',updated_at=? WHERE id=?").bind(Date.now(),orderId).run();return err("Falha ao iniciar pagamento. Nenhuma entrega foi liberada.",502);}
}
async function webhook(req,env){
 const url=new URL(req.url);const id=url.searchParams.get("data.id");
 if(!valid(id,40)||!/^[0-9]+$/.test(id))return err("Notificação inválida");
 if(!await verifyWebhook(req,env,id))return err("Assinatura inválida",401);
 const payment=await mpRequest("https://api.mercadopago.com/v1/payments/"+id,env);
 const orderId=payment.external_reference; if(!valid(orderId,64))return err("Referência inválida");
 const order=await env.ORDERS.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first();
 if(!order)return err("Pedido não encontrado",404);
 if(payment.currency_id!=="BRL"||Math.round(Number(payment.transaction_amount)*100)!==order.amount_cents)return err("Divergência de valor",409);
 const state=payment.status==="approved"?"approved":payment.status==="refunded"||payment.status==="charged_back"?"revoked":payment.status==="cancelled"||payment.status==="rejected"?"rejected":"pending";
 await env.ORDERS.prepare("UPDATE orders SET status=?,payment_id=?,updated_at=? WHERE id=?").bind(state,String(payment.id),Date.now(),orderId).run();
 return json({received:true});
}
async function status(req,env){
 if(!secureOrigin(req,env))return err("Origem não autorizada",403);
 const body=await parseBody(req);const o=await readOrder(env,body.orderId,body.claim);
 if(!o)return err("Pedido não encontrado",404);
 return json({status:o.status,bookTitle:CATALOG[o.book_id]?.title||"E-book",downloads:o.download_count});
}
async function download(req,env){
 if(!secureOrigin(req,env))return err("Origem não autorizada",403);
 const body=await parseBody(req);const o=await readOrder(env,body.orderId,body.claim);
 if(!o||o.status!=="approved")return err("Pagamento ainda não confirmado",403);
 if(Date.now()-o.created_at>30*86400000)return err("O prazo de download expirou; solicite reenvio",410);
 const book=CATALOG[o.book_id];if(!book)return err("Livro indisponível",404);
 const limit=await env.ORDERS.prepare("UPDATE orders SET download_count=download_count+1,updated_at=? WHERE id=? AND download_count<10 AND status='approved'").bind(Date.now(),o.id).run();
 if(limit.meta.changes!==1)return err("Limite de downloads; solicite suporte",429);
 const object=await env.PRIVATE_EBOOKS.get(book.key);
 if(!object)return err("Arquivo temporariamente indisponível",503);
 return new Response(object.body,{headers:{"Content-Type":"application/epub+zip","Content-Disposition":"attachment; filename=\""+o.book_id+".epub\"","Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
}
export default {async fetch(req,env){
 const path=getPath(req);
 if(req.method==="GET"&&path==="/health")return json({status:configured(env)?"ready":"unconfigured"});
 if(!configured(env))return err("Entrega digital ainda não configurada",503);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":env.PUBLIC_SITE,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"3600"}});
 try{
   if(req.method==="POST"&&path==="/api/mp-webhook")return webhook(req,env);
   let result;
   if(req.method==="POST"&&path==="/api/checkout")result=await checkout(req,env);
   else if(req.method==="POST"&&path==="/api/order-status")result=await status(req,env);
   else if(req.method==="POST"&&path==="/api/download")result=await download(req,env);
   else return err("Rota não encontrada",404);
   return cors(result,env);
 }catch(e){return err("Não foi possível concluir a operação",500);}
}};