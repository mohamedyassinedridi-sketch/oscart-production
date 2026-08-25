/* OSC'ART Production — Pont OAuth GitHub pour Decap CMS (Vercel Function)
   Variables requises sur Vercel : GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET */
module.exports = function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GITHUB_CLIENT_ID manquant — configurez les variables d\'environnement sur Vercel.');
    return;
  }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = proto + '://' + host + '/api/callback';

  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  res.setHeader('Set-Cookie',
    'oscart_oauth_state=' + state + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=600');

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);

  res.writeHead(302, { Location: url.toString() });
  res.end();
};
