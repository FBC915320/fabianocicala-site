/* Activate ONLY after Worker + Mercado Pago have passed end-to-end tests.
   Define window.EBOOK_DELIVERY_API = 'https://your-worker...' before loading. */
(function(){
 "use strict";
 const api=window.EBOOK_DELIVERY_API;
 if(!api)return;
 const labels={title:"Comprar e-book",email:"Seu e-mail para receber o e-book",submit:"Continuar para pagamento",busy:"Preparando pagamento…",close:"Cancelar"};
 const storagePrefix="fabiano-ebook-order:";
 function el(tag,attrs={},text=""){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));n.textContent=text;return n;}
 async function emailDigest(value){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value.trim().toLowerCase()));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
 async function checkout(bookId,email,button){
  button.disabled=true;const before=button.textContent;button.textContent=labels.busy;
  try{
   const attemptStorageKey="fabiano-ebook-attempt:"+bookId+":"+await emailDigest(email);
   let attempt;try{attempt=JSON.parse(sessionStorage.getItem(attemptStorageKey)||"null")}catch(e){}
   if(!attempt||Date.now()-attempt.createdAt>15*60*1000){attempt={key:crypto.randomUUID()+":"+Date.now(),createdAt:Date.now()};sessionStorage.setItem(attemptStorageKey,JSON.stringify(attempt));}
   const idempotencyKey=attempt.key;
   const res=await fetch(api+"/api/checkout",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":idempotencyKey},body:JSON.stringify({bookId,email})});
   const data=await res.json();if(!res.ok||!data.checkoutUrl||!data.orderId||!data.claim)throw Error(data.error||"Não foi possível iniciar o pagamento");
   sessionStorage.setItem(storagePrefix+data.orderId,JSON.stringify({claim:data.claim,bookId,createdAt:Date.now()}));
   window.location.assign(data.checkoutUrl);
  }catch(error){alert(error.message);button.disabled=false;button.textContent=before;}
 }
 function makeDialog(bookId){
  const old=document.getElementById("ebook-checkout-dialog");if(old)old.remove();
  const d=el("dialog",{id:"ebook-checkout-dialog","aria-labelledby":"ebook-dialog-title"});d.style.cssText="max-width:min(94vw,430px);width:100%;border:1px solid #d0d7e2;border-radius:14px;background:#fff;color:#192a42;padding:25px;box-shadow:0 25px 80px #0009";
  const h=el("h2",{id:"ebook-dialog-title"},labels.title);h.style.cssText="margin:0 0 18px;font-size:1.4rem";
  const form=el("form");form.addEventListener("submit",e=>{e.preventDefault();checkout(bookId,email.value,submit)});
  const lab=el("label",{for:"ebook-buyer-email"},labels.email);lab.style.cssText="display:block;font-size:.9rem;margin-bottom:6px";
  const email=el("input",{id:"ebook-buyer-email",type:"email",autocomplete:"email",placeholder:"voce@exemplo.com",required:"required",maxlength:"254"});email.style.cssText="width:100%;padding:12px;border:1px solid #8793a8;border-radius:8px;font:inherit";
  const note=el("p",{},"O pagamento é feito no Mercado Pago. Seu download será liberado somente após a aprovação.");note.style.cssText="font-size:.85rem;line-height:1.5;color:#5b6678";
  const consentWrap=el("label");consentWrap.style.cssText="display:flex;gap:9px;align-items:flex-start;font-size:.82rem;line-height:1.4;color:#5b6678";
  const consent=el("input",{type:"checkbox",required:"required"});consentWrap.append(consent,document.createTextNode(" Autorizo o uso do meu e-mail para processar o pedido, entregar o e-book e prestar suporte à compra."));
  const action=el("div");action.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:17px";
  const cancel=el("button",{type:"button"},labels.close);cancel.style.cssText="padding:11px 18px;border:1px solid #a1aabb;background:#fff;border-radius:8px;cursor:pointer";cancel.onclick=()=>d.close();
  const submit=el("button",{type:"submit"},labels.submit);submit.style.cssText="padding:11px 18px;border:0;background:#143059;color:#fff;border-radius:8px;cursor:pointer";
  action.append(cancel,submit);form.append(lab,email,note,consentWrap,action);d.append(h,form);document.body.append(d);d.showModal();email.focus();
 }
 document.addEventListener("click",function(e){const btn=e.target.closest("[data-ebook-buy]");if(!btn)return;e.preventDefault();const bookId=btn.getAttribute("data-ebook-buy");if(!bookId)return;makeDialog(bookId);});
 window.FABIANO_EBOOK_CHECKOUT_READY=true;
})();
