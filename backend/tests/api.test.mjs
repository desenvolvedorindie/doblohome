// Testes de integração da API. Pré-requisito: `docker compose up -d` e migrations aplicadas.
// Uso: node backend/tests/api.test.mjs   (variáveis: API_URL, MAIL_API)
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:8080';
const MAIL = process.env.MAIL_API || 'http://localhost:8025/api/v1';
const ORIGIN = 'http://localhost:5173';

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

async function call(method, path, body, token, headers = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mailTokenFor(email, param) {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch(`${MAIL}/messages`)).json();
    const msg = (list.messages || []).find((m) => m.To.some((t) => t.Address === email) && (!param || true));
    const candidates = (list.messages || []).filter((m) => m.To.some((t) => t.Address === email));
    for (const m of candidates) {
      const full = await (await fetch(`${MAIL}/message/${m.ID}`)).json();
      const match = full.HTML.match(new RegExp(`[?&]${param}=([A-Za-z0-9%_-]+)`));
      if (match) {
        await fetch(`${MAIL}/messages`, { method: 'DELETE', body: JSON.stringify({ IDs: [m.ID] }), headers: { 'Content-Type': 'application/json' } });
        return decodeURIComponent(match[1]);
      }
    }
    await sleep(300);
  }
  throw new Error(`e-mail com ${param} não chegou para ${email}`);
}

async function registerAndLogin(email, password) {
  await call('POST', '/auth/register', { email, password });
  const t = await mailTokenFor(email, 'verify');
  await call('POST', '/auth/verify-email', { token: t });
  const r = await call('POST', '/auth/login', { email, password });
  assert.equal(r.status, 200);
  return r.data;
}

const run = Date.now();
const emailA = `a_${run}@test.local`;
const emailB = `b_${run}@test.local`;
const pw = 'SenhaForte123';

console.log('Infra');
await test('health', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'ok');
});
await test('CORS preflight permite origem do front', async () => {
  const r = await call('OPTIONS', '/projects/x', undefined, undefined, {
    Origin: ORIGIN, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type',
  });
  assert.ok(r.status === 200 || r.status === 204, `status ${r.status}`);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
});
await test('CORS não libera origem desconhecida', async () => {
  const r = await call('GET', '/health', undefined, undefined, { Origin: 'http://evil.example' });
  assert.notEqual(r.headers.get('access-control-allow-origin'), 'http://evil.example');
});

console.log('Cadastro');
await test('e-mail inválido => 422', async () => {
  const r = await call('POST', '/auth/register', { email: 'xx', password: pw });
  assert.equal(r.status, 422);
});
await test('senha curta => 422', async () => {
  const r = await call('POST', '/auth/register', { email: emailA, password: '123' });
  assert.equal(r.status, 422);
});
await test('cadastro => 202 e login bloqueado até confirmar', async () => {
  const r = await call('POST', '/auth/register', { email: emailA, password: pw });
  assert.equal(r.status, 202);
  const l = await call('POST', '/auth/login', { email: emailA, password: pw });
  assert.equal(l.status, 403);
});
await test('cadastro duplicado não revela existência (202)', async () => {
  const r = await call('POST', '/auth/register', { email: emailA, password: pw });
  assert.equal(r.status, 202);
});
await test('token de confirmação inválido => 400', async () => {
  const r = await call('POST', '/auth/verify-email', { token: 'nope' });
  assert.equal(r.status, 400);
});
let sessionA;
await test('confirma e-mail por link e faz login', async () => {
  const t = await mailTokenFor(emailA, 'verify');
  const v = await call('POST', '/auth/verify-email', { token: t });
  assert.equal(v.status, 200);
  const again = await call('POST', '/auth/verify-email', { token: t });
  assert.equal(again.status, 400, 'token é de uso único');
  const l = await call('POST', '/auth/login', { email: emailA, password: pw });
  assert.equal(l.status, 200);
  assert.ok(l.data.accessToken && l.data.refreshToken);
  sessionA = l.data;
});
await test('login com senha errada => 401', async () => {
  const l = await call('POST', '/auth/login', { email: emailA, password: 'errada!!!' });
  assert.equal(l.status, 401);
});
await test('/auth/me exige token', async () => {
  assert.equal((await call('GET', '/auth/me')).status, 401);
  const r = await call('GET', '/auth/me', undefined, sessionA.accessToken);
  assert.equal(r.status, 200);
  assert.equal(r.data.user.email, emailA);
});
await test('refresh rotaciona o token', async () => {
  const r = await call('POST', '/auth/refresh', { refreshToken: sessionA.refreshToken });
  assert.equal(r.status, 200);
  const old = await call('POST', '/auth/refresh', { refreshToken: sessionA.refreshToken });
  assert.equal(old.status, 401);
  sessionA = r.data;
});

