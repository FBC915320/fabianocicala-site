/* Rodapé único do site pessoal Fabiano Cicala — 30/10/2026 */
(function () {
  "use strict";
  function initializeBrandFooter() {
    const lang = (document.documentElement.lang || "pt").slice(0,2).toLowerCase();
    const dict = {
      pt: {tagline:"O invisível já está acontecendo.",follow:"Acompanhe nas redes",privacy:"Política de Privacidade",contact:"Contato"},
      en: {tagline:"The invisible is already happening.",follow:"Follow on social media",privacy:"Privacy Policy",contact:"Contact"},
      it: {tagline:"L’invisibile sta già accadendo.",follow:"Seguimi sui social",privacy:"Informativa sulla privacy",contact:"Contatto"},
      es: {tagline:"Lo invisible ya está sucediendo.",follow:"Sígueme en las redes",privacy:"Política de privacidad",contact:"Contacto"}
    };
    const t = dict[lang] || dict.pt;
    const path = window.location.pathname;
    const isBookDetail = /^\/livros\/[^/]+\/?$/.test(path);
    if (isBookDetail) document.body.classList.add("fc-book-detail");
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/brand-footer.css?v=20261030";
    document.head.appendChild(css);
    let markup = "<div class=\"footer-identity-row\"><div class=\"personal-footer-brand\"><img src=\"/favicon.svg\" alt=\"Logomarca FC — Fabiano Cicala\" width=\"60\" height=\"60\" loading=\"lazy\"><span class=\"personal-footer-copy\"><strong>Fabiano Cicala</strong><small>O invisível já está acontecendo.</small></span></div><span class=\"footer-identity-divider\" aria-hidden=\"true\"></span><div class=\"institute-footer-brand\" aria-label=\"Instituto Cicala e Rossetti\"><span class=\"institute-footer-symbol\" aria-hidden=\"true\"></span><span class=\"institute-footer-type\"><span class=\"institute-footer-kicker\">Instituto</span><strong>Cicala e Rossetti</strong><span class=\"institute-footer-tagline\">Conhecimento · Formação · Legado</span></span></div><span class=\"footer-identity-divider\" aria-hidden=\"true\"></span><div class=\"social-block\"><h3 class=\"social-heading\">Acompanhe nas redes</h3><div class=\"social\" aria-label=\"Redes sociais pessoais\"><a href=\"https://www.linkedin.com/in/fabiano-cicala-71ba82364/\" target=\"_blank\" rel=\"noopener\" aria-label=\"LinkedIn de Fabiano Cicala\"><svg viewBox=\"0 0 24 24\" width=\"23\" height=\"23\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#0A66C2\" d=\"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z\"/></svg><span>LinkedIn</span></a><a href=\"https://www.instagram.com/fabianocicala1/\" target=\"_blank\" rel=\"noopener\" aria-label=\"Instagram de Fabiano Cicala\"><svg viewBox=\"0 0 24 24\" width=\"23\" height=\"23\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"insta-official\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#FEDA75\"/><stop offset=\".32\" stop-color=\"#FA7E1E\"/><stop offset=\".62\" stop-color=\"#D62976\"/><stop offset=\"1\" stop-color=\"#4F5BD5\"/></linearGradient></defs><rect width=\"24\" height=\"24\" rx=\"6\" fill=\"url(#insta-official)\"/><rect x=\"5\" y=\"5\" width=\"14\" height=\"14\" rx=\"4\" stroke=\"#fff\" stroke-width=\"2\" fill=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"3.2\" stroke=\"#fff\" stroke-width=\"2\" fill=\"none\"/><circle cx=\"17\" cy=\"7\" r=\"1.2\" fill=\"#fff\"/></svg><span>Instagram</span></a><a href=\"https://www.youtube.com/@fabianocicala1\" target=\"_blank\" rel=\"noopener\" aria-label=\"YouTube de Fabiano Cicala\"><svg viewBox=\"0 0 24 24\" width=\"23\" height=\"23\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\".5\" y=\"3.3\" width=\"23\" height=\"17.4\" rx=\"5\" fill=\"#FF0033\"/><path d=\"M10 7.8L17.2 12 10 16.2z\" fill=\"#fff\"/></svg><span>YouTube</span></a><a href=\"https://pin.it/1rtQKkza5\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Pinterest de Fabiano Cicala\"><svg viewBox=\"0 0 24 24\" width=\"23\" height=\"23\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#E60023\" d=\"M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.427 7.627 11.174-.105-.949-.2-2.405.042-3.446.22-.937 1.41-5.986 1.41-5.986s-.36-.72-.36-1.784c0-1.673.97-2.922 2.179-2.922 1.028 0 1.525.773 1.525 1.698 0 1.034-.657 2.58-.995 4.01-.283 1.199.6 2.176 1.78 2.176 2.136 0 3.778-2.252 3.778-5.504 0-2.877-2.067-4.889-5.02-4.889-3.42 0-5.431 2.564-5.431 5.213 0 1.033.398 2.142.894 2.744.098.119.112.224.083.344-.09.378-.293 1.198-.333 1.363-.053.22-.174.267-.402.16-1.499-.697-2.436-2.887-2.436-4.648 0-3.785 2.75-7.263 7.929-7.263 4.162 0 7.397 2.967 7.397 6.929 0 4.135-2.607 7.462-6.227 7.462-1.216 0-2.36-.632-2.752-1.378l-.747 2.849c-.27 1.042-1.002 2.347-1.492 3.234A12.001 12.001 0 0 0 24 12c0-6.627-5.373-12-12-12z\"/></svg><span>Pinterest</span></a></div></div></div>"
      .replace("O invisível já está acontecendo.",t.tagline)
      .replace("Acompanhe nas redes",t.follow);
    const existing = document.querySelector(".footer-identity-row");
    if (existing) {
      const personal = existing.querySelector(".personal-footer-brand");
      if (personal && !personal.querySelector(".personal-footer-copy")) {
        const legacy = personal.querySelector("span");
        if (legacy) {
          const copy = document.createElement("span");
          copy.className = "personal-footer-copy";
          const title = document.createElement("strong");
          title.textContent = "Fabiano Cicala";
          const small = document.createElement("small");
          small.textContent = t.tagline;
          copy.append(title,small);
          legacy.replaceWith(copy);
        }
      }
      return;
    }
    const contact = document.querySelector("footer.contact");
    if (contact) {
      contact.insertAdjacentHTML("beforeend",markup);
      return;
    }
    const existingFooters = Array.from(document.querySelectorAll("footer"));
    const legacy = existingFooters.at(-1);
    if (legacy) {
      legacy.classList.add("fc-legacy-footer");
      legacy.hidden = true;
    }
    const footer = document.createElement("footer");
    footer.className = "fc-shared-footer";
    footer.setAttribute("aria-label", lang==="pt" ? "Rodapé institucional" : "Website footer");
    footer.innerHTML =
      '<div class="fc-footer-panel">' + markup + '</div>' +
      '<div class="fc-footer-copyright">© 2026 Fabiano Cicala · ' +
      '<a href="/">fabianocicala.com</a> · <a href="mailto:fbcicala@gmail.com">' + t.contact + '</a> · <a href="/politica-de-privacidade.html">' +
      t.privacy + '</a></div>';
    const root = document.querySelector(".shell") || document.body;
    root.appendChild(footer);
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",initializeBrandFooter,{once:true});
  else initializeBrandFooter();
})();
