# Proposal

## Why

Sur Vercel, recharger la page renvoyait à l'écran de connexion et effaçait toutes les opérations : la maquette gardait tout en mémoire. Le comptoir a besoin que la session et les données survivent au rechargement, et que plusieurs postes (ou le professeur qui teste le site) voient les mêmes prêts, retours et réservations.

## What Changes

- Sauvegarde automatique des données (adhérents, livres, prêts, réservations) dans le `localStorage` du navigateur après chaque opération.
- La case « Rester connecté » devient réelle : cochée, la session survit à la fermeture du navigateur ; décochée, elle dure jusqu'à sa fermeture. L'onglet ouvert est conservé au rechargement.
- Nouveau backend serverless gratuit : une fonction Vercel `GET/PUT /api/state` qui stocke l'état partagé dans Upstash Redis (offre gratuite de la Marketplace Vercel).
- Première visite : une base vide reçoit les données de démonstration de la maquette.
- Protection entre postes : chaque écriture porte un numéro de version ; une écriture périmée est refusée (409) et l'application recharge l'état le plus récent.
- Sans base reliée ou hors ligne, l'application continue avec le stockage du navigateur.
- Bouton « Réinitialiser la démo » et indicateur de sauvegarde (serveur ou navigateur) dans le pied de la barre latérale.
- Pastilles de statut : le petit carré coloré devient un pictogramme de la même couleur.

## Capabilities

### New Capabilities

- `data-sync`: sauvegarde dans le navigateur, API d'état partagé, données de démonstration, conflits entre postes, mode hors ligne, réinitialisation.

### Modified Capabilities

- `auth`: session conservée au rechargement selon « Rester connecté ».
- `app-shell`: indicateur de sauvegarde et bouton « Réinitialiser la démo » dans le pied de la barre.
- `catalogue`: pictogramme devant chaque statut de livre.
- `penalties`: pictogramme devant chaque situation de règlement.
- `deployment/vercel-static`: la règle de réécriture SPA laisse passer `/api/*`.

## Impact

- Nouveaux fichiers : `api/state.mjs` (fonction Vercel), `backend/` (logique et stockage), `scripts/dev-api.mjs` et `proxy.conf.json` (développement local), `src/app/state/persistence.ts` et `backend.ts`.
- `vercel.json` : réécriture `/((?!api/).*)` au lieu de `/(.*)`.
- Configuration Vercel : relier une base Upstash for Redis (offre gratuite) au projet ; elle injecte `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
- Le HTML prérendu ne contient plus l'écran de connexion : l'application s'affiche après avoir relu l'état sauvegardé, sans clignotement.
