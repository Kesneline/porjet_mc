# 📋 PLAN DE RECOMMANDATIONS - Stud'Housing Trust Backend

**Contexte**: MVP/Beta fermée (< 100 users), timeline 1-2 mois, infrastructure simple (Railway/Vercel), budget limité

---

## 🎯 OBJECTIFS

1. **Sécuriser rapidement** les chemins critiques (auth, upload)
2. **Ajouter observabilité** pour debugging et monitoring
3. **Tester les features critiques** pour éviter les bugs en production
4. **Finaliser les modules** commencés (admin, search)
5. **Documenter les decisions** architecturales

---

## 📊 ROADMAP PRIORISÉE (13-14 semaines)

### **PHASE 1: SÉCURITÉ CRITIQUE (Semaine 1-2) - 40h**

_Refuser les attaques basiques de deny-of-service_

#### 1.1 Rate Limiting (8h)

**Qui**: Backend Dev
**Pourquoi**: Empêcher brute force sur /auth/login, /register, éviter DDoS simple
**Comment**:

- ✅ Ajouter `express-rate-limit` au package.json
- ✅ Créer `/src/middlewares/rateLimit.middleware.ts`
- ✅ Limites par endpoint:
  - `POST /api/auth/register` → 3/heure par IP
  - `POST /api/auth/login` → 5/15min par IP
  - `GET /api/listings` → 60/minute (public)
  - `POST /api/listings` → 10/heure (authentifié)
- ✅ Retourner HTTP 429 avec header `Retry-After`
  **Files changés**:
- `src/middlewares/rateLimit.middleware.ts` (NEW)
- `src/app.ts` (ajouter middleware)
- `package.json` (add express-rate-limit)

**Validation**: Tester avec `curl -I http://localhost:3000/api/auth/login` x6 (6ème request = 429)

---

#### 1.2 CORS Restriction (4h)

**Qui**: Backend Dev
**Pourquoi**: N'accepter les requests que depuis l'app Flutter/React connue
**Comment**:

- ✅ Ajouter `ALLOWED_ORIGINS` à `.env.example`
- ✅ Modifier `app.ts:`
  ```typescript
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );
  ```
- ✅ En dev: accepter localhost:3000, localhost:8080 (Flutter)
- ✅ En production: accepter UNIQUEMENT domaine final app
  **Files changés**:
- `src/app.ts`
- `.env.example`

**Validation**: Tester preflight request depuis origin non-autorisée (doit être bloquée)

---

#### 1.3 Input Sanitization - XSS Prevention (8h)

**Qui**: Backend Dev + QA
**Pourquoi**: Empêcher injection de `<script>`, `<img onerror>` stockées en DB
**Comment**:

- ✅ Ajouter `xss` lib au package.json
- ✅ Créer `/src/utils/sanitize.utils.ts` :
  ```typescript
  export const sanitizeString = (str: string): string => {
    return xss(str, {
      whiteList: {},
      stripIgnoredTag: true,
    });
  };
  ```
- ✅ Appliquer à tous les champs user-input (name, title, description, etc):
  - Dans validators Zod: `.transform(v => sanitizeString(v))`
  - Ou dans controller avant service
- ✅ Ne pas sanitizer les IDs, emails (valider format seulement)
  **Files changés**:
- `src/utils/sanitize.utils.ts` (NEW)
- `src/modules/auth/auth.validator.ts` (update name, university)
- `src/modules/listing/listing.validator.ts` (update title, description, city)
- `src/modules/user/user.validator.ts` (update name, phone)
- `package.json` (add xss)

**Validation**: Créer listing avec `<script>alert('xss')</script>` dans title → doit être échappé en DB et API response

---

#### 1.4 Input Length Limits (4h)

**Qui**: Backend Dev
**Pourquoi**: Éviter DoS par payload géant, limiter storage
**Comment**:

- ✅ Limites suggérées:
  ```
  name: max 100 chars (User.name currently unlimited)
  email: max 255 chars
  university: max 150 chars
  phone: max 20 chars
  title (listing): max 200 chars
  description: max 5000 chars
  city: max 100 chars
  amenities: array max 15 items, each max 50 chars
  comment (review): max 1000 chars
  ```
- ✅ Ajouter `.max()` aux validators Zod
  **Files changés**:
- `src/modules/auth/auth.validator.ts`
- `src/modules/listing/listing.validator.ts`
- `src/modules/user/user.validator.ts`
- `src/modules/admin/admin.validator.ts` (if exists)

**Validation**: Envoyer nom de 10000 chars → doit être rejeté avec 422

---

### **PHASE 2: OBSERVABILITÉ & DEBUGGING (Semaine 3-4) - 32h**

_Pouvoir tracker les bugs et erreurs en production_

#### 2.1 Structured Logging (12h)

**Qui**: Backend Dev
**Pourquoi**: Savoir ce qui se passe en production (errors, user actions, perf)
**Comment**:

- ✅ Ajouter `winston` ou `pino` au package.json (préférer Pino pour perf)
- ✅ Créer `/src/config/logger.config.ts`:

  ```typescript
  import pino from 'pino';

  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty', // CLI, ou JSON en prod
      options: { colorize: true },
    },
  });
  ```

- ✅ Créer `/src/middlewares/requestLogger.middleware.ts`:
  ```typescript
  export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - start,
        userId: req.user?.userId,
        ip: req.ip,
      });
    });
    next();
  };
  ```
- ✅ Log ALL errors dans globalErrorHandler:
  ```typescript
  if (err instanceof AppError) {
    logger.warn({ message: err.message, statusCode: err.statusCode, userId: req.user?.userId });
  } else {
    logger.error({ message: err.message, stack: err.stack, userId: req.user?.userId });
  }
  ```
- ✅ Log important business events:
  - User registration, login, logout
  - Listing created/updated/deleted
  - Admin actions (ban, verify, etc)
  - Failed auth attempts (5+ = suspicious)
    **Files changés**:
- `src/config/logger.config.ts` (NEW)
- `src/middlewares/requestLogger.middleware.ts` (NEW)
- `src/middlewares/error.middleware.ts` (update to log)
- `src/modules/auth/auth.service.ts` (add logging)
- `src/modules/listing/listing.service.ts` (add logging)
- `src/modules/admin/admin.service.ts` (add logging)
- `src/app.ts` (add requestLogger middleware)
- `package.json` (add pino, pino-pretty)

**Validation**:

- Run `npm run dev`, faire une requête → doit voir logs JSON dans terminal
- Vérifier que login échoué est loggé
- Vérifier que POST listingcrée un log business

---

#### 2.2 Error Codes & Structured Errors (8h)

**Qui**: Backend Dev
**Pourquoi**: Clients peuvent identifier erreurs par code (ex: ERR_EMAIL_TAKEN) au lieu de message non-localisé
**Comment**:

- ✅ Créer `/src/constants/errorCodes.ts`:
  ```typescript
  export const ERROR_CODES = {
    AUTH_EMAIL_TAKEN: 'ERR_EMAIL_TAKEN',
    AUTH_INVALID_CREDENTIALS: 'ERR_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'ERR_TOKEN_EXPIRED',
    LISTING_NOT_FOUND: 'ERR_LISTING_NOT_FOUND',
    LISTING_UNAUTHORIZED: 'ERR_LISTING_UNAUTHORIZED',
    FILE_INVALID_TYPE: 'ERR_FILE_INVALID_TYPE',
    FILE_TOO_LARGE: 'ERR_FILE_TOO_LARGE',
    RATE_LIMITED: 'ERR_RATE_LIMITED',
    VALIDATION_ERROR: 'ERR_VALIDATION_ERROR',
  };
  ```
- ✅ Étendre `AppError`:

  ```typescript
  export class AppError extends Error {
    public statusCode: number;
    public code?: string; // NEW

    constructor(message: string, statusCode: number = 500, code?: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  ```

- ✅ Modifier error responses:
  ```typescript
  res.status(409).json({
    success: false,
    message: 'Email already taken',
    code: 'ERR_EMAIL_TAKEN', // NEW
  });
  ```
- ✅ Utiliser partout: `throw new AppError("...", 409, "ERR_EMAIL_TAKEN")`
  **Files changés**:
- `src/constants/errorCodes.ts` (NEW)
- `src/middlewares/error.middleware.ts` (update response format)
- `src/modules/auth/auth.service.ts` (add error codes)
- `src/modules/listing/listing.service.ts` (add error codes)
- Tous les autres services

**Validation**: Faire une requête avec email duplicate → response doit inclure `"code": "ERR_EMAIL_TAKEN"`

---

#### 2.3 Request ID / Correlation Tracing (4h)

