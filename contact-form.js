(()=>{
  const form=document.getElementById('contact-form');
  if(!form)return;
  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const copy=lang.startsWith('en')?{
    sending:'Sending…',success:'Message sent successfully.',activation:'One-time activation email sent to the site owner. Please try again after activation.',error:'We could not send the message. Please email fbcicala@gmail.com.'
  }:lang.startsWith('es')?{
    sending:'Enviando…',success:'Mensaje enviado correctamente.',activation:'Se envió un correo de activación único al propietario del sitio. Inténtelo de nuevo después de la activación.',error:'No fue posible enviar el mensaje. Escriba a fbcicala@gmail.com.'
  }:lang.startsWith('it')?{
    sending:'Invio…',success:'Messaggio inviato con successo.',activation:'È stata inviata un’email di attivazione una tantum al proprietario del sito. Riprova dopo l’attivazione.',error:'Non è stato possibile inviare il messaggio. Scrivi a fbcicala@gmail.com.'
  }:{
    sending:'Enviando…',success:'Mensagem enviada com sucesso.',activation:'Foi enviado um e-mail de ativação única ao responsável pelo site. Tente novamente após a ativação.',error:'Não foi possível enviar a mensagem. Escreva para fbcicala@gmail.com.'
  };
  const status=form.querySelector('.status')||document.getElementById('status');
  const btn=form.querySelector('button[type="submit"]');
  const endpoint='https://formsubmit.co/ajax/fbcicala@gmail.com';

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!form.reportValidity())return;
    if(btn)btn.disabled=true;
    if(status)status.textContent=copy.sending;
    const fd=new FormData(form);
    const payload={};
    fd.forEach((v,k)=>{ if(k!=='_gotcha'&&k!=='_honey') payload[k]=v; });
    payload._subject='Novo contato pelo site Fabiano Cicala';
    payload._template='table';
    payload._captcha='false';
    payload.site=location.href;

    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const r=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload),
        signal:controller.signal
      });
      const data=await r.json().catch(()=>({}));
      const msg=String(data.message||'');
      if(!r.ok||data.success===false||data.success==='false')throw new Error(msg||'submit_failed');
      if(/activat|confirm/i.test(msg)){
        if(status)status.textContent=copy.activation;
        if(typeof gtag==='function')gtag('event','form_activation_required',{form_id:'contact-form',language:lang});
      }else{
        if(status)status.textContent=copy.success;
        form.reset();
        if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
      }
    }catch(err){
      if(status){
        status.innerHTML=copy.error.replace('fbcicala@gmail.com','<a href="mailto:fbcicala@gmail.com" style="color:#fff">fbcicala@gmail.com</a>');
      }
      if(typeof gtag==='function')gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }finally{
      clearTimeout(timeout);
      if(btn)btn.disabled=false;
    }
  },true);
})();
