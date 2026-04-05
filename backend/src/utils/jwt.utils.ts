/**
 * @file jwt.utils.ts
 * @description Utilitaires pour la gestion des JSON Web Tokens (JWT).
 *
 * Selon le Cahier des Charges (Section 7.1), l'algorithme JWT requis en
 * PRODUCTION est RS256 (asymétrique) : une clé privée signe le token,
 * une clé publique le vérifie. Cela est plus sécurisé car même un service
 * qui vérifie les tokens n'a pas besoin du secret de signature.
 *
 * En DÉVELOPPEMENT LOCAL, un fallback vers HS256 (symétrique, clé unique)
 * est utilisé automatiquement si les clés RSA (.pem) ne sont pas renseignées.
 *
 * STRATÉGIE TOKENS :
 * - Access Token  : Courte durée (15 min), envoyé dans le header Authorization.
 *   Il contient le userId et le role de l'utilisateur.
 * - Refresh Token : Longue durée (30 jours), opaque (UUID), stocké en base de
 *   données. Il permet d'obtenir un nouveau Access Token sans reconnexion.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Clés lues depuis les variables d'environnement.
// En mode DÉVELOPPEMENT (sans clés RSA), on utilise le même secret pour la signature et la vérification (HS256).
const JWT_SECRET_FALLBACK = 'CLE_SECRET_STUDHOUSING_DEV_MODE_UNIC';
const PRIVATE_KEY = (process.env.JWT_PRIVATE_KEY || JWT_SECRET_FALLBACK).trim().replace(/\\n/g, '\n');
const PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || JWT_SECRET_FALLBACK).trim().replace(/\\n/g, '\n');

/**
 * Structure d'un payload décodé depuis un Access Token JWT.
 * Ces informations sont embedées dans le token et accessibles sans DB.
 */
export interface JwtPayload {
  userId: string; // L'identifiant UUID de l'utilisateur (table User)
  role: string;   // Son rôle : STUDENT, OWNER, ADMIN, etc.
}

/**
 * Génère un Access Token JWT signé pour un utilisateur.
 * L'algorithme (RS256 ou HS256) est détecté automatiquement selon la clé.
 * @param payload - Les données à encoder dans le token.
 * @returns La chaîne JWT signée.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  // Détection automatique de l'algorithme :
  // Si la clé privée commence par "-----BEGIN", c'est une vraie clé RSA → RS256
  // Sinon, c'est une simple chaîne secrète → HS256 (mode développement)
  const alg = PRIVATE_KEY.includes('BEGIN') ? 'RS256' : 'HS256';

  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: alg as jwt.Algorithm,
    expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
  });
};

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
    algorithms: [expectedAlg], // Un seul algorithme accepté pour éviter confusion attacks
  }) as JwtPayload;
};

/**
 * Génère un Refresh Token opaque (non-JWT).
 * C'est un simple UUID v4 aléatoire, stocké en base de données.
 * Son opacité est une bonne pratique : si la base est compromise,
 * les tokens ne révèlent aucune information utilisateur.
 * @returns Un UUID v4 unique sous forme de chaîne de caractères.
 */
export const generateRefreshToken = (): string => {
  return crypto.randomUUID();
};
