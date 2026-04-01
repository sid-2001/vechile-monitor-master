# Vehicle Monitoring System Backend

Production-ready backend using Node.js + TypeScript + Express + MongoDB + JWT.

## Features
- JWT authentication
- 3 failed login attempts lock account
- Forgot password with passcode
- CRUD for Base, Users, Vehicles, VehicleLocations
- Filtering, search, pagination
- Automatic audit fields via reusable Mongoose plugin
- Default seed data: Admin user + Jalandhar Base
- Swagger/OpenAPI documentation for all APIs

## Run
1. Copy `.env.example` to `.env`
2. Install deps: `npm install`
3. Dev: `npm run dev`
4. Build: `npm run build`

## API Docs
- Swagger UI: `GET /api/docs`
- OpenAPI JSON: `GET /api/docs.json`

## Audit field behavior
Audit fields are added to all collections through `auditPlugin` and cannot be supplied from request body.

- On create: `created*` is auto-populated from current time + timezone and logged-in user (`SYSTEM` fallback)
- On update: `modified*` is auto-populated from current time + timezone and logged-in user
