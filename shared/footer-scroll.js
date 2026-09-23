/* ═══════════════════════════════════════════════════════════════
   Footer flotante Naowee — versión + animación scroll
   · Estampa la versión del módulo en el pill: añade
     "Incentivos vX.Y.Z" enlazado al release de GitHub.
     ▸ Para versionar el módulo: cambia MODULE_VERSION aquí (única fuente).
   · Animación: aparece al hacer scroll DOWN, desaparece al scroll UP.
     Listener atado a .page (el contenedor con overflow-y:auto del shell)
     con fallback a window por si la página no usa el shell.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  var MODULE_NAME    = 'Incentivos';
  var MODULE_VERSION = 'v2.0.0';
  var REPO           = 'naowee-tech/design-naowee-test-incentivos-demo';
  var RELEASE_URL    = 'https://github.com/' + REPO + '/releases/tag/' + MODULE_VERSION;

  /* Inyecta el separador + link de versión en el pill (idempotente). */
  function stampVersion(footer){
    if(footer.querySelector('.naowee-floating-footer__ver')) return;
    var sep = document.createElement('div');
    sep.className = 'naowee-floating-footer__sep';
    var ver = document.createElement('a');
    ver.className = 'naowee-floating-footer__ver';
    ver.href = RELEASE_URL;
    ver.target = '_blank';
    ver.rel = 'noopener noreferrer';
    ver.textContent = MODULE_NAME + ' ' + MODULE_VERSION;
    footer.appendChild(sep);
    footer.appendChild(ver);
  }

  function bind(){
    var footer = document.querySelector('.naowee-floating-footer');
    if(!footer) return;
    stampVersion(footer);
    var page = document.querySelector('.page');
    var target = page || window;
    var getY = page ? function(){ return page.scrollTop; } : function(){ return window.scrollY || window.pageYOffset || 0; };
    var lastY = getY();
    target.addEventListener('scroll', function(){
      var y = getY();
      var dy = y - lastY;
      if(Math.abs(dy) < 4) return;
      if(dy > 0){ footer.classList.remove('is-hidden'); }
      else { footer.classList.add('is-hidden'); }
      lastY = y;
    }, { passive:true });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
