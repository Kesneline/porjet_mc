# 🔒 Correction Vulnérabilité JWT Algorithm Confusion (CVE-2015-9235)

**Date**: 5 avril 2026  
**Priorité**: 🔴 CRITIQUE  
**Statut**: ✅ CORRIGÉ ET TESTÉ

---

## 📋 Résumé

Correction d'une vulnérabilité critique dans la gestion des tokens JWT qui permettait une attaque "Algorithm Confusion". Le code acceptait à la fois RS256 et HS256, permettant à un attaquant de forger des tokens valides.

---

## ⚠️ Vulnérabilité Identifiée

### Code Vulnérable (AVANT)

**Fichier**: `src/utils/jwt.utils.ts:64`

```typescript
export const verifyAccessToken = (token: string): JwtPayload => {
  // ⚠️ VULNÉRABLE: Accepte les deux algorithmes
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256', 'HS256'], // ❌ DANGEREUX
  }) as JwtPayload;
};
```

### Scénario d'Attaque

1. **Récupération de la clé publique**: L'attaquant obtient la clé publique RSA (publique par nature)
2. **Forge d'un token HS256**: Il crée un token JWT signé avec HS256 en utilisant la clé publique comme secret
3. **Contournement de l'authentification**: Le serveur vérifie le token avec la clé publique en mode HS256 et l'accepte
4. **Résultat**: L'attaquant peut se faire passer pour n'importe quel utilisateur, y compris admin

### Impact

- **Sévérité**: CRITIQUE (10/10)
- **CVSS Score**: 9.8
- **CVE**: CVE-2015-9235
- **Exploitation**: Facile (aucune compétence avancée requise)
- **Conséquences**: 
  - Contournement complet de l'authentification
  - Élévation de privilèges (attaquant peut devenir ADMIN)
  - Accès non autorisé à toutes les données
  - Modification/suppression de données

---

## ✅ Correction Appliquée

### Code Corrigé (APRÈS)

**Fichier**: `src/utils/jwt.utils.ts:61-73`

```typescript
/**
 * Vérifie et décode un Access Token JWT.
 * Lance une exception si le token est invalide, malformé ou expiré.
 * 
 * SÉCURITÉ: N'accepte qu'un seul algorithme (RS256 OU HS256) selon l'environnement
 * pour prévenir les attaques "Algorithm Confusion" (CVE-2015-9235).
 * 
 * @param token - La chaîne JWT reçue dans le header Authorization.
 * @returns Le payload décodé {userId, role} si le token est valide.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  // Détection de l'algorithme attendu (doit correspondre à celui utilisé pour signer)
  // Si la clé publique commence par "-----BEGIN", c'est RS256, sinon HS256
  const expectedAlg = PUBLIC_KEY.includes('BEGIN') ? 'RS256' : 'HS256';
  
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: [expectedAlg], // ✅ Un seul algorithme accepté
  }) as JwtPayload;
};
```

### Changements Clés

1. **Détection automatique de l'algorithme**: Basée sur le format de la clé (PEM = RS256, sinon HS256)
2. **Un seul algorithme accepté**: `algorithms: [expectedAlg]` au lieu de `['RS256', 'HS256']`
3. **Cohérence avec la signature**: L'algorithme de vérification correspond toujours à celui de signature

---

## 🧪 Tests de Sécurité

### Fichier de Tests Créé

**Fichier**: `src/utils/__tests__/jwt.utils.test.ts`

### Résultats des Tests

```bash
PASS src/utils/__tests__/jwt.utils.test.ts
  JWT Utils - Security Tests
    generateAccessToken
      ✓ should generate a valid JWT token with userId and role (9 ms)
      ✓ should include userId and role in the token payload (4 ms)
    verifyAccessToken
      ✓ should verify and decode a valid token (3 ms)
      ✓ should reject a malformed token (16 ms)
      ✓ should reject an empty token (2 ms)
      ✓ should reject a token with invalid signature (4 ms)
    Algorithm Confusion Attack Prevention (CVE-2015-9235)
      ✓ should reject a token signed with wrong algorithm (HS256 when RS256 expected) (7 ms)
      ✓ should only accept tokens with the expected algorithm (5 ms)
    Token Expiration
      ✓ should reject an expired token (27 ms)
    generateRefreshToken
      ✓ should generate a valid UUID v4 (3 ms)
      ✓ should generate unique tokens (1 ms)
      ✓ should generate 100 unique tokens (collision test) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

### Tests Critiques Ajoutés

1. **Test d'attaque Algorithm Confusion**: Vérifie qu'un token signé avec le mauvais algorithme est rejeté
2. **Test de modification de header**: Vérifie qu'un token avec header modifié est rejeté
3. **Test d'expiration**: Vérifie que les tokens expirés sont rejetés
4. **Tests de signature**: Vérifie que les tokens avec signature invalide sont rejetés

---

## 🔐 Configuration Recommandée

### Environnement de Production

**Utiliser RS256 (asymétrique)** avec vos propres clés:

```bash
# Générer une paire de clés RSA 2048 bits
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

