/* OSC'ART PRODUCTION — JS principal */
(function(){
  // Header sticky
  const header = document.getElementById('siteHeader');
  if(header){
    window.addEventListener('scroll',()=>{
      if(window.scrollY>40) header.classList.add('sticky');
      else header.classList.remove('sticky');
    });
  }

  // Menu mobile
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if(toggle && nav){
    toggle.addEventListener('click',()=>{
      nav.classList.toggle('open');
      toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      nav.classList.remove('open');
      toggle.textContent='☰';
    }));
  }

  // Année dynamique footer
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  // Portfolio filtres (insensibles à la casse) + compteurs + état vide
  const filters = document.querySelectorAll('.filter');
  let emptyMsg = null;
  function applyFilter(f){
    f = (f || 'all').toLowerCase();
    let visible = 0;
    document.querySelectorAll('.project').forEach(p=>{
      const ok = f === 'all' || (p.dataset.cat || '').toLowerCase() === f;
      p.style.display = ok ? '' : 'none';
      if(ok) visible++;
    });
    if(emptyMsg) emptyMsg.style.display = visible ? 'none' : 'block';
  }
  filters.forEach(btn=>{
    btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    btn.addEventListener('click',()=>{
      filters.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      applyFilter(btn.dataset.filter);
    });
  });
  if(window.OscartData && window.OscartData.ready){
    OscartData.ready.then(()=>{
      // Compteurs « Clips (12) » calculés après rendu dynamique
      const all = document.querySelectorAll('.project');
      if(all.length && !document.querySelector('.filter .f-count')){
        filters.forEach(btn=>{
          const f = (btn.dataset.filter || 'all').toLowerCase();
          const n = [...all].filter(p => f === 'all' || (p.dataset.cat || '').toLowerCase() === f).length;
          const s = document.createElement('span');
          s.className = 'f-count';
          s.textContent = ' (' + n + ')';
          btn.appendChild(s);
        });
      }
      // Message d'état vide
      const grid = document.querySelector('.portfolio-grid');
      if(grid && !emptyMsg){
        emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.style.display = 'none';
        emptyMsg.textContent = 'Aucun projet dans cette catégorie pour le moment.';
        grid.insertAdjacentElement('afterend', emptyMsg);
      }
      // Animations d'apparition au scroll
      if(window.matchMedia('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window){
        const rio = new IntersectionObserver(es=>es.forEach(x=>{
          if(x.isIntersecting){ x.target.classList.add('reveal-in'); rio.unobserve(x.target); }
        }),{ threshold:.08 });
        document.querySelectorAll('.project,.member,.service-card,.photo-item,.featured-item,.value-card')
          .forEach(el=>{ el.classList.add('reveal'); rio.observe(el); });
      }
    });
  }

  // Lightbox (délégation : fonctionne avec le portfolio rendu dynamiquement)
  const lb = document.getElementById('lightbox');
  const lbClose = document.getElementById('lbClose');
  const lbTitle = document.getElementById('lbTitle');
  const lbFrame = document.getElementById('lbFrame');
  if(lb){
    function lbPlaceholder(){
      return lb.querySelector('.lb-placeholder');
    }
    function getVideoEl(){
      let v = lb.querySelector('video');
      if(!v){
        v = document.createElement('video');
        v.controls = true; v.playsInline = true; v.preload = 'metadata';
        const holder = lb.querySelector('.lb-video');
        if(holder) holder.prepend(v);
        v.addEventListener('loadedmetadata',()=>{
          v.classList.toggle('portrait', v.videoHeight > v.videoWidth);
        });
        /* Vidéo absente en ligne (fichiers lourds non déployés) */
        const note = lb.querySelector('.lb-note');
        v.addEventListener('error',()=>{
          v.classList.remove('on');
          if(note) note.hidden = false;
        });
      }
      return v;
    }
    /* Lecture auto : avec son si autorisé, sinon muet (règle des navigateurs) */
    function tryPlay(v){
      v.muted = false;
      const p = v.play();
      if(p && p.catch) p.catch(()=>{ v.muted = true; v.play().catch(()=>{}); });
    }
    function toggleFs(el){
      const doc = document;
      const cur = doc.fullscreenElement || doc.webkitFullscreenElement;
      if(cur){ (doc.exitFullscreen||doc.webkitExitFullscreen).call(doc); }
      else { const r = el.requestFullscreen||el.webkitRequestFullscreen; if(r) r.call(el); }
    }
    const lbFullBtn = document.getElementById('lbFull');
    if(lbFullBtn) lbFullBtn.addEventListener('click',()=>{
      const target = lb.querySelector('.lb-video');
      if(target) toggleFs(target);
    });
    document.addEventListener('click',e=>{
      const p = e.target.closest('.project');
      if(!p) return;
      e.preventDefault();
      document.querySelectorAll('.project video').forEach(x=>{ if(!x.paused) x.pause(); });
      const titleEl = p.querySelector('h3');
      if(lbTitle && titleEl) lbTitle.textContent = titleEl.textContent;
      const raw = p.dataset.video || '';
      const isFile = /\.(mp4|webm|m4v|mov)(\?|$)/i.test(raw);
      const noteEl = lb.querySelector('.lb-note');
      if(noteEl) noteEl.hidden = true;
      const ph = lbPlaceholder();
      const vid = getVideoEl();
      const holder = lb.querySelector('.lb-video');
      if(holder) holder.classList.toggle('has-local', isFile);
      if(isFile){
        if(lbFrame){ lbFrame.src = 'about:blank'; lbFrame.style.display='none'; }
        vid.src = encodeURI(raw);
        vid.classList.add('on');
        if(ph) ph.style.display='none';
        tryPlay(vid);
      } else if(raw){
        vid.pause && vid.pause();
        vid.classList.remove('on','portrait');
        if(holder) holder.classList.remove('has-local');
        if(lbFrame){ lbFrame.src = raw; lbFrame.style.display=''; }
        if(ph) ph.style.display='none';
      } else {
        vid.pause && vid.pause();
        vid.classList.remove('on','portrait');
        if(holder) holder.classList.remove('has-local');
        if(lbFrame) lbFrame.src = 'about:blank';
        if(ph) ph.style.display='';
      }
      const desc = lb.querySelector('.lb-desc');
      if(desc) desc.textContent = p.dataset.desc || desc.textContent;
      const labels = { film:'Film', clip:'Clip', doc:'Documentaire', pub:'Publicité', event:'Événement' };
      const vals = [p.dataset.client || '', p.dataset.year || '', labels[(p.dataset.cat || '').toLowerCase()] || ''];
      lb.querySelectorAll('.lb-meta span').forEach((span,i)=>{
        const t = span.lastChild;
        if(t && t.nodeType === 3) t.textContent = ' ' + (vals[i] || '—');
      });
      lb.classList.add('open');
      document.body.style.overflow='hidden';
    });
    function closeLb(){
      lb.classList.remove('open');
      const vid = lb.querySelector('video');
      if(vid){ vid.pause(); vid.removeAttribute('src'); vid.load(); vid.classList.remove('on','portrait'); }
      const holder = lb.querySelector('.lb-video');
      if(holder) holder.classList.remove('has-local');
      if(lbFrame) lbFrame.src='about:blank';
      const noteEl2 = lb.querySelector('.lb-note');
      if(noteEl2) noteEl2.hidden = true;
      const ph = lbPlaceholder();
      if(ph) ph.style.display='';
      document.body.style.overflow='';
    }
    if(lbClose) lbClose.addEventListener('click',closeLb);
    lb.addEventListener('click',e=>{ if(e.target===lb) closeLb(); });
  }

  // Formulaire contact (validation simple + envoi Formspree ou mailto fallback)
  const form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const action = form.getAttribute('action')||'';
      const data = new FormData(form);
      if(/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(action)){
        try{
          const res = await fetch(action,{method:'POST',body:data,headers:{Accept:'application/json'}});
          if(res.ok){
            form.innerHTML = '<div style="text-align:center;padding:40px"><h3 style="color:#fff">✅ Merci !</h3><p>Votre brief a bien été envoyé. Nous revenons vers vous sous 24h.</p></div>';
            return;
          }
        }catch(err){}
      }
      fallbackMailto(form,data);
    });
  }
  /* Email de réception : celui du CMS (data/site.json → contact.email) */
  async function contactEmail(){
    try{
      if(window.OscartData){ await window.OscartData.ready; }
      const e = window.OscartData && window.OscartData.data().site.contact.email;
      if(e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e.trim();
    }catch(err){}
    return '';
  }
  function formError(form,msg){
    let box = form.querySelector('.form-error');
    if(!box){
      box = document.createElement('p');
      box.className = 'form-error';
      box.setAttribute('role','alert');
      box.style.cssText = 'color:#ff8a8a;margin-top:14px;font-size:.9rem';
      form.appendChild(box);
    }
    box.textContent = msg;
  }
  async function fallbackMailto(form,data){
    const to = await contactEmail();
    if(!to){
      formError(form,"Le formulaire n'est pas encore actif. Merci de réessayer prochainement.");
      return;
    }
    const subject = encodeURIComponent('Brief OSC\'ART Production — '+(data.get('type')||'Projet'));
    const body = encodeURIComponent(
      'Nom: '+(data.get('name')||'')+'\n'+
      'Email: '+(data.get('email')||'')+'\n'+
      'Société: '+(data.get('company')||'')+'\n'+
      'Téléphone: '+(data.get('phone')||'')+'\n'+
      'Type: '+(data.get('type')||'')+'\n'+
      'Budget: '+(data.get('budget')||'')+'\n'+
      'Livraison: '+(data.get('deadline')||'')+'\n\n'+
      'Message:\n'+(data.get('message')||'')
    );
    window.location.href = 'mailto:'+to+'?subject='+subject+'&body='+body;
  }
})();
