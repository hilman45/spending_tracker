# Conceptual Data Model

---

## Core Entities

- **User**
- **File**
- **Transaction**
- **Category**

---

## Transaction Fields (Conceptual)

| Field | Type | Notes |
|-------|------|-------|
| `id` | — | Primary key |
| `user_id` | — | Owner reference |
| `file_id` | — | Source file reference |
| `date` | — | Transaction date |
| `amount` | — | Transaction amount |
| `currency` | — | Currency code |
| `description` | — | Merchant / description |
| `suggested_category` | — | System suggestion |
| `confirmed_category` | — | User-confirmed value |
| `confidence_score` | nullable | For future AI (unused in V1) |
| `created_at` | — | Timestamp |

---

## Design Notes

- `suggested_category` and `confirmed_category` must be **separate**
- `confidence_score` is nullable and unused in V1
- Schema must **not** require changes when AI is added later
