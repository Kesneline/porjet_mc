/**
 * @file auth.service.ts
 * @description Couche Métier (Service Layer) pour l'authentification.
 *
 * Ce service est totalement indépendant d'Express (pas de Request/Response).
 * Il utilise des types TypeScript stricts (RegisterInput, LoginInput) à la place des `any`.
 * Il lance des AppError typées (avec code HTTP) à la place des Error génériques
 * pour permettre au middleware d'erreurs global de formater correctement les réponses.
 *
 * SÉCURITÉ (OWASP) :
 * - Hachage bcrypt avec coût 10 (bon équilibre sécurité / performance CPU)
 * - Message d'erreur identique pour email inconnu et mot de passe incorrect
 *   → Prévention de l'énumération d'utilisateurs (OWASP A07)
 * - Le mot de passe hashé n'est JAMAIS retourné au client
 * - Le Refresh Token est opaque (UUID), stocké en DB et révocable
 */
import { prisma } from '../../config/prisma.config';
import bcrypt from 'bcryptjs';
import { RegisterInput, LoginInput, RefreshInput } from './auth.validator';
import { 
  generateAccessToken, 
  generateRefreshToken 
} from '../../utils/jwt.utils';
import { AppError } from '../../middlewares/error.middleware';

export class AuthService {

  /**
   * Inscription d'un nouvel utilisateur avec le rôle STUDENT par défaut.
   *
   * @param data - Données validées par Zod (RegisterInput) : { email, password, name, university? }
   * @throws AppError(409) si l'email est déjà enregistré
   * @returns L'objet User (sans password) et l'Access Token JWT
   */
  static async register(data: RegisterInput) {
    const { email, password, name, university, phone } = data;

    // --- RÈGLE MÉTIER : Un email ne peut être enregistré qu'une seule fois ---
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // On lance une AppError pour que le middleware global retourne HTTP 409
      throw new AppError("Cet email est déjà utilisé sur la plateforme.", 409);
    }

    // Hachage du mot de passe avec bcrypt (coût 10 = bon compromis sécu/perf)
    // NE JAMAIS stocker ou retourner le mot de passe en clair
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur en base de données
    // Le rôle "STUDENT" est la valeur par défaut définie dans schema.prisma
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        university: university ?? null,
        phone: phone ?? null,
      }
    });

    // Génération de l'Access Token JWT (durée : 15 min par défaut)
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });

    // On retourne uniquement les champs sûrs (JAMAIS le champ 'password')
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
    };
  }

  /**
   * Connexion d'un utilisateur existant.
   * Retourne un Access Token (15 min) et un Refresh Token (30 jours, stocké en DB).
   *
   * @param data - Données validées par Zod (LoginInput) : { email, password }
   * @throws AppError(401) si les identifiants sont incorrects (message générique)
   * @returns L'objet User, l'Access Token et le Refresh Token opaque
   */
  static async login(data: LoginInput) {
    const { email, password } = data;

    // Recherche de l'utilisateur par email
    const user = await prisma.user.findUnique({ where: { email } });

    // Message d'erreur intentionnellement identique pour email inconnu et mdp incorrect
    // → Empêche un attaquant de savoir si un email est enregistré (OWASP A07)
    if (!user) throw new AppError("Identifiants incorrects.", 401);

    // Comparaison sécurisée avec bcrypt (résistant aux timing attacks)
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new AppError("Identifiants incorrects.", 401);

    // Vérification du statut du compte
  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new AppError("Votre compte est suspendu. Veuillez contacter l'administrateur.", 403);
  }

    // Génération des tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });

    // Le Refresh Token est un UUID v4 opaque, non signé, stocké en DB
    // Cela permet de le révoquer à distance (déconnexion forcée, compromission)
    const refreshTokenStr = generateRefreshToken();

    // Calcul de la date d'expiration du Refresh Token (maintenant + 30 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Sauvegarde du Refresh Token en base de données (table RefreshToken)
    const refreshToken = await prisma.refreshToken.create({
      data: { token: refreshTokenStr, userId: user.id, expiresAt }
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  /**
   * Renouvellement de l'Access Token via un Refresh Token valide.
   *
   * Processus :
   * 1. Recherche le Refresh Token en base de données
   * 2. Vérifie qu'il n'est pas expiré
   * 3. Récupère l'utilisateur associé
   * 4. Génère et retourne un nouvel Access Token JWT (15 min)
   *
   * SÉCURITÉ : On ne supprime PAS le Refresh Token après usage (stratégie "sliding window").
   * Il reste valide jusqu'à sa date d'expiration ou jusqu'à un /logout explicite.
   *
   * @param data - { refreshToken: string } (UUID opaque)
   * @throws AppError(401) si le token est introuvable ou expiré
   * @returns Un nouvel accessToken JWT
   */
  static async refreshAccessToken(data: RefreshInput) {
    const { refreshToken } = data;

    // Recherche du Refresh Token en base de données (sans include pour éviter les bugs de type de l'éditeur)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    // Token introuvable → refus
    if (!storedToken) {
      throw new AppError("Refresh Token invalide ou révoqué.", 401);
    }

    // Vérification de l'expiration (comparaison de dates)
    if (storedToken.expiresAt < new Date()) {
      // Le token est expiré → on le supprime proprement de la DB
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      throw new AppError("Refresh Token expiré. Veuillez vous reconnecter.", 401);
    }

    // Récupération de l'utilisateur via la clé étrangère
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId }
    });

    if (!user) {
      throw new AppError("Utilisateur introuvable.", 401);
    }

    // Génération d'un nouvel Access Token pour l'utilisateur
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    return { accessToken: newAccessToken };
  }

  /**
   * Déconnexion d'un utilisateur : révocation du Refresh Token.
   *
   * Supprime le Refresh Token de la base de données. Ainsi, même si le client
   * conserve le token localement, il ne pourra plus obtenir de nouveaux Access Tokens.
   *
   * NOTE : L'Access Token actuel reste valide jusqu'à sa propre expiration (15 min).
   * C'est acceptable car c'est une courte fenêtre et la révocation complète des
   * Access Tokens JWT nécessiterait une blacklist (Redis), à implémenter si besoin.
   *
   * @param data - { refreshToken: string } (UUID opaque)
   * @throws AppError(404) si le token est déjà révoqué ou introuvable
   */
  static async logout(data: RefreshInput) {
    const { refreshToken } = data;

    // Vérification que le token existe avant de tenter la suppression
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError("Refresh Token déjà révoqué ou introuvable.", 404);
    }

    // Suppression définitive du Refresh Token de la base de données
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    // Aucune donnée à retourner : la déconnexion est un succès
    return null;
  }
}
