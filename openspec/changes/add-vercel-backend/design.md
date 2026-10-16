# Design

## Context

L'application est un site Angular 21 prérendu en statique et servi par Vercel. Toute la logique métier (règles de prêt, pénalités, promotions de réservation) vit côté client dans `src/app/state/rules.ts` et `library.store.ts`, couverte par les tests. Il manquait une persistance, et l'hébergement doit rester gratuit.

## Goals / Non-Goals

**Goals**
- Rien ne se perd au rechargement, même sans réseau.
- Un état commun à tous les postes, hébergé gratuitement sur Vercel.
- Aucun écrasement silencieux quand deux postes écrivent en même temps.

**Non-Goals**
- Vraie authentification et comptes utilisateurs (la connexion reste fictive).
- Déplacer les règles métier côté serveur.
- Temps réel (WebSocket) : l'état est relu au chargement et au retour sur l'onglet.

## Decisions

- **Upstash Redis plutôt que Postgres.** Offre gratuite sans carte (256 Mo, 500 000 commandes par mois), installée depuis la Marketplace Vercel, API REST appelée avec `fetch` : aucune dépendance npm ajoutée. L'état complet tient dans une clé.
- **Une seule fonction `api/state.mjs` (export `fetch` Web standard).** Recommandé par Vercel pour regrouper les routes. Le code partagé est hors de `api/` (`backend/`) pour ne pas créer de fonctions supplémentaires.
- **État complet + version optimiste.** `PUT { version, data }` est appliqué par un script Lua atomique (`EVAL`) qui compare la version ; sinon 409 avec l'état courant. Simple, et suffisant pour quelques postes.
- **Le client garde la main sur les règles.** Il applique l'opération, sauvegarde dans `localStorage`, puis pousse l'état ; une base vide reçoit les données de démonstration du client, ce qui évite de les dupliquer côté serveur.
- **Relecture après hydratation.** Le prérendu ne connaît pas la session : la page reste neutre jusqu'à `afterNextRender`, puis l'état local est relu et le serveur interrogé. Pas d'erreur d'hydratation ni de flash de l'écran de connexion.
- **Couvertures réduites à 400×600 en JPEG** avant stockage, pour rester loin des quotas.

## Risks / Trade-offs

- Dernier arrivé perd son opération en cas de conflit → message explicite « refaites votre dernière opération ».
- Données de démo publiques : n'importe quel visiteur peut les modifier ou les réinitialiser (acceptable pour une démonstration).
- Sans base reliée, chaque navigateur a ses propres données ; l'indicateur du pied de barre le signale.

## Migration Plan

1. Déployer le code : sans variables Upstash, `/api/state` répond 503 et l'application reste en mode navigateur.
2. Relier une base Upstash for Redis gratuite au projet Vercel, puis redéployer.
3. Premier chargement : la base reçoit les données de démonstration ; l'indicateur passe à « Données partagées sur le serveur ».

## Open Questions

- Faut-il un jour un historique des opérations (journal) plutôt qu'un état complet ?