**Qui**: Backend Dev
**Pourquoi**: Tracker une erreur à travers logs et services (futur: kafka, etc)
**Comment**:

- ✅ Créer `/src/middlewares/correlationId.middleware.ts`:

  ```typescript
  import { v4 as uuidv4 } from 'uuid';

  export const correlationId = (req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  };
  ```

- ✅ Ajouter middleware AVANT requestLogger
- ✅ Logger req.id partout: `logger.info({ requestId: req.id, ... })`
  **Files changés**:
- `src/middlewares/correlationId.middleware.ts` (NEW)
- `src/app.ts` (add middleware)
- `src/middlewares/requestLogger.middleware.ts` (include req.id)

**Validation**: Faire une requête, voir header `x-request-id` en response

---

#### 2.4 Audit Log : Admin Actions (8h)

**Qui**: Backend Dev
**Pourquoi**: Tracer qui a fait quoi (ban user, approve listing, etc) = RGPD + sécurité
**Comment**:

- ✅ Créer model Prisma `AuditLog`:
  ```prisma
  model AuditLog {
    id String @id @default(uuid())
    action String // "USER_BANNED", "LISTING_APPROVED", "ROLE_CHANGED"
    adminId String
    admin User @relation(fields: [adminId], references: [id])
    targetId String? // user/listing ID being affected
    targetType String? // "USER", "LISTING"
    details Json? // "{oldRole: 'STUDENT', newRole: 'OWNER'}"
    createdAt DateTime @default(now())
  }
  ```
- ✅ Créer `/src/modules/admin/audit.service.ts`: logAuditAction()
- ✅ Appeler dans tous les endpoints admin
- ✅ Créer `GET /api/admin/audit-logs` (admin only)
  **Files changés**:
- `prisma/schema.prisma` (add AuditLog model)
- `prisma/migrations/[timestamp]_add_audit_log/` (NEW migration)
- `src/modules/admin/audit.service.ts` (NEW)
- `src/modules/admin/admin.controller.ts` (call logAuditAction before updates)

**Validation**:

- Ban a user via admin → AuditLog created with action="USER_BANNED"
- GET /api/admin/audit-logs → see all admin changes

---

### **PHASE 3: TESTING FOUNDATION (Semaine 5-6) - 40h**

_Avoir confiance que les critical paths marchent_

#### 3.1 Setup Testing Infrastructure (8h)

**Qui**: Backend Dev
**Pourquoi**: Jest + Supertest pour tester API sans déployer
**Comment**:

- ✅ Installer Jest + TypeScript:
  ```bash
  npm install --save-dev jest ts-jest @types/jest
  npm install --save-dev supertest @types/supertest
  ```