console.log('Recuperação de senha');
await test('forgot-password responde igual para e-mail inexistente', async () => {
  const r = await call('POST', '/auth/forgot-password', { email: `nao_${run}@test.local` });
  assert.equal(r.status, 200);
});
await test('reset de senha por link encerra sessões', async () => {
  await call('POST', '/auth/forgot-password', { email: emailA });
  const t = await mailTokenFor(emailA, 'reset');
  const weak = await call('POST', '/auth/reset-password', { token: t, password: '1' });
  assert.equal(weak.status, 422);
  const r = await call('POST', '/auth/reset-password', { token: t, password: 'NovaSenha456' });
  assert.equal(r.status, 200);
  assert.equal((await call('POST', '/auth/reset-password', { token: t, password: 'Outra12345' })).status, 400);
  assert.equal((await call('GET', '/auth/me', undefined, sessionA.accessToken)).status, 401);
  assert.equal((await call('POST', '/auth/login', { email: emailA, password: pw })).status, 401);
  const l = await call('POST', '/auth/login', { email: emailA, password: 'NovaSenha456' });
  assert.equal(l.status, 200);
  sessionA = l.data;
});
await test('logout invalida o token', async () => {
  const l = await call('POST', '/auth/login', { email: emailA, password: 'NovaSenha456' });
  const out = await call('POST', '/auth/logout', {}, l.data.accessToken);
  assert.equal(out.status, 204);
  assert.equal((await call('GET', '/auth/me', undefined, l.data.accessToken)).status, 401);
});

console.log('Projetos');
const tok = () => sessionA.accessToken;
const T0 = '2026-01-01T10:00:00.000Z';
const T1 = '2026-01-01T11:00:00.000Z';
const proj = (extra = {}) => ({
  name: 'Meu Doblò', description: 'desc', templateId: 'full_camper', createdAt: T0, clientUpdatedAt: T0,
  data: { config: { level1: { panels: 2 }, level2: { panels: 1 }, empty: {}, list: [] }, internalBoxes: [{ id: 1 }, { id: 2 }], internalGrid: {} },
  ...extra,
});
await test('exige autenticação', async () => {
  assert.equal((await call('GET', '/projects')).status, 401);
});
await test('cria projeto e preserva {} e []', async () => {
  const r = await call('PUT', '/projects/proj_1', proj(), tok());
  assert.equal(r.status, 200);
  assert.equal(r.data.project.version, 1);
  assert.equal(r.data.project.panelsCount, 3);
  assert.equal(r.data.project.modulesCount, 2);
  const g = await call('GET', '/projects/proj_1', undefined, tok());
  assert.deepEqual(g.data.project.data, proj().data);
  assert.equal(JSON.stringify(g.data.project.data.config.empty), '{}');
  assert.equal(JSON.stringify(g.data.project.data.config.list), '[]');
});
await test('atualização mais nova incrementa versão', async () => {
  const r = await call('PUT', '/projects/proj_1', proj({ name: 'Renomeado', clientUpdatedAt: T1 }), tok());
  assert.equal(r.status, 200);
  assert.equal(r.data.project.version, 2);
  assert.equal(r.data.project.name, 'Renomeado');
});
await test('escrita mais antiga => 409 com versão do servidor', async () => {
  const r = await call('PUT', '/projects/proj_1', proj({ name: 'Velho', clientUpdatedAt: T0 }), tok());
  assert.equal(r.status, 409);
  assert.equal(r.data.project.name, 'Renomeado');
});
await test('valida entrada', async () => {
  assert.equal((await call('PUT', '/projects/bad id!', proj(), tok())).status, 404);
  assert.equal((await call('PUT', '/projects/p2', proj({ name: '' }), tok())).status, 422);
  assert.equal((await call('PUT', '/projects/p2', { name: 'x' }, tok())).status, 422);
});
await test('lista, isolamento entre usuários e exclusão', async () => {
  const list = await call('GET', '/projects', undefined, tok());
  assert.equal(list.data.projects.length, 1);
  const B = await registerAndLogin(emailB, pw);
  assert.equal((await call('GET', '/projects/proj_1', undefined, B.accessToken)).status, 404);
  assert.equal((await call('GET', '/projects', undefined, B.accessToken)).data.projects.length, 0);
  assert.equal((await call('DELETE', '/projects/proj_1', undefined, B.accessToken)).status, 404);
  assert.equal((await call('DELETE', '/projects/proj_1', undefined, tok())).status, 204);
  assert.equal((await call('GET', '/projects', undefined, tok())).data.projects.length, 0);
  const tomb = await call('GET', '/projects?includeDeleted=1', undefined, tok());
  assert.equal(tomb.data.projects[0].deleted, true);
});
await test('import em lote', async () => {
  const r = await call('POST', '/projects/import', { projects: [{ id: 'imp_1', ...proj() }, { id: 'imp_2', ...proj({ name: 'B' }) }, { id: 'bad', name: 'x' }] }, tok());
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.results.map((x) => x.status), ['created', 'created', 'invalid']);
});

