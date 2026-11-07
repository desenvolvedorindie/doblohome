import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentPort = 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Clientes conectados ao Live Reload via SSE
const sseClients = new Set();

function broadcastReload() {
  for (const client of sseClients) {
    client.write('data: reload\n\n');
  }
}

// Observa alterações de arquivos nas pastas css, js e index.html
let fsWait = false;
const watchDirs = ['', 'css', 'js', 'assets'];

watchDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
      if (filename && !filename.startsWith('.') && !fsWait) {
        fsWait = setTimeout(() => { fsWait = false; }, 150);
        console.log(`\x1b[36m[LiveReload]\x1b[0m Arquivo alterado: ${filename} -> Atualizando navegador...`);
        broadcastReload();
      }
    });
  }
});

// Código do cliente de Live Reload injetado no HTML
const LIVE_RELOAD_SCRIPT = `
<!-- Dev Live Reload -->
<script>
  (function() {
    const evtSource = new EventSource('/_live_reload');
    evtSource.onmessage = function(e) {
      if (e.data === 'reload') {
        console.log('[LiveReload] Atualizando página...');
        location.reload();
      }
    };
  })();
</script>
`;

const server = http.createServer((req, res) => {
  // Rota SSE para Live Reload
  if (req.url === '/_live_reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // Decodifica URL limpa
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  const filePath = path.join(__dirname, cleanUrl);

  // Previne Directory Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acesso Negado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo não encontrado: ' + cleanUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro ao ler arquivo: ' + readErr.message);
        return;
      }

      // Injeta live reload no HTML
      if (ext === '.html') {
        let htmlStr = content.toString('utf-8');
        if (htmlStr.includes('</body>')) {
          htmlStr = htmlStr.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
        } else {
          htmlStr += LIVE_RELOAD_SCRIPT;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store'
        });
        res.end(htmlStr);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store'
        });
        res.end(content);
      }
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\x1b[33m[Aviso]\x1b[0m Porta ${currentPort} em uso, alternando para porta ${currentPort + 1}...`);
    currentPort++;
    setTimeout(() => {
      server.listen(currentPort);
    }, 200);
  } else {
    console.error('Erro no servidor:', err);
  }
});

server.listen(currentPort, () => {
  const url = `http://localhost:${currentPort}`;
  console.log('\n\x1b[32m=====================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[33m⚡ DOBLÒ SOLAR EXPANDER 3D - SERVIDOR DEV ATIVO ⚡\x1b[0m`);
  console.log(`\x1b[32m=====================================================\x1b[0m`);
  console.log(`📡 URL Local:        \x1b[1m\x1b[36m${url}\x1b[0m`);
  console.log(`🔄 Live Reload:     \x1b[32mAtivado (atualiza ao salvar arquivos)\x1b[0m`);
  console.log(`📁 Pasta Raiz:      ${__dirname}`);
  console.log(`\x1b[90mPressione Ctrl+C para encerrar o servidor.\x1b[0m\n`);

  // Abre automaticamente no navegador padrão do Windows
  exec(`start ${url}`);
});