- ✅ Créer `jest.config.js`:
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/config/**'],
  };
  ```
- ✅ Créer `prisma/singleton.ts` pour test DB
- ✅ Créer `.env.test` file
- ✅ Update package.json scripts:
  ```json
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage"
  ```
  **Files changés**:
- `jest.config.js` (NEW)
- `.env.test` (NEW)
- `src/__tests__/setup.ts` (NEW)
- `package.json` (add scripts)

**Validation**: `npm test` → Jest doit run 0 tests (pas encore écrit)

---

#### 3.2 Auth Module Tests (12h)

**Qui**: Backend Dev
**Pourquoi**: Register/Login/Refresh/Logout critiques pour toute l'app
**Couverture**:

```
✅ register
  - ✓ Successful registration returns accessToken
  ✓ Duplicate email rejected with 409
  ✓ Missing password rejected with 422
  ✓ XSS in name sanitized
  ✓ Very long name rejected

✅ login
  - ✓ Successful login returns accessToken + refreshToken
  ✓ Wrong password rejected with 401
  ✓ Non-existent email rejected with 401 (same message)
  ✓ Both errors use identical message (no user enumeration)

✅ refresh
  - ✓ Valid refreshToken returns new accessToken
  ✓ Invalid/expired refreshToken rejected with 401

✅ logout
  - ✓ Valid refreshToken revoked, further refresh fails
```

**Files changés**:

- `src/modules/auth/__tests__/auth.service.test.ts` (NEW)
- `src/modules/auth/__tests__/auth.controller.test.ts` (NEW)

**Validation**: `npm test -- auth.service` → 8-9 passing tests

---

#### 3.3 Listing Module Tests (12h)

**Qui**: Backend Dev
**Pourquoi**: CRUD + Cloudinary upload = complex
**Couverture**:

```
✅ createListing
  - ✓ Authenticated user can create listing
  - ✓ Unauthenticated rejected with 401
  - ✓ Invalid price rejected with 422
  - ✓ Missing required fields rejected
  - ✓ Photos uploaded to Cloudinary
  - ✓ Owner correctly set to auth user

✅ getListing / listListings
  - ✓ Can fetch listing by ID
  - ✓ List endpoint returns paginated results
  - ✓ Non-existent listing returns 404

✅ updateListing
  - ✓ Owner can update own listing
  - ✓ Non-owner rejected with 403
  - ✓ Admin can update any listing

✅ deleteListing
  - ✓ Owner can delete own listing
  - ✓ Non-owner rejected with 403
```

**Files changés**:

- `src/modules/listing/__tests__/listing.service.test.ts` (NEW)
- `src/modules/listing/__tests__/listing.controller.test.ts` (NEW)

**Validation**: `npm test -- listing` → 10+ passing tests

---

#### 3.4 Rate Limiting & Security Tests (8h)

**Qui**: Backend Dev + QA
**Pourquoi**: Vérifier que rate limiting + CORS + sanitization marchent
**Tests**:

```
✅ Rate Limiting
  - ✓ 6th login attempt in 15min returns 429
  - ✓ Response includes Retry-After header

✅ CORS
  - ✓ Preflight from allowed origin returns 200
  - ✓ Preflight from blocked origin returns error

✅ Input Sanitization
  - ✓ XSS payload in name stripped
  - ✓ Name field truncated to 100 chars (still searchable)

✅ Authentication
  - ✓ Missing Authorization header returns 401
  - ✓ Expired JWT returns 401
  - ✓ Invalid signature returns 401
```

**Files changés**:

- `src/__tests__/security.test.ts` (NEW)
- `src/__tests__/middleware.test.ts` (NEW)

**Validation**: `npm test -- security` → all tests passing

---

### **PHASE 4: MODULE COMPLETION (Semaine 7-9) - 48h**

_Terminer les features partielles, ajouter features MVP manquantes_

#### 4.1 Admin Module Completion (16h)

**Qui**: Backend Dev
**Status**: Module exists but empty

**Endpoints à implémenter**:

**User Management**:

```
GET /api/admin/users              [admin] → List all users with filters
GET /api/admin/users/:id          [admin] → User details
PATCH /api/admin/users/:id/role   [admin] → Change role (STUDENT → OWNER)
PATCH /api/admin/users/:id/status [admin] → Ban/suspend/unban user
```

**Listing Moderation**:

```
GET /api/admin/listings/pending   [admin] → Listings awaiting approval
PATCH /api/admin/listings/:id/status [admin] → APPROVE (ACTIVE) or REJECT (ARCHIVED)
```

**Reports Management**:

```
GET /api/admin/reports            [admin] → All reports (PENDING, REVIEWING, RESOLVED)
PATCH /api/admin/reports/:id      [admin] → Change status, add note
```

**Analytics** (Optional for MVP, can defer):

```
GET /api/admin/stats              [admin] → {userCount, listingCount, avgRating, etc}
```

**Validation Zod schemas** needed:

- UpdateUserRoleInput
- UpdateUserStatusInput
- UpdateListingStatusInput
- ReportResponseInput

**Audit Logging**: All admin actions logged via `audit.service.ts`

**Files changés**:

- `src/modules/admin/admin.controller.ts` (implement all endpoints)
- `src/modules/admin/admin.service.ts` (implement all services)
- `src/modules/admin/admin.validator.ts` (create schemas)
- `src/modules/admin/admin.routes.ts` (mount routes)

**Validation**:

- GET /api/admin/users → returns user list (needs `requireAuth, requireRole(['ADMIN']`)
- PATCH user role + status → verify AuditLog created

---

#### 4.2 Algolia Search Integration (16h)

**Qui**: Backend Dev
**Status**: Installed but no implementation
**Why**: Core user feature = search listings by keyword, location, price

**What to implement**:

**Create/Update Index**:

- When listing created/updated: sync to Algolia
- Index fields: title, description, city, price, type, amenities
- Optional: geolocation search (latitude/longitude)

**Search Endpoint**:

```
GET /api/listings/search?q=studio&city=Paris&maxPrice=500
  → Returns Algolia results + Prisma user data
```

**Implementation Plan**:

- ✅ Create Algolia account + admin key
- ✅ Add to `.env`: ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, ALGOLIA_ADMIN_KEY
- ✅ Create `/src/services/search.service.ts`:

  ```typescript
  export const indexListing = async (listing) => {
    await algoliaIndex.saveObject({
      objectID: listing.id,
      title: listing.title,
      description: listing.description,
      city: listing.city,
      price: listing.price,
      _geoloc: { lat: listing.latitude, lng: listing.longitude },
    });
  };

  export const search = async (query, filters) => {
    return await algoliaIndex.search(query, { filters });
  };
  ```

- ✅ Hook into listing service:
  - After `createListing()` → `indexListing()`
  - After `updateListing()` → `indexListing()`
  - After `deleteListing()` or `rejectListing()` → `algoliaIndex.deleteObject()`
- ✅ Create GET `/api/listings/search` controller

**Files changés**:

- `src/services/search.service.ts` (NEW)
- `src/modules/listing/listing.service.ts` (add hooks to index)
- `src/modules/listing/listing.routes.ts` (add search route)
- `.env.example` (add Algolia vars)
- `package.json` (algoliasearch already in it?)

**Validation**:

- Create listing → automatically appears in Algolia
- `GET /api/listings/search?q=studio` → finds matching listings

---

#### 4.3 Email Notifications Setup (8h)

**Qui**: Backend Dev (Optional for MVP, can defer to Phase 5)
**Why**: Users need to know about important events

**Simple emails to send**:

- Welcome email on registration
- Password reset (if implement)
- Listing approved by admin
- Contact request received

**Implementation**:

- ✅ Use `Resend.com` (free, easy) or `Sendgrid` (more power)
- ✅ Create `/src/services/email.service.ts`:
  ```typescript
  export const sendWelcomeEmail = (email, name) => {
    return resend.emails.send({
      from: 'noreply@studhousing.cm',
      to: email,
      subject: `Welcome ${name}!`,
      html: '<p>Thanks for signing up...</p>',
    });
  };
  ```
- ✅ Call from auth.service: after register success
- ✅ Call from admin: after listing approved
- ✅ Add to `.env`: RESEND_API_KEY

**Files changés**:

- `src/services/email.service.ts` (NEW)
- `src/modules/auth/auth.service.ts` (call sendWelcomeEmail)
- `src/modules/admin/admin.service.ts` (call sendApprovalEmail)
- `.env.example` (RESEND_API_KEY)

**Validation**:

- Register a new user → should receive welcome email
- (Can test with Resend's email preview)

---

#### 4.4 User Profile Completion (8h)

**Qui**: Backend Dev
**Status**: ✅ DONE

**Implemented features**:

- ✅ GET /api/users/me → Own profile (with owned listings)
- ✅ PATCH /api/users/profile → Update profile fields (name, phone, university, bio)
- ✅ POST /api/users/:id/avatar → Upload new avatar
- ✅ DELETE /api/users/account → Delete own account (soft delete)
- ✅ GET /api/users/:id → Public profile view

**To implement**:

```typescript
// GET /api/users/:id (public)
GET /api/users/uuid123 → {
  id, name, university, trustScore, avatar,
  listings: [...], reviews: [...]  // only approved
}

// DELETE /api/users/account (self + admin can do)
DELETE /api/users/account → Status = BANNED, email cleared
```

**Files changés**:

- `src/modules/user/user.controller.ts` (add delete endpoint)
- `src/modules/user/user.service.ts` (implement soft delete)
- `src/modules/user/user.validator.ts` (add schemas)

---

### **PHASE 5: POLISH & DEPLOYMENT (Semaine 10-14) - 40h**

_Production readiness, monitoring, documentation_

#### 5.1 Performance & Database Optimization (12h)

**Qui**: Backend Dev + DevOps
**Why**: 100 users = light load, but good practices prevent tech debt

**Optimizations**:

- ✅ Add database indexes on frequently queried fields:

  ```prisma
  model Listing {
    ...
    @@index([status])
    @@index([ownerId])
    @@index([city])
  }

  model User {
    ...
    @@index([status])
    @@index([role])
  }
  ```

- ✅ Lazy load relations in controllers (use `.select()` not `.include()` unless needed)
- ✅ Add query caching (simple in-memory for MVP, upgrade to Redis later):
  ```typescript
  const cacheKey = `listing:${id}`
  let cached = cache.get(cacheKey)
  if (!cached) {
    cached = await prisma.listing.findUnique(...)
    cache.set(cacheKey, cached, 60000) // 1 min TTL
  }
  ```
- ✅ Pagination mandatory on list endpoints (already done?)
- ✅ DB connection pooling: ensure `DATABASE_URL` uses pooler correctly

**Files changés**:

- `prisma/schema.prisma` (add indexes)
- `prisma/migrations/[timestamp]_add_indexes/` (NEW migration)
- `src/utils/cache.utils.ts` (NEW, simple object cache)
- `src/modules/listing/listing.service.ts` (use caching on popular listings)

**Validation**:

- Deployed to Railway → check response times (< 200ms target)

---

#### 5.2 Deployment Configuration (12h)

**Qui**: DevOps / Backend Lead
**Why**: Production != dev, need security headers, SSL, env vars

**What to do**:

- ✅ Create `Procfile` for Railway/Heroku:
  ```
  web: npm run build && npm start
  ```
- ✅ Update Dockerfile for containerization (if needed)
- ✅ Production `.env` values:
  ```
  NODE_ENV=production
  DATABASE_URL=... (pooler connection)
  ALLOWED_ORIGINS=https://app.studhousing.cm
  LOG_LEVEL=warn (less noise)
  JWT_PRIVATE_KEY=... (RS256 keys in production)
  JWT_PUBLIC_KEY=...
  ```
- ✅ Helmet headers tuning (enable CSP, HSTS, X-Frame options)
- ✅ HTTPS redirect: `app.use((req,res,next) => if not https req.secure ...)`
- ✅ Trust proxy: `app.set('trust proxy', 1)` for rate limiting on Railway
- ✅ Health check endpoint already exists: `/api/health`

**Files changés**:

- `.env.production` (NEW, template)
- `Procfile` (NEW for Railway)
- `src/app.ts` (update Helmet config)
- `railway.json` (NEW config)
- `.dockerignore` (NEW)

**Validation**:

- Deploy to Railway → access app.studhousing.cm
- Check: request has security headers (X-Frame-Options: DENY, HSTS, etc)

---

#### 5.3 Monitoring & Alerting Setup (8h)

**Qui**: DevOps
**Why**: Know when things break in production
**How**:

- ✅ Setup Railway monitoring (built-in)
- ✅ Setup uptime monitoring: Uptime Robot free tier
  - Ping `/api/health` every 5 min
  - Alert on email if down
- ✅ Log aggregation: Send logs to:
  - Option A: LogDNA (free tier)
  - Option B: Cabin.is (startup friendly)
  - Option C: Keep simple logging locally, rotate logs
- ✅ Error tracking: Sentry free tier
  - Capture all unhandled errors
  - Alert on CRITICAL errors
  - Config: `import * as Sentry from "@sentry/node"` in index.ts

**Setup**:

- Create Sentry account + get DSN
- Add to `.env`: `SENTRY_DSN=...`
- Initialize in `index.ts`:
  ```typescript
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    app.use(Sentry.Handlers.requestHandler());
    // ... routes ...
    app.use(Sentry.Handlers.errorHandler());
  }
  ```

**Files changés**:

- `src/index.ts` (add Sentry init)
- `railway.json` (Railway monitoring)
- `.env.production` (SENTRY_DSN)
- `package.json` (add @sentry/node)

**Validation**:

- Deploy to Railway
- Test error: `POST /api/listings` with invalid data → error should appear in Sentry dashboard

---

#### 5.4 Documentation & Handoff (8h)

**Qui**: Tech Lead + Backend Dev
**Why**: Team needs to maintain this

**Deliverables**:

- ✅ Update `CONTEXT.md`:
  - Architecture overview (already good)
  - Security measures implemented
  - Rate limiting rules
  - Error codes reference
- ✅ Create `DEPLOYMENT.md`:
  - How to deploy to Railway
  - Environment variable checklist
  - Database migration process
  - Rollback procedures
- ✅ Update `API.md`:
  - All endpoints documented
  - Auth flow (with token refresh)
  - Error response examples
  - Rate limit headers
- ✅ Create `MONITORING.md`:
  - How to view logs
  - How to check errors in Sentry
  - Important metrics to watch
- ✅ Create `ADMIN_GUIDE.md`:
  - How to approve listings
  - How to ban users
  - How to view audit logs
  - How to resolve reports

**Files chang'd**:

- `CONTEXT.md` (update)
- `DEPLOYMENT.md` (NEW)
- `API.md` (NEW or update)
- `MONITORING.md` (NEW)
- `ADMIN_GUIDE.md` (NEW)

---

## 📈 TRACKING & SUCCESS METRICS

### By End of Phase 1 (Week 2)

- [ ] Rate limiting active on `/auth/login` (can verify: 6th attempt = 429)
- [ ] CORS restricted to known origins
- [ ] Input payloads sanitized (XSS tests passing)
- [ ] Input length limits enforced (<80 lines new code)

### By End of Phase 2 (Week 4)

- [ ] Structured logging in place (Pino) with request IDs
- [ ] All errors have codes (ERR_EMAIL_TAKEN, etc)
- [ ] Admin actions audited in DB
- [ ] Can debug production issues via logs

### By End of Phase 3 (Week 6)

- [ ] Jest + Supertest configured
- [ ] 20+ unit/integration tests (auth, listing, security)
- [ ] Test coverage > 50% on critical modules
- [ ] CI/CD runs tests before deploy

### By End of Phase 4 (Week 9)

- [ ] Admin module fully functional
- [ ] Algolia search working
- [ ] Email notifications sending
- [ ] User profile features complete

### By End of Phase 5 (Week 14)

- [ ] Database indexes optimized
- [ ] Deployed to production (Railway)
- [ ] Monitoring + alerts active (Uptime Robot, Sentry)
- [ ] Documentation complete + team trained

---

## 🚀 DEPENDENCIES & TOOLS ADDED

**New npm packages**:

```json
{
  "dependencies": {
    "express-rate-limit": "^7.0.0",
    "xss": "^1.0.14",
    "pino": "^8.0.0",
    "pino-pretty": "^10.0.0",
    "uuid": "^9.0.0",
    "resend": "^1.0.0", // optional
    "@sentry/node": "^7.0.0" // optional
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0"
  }
}
```

---

## ⚠️ KNOWN RISKS & MITIGATION

| Risk                           | Impact                       | Mitigation                                                                    |
| ------------------------------ | ---------------------------- | ----------------------------------------------------------------------------- |
| Rate limit not enough for DDoS | Server goes down             | Use Railway's DDoS protection, upgrade to express-rate-limit with Redis later |
| Tests incomplete               | Regressions on feature adds  | Use CI/CD to block merges without tests                                       |
| Logging overhead               | Slower response times        | Use Pino (very fast), set log level to 'warn' in production                   |
| Algolia indexing lag           | Search results not real-time | Acceptable for MVP, can add queue (Bull) if needed                            |
| JWT RS256 keys complex         | Operational confusion        | Document key generation, automated in CI/CD                                   |
| No DB backups automated        | Data loss on Railway failure | Railway includes automatic backups, verify settings                           |

---

## 📅 TIME ALLOCATION

```
Phase 1 (Sécurité): 40h    = 2 dev weeks
Phase 2 (Logging): 32h     = 1.5 dev weeks
Phase 3 (Tests): 40h       = 2 dev weeks
Phase 4 (Features): 48h    = 2.5 dev weeks
Phase 5 (Deploy): 40h      = 2 dev weeks
─────────────────
TOTAL: 200h ≈ 10 dev-weeks = 2.5 months (1 developer)
```

**For 1-2 month timeline**: Run phases in parallel

- Week 1-2: Phase 1 + start Phase 2
- Week 3-4: Phase 2 + start Phase 3
- Week 5-6: Phase 3 + Phase 4.1 (Admin)
- Week 7-8: Phase 4.2-4.4 + Phase 5.1-5.2
- Week 9-10: Phase 5.3-5.4 + buffer

---

## ✅ APPROVAL CHECKLIST

- [ ] User confirms timeline realistic (weeks 1-2 for Phase 1?)
- [ ] Team size confirmed (1-2 devs?)
- [ ] Deployment target confirmed (Railway, Vercel, custom?)
- [ ] Email service preference (Resend, Sendgrid, etc)?
- [ ] Monitoring service preference (Sentry, LogDNA, simple logs)?
- [ ] Go/No-go for tests in Phase 3 (critical for MVP)?

---

**END OF PLAN**
