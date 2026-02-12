# AI Extensibility & Constraints

---

## Design Principle

The system must be designed so AI can be added later **without changing**:

- UI flow
- Database schema
- User confirmation logic

---

## AI Rules (Future)

| Rule | Description |
|------|-------------|
| **Suggestions only** | AI only provides suggestions |
| **No auto-save** | AI never auto-saves data |
| **Confirmation required** | User confirmation remains mandatory |
| **No direct writes** | AI cannot directly write to the database |

---

## Potential AI Features (Future)

- Smarter categorization
- Merchant name normalization
- Recurring expense detection
- Spending insights summaries

---

## Explicit AI Constraints

- AI must **not** bypass user review
- AI must **not** modify confirmed data
- AI must remain **optional**
