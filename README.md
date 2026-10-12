# Swapski | Skill-Swapping Platform

Swapski is a peer-to-peer skill-exchange platform built with a **Django 5.x REST backend**, **SQLite**, and a responsive **Vanilla JavaScript Single-Page Application (SPA)**. Members exchange professional skills and services using virtual **Swap Credits** held safely in escrow.

---

## 1. Quickstart & Setup

### Prerequisites
- Python 3.11+
- pip

### Installation Steps

1. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Seed standard categories and skills:**
   ```bash
   python manage.py seed_categories
   ```

5. **(Optional / Development) Seed sample member accounts & realistic swaps:**
   ```bash
   python manage.py seed_demo
   ```
   *Creates 4 accounts with starting credits, services, and live swaps (password: `Password123!`):*
   - `amaka.okafor@swapski.ng` (`@ammkaydesigns`)
   - `chidi.eze@swapski.ng` (`@chidibuilds`)
   - `farida.balogun@swapski.ng` (`@faridaresearch`)
   - `tunde.bakare@swapski.ng` (`@tundemotion`)

6. **Create an admin superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the local server:**
   ```bash
   python manage.py runserver
   ```
   Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.

8. **Run test suite:**
   ```bash
   python manage.py test
   ```

---

## 2. Credit Rules & Ledger Model

Swap Credits are virtual platform units (no real money, credit cards, or cashouts).

1. **300 Starting Credits**: Every new member receives 300 credits immediately upon registration via a `SIGNUP_BONUS` ledger entry.
2. **Append-Only Ledger**: No balances are stored on user models. All balances are derived dynamically from the immutable ledger and active swaps:
   - **Available Balance**: Sum of all ledger entries for the user.
   - **Escrow**: Sum of credit amounts for active swaps where the user is requester (`requested`, `in_progress`, or `review`).
   - **Earned**: Sum of `EARN` ledger entries.
   - **Spent**: Sum of credit amounts for completed swaps where the user was requester.
3. **Escrow Lock**: When a member requests a service, credits are locked in escrow via an `ESCROW_LOCK` negative ledger entry.
4. **Approval & Payment**: When the requester approves deliverables, an `EARN` entry releases credits to the provider. Approval is strictly idempotent under database row locks (`select_for_update()`).
5. **Refunds**: If a request is declined or cancelled, a `REFUND` ledger entry restores the credits to the requester.
6. **No Overspending**: All credit movements execute in atomic transactions with `select_for_update()`. Available balance can never go below zero.

---

## 3. Swap Workflow Lifecycle

```
[Requested] ──(Provider accepts)──> [In Progress] ──(Provider delivers)──> [Review] ──(Requester approves)──> [Completed]
     │                                     ▲                                    │                                  │
     │ (Provider declines/                 └──────(Request changes)─────────────┘                                  ▼
     │  Requester cancels)                                                                                  [Mutual Reviews]
     ▼
[Declined / Cancelled] (Refunded)
```

- **Request**: Requester chooses an active service, describes needs, and locks credits in escrow.
- **Accept**: Provider accepts and commits to delivery date (`due_at = accepted_at + delivery_days`).
- **Deliver**: Provider submits links, notes, or uploaded files (up to 5 MB).
- **Request Changes**: Requester can request revisions with notes; status moves back to `in_progress`.
- **Approve**: Requester approves work; credits released to provider; status marked `completed`.
- **Review**: Both parties can submit a 1–5 star review to build verified platform reputation.
- **Admin Resolution**: Stuck swaps can be resolved directly in Django Admin using actions: *Release credits to provider* or *Refund requester*.

---

## 4. Folder Structure

