# StayHub - Accommodation Rental Platform

A full-stack B2C accommodation rental platform built with React, Node.js, Express, and PostgreSQL.

## Tech Stack

- **Frontend**: React (Vite) - `/client`
- **Backend**: Node.js + Express - `/server`
- **Database**: PostgreSQL
- **Maps**: Google Maps API

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Maps API Key (optional, for map features)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` with your database credentials and secrets.

For the client, create `client/.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 3. Create database

```bash
psql -U postgres -c "CREATE DATABASE stayhub;"
```

### 4. Run migrations and seed data

```bash
npm run setup:db
```

To also seed sample data:
```bash
cd server && node database/migrate.js --seed
```

### 5. Start development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## Features

- User authentication (JWT)
- Property listings with photos
- Search with filters (location, dates, guests, price, amenities)
- Google Maps integration
- Booking management
- Host dashboard (approve/reject bookings)
- Guest dashboard (view/cancel bookings)
- Review system
- Promotions & discount codes
- Availability calendar

## Sample Accounts (after seeding)

| Role  | Email                  | Password    |
|-------|------------------------|-------------|
| Host  | sarah@example.com      | password123 |
| Guest | john@example.com       | password123 |
| Guest | emily@example.com      | password123 |

## API Endpoints

| Method | Endpoint                        | Description           |
|--------|--------------------------------|-----------------------|
| POST   | /api/auth/register              | Register user         |
| POST   | /api/auth/login                 | Login                 |
| GET    | /api/auth/profile               | Get profile           |
| GET    | /api/properties                 | Host properties       |
| POST   | /api/properties                 | Create property       |
| GET    | /api/properties/:id             | Property details      |
| PUT    | /api/properties/:id             | Update property       |
| DELETE | /api/properties/:id             | Delete property       |
| GET    | /api/search                     | Search properties     |
| POST   | /api/bookings                   | Create booking        |
| GET    | /api/bookings/guest             | Guest bookings        |
| GET    | /api/bookings/host              | Host bookings         |
| PATCH  | /api/bookings/:id/status        | Update booking status |
| POST   | /api/reviews                    | Create review         |
| GET    | /api/reviews/property/:id       | Property reviews      |
| GET    | /api/availability/:propertyId   | Get availability      |
| POST   | /api/availability/:propertyId   | Set availability      |
| POST   | /api/promotions                 | Create promotion      |
| POST   | /api/promotions/validate        | Validate promo code   |
