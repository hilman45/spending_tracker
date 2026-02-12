# Product Requirements Document – Spending Tracker

---

## 1. Product Goal

Build a web-based personal spending tracker that allows users to:

- Upload expense-related documents
- Extract transaction data
- Categorize expenses
- Review and confirm transactions
- Visualize spending analytics
- Export data to Google Sheets

### Design Priorities

| Priority | Description |
|----------|-------------|
| **Accuracy** | Over automation |
| **Confirmation** | User confirmation before saving |
| **Clarity** | Clean, explainable logic |
| **Extensibility** | Future AI-based features |

---

## 2. Target Users

- Individuals tracking personal expenses
- Single-user accounts
- Web usage only (desktop-first)
- No business or accounting workflows

---

## 3. Platform

- Web application only
- Desktop-first responsive UI

---

## 4. Tech Stack (Locked)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (App Router) |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js |
| **Backend** | Next.js Server Actions / API Routes |
| **Database & Auth** | Supabase (PostgreSQL + Auth) |
| **File Storage** | Supabase Storage |
| **OCR** | Tesseract or external OCR API |
| **Export** | Google Sheets API |

---

## 5. Core User Flow

1. User logs in
2. Uploads expense documents
3. System extracts text and detects transactions
4. System suggests categories
5. User reviews and confirms data
6. Transactions are saved
7. Dashboard updates
8. User exports to Google Sheets *(optional)*

---

## 6. Success Criteria

- [ ] Users can upload files and extract transactions
- [ ] Categorization works using rule + keyword logic
- [ ] No transaction is saved without user confirmation
- [ ] Spending analytics are visible
- [ ] Export to Google Sheets works
- [ ] Architecture supports future AI enhancement without refactor
