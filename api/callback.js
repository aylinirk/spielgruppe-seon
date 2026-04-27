export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    const msg = JSON.stringify({ provider: 'github', error: data.error_description || 'Unknown error' });
    return res.send(postMessagePage(`authorization:github:error:${msg}`));
  }

  const msg = JSON.stringify({ token: data.access_token, provider: 'github' });
  res.send(postMessagePage(`authorization:github:success:${msg}`));
}

function postMessagePage(message) {
  const safeMsg = JSON.stringify(message);
  return `<!DOCTYPE html>
<html>
<body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(${safeMsg}, e.origin);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`;
}
