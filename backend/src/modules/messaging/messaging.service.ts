/**
 * @file messaging.service.ts
 * @description Service de messagerie sécurisée entre utilisateurs (US2.3 + US5.3).
 *
 * En tant qu'utilisateur, je veux envoyer des messages sécurisés au
 * propriétaire sans révéler mon numéro de téléphone.
 *
 * SÉCURITÉ (US2.3) :
 *   - Les numéros de téléphone ne sont JAMAIS inclus dans les réponses messagerie
 *   - Seuls les participants d'une conversation peuvent lire/écrire dedans
 *
 * ANTI-ARNAQUE (US5.3) :
 *   - Les liens de paiement suspects sont détectés et bloqués (Western Union, etc.)
 *   - Les raccourcisseurs d'URL sont bloqués (bit.ly, tinyurl, etc.)
 *   - Les tentatives de partage de coordonnées bancaires (IBAN, RIB) sont bloquées
 *   - Les adresses crypto sont détectées
 *   - Le langage d'urgence financière est signalé
 *   - Les messages bloqués sont marqués avec catégorie et raison
 *   - Les utilisateurs récidivistes sont signalés (compteur de messages bloqués)
 */
import { prisma } from '../../config/prisma.config';
import { AppError } from '../../middlewares/error.middleware';

// ─────────────────────────────────────────────────────────────
// US5.3 — FILTRAGE ANTI-ARNAQUE COMPLET
// ─────────────────────────────────────────────────────────────

/** Catégories de contenus suspects pour le reporting */
type SuspiciousCategory =
  | 'PAYMENT_SERVICE'        // Western Union, MoneyGram, etc.
  | 'URL_SHORTENER'          // bit.ly, tinyurl, goo.gl, etc.
  | 'BANK_TRANSFER'          // Virement, IBAN, RIB
  | 'CRYPTO'                 // Adresses Bitcoin, Ethereum, etc.
  | 'EXTERNAL_PAYMENT'       // PayPal, CashApp, Venmo, etc.
  | 'URGENCY_SCAM'           // Langage d'urgence financière
  | 'PHISHING_URL'           // Liens vers des domaines suspects
  | 'PERSONAL_INFO_REQUEST'; // Demande de données personnelles sensibles

interface SuspiciousPattern {
  pattern: RegExp;
  category: SuspiciousCategory;
  reason: string;
}

/** Résultat d'une analyse de contenu suspect */
interface SuspiciousContentResult {
  isSuspicious: boolean;
  category: SuspiciousCategory | null;
  reason: string | null;
}

/**
 * Patterns de contenus suspects organisés par catégorie (US5.3).
 * Chaque pattern a une raison explicative pour le message de blocage.
 */
