/**
 * @file matching.service.ts
 * @description Service de matching IA personnalisé via Claude API (US4.1).
 *
 * En tant qu'étudiant, je veux un matching IA personnalisé qui classe
 * les annonces selon mon profil (budget, campus, préférences).
 *
 * FLOW :
 *   1. Récupère les annonces actives correspondant aux critères de base (Prisma)
 *   2. Envoie le profil + les annonces à Claude API pour scoring personnalisé
 *   3. Retourne les annonces triées par score de compatibilité (0-100)
 */
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../config/prisma.config';
import { config } from '../../config/env.config';
import { AppError } from '../../middlewares/error.middleware';
import { MatchingProfile } from './matching.validator';

export class MatchingService {

  /**
   * Génère un classement IA des annonces pour un profil étudiant donné.
   *
   * @param profile - Profil de recherche de l'étudiant
   * @returns Annonces classées avec score de compatibilité et justification
   */
  static async matchListings(profile: MatchingProfile) {
    if (!config.anthropicApiKey) {
      throw new AppError(
        "Le matching IA n'est pas configuré. Vérifiez ANTHROPIC_API_KEY dans le .env.",
        503
      );
    }

    // 1. Pré-filtrage Prisma : annonces actives dans la fourchette budget + zone géo
    const priceMax = profile.budget * 1.3; // marge de 30% pour laisser Claude juger
    const candidates = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        price: { lte: priceMax },
        ...(profile.preferredType && { type: profile.preferredType }),
      },
      take: 50, // limiter pour ne pas exploser le contexte Claude
      orderBy: [{ isBoosted: 'desc' }, { trustScore: 'desc' }],
      include: {
        owner: { select: { id: true, name: true, trustScore: true } },
      },
    });

    if (candidates.length === 0) {
      return { matches: [], message: 'Aucune annonce ne correspond à vos critères de base.' };
    }

    // 2. Préparer le contexte pour Claude
    const listingsContext = candidates.map((l, i) => ({
      index: i + 1,
      id: l.id,
      title: l.title,
      price: l.price,
      city: l.city,
      address: l.address,
      type: l.type,
      rooms: l.rooms,
      amenities: l.amenities,
      trustScore: l.trustScore,
      campusDist: l.campusDist,
      latitude: l.latitude,
      longitude: l.longitude,
      isBoosted: l.isBoosted,
      ownerTrustScore: l.owner.trustScore,
    }));

    const studentProfile = {
      budget: profile.budget,
      campus: profile.campusName,
      campusCoords: { lat: profile.campusLat, lng: profile.campusLng },
      maxDistanceKm: profile.maxDistance,
      preferredType: profile.preferredType || 'aucune préférence',
      requiredAmenities: profile.requiredAmenities,
      acceptsRoommates: profile.roommates,
      notes: profile.additionalNotes,
    };

    // 3. Appel Claude API
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `Tu es un expert du logement étudiant au Cameroun. Tu analyses un profil étudiant et une liste d'annonces pour produire un classement par compatibilité.

RÈGLES :
- Score de 0 à 100 (100 = parfait)
- Pondération : prix/budget (35%), distance campus (25%), équipements demandés (20%), Trust Score (15%), type de logement (5%)
- Si le prix dépasse le budget, pénalise fortement (-30 pts par tranche de 10% au-dessus)
- Si distance campus > maxDistanceKm, pénalise proportionnellement
- Favorise les annonces avec un Trust Score élevé (>3.5)
- Retourne UNIQUEMENT un JSON valide, sans texte autour

FORMAT DE RÉPONSE (JSON strict) :
[
  {
    "id": "uuid-de-l-annonce",
    "score": 87,
    "reason": "Explication courte en français (1-2 phrases)"
  }
]

Retourne les ${profile.limit} meilleures annonces triées par score décroissant.`,
      messages: [
        {
          role: 'user',
          content: `PROFIL ÉTUDIANT :\n${JSON.stringify(studentProfile, null, 2)}\n\nANNONCES DISPONIBLES :\n${JSON.stringify(listingsContext, null, 2)}`,
        },
      ],
    });

    // 4. Parser la réponse Claude
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new AppError("Réponse IA invalide.", 502);
    }

    let rankings: Array<{ id: string; score: number; reason: string }>;
    try {
      // Extraire le JSON même s'il est entouré de ```json ... ```
      const raw = textBlock.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      rankings = JSON.parse(raw);
    } catch {
      throw new AppError("Impossible de parser la réponse du matching IA.", 502);
    }

    // 5. Enrichir avec les données complètes des annonces
    const rankedIds = rankings.map((r) => r.id);
    const fullListings = candidates.filter((l) => rankedIds.includes(l.id));

    const matches = rankings.map((rank) => {
      const listing = fullListings.find((l) => l.id === rank.id);
      return {
        score: rank.score,
        reason: rank.reason,
        listing: listing || null,
      };
    }).filter((m) => m.listing !== null);

    return {
      matches,
      totalCandidates: candidates.length,
      modelUsed: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }
}