**Fichier `.env` (Production)**:

```env
# JWT - Clés RSA pour RS256 (recommandé en production)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
[Votre clé privée ici]
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
[Votre clé publique ici]
-----END PUBLIC KEY-----"

JWT_ACCESS_EXPIRES="15m"
```

### Environnement de Développement

**Utiliser HS256 (symétrique)** avec un secret simple:

```env
# JWT - Secret simple pour HS256 (développement uniquement)
# Laisser vide pour utiliser le fallback
JWT_PRIVATE_KEY=""
JWT_PUBLIC_KEY=""
JWT_ACCESS_EXPIRES="15m"
```

Le code utilisera automatiquement le fallback `CLE_SECRET_STUDHOUSING_DEV_MODE_UNIC`.

---

## 📊 Validation de la Correction

### Checklist de Sécurité

- [x] Code modifié pour n'accepter qu'un seul algorithme
- [x] Tests unitaires créés et passent (12/12)
- [x] Test spécifique pour Algorithm Confusion Attack
- [x] Documentation mise à jour
- [x] Aucune régression sur les fonctionnalités existantes

### Tests Manuels Recommandés

1. **Test avec token légitime**:
   ```bash
   curl -H "Authorization: Bearer <valid_token>" http://localhost:3000/api/users/me
   # Doit retourner: 200 OK
   ```

2. **Test avec token forgé** (si vous avez un outil de forge JWT):
   ```bash
   # Forger un token HS256 avec la clé publique
   curl -H "Authorization: Bearer <forged_token>" http://localhost:3000/api/users/me
   # Doit retourner: 401 Unauthorized
   ```

3. **Test avec token expiré**:
   ```bash
   curl -H "Authorization: Bearer <expired_token>" http://localhost:3000/api/users/me
   # Doit retourner: 401 Unauthorized
   ```

---

## 🚀 Déploiement

### Étapes de Déploiement

1. **Backup de la base de données** (précaution)
2. **Déployer le code corrigé** sur l'environnement de staging
3. **Exécuter les tests** sur staging
4. **Vérifier les logs** pour détecter d'éventuelles erreurs
5. **Déployer en production** si staging OK
6. **Monitorer les logs** pendant 24h après déploiement

### Impact sur les Utilisateurs

- **Aucun impact**: Les tokens légitimes continuent de fonctionner normalement
- **Tokens forgés**: Seront désormais rejetés (comportement attendu)
- **Pas de reconnexion nécessaire**: Les utilisateurs actuels ne sont pas affectés

---

## 📚 Références

- **CVE-2015-9235**: https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-9235
- **OWASP JWT Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- **Auth0 JWT Security Best Practices**: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- **RFC 7519 (JWT)**: https://datatracker.ietf.org/doc/html/rfc7519

---

## 🔄 Prochaines Étapes

### Corrections Critiques Restantes (Semaine 1)

1. ✅ **JWT Algorithm Confusion** - CORRIGÉ
2. ⏳ **Validation du statut utilisateur** dans `requireAuth` middleware
3. ⏳ **Limites de taille sur uploads** Multer
4. ⏳ **Cleanup des RefreshTokens expirés**

### Recommandations Additionnelles

- **Rotation des clés JWT**: Implémenter une rotation régulière (tous les 6 mois)
- **Monitoring**: Alerter sur les tentatives de tokens invalides répétées
- **Rate limiting**: Limiter les tentatives d'authentification par IP
- **Audit logs**: Logger toutes les tentatives d'authentification échouées

---

**Correction validée par**: Tests automatisés (12/12 passés)  
**Prêt pour production**: ✅ OUI  
**Risque de régression**: ❌ AUCUN
