# Backend (Yii2 API)

API REST em Yii2 + MySQL, com autenticação por e-mail e sincronização de projetos e presets.

## Subir (Docker; no WSL2 se for o seu caso)

```bash
docker compose up -d --build
docker exec doblo-api composer install --no-dev      # 1ª vez
docker exec doblo-api php yii migrate --interactive=0
```

| Serviço | URL |
|---|---|
| API | http://localhost:8080 (`GET /health`) |
| MySQL | `localhost:3307` (db/usuário/senha: `doblo`) |
| Mailpit (e-mails de dev) | http://localhost:8025 |

O front aponta para `VITE_API_URL` (padrão `http://localhost:8080`). Rode com `npm run dev`.

## Variáveis (docker-compose.yml)

`DB_DSN`, `DB_USER`, `DB_PASS`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`,
`APP_FRONTEND_URL` (base dos links de e-mail), `CORS_ORIGINS`, `COOKIE_KEY`, `YII_DEBUG`.
Em produção: defina `COOKIE_KEY`, SMTP real, `YII_DEBUG=0` e as origens de CORS.

## Endpoints

Autenticação (Bearer token; access 1h, refresh 60 dias com rotação):

| Método | Rota | |
|---|---|---|
| POST | `/auth/register` `{email,password}` | envia link de confirmação (resposta sempre 202) |
| POST | `/auth/verify-email` `{token}` | confirma e-mail (link `/?verify=TOKEN`) |
| POST | `/auth/resend-verification` `{email}` | |
| POST | `/auth/login` `{email,password}` | exige e-mail confirmado |
| POST | `/auth/refresh` `{refreshToken}` | |
| POST | `/auth/logout` | |
| POST | `/auth/forgot-password` `{email}` | link `/?reset=TOKEN`, válido 1h |
| POST | `/auth/reset-password` `{token,password}` | encerra todas as sessões |
| GET | `/auth/me` | |

Dados (privados por usuário):

| Método | Rota | |
|---|---|---|
| GET | `/projects?includeDeleted=1&since=ISO` | metadados |
| GET/PUT/DELETE | `/projects/{id}` | PUT = upsert; `409` se o servidor tem versão mais nova |
| POST | `/projects/import` | envio em lote (migração dos dados locais) |
| GET | `/presets` | todos os tipos |
| GET/PUT | `/presets/{tipo}` | `battery, b2b, cargo-box, fridge, mppt, porta-potti, solar-panel, stove`; cada tipo tem sua tabela |

Conflitos: last-write-wins por `clientUpdatedAt`; o servidor responde `409` com a versão vigente.

## Sincronização no front

`src/sync/`: o IndexedDB continua como cache offline. Mudanças são detectadas em `dbSet/dbDelete` e enviadas
com debounce; sem rede, ficam pendentes e são reenviadas ao reconectar. No login, o servidor é consultado
(fonte da verdade). No primeiro login, os dados locais existentes são enviados à conta, com confirmação.
Trocar de conta no mesmo navegador limpa o cache local.

## Testes

```bash
node backend/tests/api.test.mjs            # API (requer docker compose up)
npx vitest run tests/syncEngine.test.ts    # motor de sync contra a API real (ignorado se a API estiver off)
```
