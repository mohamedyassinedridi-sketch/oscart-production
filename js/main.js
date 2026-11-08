/* ============================================================
   OSC'ART PRODUCTION — interface (hero vidéo, portfolio, lecteur)
   Les données viennent de js/site-data.js (data/*.json + CMS).
   ============================================================ */
(function(){
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

  var CAT = { pub:'Publicité & Brand content', clip:'Clip musical', event:'Événementiel', fashion:'Mode & Beauté', sport:'Sport', film:'Fiction' };
  var CAT_SHORT = { pub:'Publicité', clip:'Clips', event:'Événementiel', fashion:'Mode & Beauté', sport:'Sport', film:'Fiction' };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function url(s){ return encodeURI(s || ''); }

  /* ---------- Header : fond au scroll, masqué en descente ---------- */
  var header = doc.getElementById('siteHeader');
  var lastY = 0;
  function onScroll(){
    var y = window.scrollY;
    if(header){
      header.classList.toggle('scrolled', y > 30);
      header.classList.toggle('hide', y > 400 && y > lastY && !body.classList.contains('menu-open'));
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var menuBtn = doc.getElementById('menuBtn');
  if(menuBtn){
    menuBtn.addEventListener('click', function(){
      var open = body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    doc.querySelectorAll('.mobile-menu a').forEach(function(a){
      a.addEventListener('click', function(){ body.classList.remove('menu-open'); });
    });
    doc.addEventListener('keydown', function(e){ if(e.key === 'Escape') body.classList.remove('menu-open'); });
  }

  var yEl = doc.getElementById('year');
  if(yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- Apparitions au scroll ---------- */
  var rio = ('IntersectionObserver' in window && !reduceMotion) ? new IntersectionObserver(function(es){
    es.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('in'); rio.unobserve(x.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveal(scope){
    (scope || doc).querySelectorAll('.rv:not(.in)').forEach(function(el){
      if(rio) rio.observe(el); else el.classList.add('in');
    });
  }
  observeReveal();
  requestAnimationFrame(function(){ body.classList.add('loaded'); });

  /* ---------- Hero vidéo : format adapté à l'écran, chargé après le poster ---------- */
  var heroVideo = doc.getElementById('heroVideo');
  if(heroVideo){
    var portrait = window.matchMedia('(max-aspect-ratio: 4/5)').matches;
    var src = heroVideo.getAttribute(portrait ? 'data-src-v' : 'data-src-h');
    var posterImg = doc.getElementById('heroPoster');
    if(portrait && posterImg && posterImg.dataset.v) posterImg.src = posterImg.dataset.v;
    if(src && !saveData && !reduceMotion){
      var startHero = function(){
        heroVideo.src = src;
        heroVideo.muted = true;
        heroVideo.addEventListener('playing', function(){ heroVideo.classList.add('ready'); }, { once:true });
        var p = heroVideo.play(); if(p && p.catch) p.catch(function(){});
      };
      if(doc.readyState === 'complete') startHero(); else window.addEventListener('load', startHero, { once:true });
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          es.forEach(function(e){
            if(!heroVideo.src) return;
            if(e.isIntersecting){ var p = heroVideo.play(); if(p && p.catch) p.catch(function(){}); }
            else heroVideo.pause();
          });
        }, { threshold: .05 }).observe(heroVideo);
      }
    }
  }

  /* ---------- Portfolio ---------- */
  var PROJECTS = [];
  var PLAY_ICON = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>';

  function card(p, i){
    var fmt = p.format === 'v' ? 'v' : 'h';
    return '<article class="work ' + fmt + ' rv" data-i="' + i + '" data-cat="' + esc(p.category) + '" tabindex="0" role="button" aria-label="Lire : ' + esc(p.title) + '">' +
      '<div class="frame">' +
        '<img loading="lazy" decoding="async" src="' + esc(url(p.poster)) + '" alt="' + esc(p.title + (p.subtitle ? ' — ' + p.subtitle : '') + ' · OSC\'ART Production') + '">' +
        '<video muted loop playsinline preload="none" aria-hidden="true"></video>' +
        '<span class="play">' + PLAY_ICON + '</span>' +
      '</div>' +
      '<div class="info"><div><h3>' + esc(p.title) + '</h3>' +
        (p.client || p.subtitle ? '<span class="client">' + esc(p.subtitle || p.client) + '</span>' : '') + '</div>' +
        '<span class="cat">' + esc(CAT_SHORT[p.category] || '') + '</span></div>' +
    '</article>';
  }

  function startPreview(el){
    var p = PROJECTS[+el.dataset.i]; if(!p || !p.preview || saveData) return;
    var v = el.querySelector('video'); if(!v) return;
    if(!v.getAttribute('src')) v.src = url(p.preview);
    var pr = v.play();
    if(pr && pr.then) pr.then(function(){ el.classList.add('playing'); }).catch(function(){});
  }
  function stopPreview(el){
    var v = el.querySelector('video');
    el.classList.remove('playing');
    if(v && !v.paused) v.pause();
  }

  function bindCards(grid){
    var cards = grid.querySelectorAll('.work');
    cards.forEach(function(el){
      el.addEventListener('click', function(){ openPlayer(+el.dataset.i); });
      el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPlayer(+el.dataset.i); } });
      if(canHover){
        el.addEventListener('mouseenter', function(){ startPreview(el); });
        el.addEventListener('mouseleave', function(){ stopPreview(el); });
      }
    });
    /* Mobile / tactile : un seul aperçu à la fois, celui le plus visible */
    if(!canHover && 'IntersectionObserver' in window && !reduceMotion){
      var ratios = new Map(), current = null;
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ ratios.set(e.target, e.intersectionRatio); });
        var best = null, br = .6;
        ratios.forEach(function(r, el){ if(r >= br){ br = r; best = el; } });
        if(best !== current){
          if(current) stopPreview(current);
          current = best;
          if(current) startPreview(current);
        }
      }, { threshold: [0, .3, .6, .8, 1] });
      cards.forEach(function(c){ io.observe(c); });
    }
    observeReveal(grid);
  }

  function renderWork(){
    doc.querySelectorAll('[data-work]').forEach(function(grid){
      var mode = grid.getAttribute('data-work');
      var limit = +grid.getAttribute('data-limit') || 0;
      var html = '';
      var n = 0;
      PROJECTS.forEach(function(p, i){
        if(mode === 'featured' && !p.featured) return;
        if(mode === 'archive' && p.featured) return;
        if(limit && n >= limit) return;
        n++;
        html += card(p, i);
      });
      grid.innerHTML = html;
      layout(grid);
      bindCards(grid);
    });
    buildFilters();
  }

  /* Mise en page par rangées : H+V (8/4), H+H (6/6), V+V+V (4/4/4) — jamais de trou */
  function layout(grid){
    var items = [].filter.call(grid.querySelectorAll('.work'), function(w){ return !w.classList.contains('is-hidden'); });
    items.forEach(function(w){ w.removeAttribute('data-span'); w.removeAttribute('data-ar'); w.style.order = ''; });
    var H = items.filter(function(w){ return w.classList.contains('h'); });
    var Vq = items.filter(function(w){ return w.classList.contains('v'); });
    var order = 0, rows = [];
    /* on alterne les rangées pour garder du rythme */
    while(H.length || Vq.length){
      if(H.length && Vq.length){ rows.push([[H.shift(), 8, ''], [Vq.shift(), 4, 'hv']]); }
      if(H.length >= 2){ rows.push([[H.shift(), 6, ''], [H.shift(), 6, '']]); }
      else if(H.length === 1 && !Vq.length){ rows.push([[H.shift(), 12, 'wide']]); }
      if(Vq.length >= 3 && (!H.length || rows.length % 2)){ rows.push([[Vq.shift(), 4, ''], [Vq.shift(), 4, ''], [Vq.shift(), 4, '']]); }
      else if(!H.length && Vq.length === 2){ rows.push([[Vq.shift(), 6, ''], [Vq.shift(), 6, '']]); }
      else if(!H.length && Vq.length === 1){ rows.push([[Vq.shift(), 6, '']]); }
    }
    rows.forEach(function(r, ri){
      if(ri % 2 && r.length === 2 && r[1][2] === 'hv') r.reverse();   /* vertical à gauche une rangée sur deux */
      r.forEach(function(c){ c[0].setAttribute('data-span', c[1]); if(c[2]) c[0].setAttribute('data-ar', c[2]); c[0].style.order = order++; });
    });
  }

  /* Filtres : uniquement les catégories réellement présentes */
  function buildFilters(){
    var box = doc.getElementById('filters'); if(!box) return;
    var grid = doc.querySelector('[data-work="all"]'); if(!grid) return;
    var counts = {};
    PROJECTS.forEach(function(p){ counts[p.category] = (counts[p.category] || 0) + 1; });
    var order = ['pub','clip','event','fashion','sport','film'];
    var html = '<button class="filter active" data-f="all">Tout<sup>' + PROJECTS.length + '</sup></button>';
    order.forEach(function(c){ if(counts[c]) html += '<button class="filter" data-f="' + c + '">' + esc(CAT_SHORT[c]) + '<sup>' + counts[c] + '</sup></button>'; });
    box.innerHTML = html;
    box.addEventListener('click', function(e){
      var b = e.target.closest('.filter'); if(!b) return;
      box.querySelectorAll('.filter').forEach(function(x){ x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.dataset.f;
      grid.querySelectorAll('.work').forEach(function(w){
        var show = f === 'all' || w.dataset.cat === f;
        w.classList.toggle('is-hidden', !show);
        if(show) w.classList.add('in');
      });
      layout(grid);
    });
    var q = new URLSearchParams(location.search).get('cat');
    if(q){ var btn = box.querySelector('[data-f="' + q + '"]'); if(btn) btn.click(); }
  }

  /* ---------- Lecteur plein écran ---------- */
  var player = doc.getElementById('player');
  var current = -1, lastFocus = null;
  function openPlayer(i){
    if(!player) return;
    var p = PROJECTS[i]; if(!p) return;
    current = i;
    lastFocus = doc.activeElement;
    doc.querySelectorAll('.work.playing').forEach(stopPreview);
    var stage = player.querySelector('.player-stage');
    var full = !!p.video;
    var src = full ? p.video : p.preview;
    var fmt = p.format === 'v' ? 'v' : 'h';
    var embed = '';
    var yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/.exec(p.video || '');
    var vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(p.video || '');
    if(yt) embed = 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?autoplay=1&rel=0&playsinline=1';
    else if(vm) embed = 'https://player.vimeo.com/video/' + vm[1] + '?autoplay=1&dnt=1';
    if(embed){
      stage.innerHTML = '<iframe class="' + fmt + '" src="' + esc(embed) + '" title="' + esc(p.title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;background:#000;border-radius:4px;' +
        (fmt === 'v' ? 'height:min(78svh,900px);aspect-ratio:9/16' : 'width:min(100%,1400px);aspect-ratio:16/9') + '"></iframe>';
    } else {
      stage.innerHTML = '<video class="' + fmt + '" playsinline ' + (full ? 'controls' : 'muted loop') + ' preload="auto" poster="' + esc(url(p.poster)) + '" src="' + esc(url(src)) + '"></video>';
    }
    player.querySelector('[data-p="title"]').textContent = p.title;
    player.querySelector('[data-p="meta"]').textContent = [p.client, CAT[p.category]].filter(Boolean).join(' · ');
    var note = '';
    if(!full) note = 'Aperçu de 6 secondes' + (p.instagram ? ' — la vidéo complète est sur Instagram.' : '.');
    else if(p.excerpt) note = 'Extrait — version courte du film.';
    player.querySelector('[data-p="note"]').textContent = note;
    var ig = player.querySelector('[data-p="ig"]');
    if(p.instagram){ ig.href = p.instagram; ig.hidden = false; } else ig.hidden = true;
    var brief = player.querySelector('[data-p="brief"]');
    if(brief) brief.href = 'contact.html?projet=' + encodeURIComponent(p.title);
    player.classList.add('open');
    player.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    var v = stage.querySelector('video');
    if(v){
      var pr = v.play();
      if(pr && pr.catch) pr.catch(function(){ v.muted = true; v.play().catch(function(){}); });
    }
    player.querySelector('.player-close').focus({ preventScroll:true });
  }
  function closePlayer(){
    if(!player || !player.classList.contains('open')) return;
    var v = player.querySelector('video');
    if(v){ v.pause(); v.removeAttribute('src'); v.load(); }
    player.querySelector('.player-stage').innerHTML = '';
    player.classList.remove('open');
    player.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll:true });
  }
  function step(d){
    if(!PROJECTS.length) return;
    openPlayer((current + d + PROJECTS.length) % PROJECTS.length);
  }
  if(player){
    player.querySelector('.player-close').addEventListener('click', closePlayer);
    player.querySelector('[data-p="prev"]').addEventListener('click', function(){ step(-1); });
    player.querySelector('[data-p="next"]').addEventListener('click', function(){ step(1); });
    player.addEventListener('click', function(e){ if(e.target === player || e.target.classList.contains('player-stage')) closePlayer(); });
    doc.addEventListener('keydown', function(e){
      if(!player.classList.contains('open')) return;
      if(e.key === 'Escape') closePlayer();
      if(e.key === 'ArrowRight') step(1);
      if(e.key === 'ArrowLeft') step(-1);
    });
  }

  /* ---------- Coordonnées depuis les données ---------- */
  function applyContact(S){
    if(!S) return;
    var c = S.contact || {}, so = S.social || {};
    doc.querySelectorAll('[data-c]').forEach(function(el){
      var k = el.getAttribute('data-c');
      var v = { email: c.email, address: c.address, phone: c.phone, instagram: so.instagram, tiktok: so.tiktok, youtube: so.youtube, vimeo: so.vimeo, linkedin: so.linkedin }[k];
      var wrap = el.closest('[data-c-wrap]') || el;
      if(!v){ wrap.hidden = true; return; }
      wrap.hidden = false;
      if(el.tagName === 'A'){
        if(k === 'email') el.href = 'mailto:' + v;
        else if(k === 'phone') el.href = 'tel:' + v.replace(/[^\d+]/g, '');
        else el.href = v;
      }
      if(el.hasAttribute('data-c-text')){
        el.textContent = k === 'instagram' ? '@' + v.replace(/\/+$/, '').split('/').pop()
                       : k === 'tiktok' ? '@' + v.replace(/\/+$/, '').split('@').pop()
                       : v;
      }
    });
  }

  /* ---------- Formulaire de contact ---------- */
  var form = doc.getElementById('contactForm');
  var siteEmail = '';
  if(form){
    var pre = new URLSearchParams(location.search).get('projet');
    if(pre){ var msg = form.querySelector('[name=message]'); if(msg && !msg.value) msg.value = 'Bonjour, j\'aimerais un projet dans l\'esprit de « ' + pre + ' ». '; }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var err = form.querySelector('.form-error'); if(err) err.textContent = '';
      var data = new FormData(form);
      var endpoint = form.getAttribute('data-formspree') || '';
      var mailto = function(){
        if(!siteEmail){ if(err) err.textContent = 'Écrivez-nous directement : l\'adresse e-mail est indiquée à gauche.'; return; }
        var subject = 'Brief — ' + (data.get('type') || 'Projet') + ' — ' + (data.get('name') || '');
        var lines = ['Nom : ' + (data.get('name') || ''), 'E-mail : ' + (data.get('email') || ''), 'Société : ' + (data.get('company') || ''),
                     'Téléphone : ' + (data.get('phone') || ''), 'Type de projet : ' + (data.get('type') || ''),
                     'Budget : ' + (data.get('budget') || ''), 'Livraison souhaitée : ' + (data.get('deadline') || ''), '', data.get('message') || ''];
        window.location.href = 'mailto:' + siteEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        form.querySelector('.form-note').textContent = 'Votre messagerie s\'ouvre avec le brief pré-rempli — il ne reste qu\'à l\'envoyer.';
      };
      if(/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(endpoint)){
        fetch(endpoint, { method:'POST', body:data, headers:{ Accept:'application/json' } })
          .then(function(r){
            if(!r.ok) throw new Error();
            form.innerHTML = '<div class="form-done"><h3>Merci.</h3><p class="muted">Votre brief est bien arrivé. Nous revenons vers vous rapidement.</p></div>';
          }).catch(mailto);
      } else mailto();
    });
  }

  /* ---------- Démarrage une fois les données chargées ---------- */
  function start(){
    var D = window.OscartData.data();
    PROJECTS = (D.portfolio || []).filter(function(p){ return p && p.title && (p.poster || p.preview); });
    renderWork();
    applyContact(D.site);
    /* Équipe : visible seulement avec de vrais membres (pas de modèle « [Nom …] ») */
    var team = (D.team || []).filter(function(m){ return m && m.name && !/^\s*\[/.test(m.name); });
    var tsec = doc.getElementById('equipe');
    if(tsec && team.length){ tsec.hidden = false; tsec.style.display = ''; }
    siteEmail = (D.site && D.site.contact && D.site.contact.email) || '';
  }
  if(window.OscartData && window.OscartData.ready) window.OscartData.ready.then(start);
  else doc.addEventListener('DOMContentLoaded', function(){ if(window.OscartData) window.OscartData.ready.then(start); });
})();
