# Frontend Integration Guide — StoryLegends Backend

## Base URL
- Local: `http://localhost:8080`
- Production: `https://slbackend-7a8596651d0c.herokuapp.com`

## Auth Header
All protected endpoints require:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints (`/api/auth`)

> All `/api/auth/**` endpoints require the request to come from an allowed origin (CORS).
> Direct browser requests without an `Origin` header (except `/api/auth/discord/callback`) will be rejected with 403.

### Register
```
POST /api/auth/register
{
  "username": "player1",
  "password": "SecurePass123!",
  "email": "player@example.com",
  "discordNickname": "player",
  "minecraftNickname": "Player123",
  "recaptchaToken": "TOKEN_FROM_GOOGLE"
}
→ 200: { "status": "success" }   // email verification required
→ 400: { "error": "..." }
→ 429: rate limited
```
> Before showing the register form, check `GET /api/admin/settings` → if `registrationOpen` is `false`, hide/disable the form and show a message.

### Verify Email
```
POST /api/auth/verify-email
{ "token": "token-from-email" }
→ 200: { "status": "success", "token": "<jwt>", "alreadyVerified": false }
```

### Resend Verification
```
POST /api/auth/resend-verification
{ "email": "player@example.com" }
→ 200: { "status": "success" }
```
**Rate limit: max 3 emails/day per IP.**

### Login
```
POST /api/auth/login
{
  "username": "player1",
  "password": "SecurePass123!",
  "totpCode": "123456"    // required only if 2FA enabled
}
→ 200: { "token": "<jwt>", "emailVerified": true, "username": "...", "isPlayer": true }
→ 400: { "error": "...", "totpRequired": true }
```

### Forgot Password
```
POST /api/auth/forgot-password
{ "email": "player@example.com" }
→ 200: { "message": "..." }   // always 200
```

### Reset Password
```
POST /api/auth/reset-password
{ "token": "token-from-email", "newPassword": "NewSecurePass123!" }
→ 200: { "message": "Пароль успешно изменен." }
→ 400: { "error": "..." }
```

---

## Discord OAuth2 (`/api/auth/discord`)

Account activation requires linking a Discord account via OAuth2.
Until `discordVerified = true`, the user cannot submit applications.

### Flow

1. **Get authorization URL** (authenticated):
```
GET /api/auth/discord/authorize
Authorization: Bearer <token>
→ 200: { "url": "https://discord.com/api/oauth2/authorize?..." }
```
Redirect the user's browser to this URL.

2. **Callback** — Discord redirects to the Frontend URL (e.g. `https://your-site.com/auth/discord/callback`):
```
GET /auth/discord/callback?code=...&state=...
```
The Frontend should redirect the browser to the Backend callback endpoint, preserving the query parameters:
```
GET /api/auth/discord/callback?code=...&state=...
```
This is handled server-side. The server exchanges the code, links Discord to the user,
then redirects the browser back to the frontend profile page:
```
/profile?discord=success&discordName=<name>   // linked successfully
/profile?discord=already_connected            // already linked
/profile?discord=error&reason=<reason>        // error
```
Possible error reasons: `discord_already_linked`, `discord_nickname_mismatch`, `token_exchange_failed`, `invalid_state`, `user_not_found`, `server_error`

3. **Alternative: connect via code** (if you handle OAuth2 on the frontend yourself):
```
POST /api/auth/discord/connect
Authorization: Bearer <token>
{ "code": "DISCORD_OAUTH_CODE" }
→ 200: { "status": "success", "discordUsername": "...", "discordId": "..." }
→ 400: { "error": "..." }
```

### Disconnect Discord
```
DELETE /api/auth/discord/disconnect
Authorization: Bearer <token>
→ 200: { "status": "success" }
```

### Discord nickname mismatch
If the user changes their Discord nickname in the profile settings, `discordVerified` is reset to `false`
and `discordUserId` is cleared. They must re-verify via OAuth2 before submitting applications.

