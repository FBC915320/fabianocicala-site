(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  const form=original.cloneNode(true);
  original.replaceWith(form);

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const btn=form.querySelector('button[type="submit"]');

  const config=lang.startsWith('en')?{
    sending:'Sending…',
    subject:'New contact | Fabiano Cicala',
    autoresponse:'Hello,\n\nYour message was successfully received through FabianoCicala.com.\n\nThank you for getting in touch. I will review your message and reply as soon as possible.\n\nFabiano Cicala\nEntrepreneur · Founder of CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('es')?{
    sending:'Enviando…',
    subject:'Nuevo contacto | Fabiano Cicala',
    autoresponse:'Hola,\n\nSu mensaje fue recibido correctamente a través de FabianoCicala.com.\n\nGracias por ponerse en contacto. Revisaré su mensaje y responderé lo antes posible.\n\nFabiano Cicala\nEmpresario · Fundador de CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:lang.startsWith('it')?{
    sending:'Invio…',
    subject:'Nuovo contatto | Fabiano Cicala',
    autoresponse:'Buongiorno,\n\nIl suo messaggio è stato ricevuto correttamente tramite FabianoCicala.com.\n\nGrazie per il contatto. Leggerò il messaggio e risponderò appena possibile.\n\nFabiano Cicala\nImprenditore · Fondatore di CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  }:{
    sending:'Enviando…',
    subject:'Novo contato | Fabiano Cicala',
    autoresponse:'Olá,\n\nSua mensagem foi recebida com sucesso pelo FabianoCicala.com.\n\nObrigado pelo contato. Vou analisar sua mensagem e retornarei assim que possível.\n\nFabiano Cicala\nEmpresário · Fundador da CIKALA\nfabianocicala.com\nLinkedIn · Instagram'
  };

  form.method='POST';
  form.action='https://formsubmit.co/fbcicala@gmail.com';
  form.removeAttribute('target');

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };

  const captcha=form.querySelector('input[name="_captcha"]');
  if(captcha)captcha.remove();

  setHidden('_subject',config.subject);
  setHidden('_template','box');
  setHidden('_next','https://fabianocicala.com/obrigado.html');
  setHidden('_honey','');
  setHidden('_autoresponse',config.autoresponse);

  form.addEventListener('submit',()=>{
    if(btn){btn.disabled=true;btn.textContent=config.sending;}
  });
})();
