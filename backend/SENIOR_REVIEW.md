# 🔍 Analyse Senior du Projet Stud'Housing Trust Backend

**Date**: 5 avril 2026  
**Reviewer**: Senior Developer  
**Version**: 1.0.0

---

## 📊 Vue d'ensemble

**Type de projet**: API REST Node.js/TypeScript pour plateforme de logement étudiant  
**Stack**: Express + Prisma + PostgreSQL (Supabase) + Cloudinary  
**Stade**: MVP en développement (Phase 4/9 complétée)  
**Architecture**: 3-Tiers strict (Routes → Controllers → Services)

---

## ✅ POINTS FORTS

### 1. **Architecture & Organisation** ⭐⭐⭐⭐⭐
- **Séparation des responsabilités exemplaire**: Pattern MVC strict avec services métier découplés d'Express
- **Structure modulaire claire**: Chaque module (`auth`, `listing`, `admin`, `user`) est autonome
- **Configuration centralisée**: `env.config.ts` avec validation Zod au démarrage (fail-fast)
- **Séparation app/server**: `app.ts` vs `index.ts` permet les tests avec supertest

### 2. **Sécurité** ⭐⭐⭐⭐
- **Authentification robuste**: JWT avec stratégie Access (15min) + Refresh Token (30j) opaque en DB
- **Hachage bcrypt** avec coût 10 (bon équilibre)
- **Protection OWASP**: Messages d'erreur identiques pour prévenir l'énumération d'utilisateurs
- **Middlewares de sécurité**: Helmet, CORS configuré, Rate Limiting global et par endpoint
- **Sanitization XSS**: Implémentée via `sanitize.utils.ts`
- **Validation stricte**: Zod sur tous les inputs avec DTOs TypeScript

### 3. **Gestion des Erreurs** ⭐⭐⭐⭐⭐
- **Middleware centralisé**: `error.middleware.ts` gère ZodError, AppError et erreurs système
- **Classe AppError custom**: Permet des erreurs métier typées avec codes HTTP
- **Réponses formatées**: `response.formatter.ts` assure la cohérence des réponses API

### 4. **Base de Données** ⭐⭐⭐⭐
- **Schéma Prisma complet**: `schema.prisma` avec 10 modèles, enums bien définis, relations correctes
- **Migrations versionnées**: 3 migrations appliquées proprement
- **Connexion Supabase**: Configuration PgBouncer (port 6543) + Direct URL (port 5432)

### 5. **Observabilité** ⭐⭐⭐⭐
- **Logger structuré Pino**: `logger.config.ts` avec JSON en prod, pretty-print en dev
- **Correlation ID**: `correlationId.middleware.ts` pour tracer les requêtes
- **Request Logger**: `requestLogger.middleware.ts` log method, path, status, duration, userId

### 6. **Documentation** ⭐⭐⭐⭐⭐
- **Commentaires JSDoc exhaustifs**: Chaque fonction documentée avec @param, @returns, @throws
- **Fichiers de contexte**: `CONTEXT.md`, `DOCS_MODULES.md`, `plan.md` (27KB de roadmap détaillée!)
- **Collection Postman**: `POSTMAN_COLLECTION_PHASE1.json` pour tests manuels

---

## ⚠️ PROBLÈMES CRITIQUES

### 1. **Sécurité JWT - Algorithme Hybride Dangereux** 🔴 CRITIQUE

**Fichier**: `src/utils/jwt.utils.ts:64`

```typescript
return jwt.verify(token, PUBLIC_KEY, {
  algorithms: ['RS256', 'HS256'], // ⚠️ VULNÉRABILITÉ
}) as JwtPayload;
```

**Problème**: Accepter à la fois RS256 et HS256 ouvre une faille de type "Algorithm Confusion Attack". Un attaquant peut forger un token HS256 signé avec la clé publique RSA (qui est publique!) et le serveur l'acceptera.

**Impact**: Contournement complet de l'authentification

**Solution**:
```typescript
const alg = PUBLIC_KEY.includes('BEGIN') ? 'RS256' : 'HS256';
return jwt.verify(token, PUBLIC_KEY, {
  algorithms: [alg], // Un seul algorithme selon l'environnement
}) as JwtPayload;
```

