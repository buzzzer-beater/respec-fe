// 디자인 시안 미리보기용 정적 서버 — 파일만 내려주고, 파일이 바뀌어도 페이지를 자동으로 새로고침하지 않습니다.
// 실행: node demo-design/serve.js [포트]  (기본 5180)
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT) || 5180;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(root, urlPath === '/' ? 'workspace.html' : urlPath);
    // 폴더 밖 파일은 내주지 않습니다.
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`demo-design: http://localhost:${port}/workspace.html`));
