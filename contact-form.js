(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  // Replace the form node to remove any legacy submit handlers.
  const form=original.cloneNode(true);
  original.replaceWith(form);
  form.removeAttribute('onsubmit');
  form.removeAttribute('target');

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const btn=form.querySelector('button[type="submit"]');

  const config=lang.startsWith('en')?{
    sending:'Sending…',
    success:'Message sent successfully. Thank you — I will get back to you as soon as possible.',
    error:'Your message could not be sent. Please check the fields and try again.',
    subject:'New contact | Fabiano Cicala',
    autoresponse:'Hello,\n\nYour message was successfully received through FabianoCicala.com.\n\nThank you for getting in touch. I will review your message and reply as soon as possible.\n\nFabiano Cicala\nEntrepreneur · Founder of CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    success:'Mensaje enviado correctamente. Gracias por el contacto; responderé lo antes posible.',
    error:'No fue posible enviar el mensaje. Revise los campos e inténtelo nuevamente.',
    subject:'Nuevo contacto | Fabiano Cicala',
    autoresponse:'Hola,\n\nSu mensaje fue recibido correctamente a través de FabianoCicala.com.\n\nGracias por ponerse en contacto. Revisaré su mensaje y responderé lo antes posible.\n\nFabiano Cicala\nEmpresario · Fundador de CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    success:'Messaggio inviato con successo. Grazie per il contatto; risponderò appena possibile.',
    error:'Non è stato possibile inviare il messaggio. Controlla i campi e riprova.',
    subject:'Nuovo contatto | Fabiano Cicala',
    autoresponse:'Buongiorno,\n\nIl suo messaggio è stato ricevuto correttamente tramite FabianoCicala.com.\n\nGrazie per il contatto. Leggerò il messaggio e risponderò appena possibile.\n\nFabiano Cicala\nImprenditore · Fondatore di CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:{
    sending:'Enviando…',
    success:'Sua mensagem foi enviada com sucesso. Obrigado pelo contato; retornarei assim que possível.',
    error:'Não foi possível enviar sua mensagem. Confira os campos e tente novamente.',
    subject:'Novo contato | Fabiano Cicala',
    autoresponse:'Olá,\n\nSua mensagem foi recebida com sucesso pelo FabianoCicala.com.\n\nObrigado pelo contato. Vou analisar sua mensagem e retornarei assim que possível.\n\nFabiano Cicala\nEmpresário · Fundador da CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  };

  // Create one status box inside the form. No page change is needed.
  let status=form.querySelector('.form-status-box');
  if(!status){
    status=document.createElement('div');
    status.className='form-status-box';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    Object.assign(status.style,{
      display:'none',
      marginTop:'14px',
      padding:'14px 16px',
      border:'1px solid rgba(216,185,95,.7)',
      background:'rgba(255,255,255,.06)',
      color:'#fff',
      fontWeight:'700',
      lineHeight:'1.45'
    });
    btn.insertAdjacentElement('afterend',status);
  }

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };

  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_captcha','false');
  setHidden('_autoresponse',config.autoresponse);
  setHidden('site',location.href);

  // Remove redirect-only fields; AJAX keeps the visitor on the same page.
  form.querySelectorAll('input[name="_next"],input[name="response"]').forEach(el=>el.remove());

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!form.reportValidity())return;

    const originalLabel=btn.textContent;
    btn.disabled=true;
    btn.textContent=config.sending;
    status.style.display='block';
    status.textContent=config.sending;

    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);

    try{
      const data=new FormData(form);
      const response=await fetch('https://formsubmit.co/ajax/fbcicala@gmail.com',{
        method:'POST',
        body:data,
        headers:{'Accept':'application/json'},
        signal:controller.signal
      });
      const result=await response.json().catch(()=>({}));
      const ok=response.ok && result.success!==false && result.success!=='false';
      if(!ok)throw new Error(result.message||'submit_failed');

      status.textContent=config.success;
      form.reset();
      if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
    }catch(err){
      status.textContent=config.error;
      if(typeof gtag==='function')gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }finally{
      clearTimeout(timeout);
      btn.disabled=false;
      btn.textContent=originalLabel;
    }
  },true);
})();