---

## User Endpoints (`/api/users`)

### Get Current User
```
GET /api/users/me   → UserResponse
```

### Update Profile / Change Password
```
PATCH /api/users/me
{
  "email": "new@example.com",
  "discordNickname": "newNick",   // resets discordVerified if changed
  "minecraftNickname": "NewMC",
  "avatarUrl": "http://...",
  "bio": "My bio",
  "oldPassword": "CurrentPass123!",
  "newPassword": "NewPass123!"
}
→ UserResponse
```
> **Important:** If `discordNickname` is changed, `discordVerified` will be set to `false` and `discordUserId` cleared.
> Show a warning and prompt the user to re-verify Discord.

### Get Accepted Players (public, CORS-restricted)
```
GET /api/users   → [ UserResponse, ... ]   // only isPlayer=true users
```
> Only accessible from allowed origins. Direct browser access without `Origin` returns 403.

---

## UserResponse Object
```json
{
  "id": 1,
  "username": "player1",
  "email": "player@example.com",
  "discordNickname": "player",
  "minecraftNickname": "Player123",
  "role": "ROLE_USER",
  "avatarUrl": "http://...",
  "banned": false,
  "banReason": null,
  "emailVerified": true,
  "discordVerified": true,
  "totpEnabled": false,
  "bio": "...",
  "isPlayer": true,
  "discordUserId": "123456789",
  "badges": [
    { "id": 1, "name": "Builder", "color": "#f4a127", "svgIcon": "<svg>...</svg>", "createdAt": "..." }
  ]
}
```

### Account activation flow
A user's account is considered **active** when ALL of these are true:
- `emailVerified = true`
- `discordVerified = true`
- `banned = false`

Show appropriate prompts when:
- `emailVerified = false` → prompt to verify email
- `discordVerified = false` → prompt to connect Discord via OAuth2
- `banned = true` → show ban banner with `banReason`, make profile read-only, hide application form

> `@SL` Discord role is **not** visible in API — it's Discord-only.
> Security fields (`registrationIp`, `lastLoginIp*`, etc.) only appear in admin `/api/admin/users`.

---

## Applications (`/api/applications`)

> Before showing the application form, check `GET /api/admin/settings` → if `applicationsOpen` is `false`, hide/disable the form.

### Create Application
```
POST /api/applications
Authorization: Bearer <token>
{
  "firstName": "Ivan", "lastName": "Ivanov",
  "whyUs": "...", "source": "...",
  "makeContent": false,
  "additionalInfo": "...",   // minimum 200 characters
  "selfRating": 8,           // 1-10
  "recaptchaToken": "TOKEN"
}
→ 200: ApplicationResponse
→ 400: "У вас уже есть активная заявка в статусе PENDING"
→ 400: "Вы должны подтвердить свой email перед подачей заявки"
→ 400: "Вы должны быть участником нашего Discord сервера..." (if Discord bot enabled)
```
**Rules:**
- email verified (`emailVerified = true`)
- Discord verified (`discordVerified = true`)
- only 1 PENDING at a time
- `additionalInfo` ≥ 200 chars
- must be in Discord server (if bot enabled)

### Get My Applications (current + full history)
```
GET /api/applications/my   → MyApplicationsResponse
```

### MyApplicationsResponse
```json
{
  "current": {
    "id": 3, "firstName": "Ivan", "lastName": "Ivanov",
    "whyUs": "...", "source": "...", "makeContent": false,
    "additionalInfo": "...", "selfRating": 8,
    "status": "PENDING",
    "adminComment": null, "createdAt": "2026-02-21T01:00:00",
    "user": { "id": 1, "username": "...", "email": "...", "discordNickname": "...", "minecraftNickname": "...", "avatarUrl": "..." }
  },
  "history": [
    {
      "id": 3, "status": "PENDING", "createdAt": "2026-02-21T01:00:00",
      "adminComment": null, ...
    },
    {
      "id": 1, "status": "REJECTED", "createdAt": "2026-01-10T10:00:00",
      "adminComment": "Недостаточно опыта", ...
    }
  ]
}
```
- `current` — always the newest application (latest by `createdAt`), or `null` if none.
- `history` — full list of all applications sorted newest → oldest; can be empty `[]`.
- Display `current` on the profile page and `history` in a collapsible "Previous applications" section.

