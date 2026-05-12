# Aplus Lock INTEGRATION_GUIDE.md

## PMS integration

Use PMS integration when external booking systems create check-in/check-out flows.

1. Create API key with scopes: `read`, `write`, `pms`, `webhook`.
2. Register webhook for `booking.checked_in`, `booking.checked_out`, `credential.revoked`.
3. Send booking payload with room, guest, check-in and check-out time.
4. On check-in, backend creates password/card/phone authorization jobs.
5. On check-out, backend revokes all credentials linked to the booking.

## HR / staff integration

Use HR integration for staff/worker/cleaner/security sync.

1. Create API key with scopes: `read`, `write`, `hr`.
2. Sync people and role mappings.
3. Attach role matrix to buildings/rooms/locks.
4. When employment ends, backend revokes related credentials and writes audit logs.

## Campus one-card integration

Campus systems can sync cards and class schedules.

- Use card identifiers that are hashed or tokenized.
- Apply schedule windows for classroom/lab access.
- Use conflict detection for overlapping class schedule rules.

## Mini app unlock

Mini app unlock must be token based.

- Token TTL should be short.
- Token must include lock scope and user role.
- Every unlock attempt creates a command and access record.
- Remote unlock is blocked when lock/gateway is offline.

## Webhooks

Recommended webhook events:

- `lock.event`
- `credential.created`
- `credential.revoked`
- `alert.created`
- `booking.checked_in`
- `booking.checked_out`

Webhook security:

- Sign payload with `whsec_*` secret.
- Retry with exponential backoff.
- Use dedupe key: `eventId + targetUrl`.
- Store delivery status for monitor UI.