---

### 2. **Absence de Validation du Statut Utilisateur** 🔴 CRITIQUE

**Fichier**: `src/middlewares/auth.middleware.ts:38-60`

**Problème**: Le middleware `requireAuth` vérifie le JWT mais ne vérifie PAS le statut du compte (`UserStatus.SUSPENDED`, `BANNED`, `PENDING`). Un utilisateur banni peut continuer à utiliser son token valide pendant 15 minutes.

**Impact**: Utilisateurs bannis peuvent continuer à accéder à l'API

**Solution**: Ajouter une vérification DB après décodage du token:
```typescript
const user = await prisma.user.findUnique({ 
  where: { id: decoded.userId },
  select: { status: true, role: true }
});
if (!user || user.status !== 'ACTIVE') {
  res.status(403).json(errorResponse('Compte suspendu ou inactif.'));
  return;
}
```

**Note**: Cela ajoute une requête DB par requête authentifiée. Pour optimiser, utiliser Redis cache avec TTL court (30s).

---

### 3. **Gestion des Uploads - Pas de Limite de Taille** 🟠 ÉLEVÉ

**Fichier**: `src/middlewares/upload.middleware.ts:17`

**Problème**: Le middleware Multer n'a pas de `limits.fileSize` défini. Un attaquant peut upload des fichiers de plusieurs GB et saturer la mémoire (MemoryStorage).

**Impact**: Déni de service (DoS) par saturation mémoire

**Solution**:
```typescript
limits: {
  fileSize: 5 * 1024 * 1024, // 5MB max par fichier
  files: 10 // Max 10 fichiers
}
```

---

### 4. **Pas de Nettoyage des Tokens Expirés** 🟠 ÉLEVÉ

**Fichier**: `src/modules/auth/auth.service.ts:105-107`

**Problème**: Les RefreshTokens expirés s'accumulent en DB sans jamais être supprimés (sauf lors d'un refresh explicite). Cela peut causer une croissance infinie de la table.

**Impact**: Dégradation progressive des performances DB

**Solution**: Ajouter un cron job ou un cleanup lors du login:
```typescript
// Dans auth.service.ts login()
await prisma.refreshToken.deleteMany({
  where: { 
    userId: user.id,
    expiresAt: { lt: new Date() }
  }
});
```

**Alternative**: Utiliser un cron job quotidien avec `node-cron`:
```typescript
cron.schedule('0 3 * * *', async () => {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
});
```

---

## 🟡 PROBLÈMES MOYENS

### 5. **Pagination Non Sécurisée** 🟡 MOYEN

**Fichier**: `src/modules/listing/listing.service.ts:46`

**Problème**: Les paramètres `page` et `limit` ne sont pas validés. Un attaquant peut envoyer `?limit=999999` et causer un DoS.

**Solution**: Valider avec Zod dans le validator:
```typescript
z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})
```

---

### 6. **Pas de Transaction pour Opérations Critiques** 🟡 MOYEN

**Fichier**: `src/modules/listing/listing.service.ts:20-38`

**Problème**: La création de listing upload d'abord sur Cloudinary, puis crée en DB. Si la DB échoue, les images restent orphelines sur Cloudinary (coût + pollution).

**Solution**: Utiliser Prisma transactions ou inverser l'ordre (DB d'abord, puis upload, puis update):
```typescript
// Option 1: DB d'abord (recommandé)
const listing = await prisma.listing.create({
  data: { ...data, ownerId, photos: [] }
});

try {
  const photoUrls = await this.uploadImagesToCloudinary(files);
  await prisma.listing.update({
    where: { id: listing.id },
    data: { photos: photoUrls }
  });
} catch (err) {
  await prisma.listing.delete({ where: { id: listing.id } });
  throw err;
}
```

---

### 7. **Variables d'Environnement Manquantes dans Validation** 🟡 MOYEN

**Fichier**: `src/config/env.config.ts:23-41`

**Problème**: `ALLOWED_ORIGINS` n'est pas dans le schéma Zod, donc pas validée au démarrage. Peut causer des bugs CORS silencieux en production.