### ApplicationResponse (single object)
```json
{
  "id": 1, "firstName": "Ivan", "lastName": "Ivanov",
  "whyUs": "...", "source": "...", "makeContent": false,
  "additionalInfo": "...", "selfRating": 8,
  "status": "PENDING",
  "adminComment": null, "createdAt": "2026-02-21T01:00:00",
  "user": { "id": 1, "username": "...", "email": "...", "discordNickname": "...", "minecraftNickname": "...", "avatarUrl": "..." }
}
```

---

## File Uploads (`/api/files`)
```
POST   /api/files/upload/avatar    multipart/form-data  →  { "url": "http://..." }
DELETE /api/files/avatar
```

---

## TOTP / 2FA (`/api/totp`)
```
POST /api/totp/setup      → { "secret": "...", "qrCodeDataUri": "..." }
POST /api/totp/verify     { "code": "123456" }   // activates 2FA
POST /api/totp/disable    { "code": "123456" }   // disables 2FA
GET  /api/totp/status     → { "totpEnabled": true/false }
```

---

## Admin Endpoints (`/api/admin`) — ROLE_ADMIN only

### Applications
```
GET   /api/admin/applications?status=PENDING
PATCH /api/admin/applications/{id}/status
      { "status": "ACCEPTED", "adminComment": "..." }
      // ACCEPTED → isPlayer=true + email + Discord DM + @SL role assigned
      // REJECTED → email + Discord DM
```

### Users
```
GET    /api/admin/users
POST   /api/admin/users        { username, password, email, discordNickname, minecraftNickname, bio, emailVerified }
PATCH  /api/admin/users/{id}   { username?, email?, discordNickname?, minecraftNickname?, bio?, isPlayer? }
DELETE /api/admin/users/{id}
POST   /api/admin/users/{id}/ban              { "reason": "..." }
POST   /api/admin/users/{id}/unban
POST   /api/admin/users/{id}/reset-password   → { "temporaryPassword": "..." }
```

**Admin-only security fields in UserResponse:**
```json
{
  "registrationIp": "RU,Moscow,78.10.162.140",
  "registrationUserAgent": "Mozilla/5.0...",
  "lastLoginIp1": "DE,Berlin,91.20.5.1",
  "lastLoginUserAgent1": "Mozilla/5.0...",
  "lastLoginIp2": "RU,Moscow,78.10.162.140",
  "lastLoginUserAgent2": "..."
}
```
Format: `CC,City,IP` (CountryCode,City,RawIP). For local/private IPs — just the raw IP.
These are **read-only** (cannot be edited via PATCH).

### Badges
```
GET    /api/admin/badges
POST   /api/admin/badges                             { "name": "Builder", "color": "#f4a127", "svgIcon": "<svg>...</svg>", "discordRoleId": "123..." }
PATCH  /api/admin/badges/{id}                        { same fields, all optional }
DELETE /api/admin/badges/{id}
POST   /api/admin/users/{userId}/badges/{badgeId}    // assign badge to user + sync Discord role
DELETE /api/admin/users/{userId}/badges/{badgeId}    // remove badge + sync Discord role
```

### Warnings
```
POST   /api/admin/users/{userId}/warnings
       { "reason": "Нарушение правил" }
       → WarningResponse
GET    /api/admin/users/{userId}/warnings
       → [ WarningResponse, ... ]
PATCH  /api/admin/warnings/{warningId}/revoke
       → WarningResponse   // sets active=false
DELETE /api/admin/warnings/{warningId}
```

