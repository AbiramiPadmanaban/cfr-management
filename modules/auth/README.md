# Auth module

Authentication for the Customer Feedback Report app. Users are created by administrators only — there is no public registration.

## Flows

1. **Admin creates user** (`/cfr/users` or API/script) → account stored without password → setup email sent
2. **User opens setup link** → `/set-password` → sets password → redirected to `/login`
3. **User signs in** → session cookie → `/cfr` dashboard
4. **Forgot password** → generic confirmation → reset email → `/reset-password` → login

## Public routes

| Path | Purpose |
|------|---------|
| `/login` | Sign in |
| `/forgot-password` | Request reset |
| `/set-password?token=` | First-time password |
| `/reset-password?token=` | Password reset |
| `/feedback/[token]` | Client feedback (unchanged, unauthenticated) |

Protected: `/`, `/cfr/**`

## Admin / scripts

```bash
# Local admin with password already set (dev bootstrap)
npm run bootstrap-admin -- admin@example.com "StrongPass@1" "Admin Name"

# Create user and send setup email (same as UI)
npm run create-user -- user@example.com "Display Name" USER

# Re-issue a setup link (prints URL; useful if email is delayed)
npx tsx scripts/issue-setup-link.ts user@example.com
```

## APIs

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Sets session cookie |
| POST | `/api/auth/logout` | Clears session |
| POST | `/api/auth/forgot-password` | Always generic success |
| POST | `/api/auth/set-password` | First-time setup |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/auth/validate-setup-token?token=` | Token check |
| POST | `/api/auth/users` | Admin: create user + setup email |
| POST | `/api/auth/users/[id]/send-setup-email` | Admin: resend setup |

## Security notes

- Passwords hashed with scrypt (never stored plain)
- Setup/reset tokens are random, SHA-256 hashed at rest, time-limited, single-use
- Inactive users cannot sign in
- Forgot-password does not reveal whether an email exists
- `SESSION_SECRET` must be set (32+ chars)
