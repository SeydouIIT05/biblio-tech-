# Proposal

## Why

La connexion et l'inscription étaient fictives : n'importe quel e-mail ouvrait le comptoir et tous les visiteurs partageaient la même bibliothèque. Pour remettre le projet au professeur, il faut de vrais comptes : il reçoit des identifiants ou crée son propre compte, et chaque compte retrouve sa bibliothèque d'un poste à l'autre.

## What Changes

- **Inscription réelle** : le formulaire crée un compte administrateur et l'espace de sa bibliothèque (nom, type, ville) sur le serveur ; une adresse déjà utilisée est refusée.
- **Connexion réelle** : e-mail et mot de passe sont vérifiés par le serveur ; « E-mail ou mot de passe incorrect. » sinon ; blocage de 15 minutes après 10 échecs.
- **Sessions** : le serveur remet un jeton (30 jours avec « Rester connecté », 1 jour sinon) ; une session expirée renvoie à l'écran de connexion avec un message.
- **Une bibliothèque par compte** : `/api/state` exige le jeton et ne renvoie que la bibliothèque du compte ; une nouvelle bibliothèque reçoit les données de démonstration.
- **Déconnexion** : ferme la session côté serveur et efface les données du compte de ce poste.
- **Mot de passe oublié** : renvoie vers l'administrateur de la bibliothèque (aucun e-mail n'est envoyé).
- **Interface** : suppression de la mention « Maquette : tout e-mail valide… » et de l'indicateur « Données partagées sur le serveur ».

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: connexion et inscription vérifiées par le serveur, sessions à jeton, mot de passe oublié.
- `data-sync`: API de comptes, état par bibliothèque protégé par jeton, données effacées à la déconnexion.
- `app-shell`: le pied de la barre perd l'indicateur de sauvegarde.

## Impact

- Nouveaux fichiers : `backend/auth.mjs`, `backend/http.mjs`, `api/auth/signup.mjs`, `api/auth/login.mjs`, `api/auth/logout.mjs`.
- Redis : clés `bibliotech:user:*`, `bibliotech:session:*`, `bibliotech:fail:*`, `bibliotech:lib:<id>:*` ; l'ancien état commun `bibliotech:state` n'est plus lu.
- Aucune dépendance ajoutée : hachage `scrypt` et jetons aléatoires du module `node:crypto`.
- Les tests unitaires Angular sans serveur gardent la connexion fictive de la maquette.
