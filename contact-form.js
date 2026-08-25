(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  // Replace any legacy form handlers from previous implementations.
  const form=original.cloneNode(true);
  original.replaceWith(form);
  form.removeAttribute('onsubmit');

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

  // Use the activated FormSubmit token instead of exposing the e-mail address.
  form.method='POST';
  form.action='https://formsubmit.co/b1683556bf571ec55cad89e14c6fbaab';
  form.target='fabiano-form-target';

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };

  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_autoresponse',config.autoresponse);
  setHidden('_next','https://fabianocicala.com/form-sent.html');
  setHidden('_url',location.href);
  setHidden('site',location.href);
  setHidden('_honey','');

  // Autoresponse requires a normal submission, so do not use AJAX or disable reCAPTCHA.
  form.querySelectorAll('input[name="_captcha"],input[name="response"]').forEach(el=>el.remove());

  let iframe=document.querySelector('iframe[name="fabiano-form-target"]');
  if(!iframe){
    iframe=document.createElement('iframe');
    iframe.name='fabiano-form-target';
    iframe.title='Envio do formulário';
    iframe.style.display='none';
    document.body.appendChild(iframe);
  }

  let status=form.querySelector('.form-status-box');
  if(!status){
    status=document.createElement('div');
    status.className='form-status-box';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    Object.assign(status.style,{
      display:'none',marginTop:'14px',padding:'14px 16px',
      border:'1px solid rgba(216,185,95,.7)',background:'rgba(255,255,255,.06)',
      color:'#fff',fontWeight:'700',lineHeight:'1.45'
    });
    btn.insertAdjacentElement('afterend',status);
  }

  let pending=false;
  let timer=null;
  const originalLabel=btn.textContent;

  const finish=(ok)=>{
    if(!pending)return;
    pending=false;
    clearTimeout(timer);
    btn.disabled=false;
    btn.textContent=originalLabel;
    status.style.display='block';
    status.textContent=ok?config.success:config.error;
    if(ok){
      form.reset();
      if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
    }else if(typeof gtag==='function'){
      gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }
  };

  form.addEventListener('submit',(e)=>{
    if(!form.reportValidity()){e.preventDefault();return;}
    pending=true;
    btn.disabled=true;
    btn.textContent=config.sending;
    status.style.display='block';
    status.textContent=config.sending;
    clearTimeout(timer);
    timer=setTimeout(()=>finish(false),30000);
  });

  window.addEventListener('message',(e)=>{
    if(e.origin!==location.origin)return;
    if(e.data&&e.data.type==='fabiano-form-success')finish(true);
  });
})();