const SUSPICIOUS_PATTERNS: SuspiciousPattern[] = [
  // --- Services de transfert d'argent internationaux ---
  { pattern: /western\s*union/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert Western Union détecté' },
  { pattern: /money\s*gram/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert MoneyGram détecté' },
  { pattern: /ria\s*transfer/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert Ria détecté' },
  { pattern: /world\s*remit/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert WorldRemit détecté' },
  { pattern: /sendwave/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert Sendwave détecté' },
  { pattern: /remitly/i, category: 'PAYMENT_SERVICE', reason: 'Service de transfert Remitly détecté' },

  // --- Raccourcisseurs d'URL (masquent la vraie destination) ---
  { pattern: /bit\.ly\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci bit.ly détecté' },
  { pattern: /tinyurl\.com/i, category: 'URL_SHORTENER', reason: 'Lien raccourci TinyURL détecté' },
  { pattern: /bit\.do\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci bit.do détecté' },
  { pattern: /goo\.gl\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci goo.gl détecté' },
  { pattern: /t\.co\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci t.co détecté' },
  { pattern: /is\.gd\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci is.gd détecté' },
  { pattern: /v\.gd\//i, category: 'URL_SHORTENER', reason: 'Lien raccourci v.gd détecté' },
  { pattern: /shorturl\.at/i, category: 'URL_SHORTENER', reason: 'Lien raccourci shorturl détecté' },
  { pattern: /cutt\.ly/i, category: 'URL_SHORTENER', reason: 'Lien raccourci cutt.ly détecté' },
  { pattern: /rb\.gy/i, category: 'URL_SHORTENER', reason: 'Lien raccourci rb.gy détecté' },

  // --- Virements bancaires et coordonnées bancaires ---
  { pattern: /virement\s*(bancaire|international)/i, category: 'BANK_TRANSFER', reason: 'Demande de virement bancaire détectée' },
  { pattern: /\bIBAN\b/i, category: 'BANK_TRANSFER', reason: 'Numéro IBAN détecté' },
  { pattern: /\bRIB\b/i, category: 'BANK_TRANSFER', reason: 'Numéro RIB détecté' },
  { pattern: /\bSWIFT\b/i, category: 'BANK_TRANSFER', reason: 'Code SWIFT détecté' },
  { pattern: /\bBIC\b/i, category: 'BANK_TRANSFER', reason: 'Code BIC détecté' },
  { pattern: /num[ée]ro\s*de?\s*compte/i, category: 'BANK_TRANSFER', reason: 'Demande de numéro de compte détectée' },
  { pattern: /coordonn[ée]es?\s*bancaire/i, category: 'BANK_TRANSFER', reason: 'Demande de coordonnées bancaires détectée' },

  // --- Cryptomonnaies (adresses de portefeuille) ---
  { pattern: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/, category: 'CRYPTO', reason: 'Adresse Bitcoin détectée' },
  { pattern: /\b0x[a-fA-F0-9]{40}\b/, category: 'CRYPTO', reason: 'Adresse Ethereum détectée' },
  { pattern: /\bbitcoin\b/i, category: 'CRYPTO', reason: 'Mention de Bitcoin détectée' },
  { pattern: /\bcrypto\s*monnaie/i, category: 'CRYPTO', reason: 'Mention de cryptomonnaie détectée' },
  { pattern: /\busdt\b/i, category: 'CRYPTO', reason: 'Mention de USDT/Tether détectée' },
  { pattern: /\bbinance\b/i, category: 'CRYPTO', reason: 'Mention de Binance détectée' },

  // --- Plateformes de paiement externes ---
  { pattern: /paypal\.me/i, category: 'EXTERNAL_PAYMENT', reason: 'Lien PayPal détecté' },
  { pattern: /paypal\.com/i, category: 'EXTERNAL_PAYMENT', reason: 'Lien PayPal détecté' },
  { pattern: /\bcash\s*app\b/i, category: 'EXTERNAL_PAYMENT', reason: 'Mention de CashApp détectée' },
  { pattern: /\bvenmo\b/i, category: 'EXTERNAL_PAYMENT', reason: 'Mention de Venmo détectée' },
  { pattern: /\bzelle\b/i, category: 'EXTERNAL_PAYMENT', reason: 'Mention de Zelle détectée' },
  { pattern: /\bskrill\b/i, category: 'EXTERNAL_PAYMENT', reason: 'Mention de Skrill détectée' },

  // --- Langage d'urgence financière (arnaque classique) ---
  { pattern: /envoy(er|ez)\s*(de\s*l['']\s*)?argent/i, category: 'URGENCY_SCAM', reason: "Demande d'envoi d'argent détectée" },
  { pattern: /urgent\s*(paiement|transfert|envoi)/i, category: 'URGENCY_SCAM', reason: 'Demande urgente de paiement détectée' },
  { pattern: /pay(er|ez)\s*(vite|maintenant|tout\s*de\s*suite|imm[ée]diatement)/i, category: 'URGENCY_SCAM', reason: 'Demande de paiement urgent détectée' },
  { pattern: /derni[eè]re\s*chance\s*(de\s*)?(pay|r[eé]serv)/i, category: 'URGENCY_SCAM', reason: 'Pression de "dernière chance" détectée' },
  { pattern: /d[eé]p[oô]t\s*(urgent|imm[eé]diat|obligatoire)/i, category: 'URGENCY_SCAM', reason: 'Demande de dépôt urgent détectée' },
  { pattern: /avance\s*(d['']\s*)?argent/i, category: 'URGENCY_SCAM', reason: "Demande d'avance d'argent détectée" },
  { pattern: /garantie\s*(financi[eè]re|mon[eé]taire)/i, category: 'URGENCY_SCAM', reason: 'Demande de garantie financière suspecte détectée' },

  // --- URLs de phishing potentiel (domaines TLD suspects) ---
  { pattern: /\b\w+\.(xyz|top|buzz|click|loan|work|gq|cf|tk|ml)\b/i, category: 'PHISHING_URL', reason: 'Lien vers un domaine suspect détecté' },

  // --- Demandes d'informations personnelles suspectes ---
  { pattern: /num[eé]ro\s*de?\s*(carte|cr[eé]dit|d[eé]bit)/i, category: 'PERSONAL_INFO_REQUEST', reason: 'Demande de numéro de carte bancaire détectée' },
  { pattern: /code\s*(secret|pin|cvv|cvc)/i, category: 'PERSONAL_INFO_REQUEST', reason: 'Demande de code secret/PIN détectée' },
  { pattern: /mot\s*de\s*passe/i, category: 'PERSONAL_INFO_REQUEST', reason: 'Demande de mot de passe détectée' },
];

/** Seuil de messages bloqués avant signalement automatique à l'admin */
const BLOCKED_MESSAGES_ALERT_THRESHOLD = 3;

export class MessagingService {

  /**
   * Démarre une nouvelle conversation entre deux utilisateurs,
   * ou retourne la conversation existante si elle existe déjà.
   *
   * @param senderId    - ID de l'utilisateur qui initie
   * @param recipientId - ID du propriétaire / destinataire
   * @param firstMessage - Premier message de la conversation
   */
  static async startConversation(senderId: string, recipientId: string, firstMessage: string) {
    if (senderId === recipientId) {
      throw new AppError('Vous ne pouvez pas vous envoyer un message.', 400);
    }

    // Vérifier que le destinataire existe
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) throw new AppError('Destinataire introuvable.', 404);

    // Vérifier si une conversation existe déjà entre les deux
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    if (existingConversation) {
      // Conversation existante : envoyer le message dedans
      const message = await this.sendMessage(existingConversation.id, senderId, firstMessage);
      return { conversation: existingConversation, message, isNew: false };
    }

    // US5.3 — Vérifier le contenu suspect AVANT de créer la conversation
    const suspiciousResult = this.analyzeSuspiciousContent(firstMessage);

    // Créer une nouvelle conversation avec les deux participants + premier message
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: senderId },
            { userId: recipientId },
          ],
        },
        messages: {
          create: {
            content: this.sanitizeMessage(firstMessage),
            senderId,
            isBlocked: suspiciousResult.isSuspicious,
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    const result: any = { conversation, message: conversation.messages[0], isNew: true };

    // Si le premier message est suspect, ajouter l'avertissement
    if (suspiciousResult.isSuspicious) {
      await this.checkRecidivism(senderId);
      result._warning = 'Ce message a été bloqué pour votre sécurité.';
      result._blocked = {
        category: suspiciousResult.category,
        reason: suspiciousResult.reason,
      };
    }

    return result;
  }

  /**
   * Liste toutes les conversations d'un utilisateur.
   * Retourne le dernier message de chaque conversation et les infos du participant.
   * Les numéros de téléphone ne sont JAMAIS inclus (US2.3).
   *
   * @param userId - ID de l'utilisateur connecté
   */
  static async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
                // PAS de phone ni email → numéro masqué (US2.3)
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isBlocked: true,
          },
        },
      },
    });

    // Formater pour le client : identifier l'interlocuteur
    return conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== userId);
      return {
        id: conv.id,
        interlocutor: otherParticipant?.user || null,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
      };
    });
  }

  /**
   * Récupère les messages d'une conversation avec pagination.
   * Vérifie que l'utilisateur est bien participant.
   *
   * @param conversationId - ID de la conversation
   * @param userId         - ID de l'utilisateur (pour vérifier l'accès)
   * @param page           - Page de messages (défaut 1)
   * @param limit          - Messages par page (défaut 30)
   */
  static async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    await this.checkParticipant(conversationId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.reverse(), // chronologique (plus ancien en premier)
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Envoie un message dans une conversation existante.
   * Vérifie la participation et filtre les liens suspects (US5.3).
   *
   * @param conversationId - ID de la conversation
   * @param senderId       - ID de l'expéditeur
   * @param content        - Contenu du message
   */
  static async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.checkParticipant(conversationId, senderId);

    const sanitized = this.sanitizeMessage(content);
    const suspiciousResult = this.analyzeSuspiciousContent(content);

    const message = await prisma.message.create({
      data: {
        content: sanitized,
        senderId,
        conversationId,
        isBlocked: suspiciousResult.isSuspicious,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Met à jour updatedAt de la conversation (pour le tri dans la liste)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // US5.3 — Si le message est bloqué, vérifier le compteur de récidives
    if (suspiciousResult.isSuspicious) {
      await this.checkRecidivism(senderId);

      return {
        ...message,
        _warning: 'Ce message a été bloqué pour votre sécurité.',
        _blocked: {
          category: suspiciousResult.category,
          reason: suspiciousResult.reason,
        },
      };
    }

    return message;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────────────────────

  /** Vérifie que l'utilisateur est participant de la conversation. */
  private static async checkParticipant(conversationId: string, userId: string) {
    const participant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) {
      throw new AppError("Vous n'avez pas accès à cette conversation.", 403);
    }
  }

  /**
   * US5.3 — Analyse le contenu d'un message pour détecter les patterns suspects.
   * Retourne la catégorie et la raison si un pattern est trouvé.
   *
   * @param content - Contenu du message à analyser
   * @returns Résultat de l'analyse avec catégorie et raison
   */
  private static analyzeSuspiciousContent(content: string): SuspiciousContentResult {
    for (const { pattern, category, reason } of SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        return { isSuspicious: true, category, reason };
      }
    }
    return { isSuspicious: false, category: null, reason: null };
  }

  /**
   * US5.3 — Vérifie si un utilisateur a dépassé le seuil de messages bloqués.
   * Si oui, crée un signalement automatique pour les admins.
   *
   * Cela permet de détecter les arnaqueurs récidivistes sans intervention manuelle.
   *
   * @param userId - ID de l'utilisateur dont on vérifie le compteur
   */
  private static async checkRecidivism(userId: string) {
    try {
      // Compter les messages bloqués de cet utilisateur
      const blockedCount = await prisma.message.count({
        where: {
          senderId: userId,
          isBlocked: true,
        },
      });

      if (blockedCount >= BLOCKED_MESSAGES_ALERT_THRESHOLD) {
        // Récupérer les infos de l'utilisateur pour le log
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });

        // Log d'alerte pour les administrateurs
        console.warn(
          `[US5.3 ALERTE] Utilisateur récidiviste détecté : ${user?.name} (${user?.email}) - ` +
          `${blockedCount} messages bloqués. Vérification manuelle recommandée.`
        );

        // Note: En production, on pourrait :
        // 1. Envoyer une notification push aux admins
        // 2. Créer un Report automatique dans la BDD
        // 3. Suspendre temporairement l'utilisateur après N récidives
      }
    } catch (error) {
      // Le compteur de récidive ne doit pas bloquer l'envoi du message
      // (fire-and-forget avec catch silencieux)
      console.error('[US5.3] Erreur lors de la vérification de récidive :', error);
    }
  }

  /** Nettoie le message (trim + suppression caractères invisibles + caractères dangereux). */
  private static sanitizeMessage(content: string): string {
    return content
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')       // Caractères invisibles (zero-width)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); // Caractères de contrôle
  }
}
