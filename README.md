# NEU Trading Demo Auth API

NestJS 11 authentication/token service for the LEAP trading reference implementation.

## Security boundary

Clients and administrative Users are intentionally separate identity domains.

- **CLIENT** authentication reads `identity.clients`. Clients have no role concept and JWTs contain no roles.
- **ADMIN** authentication reads `identity.users` plus `identity.user_roles`. Admin JWTs contain administrative roles.
- Spring Boot remains the system of record for client registration, administrative user creation, role assignment and enable/disable operations.
- NestJS owns credential verification, access JWTs, refresh sessions and logout/revocation.

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/validate` — validates an access token for the Spring Boot API and returns the current active subject/roles

Login requires an explicit `type` of `CLIENT` or `ADMIN`; the service never promotes or converts one identity type into the other.

## Run

Copy `.env.example` to `.env`, configure the OLTP PostgreSQL connection and set a long random `JWT_SECRET`.

```bash
npm install
npm run build
npm run start:dev
```

Default port: 3001.

## Demo client credentials

For local training/demo use, the Auth API can initialize a password for the seeded Joanna client without storing a plaintext password or reusable hash in Git. Set `DEMO_CLIENT_EMAIL=joanna@example.test` and `DEMO_CLIENT_PASSWORD` in the local `.env`. When the password variable is absent or blank, the bootstrap makes no database change. The password is BCrypt-hashed inside the Auth service.
