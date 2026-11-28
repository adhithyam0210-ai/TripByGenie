let app;
let initError = null;

try {
  app = require('../server/index.js');
} catch (err) {
  initError = err;
  console.error('[VERCEL_INIT_ERROR]', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Backend initialization failed on serverless instance',
      message: initError.message
    }));
  }

  let targetUrl = req.url || '/api/health';
  const vPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'] || req.headers['x-invoke-path'] || req.headers['x-vercel-matched-path'];
  
  if (vPath && !vPath.startsWith('/api/index')) {
    const queryIndex = (req.url || '').indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    targetUrl = vPath.includes('?') ? vPath : (vPath + queryString);
  }

  if (!targetUrl.startsWith('/api') && !targetUrl.startsWith('/uploads')) {
    targetUrl = '/api' + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
  }

  req.url = targetUrl;

  try {
    return app(req, res);
  } catch (err) {
    console.error('[VERCEL_DISPATCH_ERROR]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Unhandled server error in request handler',
        message: err.message
      }));
    }
  }
};

