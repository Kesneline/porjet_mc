/**
 * @file messaging.service.ts
 * @description Service de messagerie sécurisée entre utilisateurs (US2.3).
 *
 * En tant qu'utilisateur, je veux envoyer des messages sécurisés au
 * propriétaire sans révéler mon numéro de téléphone.
 *
 * SÉCURITÉ :
 *   - Les numéros de téléphone ne sont JAMAIS inclus dans les réponses messagerie
 *   - Les liens suspects (Western Union, MoneyGram, etc.) sont bloqués
 *   - Seuls les participants d'une conversation peuvent lire/écrire dedans
 */
import { prisma } from '../../config/prisma.config';
import { AppError } from '../../middlewares/error.middleware';

// Patterns de liens suspects à bloquer dans les messages (US5.3 anticipé)
const SUSPICIOUS_PATTERNS = [
  /western\s*union/i,
  /money\s*gram/i,
  /bit\.ly/i,
  /tinyurl\.com/i,
  /paypal\.me/i,
  /bit\.do/i,
  /goo\.gl/i,
  /virement\s*(bancaire|international)/i,
  /envoy(er|ez)\s*(de\s*l')?argent/i,
];

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

    return { conversation, message: conversation.messages[0], isNew: true };
  }

  /**
   * Liste toutes les conversations d'un utilisateur.
   * Retourne le dernier message de chaque conversation et les infos du participant.
   * Les numéros de téléphone ne sont JAMAIS inclus.
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
   * Vérifie la participation et filtre les liens suspects.
   *
   * @param conversationId - ID de la conversation
   * @param senderId       - ID de l'expéditeur
   * @param content        - Contenu du message
   */
  static async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.checkParticipant(conversationId, senderId);

    const sanitized = this.sanitizeMessage(content);
    const isBlocked = this.containsSuspiciousContent(content);

    const message = await prisma.message.create({
      data: {
        content: sanitized,
        senderId,
        conversationId,
        isBlocked,
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

    if (isBlocked) {
      return {
        ...message,
        _warning: "Ce message contient un lien ou terme suspect et a été bloqué pour votre sécurité.",
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

  /** Détecte les liens et termes suspects dans un message. */
  private static containsSuspiciousContent(content: string): boolean {
    return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(content));
  }

  /** Nettoie le message (trim + suppression caractères invisibles). */
  private static sanitizeMessage(content: string): string {
    return content.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  }
}
