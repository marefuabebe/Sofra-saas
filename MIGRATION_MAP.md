# SOFRA: Supabase to MERN Migration Map

This document outlines the planned replacements for all Supabase-dependent functionality to a MERN stack, ensuring no loss of features, strict tenant isolation, and a smooth architectural transition.

## High-Level Replacements

*   **Supabase RLS** → `tenantMiddleware` + `requireRole` (Express middleware)
*   **Supabase RPCs** → Express controllers + services
*   **PostgreSQL Triggers** → Mongoose timestamps + atomic Counter model
*   **Supabase Auth** → JWT + HTTP-only cookies
*   **Supabase Realtime** → Socket.IO rooms
*   **PostgreSQL Aggregation Queries** → MongoDB aggregation pipelines
*   **Supabase Public Menu Policies** → Public API routes scoped by restaurant slug

## Portal Preservation
The migration changes the backend, but exactly preserves the product's role structure and customer flow:
*   `/admin/*` → Platform Admin
*   `/dashboard/*` → Restaurant Owner / Staff
*   `/:restaurant-slug` → Customer

## Detailed Endpoint Mapping

| Current Supabase Feature | New MERN Implementation | API Endpoint / Socket Event | MongoDB Model |
| :--- | :--- | :--- | :--- |
| `supabase.rpc("admin_login")` | Express Controller + bcrypt + JWT (HTTP-only cookie) | `POST /api/auth/admin/login` | `AdminUser` |
| `supabase.rpc("restaurant_login")` | Express Controller + bcrypt + JWT (HTTP-only cookie) | `POST /api/auth/restaurant/login` | `User` |
| Logout (local storage clear) | Express Controller clearing cookie | `POST /api/auth/logout` | N/A |
| `supabase.rpc("admin_create_restaurant")` | Express Controller inside transaction | `POST /api/admin/restaurants` | `Restaurant`, `User` |
| `supabase.rpc("admin_reject_request")` | Express Controller | `PUT /api/admin/requests/:id/reject` | `RegistrationRequest` |
| `supabase.rpc("admin_toggle_restaurant_status")`| Express Controller | `PUT /api/admin/restaurants/:id/status` | `Restaurant` |
| `channel("pending-requests")` | Socket.IO Room: `admin_room` | `Event: request:new`, `request:updated` | `RegistrationRequest` |
| `channel("restaurant-orders-{id}")` | Socket.IO Room: `tenant_{restaurantId}` | `Event: order:new`, `order:updated` | `Order` |
| `supabase.from("menu_items").insert()` | Express Controller + Tenant Middleware | `POST /api/menu` | `MenuItem` |
| `supabase.from("orders").insert()` | Express Controller (Public) | `POST /api/orders` | `Order` |

## Hard Rule: Tenant Security
The `restaurantId` is intrinsically linked to the authenticated `User` and appended securely to all relevant Mongoose queries (orders, menu items, categories, reports, notifications, settings). The client MUST NEVER be able to override this tenant context via body, query, or params.
