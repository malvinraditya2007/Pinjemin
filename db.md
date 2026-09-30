# 🏗 Pinjemin Database Schema — Full Audit & Redesign

## 1. Frontend Reverse-Engineering (HTML & JS Audit)

### 1.1 Entities Extracted from UI

| Entity | Source Pages | Form Fields / Fetch Payloads | Status Lifecycle |
|---|---|---|---|
| **User** | register, login, profile, dashboard | `nama`, `username`, `password` (register); `fullName`, `bio`, `address` (edit profile) | — |
| **Item** | item-new, item-detail, discover, dashboard | `title`, `category` (select: 11 values), `condition` (select: 4 values), `description`, `depositAmount`, `neighborhood`, `tags`, `usageGuidelines`, `images` (JSON array of base64) | `isAvailable` (Boolean) |
| **Request** | item-detail (modal), requests, approvals, borrows-active | `itemId`, `purpose`, `message`, `startDate`, `endDate` | `PENDING → APPROVED → RETURNED` or `PENDING → REJECTED` or `PENDING → CANCELLED` (+ `OVERDUE` in utils) |
| **Review** | rate-review | `requestId`, `rating` (1-5 stars, owner), `itemCond` (1-5 stars), `comment` | — |
| **Notification** | notifications, dashboard (activity feed) | Created server-side | Types: `BORROW_REQUEST_RECEIVED`, `BORROW_REQUEST_APPROVED`, `BORROW_REQUEST_REJECTED`, `ITEM_RETURNED`, `RATING_RECEIVED`, `OVERDUE_REMINDER`, `TRUST_SCORE_CHANGED`, `WELCOME`, `SYSTEM` |

### 1.2 Query Patterns Observed

| Page | Pattern |
|---|---|
| `discover.html` | Filter by: `category`, `condition`, `isAvailable`, `neighborhood` (text search). Sort by: `newest` (createdAt desc), `views` (viewCount desc). Full-text search on `title` + `description`. |
| `requests.html` | Filter by tab: `status` (`PENDING`, `APPROVED`, `RETURNED`, `REJECTED`). Order: `createdAt desc`. |
| `approvals.html` | Same filter + order as requests. |
| `borrows-active.html` | Filter: `status === 'APPROVED'` on sent/received. |
| `dashboard.html` | Items filtered by `category` chip. Top lenders: `ORDER BY totalLends DESC LIMIT 3`. |
| `profile.html` | Items filtered by `ownerId`. |
| `notifications.html` | All by userId, `ORDER BY createdAt DESC`. |

### 1.3 Data Types & Values from Frontend Dropdowns

**Category** (11 values from `<select>`):
`TOOLS`, `ELECTRONICS`, `SPORTS`, `KITCHEN`, `GARDEN`, `VEHICLE`, `BABY_KIDS`, `BOOKS_MEDIA`, `FASHION`, `OUTDOOR`, `OTHER`

**Condition** (4 values):
`EXCELLENT`, `GOOD`, `FAIR`, `NEEDS_CARE`

**Request Status** (6 values from utils.js):
`PENDING`, `APPROVED`, `REJECTED`, `RETURNED`, `OVERDUE`, `CANCELLED`

**Trust Level** (4 values from utils.js):
`NEW` (≤40), `MEMBER` (≤70), `TRUSTED` (≤89), `VERIFIED` (90+)

**User Role**: `user`, `admin`

**Notification Type** (9 values from notifications.html):
`BORROW_REQUEST_RECEIVED`, `BORROW_REQUEST_APPROVED`, `BORROW_REQUEST_REJECTED`, `ITEM_RETURNED`, `RATING_RECEIVED`, `OVERDUE_REMINDER`, `TRUST_SCORE_CHANGED`, `WELCOME`, `SYSTEM`

---

## 2. Gap Analysis — Old Schema vs Frontend Reality

