# Tasks

## 1. Comptes côté serveur (capacités `auth`, `data-sync`)

- [x] 1.1 Étendre `backend/store.mjs` : état par bibliothèque, comptes (`SET NX`), sessions avec expiration, compteur d'échecs ; mêmes opérations en mémoire
- [x] 1.2 Écrire `backend/auth.mjs` : hachage `scrypt`, validation de l'inscription, jetons de session (empreinte SHA-256), inscription, connexion, déconnexion, blocage après 10 échecs
- [x] 1.3 Exiger le jeton dans `/api/state` et ne lire ou écrire que la bibliothèque du compte
- [x] 1.4 Ajouter `api/auth/signup.mjs`, `login.mjs`, `logout.mjs` et les routes du serveur de développement
- [x] 1.5 Tests Node : inscription, doublon, connexion, mauvais mot de passe, blocage, déconnexion, expiration, isolation des bibliothèques

## 2. Connexion et inscription dans Angular (capacités `auth`, `app-shell`)

- [x] 2.1 Ajouter au client `backend.ts` l'inscription, la connexion, la déconnexion et l'envoi du jeton
- [x] 2.2 Dans le store : ouvrir la session renvoyée par le serveur, charger la bibliothèque du compte, garder le jeton avec la session, gérer l'expiration
- [x] 2.3 Effacer les données du compte de ce poste à la déconnexion
- [x] 2.4 Formulaires : boutons désactivés pendant l'appel, messages du serveur, type et ville envoyés à l'inscription
- [x] 2.5 Retirer la mention « Maquette : … », l'indicateur de sauvegarde, et rendre « Mot de passe oublié » honnête
- [x] 2.6 Tests : inscription, erreurs du serveur, serveur injoignable, autre poste, deux comptes, rechargement, expiration, déconnexion

## 3. Mise en production

- [x] 3.1 Vérifier en local : tests Angular et API, build de production, parcours inscription, connexion, rechargement, déconnexion
- [ ] 3.2 Sur le site en ligne, créer le compte de démonstration depuis « Inscription » et vérifier la connexion depuis un second navigateur
