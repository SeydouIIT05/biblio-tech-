# Tasks

## 1. Persistance dans le navigateur (capacités `data-sync`, `auth`)

- [x] 1.1 Créer `src/app/state/persistence.ts` (jeton `LIBRARY_PERSISTENCE`, lecture/écriture JSON protégées) et le fournir dans `app.config.ts`
- [x] 1.2 Sauvegarder les données après chaque opération du store et relire l'état dans `restore()`, appelé après l'hydratation
- [x] 1.3 Brancher « Rester connecté » : session en `localStorage` si cochée, en `sessionStorage` sinon ; conserver l'onglet ouvert
- [x] 1.4 Réduire les couvertures importées à 400×600 en JPEG et prévenir quand le stockage est plein
- [x] 1.5 Tests : rechargement, déconnexion, « Rester connecté », données corrompues, stockage plein

## 2. Backend serverless (capacité `data-sync`)

- [x] 2.1 Écrire `backend/store.mjs` : stockage Upstash Redis (REST, script Lua compare-and-set) et stockage mémoire pour le développement
- [x] 2.2 Écrire `backend/state-handler.mjs` (GET/PUT, validation, 409, 413, 502, 503) et `api/state.mjs`
- [x] 2.3 Exclure `/api/` de la réécriture SPA dans `vercel.json`
- [x] 2.4 Ajouter `scripts/dev-api.mjs`, `proxy.conf.json` et les scripts `npm run api` / `npm run test:api`
- [x] 2.5 Tests Node (`node --test`) de l'API et du stockage Upstash simulé

## 3. Synchronisation côté Angular (capacités `data-sync`, `app-shell`)

- [x] 3.1 Créer `src/app/state/backend.ts` (client `fetch` de `/api/state`) et le fournir dans `app.config.ts`
- [x] 3.2 Dans le store : relire le serveur, y déposer les données de démo si la base est vide, pousser après chaque opération, gérer le conflit 409
- [x] 3.3 Relire le serveur quand l'onglet redevient visible
- [x] 3.4 Ajouter l'indicateur de sauvegarde et le bouton « Réinitialiser la démo » dans le pied de la barre
- [x] 3.5 Tests : base vide, deux postes, conflit, serveur injoignable, réinitialisation

## 4. Interface (capacités `catalogue`, `penalties`)

- [x] 4.1 Remplacer le carré de statut par un pictogramme coloré (catalogue, mosaïque, fiche, pénalités)

## 5. Mise en production

- [x] 5.1 Vérifier en local : tests Angular et API, build de production, parcours complet avec l'API en mémoire
- [ ] 5.2 Relier une base Upstash for Redis (offre gratuite) au projet Vercel, redéployer et vérifier que l'indicateur affiche « Données partagées sur le serveur »
