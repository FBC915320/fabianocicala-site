/* Consentimento para estatísticas do fabianocicala.com. Sem anúncios. */
(function () {
  'use strict';
  var KEY = 'fc_analytics_consent_v1';
  var GA_ID = 'G-ENQR4X8ZZZ';
  var rawLang = (document.documentElement.lang || 'pt').toLowerCase().slice(0,2);
  var language = ['pt','it','en','es'].includes(rawLang) ? rawLang : 'pt';
  var translations = {
    pt: {title:'Privacidade e cookies',description:'Usamos Google Analytics para entender as visitas somente com sua autorização. Você pode mudar sua escolha quando quiser.',accept:'Aceitar estatísticas',reject:'Recusar',settings:'Preferências de cookies',policy:'Política de Privacidade',cookie:'Cookies'},
    it: {title:'Privacy e cookie',description:'Utilizziamo Google Analytics per comprendere le visite solo con il tuo consenso. Puoi modificare la tua scelta in qualsiasi momento.',accept:'Accetta statistiche',reject:'Rifiuta',settings:'Preferenze cookie',policy:'Informativa sulla privacy (in portoghese)',cookie:'Cookie'},
    en: {title:'Privacy and cookies',description:'We use Google Analytics to understand visits only with your consent. You can change your choice at any time.',accept:'Accept analytics',reject:'Decline',settings:'Cookie preferences',policy:'Privacy Policy (Portuguese)',cookie:'Cookies'},
    es: {title:'Privacidad y cookies',description:'Usamos Google Analytics para comprender las visitas solo si lo autorizas. Puedes cambiar tu decisión cuando quieras.',accept:'Aceptar estadísticas',reject:'Rechazar',settings:'Preferencias de cookies',policy:'Política de privacidad',cookie:'Cookies'}
  };
  var strings = translations[language];
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
  function trackEvent(name, parameters) {
    if (getConsent() !== 'accepted') return;
    startAnalytics();
    window.gtag('event', name, parameters || {});
  }
  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }
  function classifyLink(anchor) {
    var url;
    try { url = new URL(anchor.href, window.location.href); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\./, '').toLowerCase();
    var platform = '';
    if (host.includes('hotmart')) platform = 'hotmart';
    else if (host.includes('amazon.')) platform = 'amazon';
    else if (host.includes('kiwify')) platform = 'kiwify';
    else if (host.includes('apple.com')) platform = 'apple_books';
    if (platform) return {name:'purchase_link_click', platform:platform, url:url.href};
    if (host.includes('youtube.com') || host.includes('youtu.be')) return {name:'video_link_click', platform:'youtube', url:url.href};
    return null;
  }
  function setupMeasurement() {
    document.addEventListener('click', function (event) {
      var anchor = event.target.closest && event.target.closest('a[href]');
      if (!anchor) return;
      var classified = classifyLink(anchor);
      if (!classified) return;
      trackEvent(classified.name, {
        platform: classified.platform,
        link_url: classified.url,
        link_text: cleanText(anchor.textContent),
        page_path: window.location.pathname
      });
    }, true);
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form || form.tagName !== 'FORM') return;
      trackEvent('generate_lead', {
        form_id: form.id || 'formulario',
        page_path: window.location.pathname
      });
    }, true);
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
    var reopen = makeButton(strings.cookie, showBanner, false);
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
    setupMeasurement();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