**Solution**:
```typescript
const EnvSchema = z.object({
  // ... autres vars
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});
```

---

## 🔵 AMÉLIORATIONS RECOMMANDÉES

### 8. **Tests Unitaires Incomplets** 🔵 FAIBLE

**État actuel**: Seulement 3 fichiers de tests:
- `auth.service.test.ts`
- `listing.service.test.ts`
- `security.middleware.test.ts`

**Recommandation**: Viser 70%+ de couverture sur les services critiques (auth, admin, listing).

**Priorités de tests**:
1. `auth.service.ts` - Tous les cas d'erreur (email dupliqué, mdp incorrect, token expiré)
2. `admin.service.ts` - Permissions et validations
3. `listing.service.ts` - Upload failures, permissions
4. Middlewares - `requireAuth`, `requireRole`, `rateLimit`

---

### 9. **Pas de Health Check Avancé** 🔵 FAIBLE

**Fichier**: `src/app.ts:92-99`

**Problème**: Le endpoint `/api/health` ne vérifie pas la connexion DB. En production, un healthcheck doit tester les dépendances critiques.

**Solution**:
```typescript
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const cloudinaryStatus = await testCloudinaryConnection();
    res.json({ 
      status: 'ok', 
      db: 'connected',
      cloudinary: cloudinaryStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      db: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});
```

---

### 10. **Pas de Soft Delete** 🔵 FAIBLE

**Fichier**: `src/modules/listing/listing.service.ts:123`

**Problème**: La suppression de listing est physique (`prisma.listing.delete`). Mieux vaut un soft delete (status = ARCHIVED) pour l'audit et la récupération.

**Solution**:
```typescript
static async deleteListing(id: string, userId: string, userRole: string) {
  const listing = await this.getListingById(id);

  if (listing.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError("Vous n'êtes pas autorisé à supprimer ce logement.", 403);
  }

  // Soft delete
  return await prisma.listing.update({ 
    where: { id },
    data: { status: 'ARCHIVED' }
  });
}
```

---

### 11. **Logs Sensibles en Production** 🔵 FAIBLE

**Fichier**: `src/middlewares/error.middleware.ts:85`

**Problème**: `console.error` en production expose les stack traces dans les logs. Utiliser le logger Pino à la place.

**Solution**:
```typescript
import { logger } from '../config/logger.config';

// Dans globalErrorHandler
logger.error({ 
  err, 
  correlationId: req.correlationId,
  path: req.path,
  method: req.method
}, 'Unhandled error');
```

---

### 12. **Pas de Rate Limiting sur Refresh Token** 🔵 FAIBLE

**Fichier**: `src/modules/auth/auth.routes.ts`

**Problème**: Le endpoint `/refresh` n'a pas de rate limit spécifique. Un attaquant peut brute-force des refresh tokens.

**Solution**:
```typescript
// Dans rateLimit.middleware.ts
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 refresh max par 15min
  message: 'Trop de tentatives de refresh. Réessayez dans 15 minutes.'
});

// Dans auth.routes.ts
router.post('/refresh', refreshTokenLimiter, refreshToken);
```

---

## 📈 MÉTRIQUES DE QUALITÉ

| Critère | Score | Commentaire |
|---------|-------|-------------|
| **Architecture** | 9/10 | Excellente séparation des responsabilités |
| **Sécurité** | 6/10 | Bonnes bases mais vulnérabilités critiques JWT + statut user |
| **Maintenabilité** | 9/10 | Code très lisible, bien documenté |
| **Testabilité** | 7/10 | Architecture testable mais couverture faible |
| **Performance** | 7/10 | Pas d'optimisations avancées (cache, indexes DB) |
| **Observabilité** | 8/10 | Bon logging structuré, manque APM/tracing |

**Score Global**: **7.7/10** - Projet solide avec quelques failles de sécurité à corriger

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### ✅ Semaine 1 - CRITIQUE (40h)

**Objectif**: Corriger les vulnérabilités de sécurité bloquantes

#### 1.1 Corriger JWT Algorithm Confusion (8h)
- [ ] Modifier `src/utils/jwt.utils.ts:64` pour n'accepter qu'un seul algorithme
- [ ] Ajouter tests unitaires pour vérifier le rejet de tokens avec mauvais algo
- [ ] Documenter le choix d'algorithme dans `CONTEXT.md`