**WarningResponse:**
```json
{
  "id": 1,
  "userId": 5,
  "username": "player1",
  "reason": "Нарушение правил",
  "issuedById": 1,
  "issuedByUsername": "admin",
  "createdAt": "2026-02-21T01:00:00",
  "active": true
}
```

**Auto-ban:** if `autoBanOnMaxWarnings=true` and active warning count ≥ `maxWarningsBeforeBan`, the user is automatically banned.

### Site Settings
```
GET   /api/admin/settings   → SiteSettings
PATCH /api/admin/settings   → SiteSettings
```

**SiteSettings object:**
```json
{
  "maxWarningsBeforeBan": 3,
  "autoBanOnMaxWarnings": true,
  "sendEmailOnWarning": true,
  "sendDiscordDmOnWarning": true,
  "sendEmailOnBan": true,
  "sendDiscordDmOnBan": true,
  "sendEmailOnApplicationApproved": true,
  "sendEmailOnApplicationRejected": true,
  "applicationsOpen": true,
  "registrationOpen": true
}
```

**PATCH body** — all fields optional:
```json
{
  "maxWarningsBeforeBan": 5,
  "applicationsOpen": false,
  "registrationOpen": false
}
```

> **Frontend usage:**
> - Fetch settings on app load (or before showing register/apply forms).
> - If `registrationOpen = false` → hide or disable registration form, show "Регистрация временно закрыта".
> - If `applicationsOpen = false` → hide or disable application form, show "Приём заявок временно закрыт".

---

## Discord Integration
When `discord.bot.enabled=true`:
- **Application submit** → checks user is in Discord guild by `discordNickname`
- **Application accepted** → assigns `@SL` role + sends DM to user
- **Application rejected** → sends DM with reason
- **Application submitted** → sends DM confirmation
- **Warning issued** → sends DM notification (if `sendDiscordDmOnWarning=true`)
- **User banned** → removes `@SL` role + sends DM (if `sendDiscordDmOnBan=true`)
- **User unbanned** → restores `@SL` role + sends DM
- **Badge assigned/removed** → syncs Discord role automatically

`@SL` role is **not** exposed in API. Show only `badges` on website.

---

## Ban Handling
- Banned users CAN login and receive JWT
- After login check `banned` field → show banner with `banReason`, read-only profile
- Disable: creating applications, editing profile, uploading avatar

---

## Statuses & Roles
- `ApplicationStatus`: `PENDING` | `ACCEPTED` | `REJECTED`
- `UserRole`: `ROLE_USER` | `ROLE_MODERATOR` | `ROLE_ADMIN`

---

## Errors
- `400` → `{ "error": "..." }`
- `401/403` → redirect to login (or show "forbidden" for origin-restricted endpoints)
- `429` → rate limited

---

## Quick Reference: Account State Checks

| Condition | What to show |
|-----------|-------------|
| `emailVerified = false` | "Подтвердите email" banner, resend button |
| `discordVerified = false` | "Подключите Discord" banner, link button |
| `banned = true` | Ban banner with `banReason`, read-only profile |
| `applicationsOpen = false` | "Приём заявок закрыт" on apply page |
| `registrationOpen = false` | "Регистрация закрыта" on register page |

---

## Discord OAuth2 Setup (for devs)

1. Create app at https://discord.com/developers/applications
2. Add redirect URI: `http://localhost:8080/api/auth/discord/callback` (dev) or production URL
3. Set env vars: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_OAUTH_REDIRECT_URI`
4. Frontend flow:
   - Call `GET /api/auth/discord/authorize` → get URL
   - Open URL in popup or redirect
   - Handle `?discord=success` or `?discord=error` query params on the `/profile` page

---

## Database Migrations

Run the migration script against your PostgreSQL database:
```bash
# Local
DB_URL=jdbc:postgresql://localhost:5432/slbackend ./migrate.sh

# Heroku
heroku run bash -a <app-name>
./migrate.sh
```
The script is idempotent — safe to run multiple times.