### 2.1 Anti-Patterns in Old Schema

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **String-typed enums** — `category`, `condition`, `status`, `type`, `trustLevel`, `role` are all plain `String`. No type-safety, no DB-level constraint. | All models | 🔴 Critical |
| 2 | **No `onDelete` cascades** — Deleting a User leaves orphaned Items, Requests, Reviews, Notifications. Deleting an Item leaves orphaned Requests, Reviews. | All `@relation()` | 🔴 Critical |
| 3 | **No indexes on FKs** — `ownerId`, `borrowerId`, `lenderId`, `itemId`, `userId` lack `@@index`. Every filtered query does a full table scan on those columns. | All FK fields | 🟠 High |
| 4 | **`images` as String** — Stored as JSON string but typed as `String`. Should be `Json` for native PostgreSQL JSONB. | `Item.images` | 🟠 High |
| 5 | **`tags` as comma-separated String** — Not searchable efficiently. Should be `String[]` (Postgres array) or `Json`. | `Item.tags` | 🟡 Medium |
| 6 | **`data` in Notification as String** — JSON-stringified manually. Should be native `Json` type. | `Notification.data` | 🟡 Medium |
| 7 | **No `@@map` / `@map`** — All tables/columns default to camelCase in PostgreSQL. Not standard PostgreSQL naming convention. | All models | 🟡 Medium |
| 8 | **`phone` required but auto-generated** — `phone` is `@unique` and mandatory, but registration uses a timestamp placeholder (`+62${Date.now()}`). Field should be optional. | `User.phone` | 🟡 Medium |
| 9 | **No `updatedAt` on Review** — Reviews lack `updatedAt`. | `Review` | 🟡 Medium |
| 10 | **No soft-delete** — No `deletedAt` field on User or Item for data recovery. | User, Item | 🟡 Medium |
| 11 | **Review not linked to Request** — `rate-review.html` navigates via `?req=<requestId>`, but old schema's Review has no `requestId`. Rating controller uses `requestId` in body but doesn't persist the link. | `Review` | 🟠 High |
| 12 | **No unique constraint on Review per Request** — A user could submit unlimited reviews for the same request. | `Review` | 🟠 High |
| 13 | **`distance` mock field** — `Item.distance` is a mock field (`Float?`) with no real geo data backing. Dead weight. | `Item.distance` | 🟢 Low |
| 14 | **`neighborhood` on both User and Item** — Redundant; `users.controller.js` syncs them manually. | `User.neighborhood`, `Item.neighborhood` | 🟢 Low |

### 2.2 Missing Fields (Frontend/Backend Needs vs Schema)

| Field | Needed By | Not in Old Schema? |
|---|---|---|
| `Review.requestId` | `rate-review.html` sends `requestId`, ratings controller uses it | ✅ Missing |
| `User.deletedAt` | Soft-delete for user accounts | ✅ Missing |
| `Item.deletedAt` | Soft-delete for items | ✅ Missing |

### 2.3 Dead/Unnecessary Fields

| Field | Why Dead |
|---|---|
| `Item.distance` | Mock-only. No geo coordinates in User or Item. Frontend doesn't use it for any real query. |
| `User.neighborhood` | Redundant with `User.address`. Backend syncs neighborhood → item automatically. Only `address` is edited in profile. Frontend reads `user.address` for display. |

---

## 3. Prisma Model ↔ Frontend Mapping Table

