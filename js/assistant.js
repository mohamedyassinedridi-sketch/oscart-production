/* OSC'ART PRODUCTION — Assistant IA (widget de chat)
   Parle avec /api/assistant (Claude ou Gemini côté serveur), réponses en streaming.
   La conversation est gardée le temps de l'onglet (sessionStorage). */
(function(){
  'use strict';
  var doc = document;
  var KEY = 'oscart_chat_v1';
  var EMAIL = 'oscartproduction@gmail.com', TEL = '+216 29 067 452', TEL_HREF = 'tel:+21629067452';
  var SUGGESTIONS = [
    'Quels services proposez-vous ?',
    'Combien coûte un clip ou une pub ?',
    'Je veux un devis pour un événement',
    'Montrez-moi vos projets de marque'
  ];
  var WELCOME = 'Bonjour 👋 Je suis l’assistant d’OSC’ART Production. Je peux vous parler de nos services, de nos réalisations, ou vous aider à préparer votre brief. Je réponds en français, en anglais, en arabe et en derja.';

  var state = load();
  var busy = false;

  function load(){
    try{ var s = JSON.parse(sessionStorage.getItem(KEY)); if(s && Array.isArray(s.messages)) return s; }catch(e){}
    return { messages: [], open: false };
  }
  function save(){ try{ sessionStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  /* Texte simple -> HTML sûr : liens, e-mails, téléphones, **gras**, listes */
  function format(text){
    var h = esc(text);
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, function(u){
      var internal = u.indexOf(location.host) > -1;
      return '<a href="' + u + '"' + (internal ? '' : ' target="_blank" rel="noopener"') + '>' + u.replace(/^https?:\/\/(www\.)?/, '') + '</a>';
    });
    h = h.replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');
    h = h.replace(/(\+216[\s\d]{8,12}\d|\b\d{2}\s?\d{3}\s?\d{3}\b)/g, function(n){ return '<a href="tel:' + n.replace(/[^\d+]/g, '') + '">' + n + '</a>'; });
    h = h.split('\n').map(function(l){ return /^\s*[-•]\s+/.test(l) ? '<span class="ai-li">' + l.replace(/^\s*[-•]\s+/, '') + '</span>' : l; }).join('<br>');
    return h.replace(/(<br>)?(<span class="ai-li">)/g, '$2');
  }

  /* ---------- Interface ---------- */
  var root = doc.createElement('div');
  root.className = 'ai-chat';
  root.innerHTML =
    '<button class="ai-fab" type="button" aria-expanded="false" aria-controls="aiPanel">' +
      '<span class="ai-fab-dot" aria-hidden="true"></span><span class="ai-fab-label">Une question ?</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
    '</button>' +
    '<section class="ai-panel" id="aiPanel" role="dialog" aria-label="Assistant OSC’ART Production" hidden>' +
      '<header class="ai-head">' +
        '<img src="images/logo-mark.png" alt="" width="30" height="28">' +
        '<div><strong>Assistant OSC’ART</strong><span>IA · répond en quelques secondes</span></div>' +
        '<button class="ai-reset" type="button" title="Nouvelle conversation" aria-label="Nouvelle conversation">↺</button>' +
        '<button class="ai-close" type="button" aria-label="Fermer l’assistant">✕</button>' +
      '</header>' +
      '<div class="ai-log" aria-live="polite"></div>' +
      '<div class="ai-chips"></div>' +
      '<form class="ai-form">' +
        '<label class="sr-only" for="aiInput">Votre message</label>' +
        '<textarea id="aiInput" rows="1" maxlength="2000" placeholder="Écrivez votre message…" autocomplete="off"></textarea>' +
        '<button type="submit" aria-label="Envoyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2-7z" fill="currentColor"/></svg></button>' +
      '</form>' +
      '<p class="ai-foot">Réponses générées par IA, à confirmer avec l’équipe · <a href="contact.html">Devis</a> · <a href="' + TEL_HREF + '">Appeler</a></p>' +
    '</section>';
  doc.body.appendChild(root);

  var fab = root.querySelector('.ai-fab'), panel = root.querySelector('.ai-panel');
  var log = root.querySelector('.ai-log'), chips = root.querySelector('.ai-chips');
  var form = root.querySelector('.ai-form'), input = root.querySelector('textarea');

  function bubble(role, html, cls){
    var d = doc.createElement('div');
    d.className = 'ai-msg ai-' + role + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function render(){
    log.innerHTML = '';
    bubble('assistant', format(WELCOME));
    state.messages.forEach(function(m){ bubble(m.role, m.role === 'user' ? esc(m.content).replace(/\n/g, '<br>') : format(m.content)); });
    chips.innerHTML = state.messages.length ? '' : SUGGESTIONS.map(function(s){ return '<button type="button">' + esc(s) + '</button>'; }).join('');
  }
  function setOpen(open){
    state.open = open; save();
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if(open){ render(); setTimeout(function(){ input.focus({ preventScroll: true }); }, 60); }
  }
  fab.addEventListener('click', function(){ setOpen(panel.hidden); });
  root.querySelector('.ai-close').addEventListener('click', function(){ setOpen(false); fab.focus(); });
  root.querySelector('.ai-reset').addEventListener('click', function(){ if(busy) return; state.messages = []; save(); render(); input.focus(); });
  doc.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !panel.hidden) setOpen(false); });
  chips.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) ask(b.textContent); });
  input.addEventListener('input', function(){ input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
  input.addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
  form.addEventListener('submit', function(e){ e.preventDefault(); ask(input.value); });

  function fallbackHTML(){
    return 'L’assistant n’est pas disponible pour le moment. Contactez directement l’équipe :<br>' +
      '<span class="ai-li"><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></span>' +
      '<span class="ai-li"><a href="' + TEL_HREF + '">' + TEL + '</a></span>' +
      '<span class="ai-li"><a href="contact.html">Formulaire de brief</a></span>';
  }

  function ask(text){
    text = String(text || '').trim();
    if(!text || busy) return;
    busy = true;
    input.value = ''; input.style.height = 'auto';
    chips.innerHTML = '';
    state.messages.push({ role: 'user', content: text.slice(0, 2000) }); save();
    bubble('user', esc(text).replace(/\n/g, '<br>'));
    var out = bubble('assistant', '<span class="ai-typing"><i></i><i></i><i></i></span>', 'is-pending');
    var acc = '';

    fetch('api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.messages.slice(-20), page: location.pathname })
    }).then(function(r){
      if(r.status === 429) return r.json().then(function(j){ throw { msg: j.error }; });
      if(!r.ok || !r.body) throw { fallback: true };
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
      function pump(){
        return reader.read().then(function(x){
          if(x.done) return;
          buf += dec.decode(x.value, { stream: true });
          var parts = buf.split('\n\n'); buf = parts.pop();
          parts.forEach(function(p){
            var line = p.replace(/^data:\s?/, ''); if(!line) return;
            var ev; try{ ev = JSON.parse(line); }catch(e){ return; }
            if(ev.t){ acc += ev.t; out.classList.remove('is-pending'); out.innerHTML = format(acc); log.scrollTop = log.scrollHeight; }
            if(ev.error && !acc) throw { fallback: true };
          });
          return pump();
        });
      }
      return pump();
    }).then(function(){
      if(!acc) throw { fallback: true };
      state.messages.push({ role: 'assistant', content: acc }); save();
    }).catch(function(err){
      out.classList.remove('is-pending');
      out.innerHTML = err && err.msg ? esc(err.msg) : fallbackHTML();
      state.messages.pop(); save();   /* la question pourra être reposée */
    }).then(function(){ busy = false; });
  }

  if(state.open) setOpen(true);
})();
