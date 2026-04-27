export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID,
    scope: 'repo',
  });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
