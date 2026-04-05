-- Migration: US4.4 — Ajout des champs isBoosted et boostedUntil sur Listing
-- Ces champs permettent de booster une annonce après paiement Orange Money / MTN MoMo.

ALTER TABLE "Listing" ADD COLUMN "isBoosted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "boostedUntil" TIMESTAMP(3);
