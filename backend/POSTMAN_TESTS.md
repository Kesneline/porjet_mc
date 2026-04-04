# 🚀 Guide de Test Postman - Stud'Housing Trust

Utilisez ces informations pour tester les nouvelles fonctionnalités du module **User**.

---

## 1. Inscription (`POST /auth/register`)
- **URL** : `http://localhost:3000/api/auth/register`
- **Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "Password123",
  "name": "Jean Dupont",
  "phone": "+237 6xx xxx xxx",
  "university": "UY1"
}
```

---

## 2. Connexion (`POST /auth/login`)
- **URL** : `http://localhost:3000/api/auth/login`
- **Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```
> **IMPORTANT** : Copiez le `accessToken` reçu dans la réponse.

---

## 3. Mon Profil (`GET /users/me`)
- **URL** : `http://localhost:3000/api/users/me`
- **Headers** : 
    - `Authorization` : `Bearer <VOTRE_TOKEN>`
- **But** : Vérifie que le serveur vous reconnaît et renvoie vos infos (y compris les champs vides).

---

## 4. Mise à jour Profil (`PATCH /users/profile`)
- **URL** : `http://localhost:3000/api/users/profile`
- **Headers** : 
    - `Authorization` : `Bearer <VOTRE_TOKEN>`
- **Body (form-data)** : 
    - `name` : (text) "Jean Modifié"
    - `phone` : (text) "+237 699 99 99 99"
    - `university` : (text) "Polytech Yaoundé"
    - `avatar` : (file) Sélectionnez une image `.jpg` ou `.png`
- **But** : Remplit les champs vides et uploade ta photo sur Cloudinary.

---

## 5. Administration (Admin uniquement)
- **Prérequis** : Votre utilisateur doit avoir `role: "ADMIN"` en base de données.
- **URL Liste Users** : `GET /api/admin/users`
- **URL Vérifier User** : `PATCH /api/admin/users/<ID_USER>/verify`
- **URL Changer Rôle** : `PATCH /api/admin/users/<ID_USER>/role` (Body: `{"role": "OWNER"}`)

---

## 6. Gestion des Erreurs (Audit)
- Essayez d'envoyer un mot de passe trop court (< 8 caractères).
- Essayez d'envoyer un nom de 1 seul caractère.
- Essayez d'accéder à `/me` sans le token Authorization.

---
*Le serveur redémarre automatiquement à chaque modification via `ts-node-dev`.*
