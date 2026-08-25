(()=>{
  const original=document.getElementById('contact-form');
  if(!original)return;

  // Remove listeners left by the old Google Apps Script implementation.
  const form=original.cloneNode(true);
  original.replaceWith(form);

  const lang=(document.documentElement.lang||'pt-BR').toLowerCase();
  const status=form.querySelector('.status')||form.querySelector('#status');
  const btn=form.querySelector('button[type="submit"]');

  const copy=lang.startsWith('en')?'Sending…':lang.startsWith('es')?'Enviando…':lang.startsWith('it')?'Invio…':'Enviando…';

  form.method='POST';
  form.action='https://formsubmit.co/fbcicala@gmail.com';
  form.removeAttribute('target');

  const setHidden=(name,value)=>{
    let el=form.querySelector(`input[name="${name}"]`);
    if(!el){el=document.createElement('input');el.type='hidden';el.name=name;form.appendChild(el);}
    el.value=value;
  };

  setHidden('_subject','Novo contato pelo site Fabiano Cicala');
  setHidden('_template','table');
  setHidden('_captcha','false');
  setHidden('_next','https://fabianocicala.com/obrigado.html');
  setHidden('_honey','');

  form.addEventListener('submit',()=>{
    if(status)status.textContent=copy;
    if(btn)btn.disabled=true;
  });
})();
