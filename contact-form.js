(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  const form=original.cloneNode(true);
  original.replaceWith(form);
  form.removeAttribute('onsubmit');

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const btn=form.querySelector('button[type="submit"]');
  const originalLabel=btn.textContent;

  const config=lang.startsWith('en')?{
    sending:'Sending…',
    success:'Your message was sent successfully. Thank you — I will get back to you as soon as possible.',
    error:'Your message could not be sent. Please try again or email fbcicala@gmail.com.',
    subject:'New contact | Fabiano Cicala',
    autoresponse:'Hello,\n\nI received your message through fabianocicala.com.\n\nThank you for reaching out. I will read it carefully and get back to you as soon as possible.\n\nBest regards,\nFabiano Cicala\nfabianocicala.com'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    success:'Su mensaje fue enviado correctamente. Gracias por el contacto; responderé lo antes posible.',
    error:'No fue posible enviar el mensaje. Inténtelo nuevamente o escriba a fbcicala@gmail.com.',
    subject:'Nuevo contacto | Fabiano Cicala',
    autoresponse:'Hola,\n\nHe recibido su mensaje a través de fabianocicala.com.\n\nGracias por ponerse en contacto. Lo leeré con atención y responderé lo antes posible.\n\nSaludos,\nFabiano Cicala\nfabianocicala.com'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    success:'Il messaggio è stato inviato con successo. Grazie; risponderò appena possibile.',
    error:'Non è stato possibile inviare il messaggio. Riprova o scrivi a fbcicala@gmail.com.',
    subject:'Nuovo contatto | Fabiano Cicala',
    autoresponse:'Buongiorno,\n\nHo ricevuto il suo messaggio tramite fabianocicala.com.\n\nGrazie per il contatto. Lo leggerò con attenzione e risponderò appena possibile.\n\nCordiali saluti,\nFabiano Cicala\nfabianocicala.com'
  }:{
    sending:'Enviando…',
    success:'Sua mensagem foi enviada com sucesso. Obrigado pelo contato; retornarei assim que possível.',
    error:'Não foi possível enviar sua mensagem. Tente novamente ou escreva para fbcicala@gmail.com.',
    subject:'Novo contato | Fabiano Cicala',
    autoresponse:'Olá,\n\nRecebi sua mensagem pelo fabianocicala.com.\n\nObrigado pelo contato. Vou ler com atenção e retornarei assim que possível.\n\nUm abraço,\nFabiano Cicala\nfabianocicala.com'
  };

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){
      el=document.createElement('input');
      el.type='hidden';
      el.name=name;
      form.appendChild(el);
    }
    el.value=value;
  };

  form.method='POST';
  form.action='https://formsubmit.co/b1683556bf571ec55cad89e14c6fbaab';
  form.target='fabiano-contact-frame';

  form.querySelectorAll('input[name="response"],input[name="to"],input[name="subject"],input[name="hp_email"],input[name="_captcha"]').forEach(el=>el.remove());
  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_autoresponse',config.autoresponse);
  setHidden('_next','https://fabianocicala.com/form-sent.html');
  setHidden('_honey','');
  setHidden('site',location.href);

  let iframe=document.querySelector('iframe[name="fabiano-contact-frame"]');
  if(!iframe){
    iframe=document.createElement('iframe');
    iframe.name='fabiano-contact-frame';
    iframe.title='Envio do formulário';
    iframe.hidden=true;
    document.body.appendChild(iframe);
  }

  let status=form.querySelector('.form-status-box');
  if(!status){
    status=document.createElement('div');
    status.className='form-status-box';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.style.display='none';
    btn.insertAdjacentElement('afterend',status);
  }

  const show=(type,text)=>{
    status.className=`form-status-box ${type}`;
    status.textContent=text;
    status.style.display='block';
  };

  let pending=false;
  let timer=null;

  const finish=(ok)=>{
    if(!pending)return;
    pending=false;
    clearTimeout(timer);
    btn.disabled=false;
    btn.textContent=originalLabel;
    if(ok){
      show('success',config.success);
      form.reset();
      setHidden('_subject',config.subject);
      setHidden('_template','box');
      setHidden('_autoresponse',config.autoresponse);
      setHidden('_next','https://fabianocicala.com/form-sent.html');
      setHidden('_honey','');
      setHidden('site',location.href);
      if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
    }else{
      show('error',config.error);
      if(typeof gtag==='function')gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }
  };

  iframe.addEventListener('load',()=>{
    if(!pending)return;
    try{
      const href=iframe.contentWindow.location.href;
      if(href.startsWith('https://fabianocicala.com/form-sent.html'))finish(true);
    }catch(_){/* cross-origin while FormSubmit processes; wait for redirect back */}
  });

  form.addEventListener('submit',(e)=>{
    if(!form.reportValidity()){
      e.preventDefault();
      return;
    }
    pending=true;
    btn.disabled=true;
    btn.textContent=config.sending;
    show('sending',config.sending);
    clearTimeout(timer);
    timer=setTimeout(()=>finish(false),30000);
  },true);
})();