```
swapski/
├── accounts/                  # User model, authentication, profiles, demo seeds
│   ├── management/commands/   # seed_demo command
│   ├── models.py              # Custom User model (AbstractUser, email, handle, skills)
│   ├── serializers.py         # User serializers
│   ├── views.py               # Auth, profile, public profile endpoints
│   └── tests.py               # API & auth test suite
├── marketplace/               # Categories, Skills, Services
│   ├── management/commands/   # seed_categories command
│   ├── models.py              # Category, Skill, Service models
│   ├── serializers.py         # Service & catalog serializers
│   └── views.py               # Marketplace catalogue & service CRUD
├── swaps/                     # Core swaps engine, escrow, ledger, chat, reviews
│   ├── admin.py               # Django Admin with resolution actions & read-only ledger
│   ├── models.py              # SwapRequest, Delivery, LedgerEntry, Message, Review, Notification
│   ├── services.py            # Pure business logic functions & transactional rules
│   ├── serializers.py         # Swap, delivery, message, and wallet serializers
│   ├── views.py               # Swap transitions, chat polling, wallet, notifications, dashboard
│   └── tests.py               # Business rules unit tests
├── config/                    # Django project configuration
│   ├── settings.py            # Settings (Lagos timezone, session auth, media, etc.)
│   ├── urls.py                # Main URL router
│   ├── api_urls.py            # JSON REST API routes (/api/*)
│   └── exceptions.py          # Unified JSON error response handler
├── templates/
│   └── index.html             # Shell template loading vendored assets and modular frontend
├── static/
│   ├── css/styles.css         # Theme styles (Dark/Light glassmorphism)
│   ├── img/SWAP.png           # Brand logo
│   ├── vendor/                # Pinned local dependencies (Bootstrap 5.3.8, Icons, Inter font)
│   └── js/
│       ├── api.js             # CSRF-aware fetch API client
│       ├── ui.js              # esc() escaping, toasts, modals, category helpers
│       ├── main.js            # SPA hash router, persistent app shell, badge poller
│       └── pages/             # Modular page renderers (landing, auth, dashboard, marketplace, swaps, messages, wallet, notifications, profile, settings)
├── _legacy/                   # Original mock files & previous tooling backup
├── manage.py
├── requirements.txt
└── README.md
```

---

## 5. API Reference Summary

All API endpoints return JSON under `/api/`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register user, grant 300 credits bonus, log in session |
| `POST` | `/api/auth/login/` | Log into session |
| `POST` | `/api/auth/logout/` | End session |
| `GET` | `/api/auth/me/` | Current user details, balances, and unread badges |
| `POST` | `/api/auth/change-password/` | Update account password |
| `GET` / `PATCH` | `/api/me/` | View / update profile and skills |
| `GET` | `/api/users/<id>/` | Public read-only member profile |
| `GET` | `/api/categories/` | List categories |
| `GET` | `/api/skills/?q=` | Search skills catalogue |
| `GET` | `/api/services/?q=&category=&sort=&page=` | Search active marketplace services (page size 12) |
| `POST` | `/api/services/` | Publish a new service |
| `GET` / `PATCH` / `DELETE` | `/api/services/<id>/` | View, edit, or deactivate service |
| `GET` | `/api/me/services/` | View current user's owned services |
| `GET` | `/api/swaps/?role=&status=` | Filter user's swaps |
| `POST` | `/api/swaps/` | Create swap request and lock escrow |
| `GET` | `/api/swaps/<id>/` | Full swap detail (timeline, deliveries, actions, ledger) |
| `POST` | `/api/swaps/<id>/accept/` | Provider accepts request |
| `POST` | `/api/swaps/<id>/decline/` | Provider declines (refunds requester) |
| `POST` | `/api/swaps/<id>/cancel/` | Requester cancels (refunds requester) |
| `POST` | `/api/swaps/<id>/deliver/` | Provider delivers link, note, or file |
| `POST` | `/api/swaps/<id>/request-changes/` | Requester requests revisions |
| `POST` | `/api/swaps/<id>/approve/` | Requester approves & releases escrow credits |
| `POST` | `/api/swaps/<id>/review/` | Leave 1–5 star review |
| `GET` / `POST` | `/api/swaps/<id>/messages/` | Read messages (`?after=`) & post new message |
| `GET` | `/api/deliveries/<id>/download/` | Download attached deliverable (participants only) |
| `GET` | `/api/wallet/` | Derived balances and ledger history |
| `GET` | `/api/notifications/` | List notifications |
| `POST` | `/api/notifications/<id>/read/` | Mark notification read |
| `POST` | `/api/notifications/read-all/` | Mark all notifications read |
| `GET` | `/api/dashboard/` | Action items, balances, recommendations |
| `GET` | `/api/stats/` | Platform counts (members, services, swaps) |
