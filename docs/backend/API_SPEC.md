# Aplus Lock API_SPEC.md

Batch 23 defines the app-facing backend surface for Aplus Lock. The app must be able to switch `baseUrl` between local server, private cloud, and Aplus cloud without changing UI code.

## Authentication

- `POST /v1/auth/login` — email/phone + password.
- `POST /v1/auth/register` — create account and send OTP.
- `POST /v1/auth/otp/verify` — verify OTP for register/reset/sensitive actions.
- `POST /v1/auth/logout` — revoke session and optional trusted device.
- `GET /v1/auth/me` — current user profile, role and permission scope.

## Homes / rooms / staff

- `GET /v1/homes`
- `GET /v1/rooms?homeId=&floorId=&query=`
- `POST /v1/rooms`
- `PATCH /v1/rooms/:roomId`
- `POST /v1/rooms/:roomId/assign-lock`
- `GET /v1/memberships`
- `POST /v1/invites`
- `POST /v1/invites/:inviteId/accept`

## Locks / device settings

- `GET /v1/locks`
- `GET /v1/locks/:lockId`
- `PATCH /v1/locks/:lockId/settings`
- `GET /v1/locks/:lockId/diagnostic`
- `GET /v1/locks/:lockId/firmware`
- `POST /v1/locks/:lockId/firmware/install`
- `GET /v1/locks/:lockId/capability-matrix`

## Credentials

- `GET /v1/credentials?lockId=&personId=&type=`
- `POST /v1/credentials/passwords`
- `POST /v1/credentials/cards`
- `POST /v1/credentials/fingerprints`
- `POST /v1/credentials/faces`
- `POST /v1/credentials/remotes`
- `POST /v1/credentials/phones`
- `POST /v1/credentials/nfc`
- `POST /v1/credentials/combination-rules`
- `POST /v1/credentials/:credentialId/revoke`

## Commands / realtime lifecycle

- `POST /v1/commands/remote-unlock`
- `POST /v1/commands/lock`
- `GET /v1/commands/:commandId`
- `POST /v1/commands/:commandId/cancel`

Command states: `pending`, `sent`, `ack`, `success`, `timeout`, `failed`.
The app must not change lock state until `success` is confirmed by backend/gateway event.

## Records / alerts / reports

- `GET /v1/records?lockId=&method=&result=&from=&to=`
- `GET /v1/records/:recordId`
- `POST /v1/records/:recordId/notes`
- `GET /v1/alerts`
- `PATCH /v1/alerts/:alertId/read`
- `PATCH /v1/alerts/:alertId/resolve`
- `POST /v1/tickets`
- `GET /v1/reports/summary`
- `GET /v1/reports/method-breakdown`
- `GET /v1/reports/export?format=csv|json|pdf`

## PMS / Open API

- `POST /v1/open-api/pms/bookings`
- `POST /v1/open-api/pms/check-in`
- `POST /v1/open-api/pms/check-out`
- `POST /v1/open-api/hr/staff-sync`
- `POST /v1/open-api/campus-card/sync`
- `POST /v1/open-api/miniapp/unlock-token`
- `POST /v1/open-api/webhooks`
- `POST /v1/open-api/webhooks/:webhookId/test`

## Security requirements

- All protected endpoints require JWT or API key.
- API keys must be masked in app UI and never stored as plaintext in frontend source.
- Rate limit by API key, IP and user role.
- Sensitive actions require audit log: remote unlock, transfer, revoke, factory reset, emergency card, API key operations.
- Release guard must block `localhost` or `127.0.0.1` base URL.