**Fichiers modifiés**:
- `src/utils/jwt.utils.ts`
- `src/utils/__tests__/jwt.utils.test.ts` (NEW)

**Validation**: Tester avec token HS256 forgé avec clé publique → doit être rejeté

---

#### 1.2 Ajouter Validation Statut Utilisateur (12h)
- [ ] Modifier `src/middlewares/auth.middleware.ts` pour vérifier `user.status`
- [ ] Ajouter cache Redis (optionnel) pour éviter requête DB à chaque fois
- [ ] Créer tests pour utilisateurs SUSPENDED, BANNED, PENDING
- [ ] Documenter le comportement dans `DOCS_MODULES.md`

**Fichiers modifiés**:
- `src/middlewares/auth.middleware.ts`
- `src/middlewares/__tests__/auth.middleware.test.ts` (NEW)
- `package.json` (ajouter `ioredis` si cache)

**Validation**: 
- Token valide + user BANNED → HTTP 403
- Token valide + user ACTIVE → HTTP 200

---

#### 1.3 Limiter Taille Uploads (4h)
- [ ] Ajouter `limits` dans `src/middlewares/upload.middleware.ts`
- [ ] Tester upload de fichier > 5MB → doit être rejeté
- [ ] Ajouter message d'erreur clair pour l'utilisateur

**Fichiers modifiés**:
- `src/middlewares/upload.middleware.ts`

**Validation**: Upload 10MB → HTTP 413 Payload Too Large

---

#### 1.4 Tests de Sécurité (16h)
- [ ] Créer suite de tests de sécurité complète
- [ ] Tester rate limiting sur tous les endpoints critiques
- [ ] Tester XSS sanitization sur tous les champs texte
- [ ] Tester CORS avec origines non autorisées
- [ ] Documenter les résultats dans `SECURITY_TESTS.md`

**Fichiers créés**:
- `src/__tests__/security.comprehensive.test.ts`
- `SECURITY_TESTS.md`

---

### ✅ Semaine 2 - ÉLEVÉ (32h)

**Objectif**: Stabiliser la gestion des données et prévenir les fuites de ressources

#### 2.1 Cleanup RefreshTokens Expirés (8h)
- [ ] Créer service de cleanup dans `src/services/cleanup.service.ts`
- [ ] Implémenter cron job avec `node-cron`
- [ ] Ajouter cleanup lors du login (fallback)
- [ ] Logger les statistiques de cleanup (nombre de tokens supprimés)

**Fichiers créés/modifiés**:
- `src/services/cleanup.service.ts` (NEW)
- `src/index.ts` (démarrer le cron)
- `package.json` (ajouter `node-cron`)

**Validation**: Laisser tourner 24h, vérifier les logs de cleanup

---

#### 2.2 Valider Pagination (4h)
- [ ] Créer `src/validators/pagination.validator.ts`
- [ ] Appliquer dans `listing.controller.ts` et `admin.controller.ts`
- [ ] Tester avec `?limit=999999` → doit être plafonné à 100

**Fichiers créés/modifiés**:
- `src/validators/pagination.validator.ts` (NEW)
- `src/modules/listing/listing.controller.ts`
- `src/modules/admin/admin.controller.ts`

---

#### 2.3 Transactions Prisma pour Listings (12h)
- [ ] Refactorer `listing.service.ts:createListing` avec transaction
- [ ] Implémenter rollback automatique si upload Cloudinary échoue
- [ ] Ajouter tests pour cas d'échec (DB down, Cloudinary down)
- [ ] Documenter la stratégie de transaction dans code

**Fichiers modifiés**:
- `src/modules/listing/listing.service.ts`
- `src/modules/listing/__tests__/listing.service.test.ts`

**Validation**: Simuler échec Cloudinary → listing ne doit pas être créé en DB

---

#### 2.4 Valider Variables d'Environnement (4h)
- [ ] Ajouter `ALLOWED_ORIGINS` dans `env.config.ts` Zod schema
- [ ] Ajouter validation pour `LOG_LEVEL`
- [ ] Créer tests pour démarrage avec env vars manquantes

