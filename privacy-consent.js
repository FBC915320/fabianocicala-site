/* Consentimento para estatísticas do fabianocicala.com. Sem anúncios. */
(function () {
  'use strict';
  var KEY = 'fc_analytics_consent_v1';
  var GA_ID = 'G-ENQR4X8ZZZ';
  var language = (document.documentElement.lang || 'pt').toLowerCase().startsWith('es') ? 'es' : 'pt';
  var strings = language === 'es'
    ? {title:'Privacidad y cookies',description:'Usamos Google Analytics para comprender las visitas solo si lo autorizas. Puedes cambiar tu decisión cuando quieras.',accept:'Aceptar estadísticas',reject:'Rechazar',settings:'Preferencias de cookies',policy:'Política de privacidad'}
    : {title:'Privacidade e cookies',description:'Usamos Google Analytics para entender as visitas somente com sua autorização. Você pode mudar sua escolha quando quiser.',accept:'Aceitar estatísticas',reject:'Recusar',settings:'Preferências de cookies',policy:'Política de Privacidade'};
  var initialized = false;
  var analyticsStarted = false;
  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* restrição do navegador */ }
  }
  function startAnalytics() {
    if (analyticsStarted) return;
    analyticsStarted = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  }
  function makeButton(text, onClick, primary) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.style.cssText = 'cursor:pointer;border:1px solid #9baaca;border-radius:7px;padding:9px 14px;font:inherit;font-size:14px;background:' + (primary ? '#245ed0;color:white' : '#fff;color:#12234a');
    button.addEventListener('click', onClick);
    return button;
  }
  function setup() {
    if (initialized) return;
    initialized = true;
    var reopen = makeButton('Cookies', showBanner, false);
    reopen.setAttribute('aria-label', strings.settings);
    reopen.style.cssText += ';position:fixed;bottom:10px;left:10px;z-index:10000;box-shadow:0 2px 12px #0002;font-size:12px;padding:6px 9px;min-height:38px;min-width:78px';
    document.body.appendChild(reopen);
    var banner = document.createElement('section');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', strings.title);
    banner.style.cssText = 'position:fixed;bottom:60px;left:12px;right:12px;max-width:630px;z-index:10001;background:#fff;color:#12234a;border:1px solid #b7c3d7;border-radius:12px;padding:18px;box-shadow:0 6px 24px #0003;font-family:system-ui,-apple-system,sans-serif;line-height:1.5';
    var title = document.createElement('strong');
    title.textContent = strings.title;
    title.style.cssText = 'font-size:18px;display:block;margin-bottom:7px';
    var desc = document.createElement('p');
    desc.textContent = strings.description;
    desc.style.cssText = 'font-size:14px;margin:0 0 10px';
    var policy = document.createElement('a');
    policy.href = '/politica-de-privacidade.html';
    policy.textContent = strings.policy;
    policy.style.cssText = 'display:inline-block;color:#2057ad;text-decoration:underline;font-size:14px;margin-bottom:12px';
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    actions.appendChild(makeButton(strings.reject, function () {
      saveConsent('rejected'); banner.hidden = true;
      // Recarregar interrompe imediatamente qualquer Analytics iniciado anteriormente.
      if (analyticsStarted) window.location.reload();
    }, false));
    actions.appendChild(makeButton(strings.accept, function () {
      saveConsent('accepted'); banner.hidden = true; startAnalytics();
    }, true));
    banner.appendChild(title);
    banner.appendChild(desc);
    banner.appendChild(policy);
    banner.appendChild(actions);
    document.body.appendChild(banner);
    function showBanner() { banner.hidden = false; }
    banner.hidden = getConsent() !== null;
    if (getConsent() === 'accepted') startAnalytics();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
