# Frontend README

## Checklist
- [ ] Define the frontend stack and local dev setup
- [ ] Integrate auth, profile, applications, admin flows
- [ ] Implement file uploads to MinIO-backed endpoints
- [ ] Add role-aware UI and error handling
- [ ] Verify all endpoints with real data

## Overview
Backend provides a REST API for registration, auth, applications, users, admin actions, and file uploads. This document describes what the frontend must implement to cover all required features.

## Base URL
- Local API: `http://localhost:8080`

## Authentication
- JWT is returned by `/api/auth/login` and `/api/auth/register` (only if auto-verify is on, usually register requires email verification).
- Include header on all protected endpoints:
  - `Authorization: Bearer <token>`

## Required Pages/Flows

### 1) Registration + Login
- Registration fields:
  - `username`, `password`, `email`, `discordNickname`, `minecraftNickname`, `recaptchaToken`
- On success, user must verify email.
- Login fields:
  - `username`, `password`, `totpCode` (optional)

**Register**
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "password": "SecurePass123!",
  "email": "player@example.com",
  "discordNickname": "player#1234",
  "minecraftNickname": "Player123",
  "recaptchaToken": "TOKEN_FROM_GOOGLE"
}
```

**Verify Email**
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Resend Verification**
```
POST /api/auth/resend-verification
{ "email": "player@example.com" }
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "SecurePass123!",
  "totpCode": "123456" // Optional, required if 2FA enabled
}
```

### 2) Forgot Password
- Separate page/modal
- User enters email -> system sends reset link
- Link opens reset pwd page -> User enters new password

**Forgot Password Request**
```
POST /api/auth/forgot-password
{ "email": "player@example.com" }
```

**Reset Password**
```
POST /api/auth/reset-password
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

### 3) Profile + Edit
- Show user profile data:
  - `username`, `email`, `discordNickname`, `minecraftNickname`, `avatarUrl`, `role`, `banned`, `bio`, `totpEnabled`, `emailVerified`
- Allow editing:
  - `email`, `discordNickname`, `minecraftNickname`, `avatarUrl`, `bio`
  - **Change Password**: requires `oldPassword` and `newPassword`
- Avatar upload uses file endpoint (see below) and then reflects new URL.

**Get profile**
```
GET /api/users/me
Authorization: Bearer <token>
```

**Update profile**
```
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new@example.com",
  "discordNickname": "new#1234",
  "minecraftNickname": "NewNick",
  "avatarUrl": "http://localhost:9000/slbackend-avatars/avatars/uuid.png",
  "bio": "My new bio",
  "oldPassword": "CurrentPassword123!", // Required only if changing password
  "newPassword": "NewPassword123!"       // Required only if changing password
}
```

### 4) Applications
- User can create exactly one PENDING application.
- Show current application status in profile or separate page.

**Create application**
```
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Ivan",
  "lastName": "Ivanov",
  "whyUs": "...",
  "source": "...",
  "makeContent": false,
  "additionalInfo": "...",
  "selfRating": 8
}
```

**Get my application**
```
GET /api/applications/my
Authorization: Bearer <token>
```

### 5) Players List
- Show list of all verified users for browsing.

**Get all users**
```
GET /api/users
Authorization: Bearer <token>
```

### 6) Admin Panel
- Visible only for `role === ROLE_ADMIN`.

**List applications**
```
GET /api/admin/applications
// Optional query param: ?status=PENDING
Authorization: Bearer <token>
```

**Update application status**
```
PATCH /api/admin/applications/{id}/status
Authorization: Bearer <token>
{
  "status": "ACCEPTED",
  "adminComment": "Approved"
}
```

**List users**
```
GET /api/admin/users
Authorization: Bearer <token>
```

**Ban user**
```
POST /api/admin/users/{id}/ban
Authorization: Bearer <token>
{ "reason": "Rules violation" }
```

**Unban user**
```
POST /api/admin/users/{id}/unban
Authorization: Bearer <token>
```

**Reset User Password (Admin)**
```
POST /api/admin/users/{id}/reset-password
Authorization: Bearer <token>
// Returns temporary password
```

**Create User (Admin)**
```
POST /api/admin/users
Authorization: Bearer <token>
{ ...params similar to register... }
```

**Delete User**
```
DELETE /api/admin/users/{id}
Authorization: Bearer <token>
```

### 7) TOTP (2FA)
- Enable/Disable 2FA for account security.

**Setup TOTP**
```
POST /api/totp/setup
Authorization: Bearer <token>
// Returns { "secret": "...", "qrCodeDataUri": "..." }
```

**Verify TOTP (Activate)**
```
POST /api/totp/verify
Authorization: Bearer <token>
{ "code": "123456" }
```

**Disable TOTP**
```
POST /api/totp/disable
Authorization: Bearer <token>
{ "code": "123456" }
```

**Get TOTP Status**
```
GET /api/totp/status
Authorization: Bearer <token>
// Returns { "totpEnabled": true/false }
```

## File Uploads (MinIO)
Backend integrates MinIO; upload endpoints return a public URL.

**Upload avatar**
```
POST /api/files/upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Delete avatar**
```
DELETE /api/files/avatar
Authorization: Bearer <token>
```

**Upload application image (optional)**
```
POST /api/files/upload/application-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

### Frontend upload example (JS)
```js
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const res = await fetch("http://localhost:8080/api/files/upload/avatar", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const data = await res.json();
// data.url is the public file URL
```
    
## UI Requirements Checklist
- [ ] Auth pages: register (+recaptcha), login (+totp), verify email, forgot password
- [ ] Profile page: view + edit fields (including password change)
- [ ] Avatar upload + preview
- [ ] Application form + status view
- [ ] Players list page
- [ ] Admin panel (role-based)
- [ ] Error display for 400/401/403
- [ ] Loading states for API calls

## Statuses and Roles
- ApplicationStatus: `PENDING`, `ACCEPTED`, `REJECTED`
- UserRole: `ROLE_USER`, `ROLE_MODERATOR`, `ROLE_ADMIN`

## Ban Handling
- Banned users **CAN** login and receive JWT token
- Check `user.banned` field after login
- If `user.banned === true`:
  - Show red banner with `user.banReason`
  - Display profile in **read-only** mode
  - **Disable**: creating applications, editing profile, uploading avatar
  - **Allow**: viewing profile, viewing player list, logout
- See `BAN_HANDLING.md` for detailed frontend implementation guide

## Notes
- Handle 401/403 by redirecting to login or showing access denied.
- For admin panel, hide routes if role is not admin.
- Avatar URLs are public and can be used directly in `img`.

## Optional Enhancements
- Client-side form validation
- Pagination for lists
- Search/filter for users and applications
- Admin audit log
