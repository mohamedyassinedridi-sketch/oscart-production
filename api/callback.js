/* OSC'ART Production — Callback OAuth GitHub pour Decap CMS (Vercel Function)
   Reçoit le code GitHub, l'échange contre un token, puis le transmet au CMS. */
module.exports = function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = proto + '://' + host;

  function respond(payload) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!DOCTYPE html><html><body><script>' +
      'window.opener.postMessage(' + JSON.stringify(payload) + ', "*");' +
      'window.close();</script></body></html>');
  }

  const q = req.query || {};
  const cookies = (req.headers.cookie || '').split(';').reduce(function(acc, c){
    const p = c.trim().split('=');
    acc[p[0]] = p.slice(1).join('=');
    return acc;
  }, {});

  if (q.error) { respond({ error: q.error_description || q.error }); return; }
  if (!q.code) { respond({ error: 'Code d\'autorisation manquant.' }); return; }
  if (!q.state || q.state !== cookies.oscart_oauth_state) {
    respond({ error: 'State OAuth invalide (session expirée ? Réessayez).' });
    return;
  }
  if (!clientId || !clientSecret) {
    respond({ error: 'Variables GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET manquantes sur Vercel.' });
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
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.error || !data.access_token) {
        respond({ error: data.error_description || data.error || 'Échec de l\'échange du token.' });
        return;
      }
      respond({ token: data.access_token, provider: 'github' });
    })
    .catch(function(err){ respond({ error: String(err && err.message || err) }); });
};
