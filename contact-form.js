(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  const form=original.cloneNode(true);
  original.replaceWith(form);
  form.removeAttribute('onsubmit');
  form.removeAttribute('target');
  form.method='POST';
  form.action='https://email.gosecureserver.in/api/send.php';
  form.acceptCharset='utf-8';

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const btn=form.querySelector('button[type="submit"]');
  const config=lang.startsWith('en')?{
    sending:'Sending…',
    success:'Your message was sent successfully. Thank you — I will get back to you as soon as possible.',
    error:'Your message could not be sent. Please try again in a moment.',
    subject:'New contact | Fabiano Cicala',
    confirmSubject:'Message received | Fabiano Cicala',
    confirmMessage:'Hello,\n\nYour message sent through FabianoCicala.com was received successfully.\n\nThank you for getting in touch. I will review it and reply as soon as possible.\n\nFabiano Cicala\nEntrepreneur · Founder of CIKALA\nhttps://fabianocicala.com'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    success:'Su mensaje fue enviado correctamente. Gracias; responderé lo antes posible.',
    error:'No fue posible enviar el mensaje. Inténtelo nuevamente en unos instantes.',
    subject:'Nuevo contacto | Fabiano Cicala',
    confirmSubject:'Mensaje recibido | Fabiano Cicala',
    confirmMessage:'Hola,\n\nSu mensaje enviado por FabianoCicala.com fue recibido correctamente.\n\nGracias por el contacto. Lo revisaré y responderé lo antes posible.\n\nFabiano Cicala\nEmpresario · Fundador de CIKALA\nhttps://fabianocicala.com'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    success:'Il messaggio è stato inviato con successo. Grazie; risponderò appena possibile.',
    error:'Non è stato possibile inviare il messaggio. Riprova tra poco.',
    subject:'Nuovo contatto | Fabiano Cicala',
    confirmSubject:'Messaggio ricevuto | Fabiano Cicala',
    confirmMessage:'Buongiorno,\n\nIl messaggio inviato tramite FabianoCicala.com è stato ricevuto correttamente.\n\nGrazie per il contatto. Lo leggerò e risponderò appena possibile.\n\nFabiano Cicala\nImprenditore · Fondatore di CIKALA\nhttps://fabianocicala.com'
  }:{
    sending:'Enviando…',
    success:'Sua mensagem foi enviada com sucesso. Obrigado pelo contato; retornarei assim que possível.',
    error:'Não foi possível enviar sua mensagem. Tente novamente em alguns instantes.',
    subject:'Novo contato | Fabiano Cicala',
    confirmSubject:'Mensagem recebida | Fabiano Cicala',
    confirmMessage:'Olá,\n\nSua mensagem enviada pelo FabianoCicala.com foi recebida com sucesso.\n\nObrigado pelo contato. Vou analisá-la e retornarei assim que possível.\n\nFabiano Cicala\nEmpresário · Fundador da CIKALA\nhttps://fabianocicala.com'
  };

  form.querySelectorAll('input[name^="_"],input[name="response"]').forEach(el=>el.remove());

  const ensureHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
    return el;
  };
  ensureHidden('to','fbcicala@gmail.com');
  ensureHidden('subject',config.subject);
  ensureHidden('hp_email','');
  ensureHidden('source','fabianocicala.com');

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

  const postJson=async(payload,signal)=>{
    const response=await fetch('https://email.gosecureserver.in/api/send.php',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload),
      signal
    });
    const raw=await response.text();
    let result={};
    try{result=JSON.parse(raw)}catch(_){result={message:raw}};
    if(!response.ok || result.success===false || result.status==='error'){
      throw new Error(result.message||`HTTP ${response.status}`);
    }
    return result;
  };

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!form.reportValidity())return;

    btn.disabled=true;
    show('sending',config.sending);

    const data={};
    new FormData(form).forEach((v,k)=>data[k]=String(v));
    const visitorEmail=(data.email||'').trim();
    data.to='fbcicala@gmail.com';
    data.subject=config.subject;
    data.reply_to=visitorEmail;

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);

    try{
      await postJson(data,controller.signal);

      if(visitorEmail){
        try{
          await postJson({
            to:visitorEmail,
            subject:config.confirmSubject,
            name:'Fabiano Cicala',
            email:'fbcicala@gmail.com',
            reply_to:'fbcicala@gmail.com',
            message:config.confirmMessage,
            hp_email:''
          },controller.signal);
        }catch(_){/* main lead was already delivered */}
      }

      show('success',config.success);
      form.reset();
      ensureHidden('to','fbcicala@gmail.com');
      ensureHidden('subject',config.subject);
      ensureHidden('hp_email','');
      ensureHidden('source','fabianocicala.com');
      if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'contact-form',form_name:'Contato Fabiano Cicala',language:lang});
    }catch(err){
      console.error('Contact form error:',err);
      show('error',config.error);
      if(typeof gtag==='function')gtag('event','form_submit_error',{form_id:'contact-form',language:lang});
    }finally{
      clearTimeout(timer);
      btn.disabled=false;
    }
  },true);
})();
