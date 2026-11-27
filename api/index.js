const app = require('../server/index.js');

module.exports = (req, res) => {
  let targetUrl = req.url || '/api/health';
  const vPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'] || req.headers['x-invoke-path'] || req.headers['x-vercel-matched-path'];
  
  if (vPath && !vPath.startsWith('/api/index')) {
    targetUrl = vPath;
  } else if (targetUrl.startsWith('/api/index.js')) {
    const after = targetUrl.replace(/^\/api\/index\.js\/?/, '/');
    targetUrl = after.startsWith('/api') ? after : ('/api' + after);
  }

  if (!targetUrl.startsWith('/api') && !targetUrl.startsWith('/uploads')) {
    targetUrl = '/api' + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
  }

  req.url = targetUrl;
  return app(req, res);
};

