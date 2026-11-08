/* OSC'ART Production — Callback OAuth GitHub pour Decap CMS (Vercel Function)
   Reçoit le code GitHub, l'échange contre un token, puis le transmet au CMS
   via le protocole de handshake attendu par Decap :
     1. popup → opener : "authorizing:github"
     2. opener → popup : même message (confirme qu'il écoute)
     3. popup → opener : "authorization:github:success:{token,provider}"
   Le message n'est envoyé qu'à l'origine du site, jamais à "*". */
module.exports = function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = proto + '://' + host;

  function respond(status, content) {
    const message = 'authorization:github:' + status + ':' + JSON.stringify(content);
    /* Échappement pour une insertion sûre dans <script> (anti-XSS) */
    const safe = function (v) {
      return JSON.stringify(v)
        .replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    };
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    /* Le cookie de state est à usage unique */
    res.setHeader('Set-Cookie', 'oscart_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    res.end('<!DOCTYPE html><html><body><p>Connexion en cours…</p><script>' +
      '(function(){' +
      'var ORIGIN=' + safe(origin) + ',MSG=' + safe(message) + ';' +
      'if(!window.opener){document.body.textContent="Fenêtre de connexion orpheline — relancez la connexion depuis /cms/.";return;}' +
      'function onMsg(e){' +
      'if(e.origin!==ORIGIN||e.data!=="authorizing:github")return;' +
      'window.removeEventListener("message",onMsg);' +
      'window.opener.postMessage(MSG,ORIGIN);' +
      'setTimeout(function(){window.close();},300);' +
      '}' +
      'window.addEventListener("message",onMsg);' +
      'window.opener.postMessage("authorizing:github",ORIGIN);' +
      '})();</script></body></html>');
  }

  const q = req.query || {};
  const cookies = (req.headers.cookie || '').split(';').reduce(function (acc, c) {
    const p = c.trim().split('=');
    acc[p[0]] = p.slice(1).join('=');
    return acc;
  }, {});

  if (q.error) { respond('error', { message: String(q.error_description || q.error) }); return; }
  if (!q.code) { respond('error', { message: 'Code d\'autorisation manquant.' }); return; }
  if (!q.state || q.state !== cookies.oscart_oauth_state) {
    respond('error', { message: 'State OAuth invalide (session expirée ? Réessayez).' });
    return;
  }
  if (!clientId || !clientSecret) {
    respond('error', { message: 'Variables GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET manquantes sur Vercel.' });
    return;
  }

  fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: q.code,
      redirect_uri: origin + '/api/callback'
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error || !data.access_token) {
        respond('error', { message: data.error_description || data.error || 'Échec de l\'échange du token.' });
        return;
      }
      respond('success', { token: data.access_token, provider: 'github' });
    })
    .catch(function (err) { respond('error', { message: String(err && err.message || err) }); });
};