console.log('Presets');
const items = [{ id: 'a', name: 'A', meta: {}, tags: [] }, { id: 'b', name: 'B', isDefault: true }];
await test('GET sem dados => exists=false', async () => {
  const r = await call('GET', '/presets/battery', undefined, tok());
  assert.equal(r.status, 200);
  assert.equal(r.data.exists, false);
});
await test('tipo desconhecido => 404', async () => {
  assert.equal((await call('GET', '/presets/xyz', undefined, tok())).status, 404);
});
await test('salva, lê, preserva ordem e {}', async () => {
  const r = await call('PUT', '/presets/battery', { items, activeId: 'b', clientUpdatedAt: T0 }, tok());
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.items, items);
  assert.equal(r.data.activeId, 'b');
  assert.equal(JSON.stringify(r.data.items[0].meta), '{}');
});
await test('substituição remove itens ausentes', async () => {
  const r = await call('PUT', '/presets/battery', { items: [items[1]], activeId: 'b', clientUpdatedAt: T1 }, tok());
  assert.equal(r.data.items.length, 1);
});
await test('escrita antiga => 409', async () => {
  const r = await call('PUT', '/presets/battery', { items, activeId: 'a', clientUpdatedAt: T0 }, tok());
  assert.equal(r.status, 409);
  assert.equal(r.data.items.length, 1);
});
await test('valida itens', async () => {
  assert.equal((await call('PUT', '/presets/battery', { items: [{ name: 'sem id' }] }, tok())).status, 422);
  assert.equal((await call('PUT', '/presets/battery', { items: [{ id: 'x' }, { id: 'x' }] }, tok())).status, 422);
  assert.equal((await call('PUT', '/presets/battery', { items: 'x' }, tok())).status, 422);
});
await test('todos os tipos funcionam e GET /presets agrega', async () => {
  for (const t of ['b2b', 'cargo-box', 'fridge', 'mppt', 'porta-potti', 'solar-panel', 'stove', 'loads']) {
    const r = await call('PUT', `/presets/${t}`, { items: [{ id: 'p', name: t }], activeId: 'p', clientUpdatedAt: T0 }, tok());
    assert.equal(r.status, 200, t);
  }
  const all = await call('GET', '/presets', undefined, tok());
  assert.equal(Object.keys(all.data.presets).length, 9);
});
await test('presets isolados por usuário', async () => {
  const B = (await call('POST', '/auth/login', { email: emailB, password: pw })).data;
  const r = await call('GET', '/presets/battery', undefined, B.accessToken);
  assert.equal(r.data.exists, false);
});

console.log('Plano de Corte');
await test('GET /cutting/pdf retorna application/pdf válido', async () => {
  const res = await fetch(`${API}/cutting/pdf`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  const buffer = await res.arrayBuffer();
  assert.ok(buffer.byteLength > 10000, `Tamanho esperado > 10KB, obtido: ${buffer.byteLength}`);
  const headerStr = String.fromCharCode(...new Uint8Array(buffer.slice(0, 5)));
  assert.equal(headerStr, '%PDF-');
});

console.log(`\n${passed} passaram, ${failures.length} falharam`);
process.exit(failures.length ? 1 : 0);
