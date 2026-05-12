# Aplus Lock BACKEND_SCHEMA.md

## users

Stores users, role hints, trusted devices and account security metadata.

Relationships: `memberships`, `credentials`, `audit_logs`.

## homes / buildings / floors / rooms

Stores project structure: home, hotel, office, building, floor and room.

Relationships: `locks`, `bookings`, `memberships`, `credentials`.

## locks

Stores lock hardware state.

Fields include `serial`, `model`, `gatewayId`, `firmware`, `battery`, `doorState`, `connectionState`, `settings`, `capabilities`.

Relationships: `rooms`, `credentials`, `commands`, `records`, `alerts`.

## credentials

Unified credential table for password, card, fingerprint, face, remote, phone, NFC and combination rules.

Fields include `type`, `status`, `ownerId`, `lockId`, `validFrom`, `validTo`, `syncState`, `hardwareRef`.

## commands

Stores command lifecycle.

States: `pending`, `sent`, `ack`, `success`, `timeout`, `failed`.

## records

Stores immutable access/audit records.

Records must link to lock, user/person, credential, command and ticket when available.

## alerts / tickets

Stores alarm center data and incident tickets.

Alert types include `battery_low`, `door_left_open`, `tamper`, `offline`, `failed_attempts`.

## api_keys / webhooks

Stores integration keys and webhook subscriptions.

Secrets must be hashed/encrypted server-side; app UI only receives masked values.