| Prisma Model.Field | HTML Element / JS Payload | Page |
|---|---|---|
| `User.fullName` | `#reg-nama` (input name="nama") | register.html |
| `User.username` | `#reg-username`, `#login-username` | register, login |
| `User.passwordHash` | `#reg-password`, `#login-password` | register, login |
| `User.bio` | `#edit-bio` (textarea) | profile.html (edit modal) |
| `User.address` | `#edit-address` (input) | profile.html (edit modal) |
| `User.trustScore` | `#trust-score-val`, trust ring | dashboard, profile |
| `User.totalLends` | profile stats, top lenders leaderboard | profile, dashboard |
| `User.totalBorrows` | profile stats | profile |
| `User.successfulReturns` | profile stats, impact calculation | profile, dashboard |
| `Item.title` | `#item-title` | item-new |
| `Item.category` | `#item-cat` (select, 11 options) | item-new, discover |
| `Item.condition` | `#item-cond` (select, 4 options) | item-new, discover |
| `Item.description` | `#item-desc` (textarea) | item-new |
| `Item.depositAmount` | `#deposit` (number input) | item-new |
| `Item.neighborhood` | `#neighborhood` (input) | item-new |
| `Item.tags` | `#item-tags` (comma-separated input) | item-new |
| `Item.usageGuidelines` | `#guidelines` (textarea) | item-new |
| `Item.images` | `#file-input` (file upload → base64 JSON) | item-new |
| `Item.isAvailable` | Badge "Tersedia"/"Dipinjam" | discover, item-detail |
| `Item.viewCount` | "👁 X dilihat" | discover, item-detail |
| `Request.purpose` | `#purpose` (textarea) | item-detail (borrow modal) |
| `Request.message` | `#msg` (textarea, optional) | item-detail (borrow modal) |
| `Request.startDate` | `#start-date` (date input) | item-detail (borrow modal) |
| `Request.endDate` | `#end-date` (date input) | item-detail (borrow modal) |
| `Request.status` | Tab filters + badge | requests, approvals |
| `Request.rejectReason` | `#reject-reason-{id}` (select) | approvals |
| `Review.rating` | `input[name="owner-rating"]` (radio 1-5) | rate-review |
| `Review.itemCond` | `input[name="item-cond"]` (radio 1-5) | rate-review |
| `Review.comment` | `#owner-comment` (textarea) | rate-review |
| `Notification.type` | Icon mapping in JS | notifications, dashboard |
| `Notification.title` | Card title | notifications |
| `Notification.body` | Card body text | notifications |
| `Notification.isRead` | Opacity + green dot | notifications |

---

## 4. Migration & Breaking Changes Guide

### Renamed Fields
| Old | New | Reason |
|---|---|---|
| — | All PG columns get `@map("snake_case")` | PostgreSQL naming convention |

### Dropped Fields
| Field | Reason |
|---|---|
| `Item.distance` | Mock-only, never used in any real query |
| `User.neighborhood` | Redundant with `User.address`; backend already syncs to Item |

### New Fields
| Field | Reason |
|---|---|
| `Review.requestId` | Links review to specific borrow request (as frontend expects) |
| `User.deletedAt` | Soft-delete capability |
| `Item.deletedAt` | Soft-delete capability |

### Type Changes
| Field | Old Type | New Type |
|---|---|---|
| `Item.category` | `String` | `enum ItemCategory` |
| `Item.condition` | `String` | `enum ItemCondition` |
| `Item.images` | `String` | `Json` (JSONB) |
| `Item.tags` | `String` | `String[]` (PG array) |
| `Request.status` | `String` | `enum RequestStatus` |
| `Notification.type` | `String` | `enum NotificationType` |
| `Notification.data` | `String?` | `Json?` |
| `User.trustLevel` | `String` | `enum TrustLevel` |
| `User.role` | `String` | `enum UserRole` |

### New Indexes
- All FK fields: `ownerId`, `borrowerId`, `lenderId`, `itemId`, `userId`, `authorId`, `targetId`
- Search/filter columns: `Item.category`, `Item.condition`, `Item.isAvailable`, `Item.neighborhood`
- Composite: `Item(category, isAvailable, createdAt)`
- Unique constraint: `Review(requestId)` — one review per request

### Cascade Rules
| Relation | onDelete |
|---|---|
| Item → User (owner) | `Cascade` — deleting user removes their items |
| Request → Item | `Cascade` — deleting item removes related requests |
| Request → User (borrower, lender) | `Cascade` |
| Review → User (author, target) | `Cascade` |
| Review → Item | `SetNull` — keep review if item deleted |
| Review → Request | `SetNull` — keep review if request deleted |
| Notification → User | `Cascade` |

> [!IMPORTANT]
> Since we used `prisma db push --force-reset` earlier (empty DB), this migration is a clean-slate replacement. No data migration needed.
