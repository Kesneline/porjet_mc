/**
 * @file jwt.utils.test.ts
 * @description Tests unitaires pour les utilitaires JWT.
 * 
 * Tests de sécurité critiques:
 * - Prévention des attaques "Algorithm Confusion" (CVE-2015-9235)
 * - Validation de l'expiration des tokens
 * - Rejet des tokens malformés
 */
import jwt from 'jsonwebtoken';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, JwtPayload } from '../jwt.utils';

describe('JWT Utils - Security Tests', () => {
  
  describe('generateAccessToken', () => {
    it('should generate a valid JWT token with userId and role', () => {
      const payload: JwtPayload = { userId: 'test-user-123', role: 'STUDENT' };
      const token = generateAccessToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include userId and role in the token payload', () => {
      const payload: JwtPayload = { userId: 'test-user-456', role: 'OWNER' };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe('test-user-456');
      expect(decoded.role).toBe('OWNER');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid token', () => {
      const payload: JwtPayload = { userId: 'test-user-789', role: 'ADMIN' };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe('test-user-789');
      expect(decoded.role).toBe('ADMIN');
    });

    it('should reject a malformed token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject an empty token', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });

    it('should reject a token with invalid signature', () => {
      const payload: JwtPayload = { userId: 'test-user-999', role: 'STUDENT' };
      const token = generateAccessToken(payload);
      
      // Modifier la signature (dernier segment du JWT)
      const parts = token.split('.');
      parts[2] = 'tampered_signature';
      const tamperedToken = parts.join('.');
      
      expect(() => {
        verifyAccessToken(tamperedToken);
      }).toThrow();
    });
  });

  describe('Algorithm Confusion Attack Prevention (CVE-2015-9235)', () => {
    /**
     * Test critique: Vérifie qu'un token signé avec un algorithme différent
     * de celui attendu est rejeté.
     * 
     * Scénario d'attaque:
     * 1. L'attaquant récupère la clé publique RSA (publique par nature)
     * 2. Il forge un token HS256 signé avec cette clé publique
     * 3. Sans protection, le serveur vérifierait le token avec la clé publique en mode HS256
     * 4. Le token serait accepté → contournement de l'authentification
     */
    it('should reject a token signed with wrong algorithm (HS256 when RS256 expected)', () => {
      // Simuler un environnement avec clés RSA (RS256)
      const originalPrivateKey = process.env.JWT_PRIVATE_KEY;
      const originalPublicKey = process.env.JWT_PUBLIC_KEY;
      
      // Clés RSA de test (format PEM)
      const testPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf9Cnzj4p4WGeKLs1Pt8Qu
KUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQJAIJLixBy2qpFoS4DSmoEm
o3qGy0t6z09AIJtH+5OeRV1be+N4cDYJKffGzDa88vQENZiRm0GRq6a+HPGQMd2k
TQIhAKMSvzIBnni7ot/OSie2TmJLY4SwTQAevXysE2RbFDYdAiEBCUEaRQnMnbp7
9mxDXDf6AU0cN/RPBjb9qSHDcWZHGzUCIG2Es59z8ugGrDY+pxLQnwfotadxd+Uy
v/Ow5T0q5gIJAiEAyS4RaI9YG8EWx/2w0T67ZUVAw8eOMB6BIUg0Xcu+3okCIBOs
/5OiPgoTdSy7bcF9IGpSE8ZgGKzgYQVZeN97YE00
-----END RSA PRIVATE KEY-----`;
      
      const testPublicKey = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf
9Cnzj4p4WGeKLs1Pt8QuKUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQ==
-----END PUBLIC KEY-----`;
      
      // Simuler un environnement RS256
      process.env.JWT_PRIVATE_KEY = testPrivateKey;
      process.env.JWT_PUBLIC_KEY = testPublicKey;
      
      try {
        // Générer un token légitime RS256
        const payload: JwtPayload = { userId: 'attacker-user', role: 'ADMIN' };
        const legitimateToken = generateAccessToken(payload);
        
        // Vérifier que le token légitime fonctionne
        expect(() => verifyAccessToken(legitimateToken)).not.toThrow();
        
        // ATTAQUE: Forger un token HS256 avec la clé publique
        const maliciousToken = jwt.sign(payload, testPublicKey, {
          algorithm: 'HS256', // Algorithme différent!
        });
        
        // Le token malveillant DOIT être rejeté
        expect(() => {
          verifyAccessToken(maliciousToken);
        }).toThrow(/invalid algorithm|invalid signature/i);
        
      } finally {
        // Restaurer l'environnement
        if (originalPrivateKey) {
          process.env.JWT_PRIVATE_KEY = originalPrivateKey;
        } else {
          delete process.env.JWT_PRIVATE_KEY;
        }
        if (originalPublicKey) {
          process.env.JWT_PUBLIC_KEY = originalPublicKey;
        } else {
          delete process.env.JWT_PUBLIC_KEY;
        }
      }
    });

    it('should only accept tokens with the expected algorithm', () => {
      // Test que verifyAccessToken utilise bien un seul algorithme
      // et non pas ['RS256', 'HS256'] qui serait vulnérable
      
      const payload: JwtPayload = { userId: 'test-user', role: 'STUDENT' };
      
      // Générer un token avec l'algorithme actuel
      const validToken = generateAccessToken(payload);
      
      // Le token valide doit passer
      expect(() => verifyAccessToken(validToken)).not.toThrow();
      
      // Vérifier que le code utilise bien un seul algorithme
      // en inspectant le comportement: un token avec un header modifié doit être rejeté
      const parts = validToken.split('.');
      
      // Décoder le header actuel
      const currentHeader = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      
      // Créer un header avec un algorithme différent
      const wrongAlg = currentHeader.alg === 'HS256' ? 'RS256' : 'HS256';
      const tamperedHeader = Buffer.from(JSON.stringify({ ...currentHeader, alg: wrongAlg })).toString('base64');
      
      // Remplacer le header
      const tamperedToken = [tamperedHeader, parts[1], parts[2]].join('.');
      
      // Le token avec algorithme modifié DOIT être rejeté
      expect(() => {
        verifyAccessToken(tamperedToken);
      }).toThrow();
    });
  });

  describe('Token Expiration', () => {
    it('should reject an expired token', async () => {
      // Sauvegarder la config originale
      const originalExpires = process.env.JWT_ACCESS_EXPIRES;
      
      // Configurer un token qui expire immédiatement
      process.env.JWT_ACCESS_EXPIRES = '1ms';
      
      try {
        const payload: JwtPayload = { userId: 'test-user-expired', role: 'STUDENT' };
        const token = generateAccessToken(payload);
        
        // Attendre que le token expire
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Le token expiré DOIT être rejeté
        expect(() => {
          verifyAccessToken(token);
        }).toThrow(/jwt expired/i);
        
      } finally {
        // Restaurer la config
        if (originalExpires) {
          process.env.JWT_ACCESS_EXPIRES = originalExpires;
        } else {
          delete process.env.JWT_ACCESS_EXPIRES;
        }
      }
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid UUID v4', () => {
      const token = generateRefreshToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Format UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(token).toMatch(uuidRegex);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      const token3 = generateRefreshToken();
      
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate 100 unique tokens (collision test)', () => {
      const tokens = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        tokens.add(generateRefreshToken());
      }
      
      // Tous les tokens doivent être uniques
      expect(tokens.size).toBe(100);
    });
  });
});
