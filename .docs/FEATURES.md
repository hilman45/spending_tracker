# Feature Specifications

---

## 1. Authentication

- Email/password authentication via Supabase
- All actions require authentication
- Users can only access their own data

---

## 2. File Upload & Storage

### Supported File Types (V1)

- PDF
- DOCX
- JPG / PNG

### Upload Rules

- Drag-and-drop and file browser upload
- Multiple files per upload allowed
- Files stored in Supabase Storage
- Files linked to user account

### File Retention

- Original files are retained
- Users can delete files manually

---

## 3. Text Extraction & OCR

- **PDFs:** Extract embedded text
- **DOCX:** Extract document text
- **Images:** OCR-based extraction
- Extraction is best-effort
- Errors are expected and handled gracefully

---

## 4. Transaction Detection

- One file may contain one or multiple transactions
- Extracted fields (if available):
  - Date
  - Amount
  - Currency
  - Description / merchant
- Missing or incorrect fields must be editable

---

## 5. Categorization (V1)

### Strategy

- Rule-based and keyword-based
- No AI-based categorization in V1

### Examples

| Keywords | Category |
|----------|----------|
| "Grab", "Uber" | Transport |
| "Netflix", "Spotify" | Subscriptions |
| "Shopee", "Lazada" | Shopping |

### User Control

- System suggests a category
- User can override
- User confirmation required before saving

---

## 6. Review & Confirmation

- Extracted transactions are shown in a review screen
- Users must confirm or edit all fields
- No background auto-save
- No silent saving

---

## 7. Transaction Management

Users can:

- View transactions
- Edit transactions
- Delete transactions
- Filter by date and category
- View source file for each transaction

---

## 8. Dashboard & Analytics

- Total spending summary
- Spending by category (pie chart)
- Monthly trend (line chart)
- Filters by date range and category

### Out of Scope

- Forecasting
- Budget recommendations
- Financial advice

---

## 9. Google Sheets Export

- Manual user-triggered export
- User selects date range
- New Google Sheet per export

### Export Columns

| Column |
|--------|
| Date |
| Description |
| Category |
| Amount |
| Currency |
| Source file |
