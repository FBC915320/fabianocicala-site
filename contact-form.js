(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  // Replace legacy handlers so only this implementation controls submission.
  const form=original.cloneNode(true);
  original.replaceWith(form);
  form.removeAttribute('onsubmit');
  form.removeAttribute('target');

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const btn=form.querySelector('button[type="submit"]');
  const config=lang.startsWith('en')?{
    sending:'Sending…',
    success:'Your message was sent successfully. Thank you — I will get back to you as soon as possible.',
    error:'Your message could not be sent. Please try again or email fbcicala@gmail.com.',
    subject:'New contact | Fabiano Cicala',
    autoresponse:'Hello,\n\nYour message was successfully received through FabianoCicala.com.\n\nThank you for getting in touch. I will review your message and reply as soon as possible.\n\nFabiano Cicala\nEntrepreneur · Founder of CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    success:'Su mensaje fue enviado correctamente. Gracias por el contacto; responderé lo antes posible.',
    error:'No fue posible enviar el mensaje. Inténtelo nuevamente o escriba a fbcicala@gmail.com.',
    subject:'Nuevo contacto | Fabiano Cicala',
    autoresponse:'Hola,\n\nSu mensaje fue recibido correctamente a través de FabianoCicala.com.\n\nGracias por ponerse en contacto. Revisaré su mensaje y responderé lo antes posible.\n\nFabiano Cicala\nEmpresario · Fundador de CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    success:'Il messaggio è stato inviato con successo. Grazie; risponderò appena possibile.',
    error:'Non è stato possibile inviare il messaggio. Riprova o scrivi a fbcicala@gmail.com.',
    subject:'Nuovo contatto | Fabiano Cicala',
    autoresponse:'Buongiorno,\n\nIl suo messaggio è stato ricevuto correttamente tramite FabianoCicala.com.\n\nGrazie per il contatto. Leggerò il messaggio e risponderò appena possibile.\n\nFabiano Cicala\nImprenditore · Fondatore di CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:{
    sending:'Enviando…',
    success:'Sua mensagem foi enviada com sucesso. Obrigado pelo contato; retornarei assim que possível.',
    error:'Não foi possível enviar sua mensagem. Tente novamente ou escreva para fbcicala@gmail.com.',
    subject:'Novo contato | Fabiano Cicala',
    autoresponse:'Olá,\n\nSua mensagem foi recebida com sucesso pelo FabianoCicala.com.\n\nObrigado pelo contato. Vou analisar sua mensagem e retornarei assim que possível.\n\nFabiano Cicala\nEmpresário · Fundador da CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  };

  // Activated FormSubmit token. AJAX keeps the visitor on the same page.
  const endpoint='https://formsubmit.co/ajax/b1683556bf571ec55cad89e14c6fbaab';

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };

  form.querySelectorAll('input[name="_captcha"],input[name="response"],input[name="_next"]').forEach(el=>el.remove());
  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_autoresponse',config.autoresponse);
  setHidden('_honey','');
  setHidden('site',location.href);

  let status=form.querySelector('.form-status-box');
  if(!status){
    status=document.createElement('div');
    status.className='form-status-box';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    btn.insertAdjacentElement('afterend',status);
  }

  const show=(type,text)=>{
    status.className=`form-status-box ${type}`;
    status.textContent=text;
    status.style.display='block';
  };

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!form.reportValidity())return;

    btn.disabled=true;
    show('sending',config.sending);

    const data=new FormData(form);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Accept':'application/json'},
        body:data,
        signal:controller.signal
      });
      const result=await response.json().catch(()=>({}));
      const explicitFailure=result.success===false||result.success==='false';
      if(!response.ok||explicitFailure)throw new Error(result.message||'submit_failed');

      show('success',config.success);
      form.reset();
      if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
    }catch(err){
      show('error',config.error);
      if(typeof gtag==='function')gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }finally{
      clearTimeout(timer);
      btn.disabled=false;
    }
  },true);
})();