**Fichiers modifiés**:
- `src/config/env.config.ts`
- `.env.example`

---

#### 2.5 Documentation Sécurité (4h)
- [ ] Créer `SECURITY.md` avec toutes les mesures de sécurité
- [ ] Documenter les threat models (OWASP Top 10)
- [ ] Ajouter guide de déploiement sécurisé

**Fichiers créés**:
- `SECURITY.md`

---

### ✅ Semaine 3 - MOYEN (32h)

**Objectif**: Améliorer l'observabilité et la qualité du code

#### 3.1 Health Check Avancé (8h)
- [ ] Améliorer `/api/health` avec vérification DB
- [ ] Ajouter vérification Cloudinary
- [ ] Créer endpoint `/api/health/detailed` (admin only) avec métriques
- [ ] Intégrer avec monitoring externe (Uptime Robot, etc.)

**Fichiers modifiés**:
- `src/app.ts`
- `src/config/cloudinary.config.ts` (ajouter test connection)

---

#### 3.2 Augmenter Couverture Tests (16h)
- [ ] Tests complets pour `admin.service.ts` (0% actuellement)
- [ ] Tests complets pour `user.service.ts` (0% actuellement)
- [ ] Tests pour tous les middlewares
- [ ] Viser 70%+ de couverture globale

**Fichiers créés**:
- `src/modules/admin/__tests__/admin.service.test.ts`
- `src/modules/user/__tests__/user.service.test.ts`
- `src/middlewares/__tests__/rateLimit.middleware.test.ts`
- `src/middlewares/__tests__/upload.middleware.test.ts`

**Validation**: `npm run test:cov` → coverage > 70%

---

#### 3.3 Migrer vers Logger Pino (4h)
- [ ] Remplacer tous les `console.log/error` par `logger`
- [ ] Ajouter contexte structuré (userId, correlationId) dans tous les logs
- [ ] Configurer rotation de logs en production

**Fichiers modifiés**:
- `src/middlewares/error.middleware.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/listing/listing.service.ts`
- Tous les services

---

