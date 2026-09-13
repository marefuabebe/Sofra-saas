# SOFRA Architecture

The SOFRA application utilizes a monolithic repository with a clear frontend/backend split.

## Frontend (`/frontend`)
*   **Framework**: React 18, Vite, TypeScript
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM (v7)
*   **API Communication**: Axios/fetch wrapping standard REST calls to the backend, plus Socket.IO client for realtime updates.

## Backend (`/backend`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: MongoDB (Mongoose ODM)
*   **Authentication**: Custom JWT (HTTP-only cookies), bcrypt.
*   **Realtime**: Socket.IO

## Tenancy & Data Isolation
*   Strict multi-tenant isolation enforced via server-side middleware (`tenantMiddleware`).
*   The `restaurantId` is intrinsically linked to the authenticated `User` and appended securely to all relevant Mongoose queries. Clients cannot arbitrarily specify `restaurantId` in requests.

## End-to-End Flow
```text
                    RESTAURANT
                        │
                Dashboard / Owner
                        │
                   Generate QR
                        │
                        ▼
               https://sofra.com/
                 [restaurant-slug]
                        │
                        ▼
                    CUSTOMER
                        │
                  Scan QR / Link
                        │
                        ▼
                 CustomerMenu
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        Restaurant API       Menu API
              │                   │
              └─────────┬─────────┘
                        ▼
                    Menu UI
                        │
                  Select Food
                        │
                     Cart
                        │
                  Place Order
                        │
                        ▼
                  Express API
                        │
                  MongoDB Order
                        │
                  Socket.IO
                        │
                        ▼
              Restaurant Dashboard
                        │
                 Update Status
                        │
                  Socket.IO
                        │
                        ▼
                 Customer Status
```
