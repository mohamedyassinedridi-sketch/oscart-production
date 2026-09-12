/* OSC'ART Production — Moteur de contenu dynamique
   Charge les donnees depuis data/*.json et les applique sur toutes les pages.
   Les modifications locales (admin.html) sont stockees dans le navigateur
   (localStorage) et ont priorite sur les fichiers JSON. */
(function(){
  var KEY = 'oscart_site_v1';

  function defaults(){
    return {
      site: {
        contact: { address:'', phone:'', email:'' },
        social:  { instagram:'', youtube:'', vimeo:'', linkedin:'', tiktok:'' },
        stats: [
          { v:'', l:'projets realises' },
          { v:'', l:'clients satisfaits' },
          { v:'', l:'prix & selections' },
          { v:'', l:'annees d\'experience' }
        ],
        showreel: '',
        media: { logo:'images/logo.png', hero:'' }
      },
      portfolio: [],
      team: [],
      services: [],
      gallery: []
    };
  }

  function merge(base, over){
    if(Array.isArray(base)) return Array.isArray(over) ? over : base;
    if(base && typeof base === 'object'){
      var o = Object.assign({}, base);
      if(over && typeof over === 'object'){
        for(var k in over){
          if(over[k] === undefined || over[k] === null || over[k] === '') continue;
          o[k] = merge(base[k] === undefined ? over[k] : base[k], over[k]);
        }
      }
      return o;
    }
    return (over === undefined || over === '') ? base : over;
  }

  function loadLocal(){
    try{
      var raw = JSON.parse(localStorage.getItem(KEY));
      if(!raw) return null;
      if(!raw.site){ raw = { site: raw }; }
      return raw;
    }catch(e){ return null; }
  }

  var ESC_MAP = {'&':'&amp;','<':'&lt;','>':'&gt;'};
  function esc(s){
    s = String(s == null ? '' : s);
    return s.replace(/[&<>]/g, function(c){ return ESC_MAP[c]; })
            .split('"').join('&quot;')
            .split("'").join('&#39;');
  }

  function embedUrl(u){
    if(!u) return '';
    var m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
    if(m) return 'https://www.youtube.com/embed/' + m[1];
    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if(m) return 'https://player.vimeo.com/video/' + m[1];
    return u;
  }

  function isVideoFile(u){
    return /\.(mp4|webm|m4v|mov)(\?|$)/i.test(u || '');
  }

  /* Bascule plein écran (préfixes Safari inclus) */
  function toggleFs(el){
    var doc = document;
    var cur = doc.fullscreenElement || doc.webkitFullscreenElement;
    if(cur){ (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); }
    else {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if(req) req.call(el);
    }
  }

  var CAT_LABELS = { film:'Film', clip:'Clip', doc:'Documentaire', pub:'Publicite', event:'Evenement' };

  var D = defaults();
  var LOCAL = loadLocal() || {};
  var readyResolve;
  var ready = new Promise(function(res){ readyResolve = res; });

  function fetchJSON(url){
    return fetch(url + '?t=' + Date.now()).then(function(r){
      if(!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function hydrate(files){
    var def = defaults().site;
    D.site = merge(def, files.site || {});
    if(LOCAL.site) D.site = merge(D.site, LOCAL.site);
    /* accepte un tableau nu OU l'objet {cle: [...]} écrit par le CMS Decap */
    function arr(v, key){
      if(Array.isArray(v)) return v;
      if(v && typeof v === 'object' && Array.isArray(v[key])) return v[key];
      return [];
    }
    D.portfolio = Array.isArray(LOCAL.portfolio) ? LOCAL.portfolio : arr(files.portfolio, 'portfolio');
    D.team      = Array.isArray(LOCAL.team)      ? LOCAL.team      : arr(files.team, 'team');
    D.services  = Array.isArray(LOCAL.services)  ? LOCAL.services  : arr(files.services, 'services');
    D.gallery   = Array.isArray(LOCAL.gallery)   ? LOCAL.gallery   : arr(files.gallery, 'gallery');
  }

  /* ================= REGLAGES DU SITE ================= */
  var PLACEHOLDER = /\[\s*À\s*(REMPLACER|ACTIVER)/i;

  function maskPlaceholders(){
    document.querySelectorAll('.site-footer .footer-grid li').forEach(function(li){
      if(PLACEHOLDER.test(li.textContent)) li.style.display = 'none';
    });
    document.querySelectorAll('.contact-info ul li').forEach(function(li){
      if(!PLACEHOLDER.test(li.textContent)) return;
      var strong = li.querySelector('strong');
      if(strong) li.innerHTML = '<strong>' + strong.innerHTML + '</strong><br>—';
      else li.style.display = 'none';
    });
    document.querySelectorAll('.socials a').forEach(function(a){
      if(PLACEHOLDER.test(a.getAttribute('href') || '')) a.style.display = 'none';
    });
    document.querySelectorAll('a[href]').forEach(function(a){
      if(!PLACEHOLDER.test(a.getAttribute('href') || '')) return;
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.style.pointerEvents = 'none';
      a.style.opacity = '.45';
      a.title = 'À compléter';
    });
    document.querySelectorAll('.newsletter-mini').forEach(function(el){
      if(PLACEHOLDER.test(el.textContent)) el.style.display = 'none';
    });
  }

  function applySite(){
    var S = D.site;

    document.querySelectorAll('.site-footer .footer-grid li').forEach(function(li){
      var t = li.textContent;
      if(t.indexOf('\uD83D\uDCCD') > -1 && S.contact.address){
        li.textContent = '\uD83D\uDCCD ' + S.contact.address;
      } else if(t.indexOf('\uD83D\uDCDE') > -1 && S.contact.phone){
        li.innerHTML = '\uD83D\uDCDE <a href="tel:' + esc(S.contact.phone.replace(/[^\d+]/g,'')) + '">' + esc(S.contact.phone) + '</a>';
      } else if(t.indexOf('✉') > -1 && S.contact.email){
        li.innerHTML = '✉ <a href="mailto:' + esc(S.contact.email) + '">' + esc(S.contact.email) + '</a>';
      }
    });

    document.querySelectorAll('.contact-info ul li').forEach(function(li){
      var strong = li.querySelector('strong'); if(!strong) return;
      var label = strong.textContent;
      if(label.indexOf('Adresse') > -1 && S.contact.address){
        li.innerHTML = '<strong>' + strong.innerHTML + '</strong><br>' + esc(S.contact.address);
      } else if(label.indexOf('Telephone') > -1 || label.indexOf('Téléphone') > -1){
        if(S.contact.phone){
          li.innerHTML = '<strong>' + strong.innerHTML + '</strong><br><a href="tel:' + esc(S.contact.phone.replace(/[^\d+]/g,'')) + '">' + esc(S.contact.phone) + '</a>';
        }
      } else if(label.indexOf('Email general') > -1 || label.indexOf('Email général') > -1){
        if(S.contact.email){
          li.innerHTML = '<strong>' + strong.innerHTML + '</strong><br><a href="mailto:' + esc(S.contact.email) + '">' + esc(S.contact.email) + '</a>';
        }
      }
    });

    var socialMap = [
      ['instagram', /instagram|\uD83D\uDCF7/i],
      ['youtube',   /youtube|\u25B6/i],
      ['vimeo',     /vimeo|\uD83C\uDFAc/i],
      ['linkedin',  /linkedin|^in$/i],
      ['tiktok',    /tiktok|\uD83C\uDFB5/i]
    ];
    document.querySelectorAll('.socials a').forEach(function(a){
      var label = (a.getAttribute('aria-label') || a.textContent || '');
      for(var i = 0; i < socialMap.length; i++){
        if(socialMap[i][1].test(label)){
          var u = S.social[socialMap[i][0]];
          if(u) a.setAttribute('href', u);
          break;
        }
      }
    });

    if(S.stats && S.stats.length){
      document.querySelectorAll('.hero-stats > div').forEach(function(div, i){
        var s = S.stats[i]; if(!s) return;
        var strong = div.querySelector('strong'), span = div.querySelector('span');
        if(strong && s.v) strong.textContent = s.v;
        if(span && s.l) span.textContent = s.l;
      });
    }

    /* Showreel (accueil) — fichier local OU YouTube/Vimeo */
    var vwrap = document.querySelector('.video-frame');
    if(vwrap && S.showreel){
      var sph = vwrap.querySelector('.video-placeholder');
      if(sph) sph.style.display = 'none';
      if(isVideoFile(S.showreel)){
        var vid = vwrap.querySelector('video');
        if(!vid){
          vid = document.createElement('video');
          vid.controls = true;
          /* Lecture automatique : les navigateurs exigent le son coupé */
          vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
          vid.preload = 'auto';
          var oldFrame = vwrap.querySelector('iframe');
          if(oldFrame) oldFrame.remove();
          vwrap.appendChild(vid);
          vid.addEventListener('loadedmetadata', function(){
            if(vid.videoHeight > vid.videoWidth){ vwrap.classList.add('portrait'); }
            else { vwrap.classList.remove('portrait'); }
            var p = vid.play(); if(p && p.catch) p.catch(function(){});
          });
          var fsb = document.createElement('button');
          fsb.className = 'fs-btn'; fsb.type = 'button';
          fsb.textContent = '⛶';
          fsb.setAttribute('aria-label', 'Plein écran');
          fsb.setAttribute('title', 'Plein écran');
          vwrap.appendChild(fsb);
          fsb.addEventListener('click', function(ev){
            ev.preventDefault(); ev.stopPropagation();
            toggleFs(vid);
          });
        }
        vid.src = encodeURI(S.showreel);
      } else {
        var fr = vwrap.querySelector('iframe');
        if(fr){ fr.src = embedUrl(S.showreel); }
      }
    }

    if(S.media.logo){
      document.querySelectorAll('img.logo-mark').forEach(function(im){ im.src = S.media.logo; });
    }

    var heroBg = document.querySelector('.hero-bg');
    if(heroBg && S.media.hero){
      heroBg.style.backgroundImage = 'url("' + S.media.hero + '")';
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
    }

    maskPlaceholders();
  }

  /* ================= PORTFOLIO ================= */
  function thumbStyle(el, src, fallbackIdx){
    if(src){
      el.style.backgroundImage = 'url("' + src + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.classList.add('thumb-' + ((fallbackIdx % 9) + 1));
    }
  }

  function renderPortfolio(){
    var grid = document.querySelector('.portfolio-grid');
    if(!grid || !D.portfolio.length) return;
    grid.innerHTML = D.portfolio.map(function(p){
      return '<article class="project" data-cat="' + esc(p.category) + '"' +
        ' data-video="' + esc(embedUrl(p.video)) + '"' +
        ' data-client="' + esc(p.client) + '" data-year="' + esc(p.year) + '"' +
        ' data-desc="' + esc(p.desc) + '">' +
        '<a href="#" class="thumb">' +
          '<video muted loop playsinline preload="none" poster="' + esc(encodeURI(p.thumb)) + '"></video>' +
          '<em>' + esc(CAT_LABELS[p.category] || '') + '</em>' +
          '<span>\u25B6</span>' +
        '</a>' +
        '<div class="project-info">' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p>' + esc(p.subtitle) + '</p>' +
          '<p class="tags">' + esc(p.tags) + '</p>' +
        '</div></article>';
    }).join('');

    /* Aperçu vidéo : survol (desktop) + 1er tap muet (mobile) */
    var isTouch = window.matchMedia('(hover: none)').matches;
    grid.querySelectorAll('.project').forEach(function(card){
      var v = card.querySelector('video');
      var th = card.querySelector('.thumb');
      if(!v || !th) return;
      function playPreview(){
        var src = card.dataset.video || '';
        if(!isVideoFile(src)) return false;
        if(!v.getAttribute('src')) v.src = encodeURI(src);
        v.muted = true;
        var pr = v.play();
        if(pr && pr.catch) pr.catch(function(){});
        th.classList.add('playing');
        return true;
      }
      card.addEventListener('mouseenter', playPreview);
      card.addEventListener('mouseleave', function(){
        if(!v.paused) v.pause();
        th.classList.remove('playing');
      });
      /* Mobile : 1er tap = aperçu muet, 2e tap = lightbox */
      if(isTouch){
        card.addEventListener('click', function(e){
          if(!th.classList.contains('playing')){
            e.preventDefault(); e.stopPropagation();
            playPreview();
          }
        }, true);
      }
    });
    renderVideoSEO(grid);
    /* Chargement des vidéos seulement à proximité + pause hors écran */
    if('IntersectionObserver' in window){
      var vio = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          var v = en.target.querySelector('video');
          if(!v) return;
          if(en.isIntersecting){
            var src = en.target.dataset.video || '';
            if(isVideoFile(src) && !v.getAttribute('src')) v.src = encodeURI(src);
          } else if(!v.paused){ v.pause(); }
        });
      }, { threshold: 0.1 });
      grid.querySelectorAll('.project').forEach(function(c){ vio.observe(c); });
    }
  }

  /* SEO : données structurées VideoObject pour chaque projet */
  function renderVideoSEO(grid){
    if(!document.getElementById('oscart-video-ld')){
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'oscart-video-ld';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: D.portfolio.slice(0, 25).map(function(p, i){
          return {
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'VideoObject',
              name: p.title || 'Projet OSC\'ART',
              description: p.desc || p.subtitle || ('Réalisation ' + (CAT_LABELS[p.category] || '') + ' par OSC\'ART Production'),
              thumbnailUrl: (p.thumb || '').replace(/^\//, ''),
              uploadDate: String(p.year || new Date().getFullYear()) + '-01-01',
              publisher: { '@type': 'Organization', name: 'OSC\'ART Production' }
            }
          };
        })
      });
      document.body.appendChild(ld);
    }
  }

  function renderFeatured(){
    var grid = document.querySelector('.featured-grid');
    if(!grid || !D.portfolio.length) return;
    var items = D.portfolio.slice(0, 3);
    grid.innerHTML = items.map(function(p, i){
      return '<a href="portfolio.html" class="featured-item">' +
        '<div class="thumb"></div>' +
        '<div class="featured-meta"><h3>' + esc(p.title) + '</h3>' +
        '<span>' + esc(CAT_LABELS[p.category] || p.category) + '</span></div></a>';
    }).join('');
    grid.querySelectorAll('.thumb').forEach(function(a, i){
      thumbStyle(a, items[i].thumb, i);
    });
  }

  /* ================= EQUIPE ================= */
  function renderTeam(){
    var grid = document.querySelector('.team-grid');
    if(!grid || !D.team.length) return;
    grid.innerHTML = D.team.map(function(m, i){
      var avatar = m.photo
        ? '<img class="avatar" src="' + esc(m.photo) + '" alt="' + esc(m.name) + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">'
        : '';
      return '<div class="member"><div class="avatar" style="overflow:hidden">' + avatar + '</div>' +
        '<h3>' + esc(m.name) + '</h3><span>' + esc(m.role) + '</span><p>' + esc(m.bio) + '</p></div>';
    }).join('');
    grid.querySelectorAll('.avatar').forEach(function(av, i){
      if(D.team[i].photo) return;
      av.classList.add('a-' + ((i % 4) + 1));
      av.removeAttribute('style');
    });
  }

  /* ================= SERVICES ================= */
  function renderServicesHome(){
    var grid = document.querySelector('.services-grid');
    if(!grid || !D.services.length) return;
    grid.innerHTML = D.services.map(function(s){
      return '<article class="service-card">' +
        '<div class="service-icon">' + esc(s.icon) + '</div>' +
        '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
        '<a href="services.html#' + esc(s.id) + '" class="more-link">En savoir plus \u2192</a>' +
      '</article>';
    }).join('');
  }

  function renderServicesDetail(){
    var wrap = document.querySelector('.services-detail');
    if(!wrap || !D.services.length) return;
    wrap.innerHTML = D.services.map(function(s, i){
      var reverse = (i % 2 === 1) ? ' reverse' : '';
      return '<div class="container service-row' + reverse + '" id="' + esc(s.id) + '">' +
        '<div class="service-text"><span class="tag">' + esc(s.tag) + '</span>' +
        '<h2>' + esc(s.title) + '</h2><p>' + esc(s.detail) + '</p>' +
        '<ul class="checklist">' + s.items.map(function(it){ return '<li>' + esc(it) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="service-visual visual-' + (i + 1) + '"></div></div>';
    }).join('');
  }

  /* ================= GALERIE PHOTO (albums + lightbox V2) ================= */
  function renderGallery(){
    var grid = document.getElementById('photoGrid');
    if(!grid || !D.gallery.length) return;

    /* Normalisation — formats acceptés :
       {src,title,album}            (hérité, regroupé par album)
       {album,cover,photos:[...]}   (album explicite)
       "chemin.jpg"                 (chaîne simple) */
    var albums = [], singles = [];
    D.gallery.forEach(function(it){
      if(typeof it === 'string'){ singles.push({ src: it, title: '', album: '' }); return; }
      if(!it) return;
      if(Array.isArray(it.photos) && it.photos.length){
        var name = (it.album || 'Album').trim();
        var phs = it.photos.map(function(s){
          return (typeof s === 'string') ? { src: s, title: '', album: name } : { src: s.src, title: s.title || '', album: name };
        }).filter(function(g){ return g && g.src; });
        if(phs.length) albums.push({ name: name, cover: it.cover || phs[0].src, photos: phs });
      } else if(it.src){
        var al = (it.album || '').trim();
        if(al){
          var ex = null;
          for(var i = 0; i < albums.length; i++){ if(albums[i].name === al){ ex = albums[i]; break; } }
          var ph = { src: it.src, title: it.title || '', album: al };
          if(ex) ex.photos.push(ph);
          else albums.push({ name: al, cover: '', photos: [ph] });
        } else {
          singles.push({ src: it.src, title: it.title || '', album: '' });
        }
      }
    });
    albums.forEach(function(a){ if(!a.cover && a.photos[0]) a.cover = a.photos[0].src; });
    if(!albums.length && !singles.length) return;

    function tileHTML(g, si){
      var cap = g.title ? '<figcaption><strong>' + esc(g.title) + '</strong></figcaption>' : '';
      return '<figure class="photo-item" data-single="' + si + '">' +
        '<img loading="lazy" src="' + esc(encodeURI(g.src)) + '" alt="' + esc(g.title || "Photo OSC'ART") + '">' +
        cap + '</figure>';
    }

    grid.innerHTML = '<div class="photo-grid">' +
      albums.map(function(a, ai){
        return '<figure class="photo-item album-card" data-album="' + ai + '" role="button" tabindex="0"' +
          ' aria-label="Ouvrir l\u2019album ' + esc(a.name) + ' \u2014 ' + a.photos.length + ' photos">' +
          '<img loading="lazy" src="' + esc(encodeURI(a.cover)) + '" alt="' + esc(a.name) + '">' +
          '<span class="al-count">' + a.photos.length + ' photo' + (a.photos.length > 1 ? 's' : '') + '</span>' +
          '<figcaption><strong>' + esc(a.name) + '</strong><span>Album</span></figcaption>' +
        '</figure>';
      }).join('') +
      singles.map(tileHTML).join('') +
    '</div>';

    /* ---------- Lightbox V2 ---------- */
    var overlay = document.createElement('div');
    overlay.className = 'photo-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Galerie photos');
    overlay.innerHTML =
      '<button class="pl-close" aria-label="Fermer">\u00D7</button>' +
      '<span class="pl-counter"></span>' +
      '<button class="pl-nav pl-prev" aria-label="Photo précédente">\u2039</button>' +
      '<button class="pl-nav pl-next" aria-label="Photo suivante">\u203A</button>' +
      '<img alt="">' +
      '<p class="pl-caption"></p>';
    document.body.appendChild(overlay);
    var big     = overlay.querySelector('img');
    var prevB   = overlay.querySelector('.pl-prev');
    var nextB   = overlay.querySelector('.pl-next');
    var counter = overlay.querySelector('.pl-counter');
    var caption = overlay.querySelector('.pl-caption');
    var LIST = [], IDX = 0, lastFocus = null;

    function show(i){
      var n = LIST.length; if(!n) return;
      IDX = ((i % n) + n) % n;
      var g = LIST[IDX];
      big.classList.remove('portrait');
      big.onload = function(){ big.classList.toggle('portrait', big.naturalHeight > big.naturalWidth); };
      big.src = encodeURI(g.src);
      big.alt = g.title || g.album || "Photo OSC'ART";
      caption.textContent = g.title || '';
      var two = n > 1;
      counter.textContent = (IDX + 1) + ' / ' + n;
      counter.style.display = two ? '' : 'none';
      prevB.style.display = nextB.style.display = two ? '' : 'none';
      /* préchargement de la suivante */
      var nxt = LIST[(IDX + 1) % n];
      if(nxt && two){ var im = new Image(); im.src = encodeURI(nxt.src); }
    }
    function openList(list, i){
      LIST = list; lastFocus = document.activeElement;
      show(i);
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('.project video').forEach(function(v){ if(!v.paused) v.pause(); });
      overlay.querySelector('.pl-close').focus();
    }
    function closePl(){
      overlay.classList.remove('open');
      big.src = '';
      document.body.style.overflow = '';
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }

    grid.addEventListener('click', function(e){
      var card = e.target.closest('.album-card');
      if(card){ openList(albums[+card.getAttribute('data-album')].photos, 0); return; }
      var t = e.target.closest('.photo-item[data-single]');
      if(t){ openList(singles, +t.getAttribute('data-single')); }
    });
    grid.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.album-card');
      if(card){ e.preventDefault(); openList(albums[+card.getAttribute('data-album')].photos, 0); }
    });

    prevB.addEventListener('click', function(ev){ ev.stopPropagation(); show(IDX - 1); });
    nextB.addEventListener('click', function(ev){ ev.stopPropagation(); show(IDX + 1); });
    overlay.querySelector('.pl-close').addEventListener('click', closePl);
    overlay.addEventListener('click', function(e){
      if(e.target === overlay || e.target === big){ if(e.target === big){ show(IDX + 1); } else { closePl(); } }
    });
    document.addEventListener('keydown', function(e){
      if(!overlay.classList.contains('open')) return;
      if(e.key === 'Escape') closePl();
      else if(e.key === 'ArrowLeft') show(IDX - 1);
      else if(e.key === 'ArrowRight') show(IDX + 1);
    });
    /* swipe tactile (seuil 40px) */
    var tx = 0;
    overlay.addEventListener('touchstart', function(e){ tx = e.changedTouches[0].clientX; }, { passive: true });
    overlay.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - tx;
      if(Math.abs(dx) > 40){ if(dx < 0) show(IDX + 1); else show(IDX - 1); }
    }, { passive: true });
  }

  /* ================= LANCEMENT ================= */
  function applyAll(){
    try{ applySite(); }catch(e){}
    try{ renderPortfolio(); }catch(e){}
    try{ renderFeatured(); }catch(e){}
    try{ renderTeam(); }catch(e){}
    try{ renderServicesHome(); }catch(e){}
    try{ renderServicesDetail(); }catch(e){}
    try{ renderGallery(); }catch(e){}
  }

  Promise.all([
    fetchJSON('data/site.json').catch(function(){ return {}; }),
    fetchJSON('data/portfolio.json').catch(function(){ return []; }),
    fetchJSON('data/team.json').catch(function(){ return []; }),
    fetchJSON('data/services.json').catch(function(){ return []; }),
    fetchJSON('data/gallery.json').catch(function(){ return []; })
  ]).then(function(res){
    hydrate({ site: res[0], portfolio: res[1], team: res[2], services: res[3], gallery: res[4] });
    applyAll();
    readyResolve(true);
  });

  window.OscartData = {
    ready: ready,
    data: function(){ return JSON.parse(JSON.stringify({
      site: D.site, portfolio: D.portfolio, team: D.team, services: D.services, gallery: D.gallery
    })); },
    save: function(bundle){
      localStorage.setItem(KEY, JSON.stringify(bundle || {}));
      location.reload();
    },
    reset: function(){
      localStorage.removeItem(KEY);
      location.reload();
    }
  };
})();