#### 3.4 Documentation API (4h)
- [ ] Installer Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`)
- [ ] Documenter tous les endpoints avec JSDoc
- [ ] Générer documentation auto sur `/api/docs`

**Fichiers créés/modifiés**:
- `src/config/swagger.config.ts` (NEW)
- `src/app.ts` (monter Swagger UI)
- `package.json`

---

### ✅ Semaine 4 - OPTIMISATIONS (24h)

**Objectif**: Préparer le scaling et améliorer l'expérience développeur

#### 4.1 Soft Delete (6h)
- [ ] Implémenter soft delete pour `listings`
- [ ] Ajouter endpoint admin pour restaurer listings archivés
- [ ] Filtrer listings archivés des requêtes publiques

**Fichiers modifiés**:
- `src/modules/listing/listing.service.ts`
- `src/modules/admin/admin.service.ts`

---

#### 4.2 Rate Limiting Avancé (6h)
- [ ] Ajouter rate limit sur `/api/auth/refresh`
- [ ] Implémenter rate limit par userId (pas seulement IP)
- [ ] Créer dashboard de monitoring des rate limits

**Fichiers modifiés**:
- `src/middlewares/rateLimit.middleware.ts`
- `src/modules/auth/auth.routes.ts`

---

#### 4.3 Cache Redis (8h)
- [ ] Installer et configurer Redis
- [ ] Cacher les listings populaires (TTL 5min)
- [ ] Cacher les statuts utilisateurs (TTL 30s) pour `requireAuth`
- [ ] Ajouter invalidation de cache sur update

**Fichiers créés/modifiés**:
- `src/config/redis.config.ts` (NEW)
- `src/services/cache.service.ts` (NEW)
- `src/middlewares/auth.middleware.ts`
- `src/modules/listing/listing.service.ts`

---

#### 4.4 CI/CD Pipeline (4h)
- [ ] Créer `.github/workflows/ci.yml`
- [ ] Automatiser tests sur chaque PR
- [ ] Automatiser déploiement sur Railway/Vercel
- [ ] Ajouter checks de sécurité (npm audit, Snyk)

**Fichiers créés**:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

---

## 💡 RECOMMANDATIONS ARCHITECTURALES

### Court Terme (1-2 mois)
- **Redis**: Pour cache (listings populaires) et blacklist JWT
- **Bull/BullMQ**: Pour jobs asynchrones (emails, cleanup, analytics)
- **Sentry**: Pour error tracking en production
- **Swagger/OpenAPI**: Documentation API auto-générée

### Moyen Terme (3-6 mois)
- **GraphQL**: Si le frontend a besoin de requêtes complexes
- **WebSockets**: Pour messagerie temps réel (conversations)
- **Elasticsearch**: Pour recherche avancée (remplacer Algolia si budget limité)
- **CI/CD**: GitHub Actions pour tests auto + déploiement

### Long Terme (6+ mois)
- **Microservices**: Séparer Auth, Listings, Payments si scaling nécessaire
- **Event Sourcing**: Pour audit trail complet (RGPD)
- **Multi-région**: CDN + DB replicas pour latence globale

---

## 🔧 OUTILS RECOMMANDÉS

### Développement
- **Husky**: Pre-commit hooks pour linting/tests
- **Commitlint**: Convention de commits (Conventional Commits)
- **Prettier**: Formatage automatique du code
- **ESLint**: Linting avec règles strictes

### Monitoring & Observabilité
- **Sentry**: Error tracking et performance monitoring
- **DataDog/New Relic**: APM (Application Performance Monitoring)
- **Grafana + Prometheus**: Métriques custom et dashboards
- **Uptime Robot**: Monitoring de disponibilité

### Sécurité
- **Snyk**: Scan de vulnérabilités dans les dépendances
- **OWASP ZAP**: Tests de pénétration automatisés
- **SonarQube**: Analyse de qualité et sécurité du code
- **Dependabot**: Mises à jour automatiques des dépendances

### Testing
- **Artillery**: Load testing et stress testing
- **Postman/Newman**: Tests d'intégration automatisés
- **Jest**: Tests unitaires et d'intégration
- **Supertest**: Tests HTTP end-to-end

---

## 📊 INDICATEURS DE SUCCÈS

### Semaine 1
- ✅ 0 vulnérabilités critiques détectées par Snyk
- ✅ Tous les tests de sécurité passent
- ✅ Rate limiting fonctionnel sur tous les endpoints

### Semaine 2
- ✅ 0 RefreshTokens expirés en DB après 24h
- ✅ Pagination limitée à 100 items max
- ✅ Transactions Prisma testées et validées

### Semaine 3
- ✅ Couverture de tests > 70%
- ✅ Health check vérifie DB et Cloudinary
- ✅ Documentation Swagger complète

### Semaine 4
- ✅ Soft delete implémenté et testé
- ✅ Redis cache opérationnel
- ✅ CI/CD pipeline déployé

---

## 🏆 CONCLUSION

Ce projet démontre une **excellente maîtrise des fondamentaux** du développement backend moderne:
- Architecture propre et scalable
- Sécurité bien pensée (malgré 2-3 failles à corriger)
- Documentation exemplaire
- Code maintenable et lisible

Les **points d'amélioration** sont principalement:
1. Corriger les vulnérabilités de sécurité identifiées (Semaine 1)
2. Augmenter la couverture de tests (Semaine 3)
3. Ajouter des optimisations de performance (Semaine 4)

**Verdict**: Projet **production-ready à 80%**. Avec les corrections critiques (Semaine 1-2), il sera prêt pour un lancement MVP en toute sécurité.

---

## 📝 NOTES FINALES

### Points d'Attention
- **Performance DB**: Ajouter des indexes sur `User.email`, `Listing.status`, `RefreshToken.token`
- **Backup**: Mettre en place des backups automatiques quotidiens de la DB
- **Monitoring**: Configurer des alertes pour erreurs 5xx, latence > 1s, rate limit hits
- **Documentation**: Maintenir `CONTEXT.md` à jour à chaque changement majeur

### Ressources Utiles
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Note globale**: **7.7/10** ⭐⭐⭐⭐ (Très Bien)

**Prêt pour production**: 80% (après corrections Semaine 1-2)
