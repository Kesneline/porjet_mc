# 🏗️ Architecture des Modules - Stud'Housing Trust

Ce document récapitule l'ensemble des modules du système, leur état d'avancement et leur rôle dans l'écosystème **Stud'Housing Trust**.

---

## 🏛️ Modules de Base (Fondation)
| Module | Description | État |
| :--- | :--- | :--- |
| **Auth** | Gestion des comptes, Sécurité JWT RS256, Bcrypt. | ✅ Opérationnel |
| **Listing** | CRUD des annonces, Upload photos (Cloudinary), Catégories. | ✅ Opérationnel |
| **User** | Profils, Avatars, Rôles (Student, Owner, Admin). | ✅ Opérationnel |

---

## 🛡️ Modules de Confiance (Social & Trust)
| Module | Description | État |
| :--- | :--- | :--- |
| **Review** | Système d'avis et de notation (1-5★) pour les logements. | ⏳ Prévu en DB |
| **Vouching** | Recommandations entre pairs pour valider le sérieux. | ⏳ Prévu en DB |
| **TrustScore** | Calcul du score de fiabilité (Algo IA + Social). | 🚧 Spécifié |

---

## 💬 Modules de Communication
| Module | Description | État |
| :--- | :--- | :--- |
| **Chat** | Messagerie privée entre étudiants et bailleurs. | ⏳ Prévu en DB |
| **Report** | Signalements d'abus, arnaques ou contenus inappropriés. | ⏳ Prévu en DB |
| **Notification** | Alerts Push/Email pour les nouveaux messages ou annonces. | 🚧 Recherche |

---

## 💰 Modules de Monétisation
| Module | Description | État |
| :--- | :--- | :--- |
| **Payment** | Intégration MTN MoMo & Orange Money (Cameroun). | ⏳ Prévu en DB |
| **Premium** | Abonnements étudiants et boosts d'annonces propriétaires. | ⏳ Prévu en DB |

---

## 🌐 Modules Infrastructure & Meta
| Module | Description | État |
| :--- | :--- | :--- |
| **Search** | Recherche ultra-rapide par filtres via **Algolia**. | 🚧 Reporté |
| **Geocoding** | Calcul de distance campus (UY1, Soa, Polytech). | 🚧 Spécifié |
| **AIService** | IA pour support client et détection de fraude (Claude). | 🚧 Spécifié |

---
*Dernière mise à jour : 3 Avril 2026*
