(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

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
    subject:'New contact | Fabiano Cicala'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    success:'Su mensaje fue enviado correctamente. Gracias por el contacto; responderé lo antes posible.',
    error:'No fue posible enviar el mensaje. Inténtelo nuevamente o escriba a fbcicala@gmail.com.',
    subject:'Nuevo contacto | Fabiano Cicala'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    success:'Il messaggio è stato inviato con successo. Grazie; risponderò appena possibile.',
    error:'Non è stato possibile inviare il messaggio. Riprova o scrivi a fbcicala@gmail.com.',
    subject:'Nuovo contatto | Fabiano Cicala'
  }:{
    sending:'Enviando…',
    success:'Sua mensagem foi enviada com sucesso. Obrigado pelo contato; retornarei assim que possível.',
    error:'Não foi possível enviar sua mensagem. Tente novamente ou escreva para fbcicala@gmail.com.',
    subject:'Novo contato | Fabiano Cicala'
  };

  // FormSubmit documents the AJAX endpoint with the destination e-mail address.
  const endpoint='https://formsubmit.co/ajax/fbcicala@gmail.com';

  form.querySelectorAll('input[name="_captcha"],input[name="response"],input[name="_next"],input[name="_autoresponse"]').forEach(el=>el.remove());

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };
  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_url',location.href);
  setHidden('site',location.href);
  setHidden('_honey','');

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
      const ok=response.ok && !(result.success===false || result.success==='false');
      if(!ok)throw new Error(result.message||'submit_failed');

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
