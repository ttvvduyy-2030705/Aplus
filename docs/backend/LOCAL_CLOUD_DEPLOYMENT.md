# Aplus Lock LOCAL_CLOUD_DEPLOYMENT.md

## Local server

For demo, lab and hardware testing.

Checklist:

- Use LAN IP or internal DNS, not `localhost` in app release.
- Keep MQTT broker reachable from app/gateway.
- Schedule database backup.
- Store secrets outside frontend source.
- Test backend-off behavior: app must not crash.

## Private cloud

Recommended for hotels/apartments that require private data.

Checklist:

- HTTPS certificate.
- Database backup and restore test.
- Failover endpoint.
- API key rotation policy.
- Webhook retry/dedupe.
- Immutable audit logs.

## Aplus cloud

Shared cloud profile for Open API and realtime monitor.

Checklist:

- Rate limit by API key, IP and user.
- Secret rotation.
- Monitoring for WebSocket/MQTT connections.
- Alert on failed webhook delivery.
- Do not expose raw API key in mobile app.

## Release guard

Before handoff:

- No `localhost` or `127.0.0.1` base URL.
- No test account in production config.
- No plaintext API key in mobile source.
- Remote unlock requires permission, online state, App PIN/biometric and audit log.
