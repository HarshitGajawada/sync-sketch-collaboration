const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Simple Node.js server working!',
    url: req.url,
    method: req.method
  }));
});

const PORT = 8001;
server.listen(PORT, () => {
  console.log(`✅ Simple server running on http://localhost:${PORT}`);
  console.log(`🔗 Visit: http://localhost:${PORT}`);
});