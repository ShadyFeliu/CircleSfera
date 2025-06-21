import { createServer } from "http";

const httpServer = createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('API CircleSfera funcionando');
  }
}); 