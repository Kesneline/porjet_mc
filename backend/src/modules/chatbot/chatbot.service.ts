/**
 * @file chatbot.service.ts
 * @description Service chatbot IA pour conseils logement 24/7 (US4.2).
 *
 * En tant qu'étudiant, je veux discuter avec un assistant IA pour obtenir
 * des conseils logement : quartiers recommandés, budget, sécurité,
 * démarches administratives, droits du locataire au Cameroun, etc.
 *
 * FLOW :
 *   1. Reçoit le message de l'utilisateur + historique de conversation
 *   2. Envoie à Claude API avec un system prompt spécialisé Cameroun
 *   3. Retourne la réponse de l'assistant
 *
 * NOTE : Le chatbot ne manipule PAS les données de la BDD.
 * Pour la recherche de logements, orienter l'utilisateur vers le matching (US4.1).
 */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/env.config';
import { AppError } from '../../middlewares/error.middleware';
import { ChatbotMessageInput } from './chatbot.validator';

/** System prompt définissant la personnalité et les connaissances du chatbot */
const CHATBOT_SYSTEM_PROMPT = `Tu es l'assistant IA de Stud'Housing Trust, une plateforme de logement étudiant au Cameroun. Tu aides les étudiants à trouver un logement sûr et adapté.

IDENTITÉ :
- Nom : Assistant Stud'Housing
- Ton : Amical, professionnel, rassurant
- Langue : Français (avec termes locaux camerounais acceptés)
- Tu tutoies l'étudiant pour créer un lien de confiance

DOMAINES D'EXPERTISE :
1. QUARTIERS — Tu connais les villes universitaires du Cameroun (Yaoundé, Douala, Buéa, Dschang, Bamenda, Ngaoundéré, Maroua, Bertoua) et leurs quartiers étudiants :
   - Yaoundé : Ngoa-Ekelle, Melen, Omnisport, Biyem-Assi, Mendong, Soa
   - Douala : Bonamoussadi, Logpom, Makepe, Ndogbong, Akwa
   - Buéa : Molyko, Bonduma, Great Soppo
   - Dschang : quartier universitaire, Foto, Haoussa

2. BUDGET — Tu conseilles sur les fourchettes de prix réalistes en FCFA :
   - Chambre simple : 15 000 – 30 000 FCFA/mois
   - Studio : 25 000 – 50 000 FCFA/mois
   - Appartement : 40 000 – 100 000+ FCFA/mois
   - Colocation : 10 000 – 25 000 FCFA/personne

3. SÉCURITÉ — Tu sensibilises sur :
   - Vérifier l'identité du bailleur (CNI, titre foncier)
   - Exiger un contrat de bail écrit
   - Ne JAMAIS envoyer d'argent via Western Union ou transfert international
   - Visiter le logement avant de payer
   - Se méfier des prix trop bas (arnaques)
   - Utiliser la messagerie sécurisée de la plateforme

4. DROITS DU LOCATAIRE AU CAMEROUN :
   - Loi n°97/003 relative à la promotion immobilière
   - Durée du préavis (3 mois minimum pour le bailleur)
   - Le bailleur doit remettre un reçu pour chaque loyer payé
   - La caution ne peut excéder 2 mois de loyer
   - Réparations : bailleur (gros travaux) vs locataire (entretien courant)

5. DÉMARCHES :
   - Documents nécessaires (CNI/passeport, certificat de scolarité, garant)
   - Comment négocier le loyer
   - Quand et comment résilier un bail

RÈGLES :
- Tu ne donnes JAMAIS de numéro de téléphone personnel ni d'adresse email
- Tu ne recommandes JAMAIS un logement ou bailleur spécifique (pas de publicité)
- Si l'étudiant cherche un logement précis, oriente-le vers la recherche ou le matching IA de la plateforme
- Tu ne fournis PAS de conseils juridiques formels (recommande de consulter un avocat si nécessaire)
- Tu refuses poliment les sujets hors de ton domaine (politique, religion, etc.)
- Tes réponses sont concises (max 300 mots sauf si la question nécessite plus de détails)
- Si tu ne sais pas, dis-le honnêtement plutôt que d'inventer`;

export class ChatbotService {
  /**
   * Envoie un message au chatbot IA et retourne sa réponse.
   *
   * @param input - Message de l'utilisateur + historique de conversation
   * @returns Réponse de l'assistant IA
   */
  static async chat(input: ChatbotMessageInput) {
    if (!config.anthropicApiKey) {
      throw new AppError(
        "L'assistant IA n'est pas configuré. Vérifiez ANTHROPIC_API_KEY dans le .env.",
        503
      );
    }

    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    // Construire l'historique des messages pour Claude
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Ajouter l'historique de conversation existant
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      for (const msg of input.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Ajouter le nouveau message de l'utilisateur
    messages.push({
      role: 'user',
      content: input.message,
    });

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: CHATBOT_SYSTEM_PROMPT,
        messages,
      });

      // Extraire la réponse texte
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new AppError("L'assistant IA n'a pas pu générer de réponse.", 502);
      }

      return {
        reply: textBlock.text,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      // Erreur spécifique à l'API Anthropic
      if (error instanceof AppError) throw error;

      if (error?.status === 429) {
        throw new AppError(
          "L'assistant IA est temporairement surchargé. Veuillez réessayer dans quelques instants.",
          429
        );
      }

      if (error?.status === 401) {
        throw new AppError(
          "Erreur d'authentification avec le service IA. Contactez l'administrateur.",
          503
        );
      }

      throw new AppError(
        "Une erreur est survenue avec l'assistant IA. Veuillez réessayer.",
        502
      );
    }
  }
}
