# Design

## Context

Le backend (`add-vercel-backend`) stocke un état unique dans Upstash Redis via la fonction `api/state.mjs`. L'authentification restait côté client et fictive. Il faut des comptes sans service payant ni dépendance supplémentaire, et sans secret à configurer sur Vercel.

## Goals / Non-Goals

**Goals**
- Comptes réels, mots de passe jamais stockés en clair.
- Données isolées par bibliothèque, accessibles depuis n'importe quel poste.
- Aucune variable d'environnement nouvelle à créer : la base Upstash suffit.

**Non-Goals**
- Envoi d'e-mails (vérification d'adresse, réinitialisation du mot de passe).
- Plusieurs utilisateurs ou rôles dans une même bibliothèque.
- Connexion par Google ou Microsoft.

## Decisions

- **`scrypt` de `node:crypto`** avec un sel aléatoire de 16 octets et une comparaison en temps constant : sûr et sans dépendance.
- **Sessions stockées dans Redis** plutôt qu'un JWT signé : pas de secret à gérer, déconnexion immédiate (la clé est supprimée), expiration native (`SET … EX`). La clé est l'empreinte SHA-256 du jeton : une fuite de la base ne donne pas de jeton utilisable.
- **Création atomique du compte** avec `SET … NX` : deux inscriptions simultanées sur la même adresse ne peuvent pas réussir toutes les deux.
- **Limite de tentatives** : compteur `INCR` + `EXPIRE` de 15 minutes par adresse, blocage à 10 échecs (réponse 429).
- **Trois petites fonctions** `api/auth/{signup,login,logout}.mjs` qui partagent `backend/auth.mjs` ; `backend/http.mjs` centralise les réponses 405, 503 et 502.
- **Les tests sans serveur gardent la connexion fictive** : le store n'appelle le serveur que si `LIBRARY_BACKEND` est fourni (navigateur), ce qui préserve les 100 tests existants.
- **Mot de passe oublié honnête** : sans envoi d'e-mail, le lien renvoie vers l'administrateur plutôt que d'annoncer un envoi qui n'a pas lieu.

## Risks / Trade-offs

- Pas de vérification de l'adresse e-mail : n'importe qui peut créer un compte avec une adresse qui n'est pas la sienne.
- La réponse 409 à l'inscription révèle qu'une adresse a déjà un compte (acceptable pour un comptoir de bibliothèque).
- L'état commun créé par `add-vercel-backend` n'est pas migré : chaque compte part des données de démonstration.

## Migration Plan

1. Déployer : les fonctions utilisent la base Upstash déjà reliée.
2. Créer le compte de démonstration depuis l'onglet « Inscription » du site en ligne.
3. Partager ces identifiants avec le professeur, qui peut aussi créer son propre compte.

## Open Questions

- Faut-il ajouter plus tard des comptes « agent de comptoir » rattachés à la bibliothèque d'un administrateur ?
