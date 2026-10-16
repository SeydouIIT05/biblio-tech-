# Design

## Context

L'application BiblioTech a été portée vers Angular 21 avec SSR (outputMode: server) et un bundle statique/server existants. Pour un déploiement simple sur Vercel via GitHub, on choisit un mode statique pour éviter la complexité SSR serverless (api/index.js, rewrites spéciaux, includeFiles). Voir proposal.md.

## Goals / Non-Goals

**Goals :**
- Passer `angular.json` en `outputMode: "static"` pour produire `dist/BiblioTech/browser`.
- Ajouter `vercel.json` à la racine (buildCommand, outputDirectory, framework, rewrites vers `/index.html`).
- Préparer la publication sur GitHub (biblio-tech, public, compte école) et indiquer les étapes Vercel.
- Préserver le comportement (auth, vues, données démo en mémoire).

**Non-Goals :**
- Ajout de backend/DB ou persistance localStorage.
- Changement des specs fonctionnelles.
- Gestion SSR avancée (serverless).

## Decisions

**D1 : outputMode static (vs SSR serverless)**
- Rationale : app 100% client-side, pas de données serveur ; statique = plus simple sur Vercel.
- Alternatives : garder SSR + api/index.js (plus complexe, pièges `index.csr.html`/`/`).
- Choix : static.

**D2 : vercel.json minimal**
- Rationale : explicite (buildCommand, outputDirectory, framework, rewrites). Évite ambiguïtés.
- Alternatives : pas de vercel.json (Vercel autodetecte parfois, mais explicite est sûr).
- Choix : yes.

## Risks / Trade-offs

- [Build] Prérender statique : si jamais on ajoute des routes dynamiques, il faudrait repasser SSR. Mitigation : non-goal.
- [SSR] Si on remettait SSR plus tard, changer outputMode et ajouter config. Mitigation : documenté comme évolution.
- [Vercel] outputDirectory doit correspondre exactement. Mitigation : `dist/BiblioTech/browser`.

## Migration Plan

1. Modifier `angular.json` : `outputMode: "static"` (garder `server`/`ssr` non requis ; on garde si pas gênant, sinon on nettoie léger).
2. Créer `vercel.json`.
3. Build statique + tests.
4. Commit, push sur GitHub biblio-tech.
5. Connecter repo à Vercel (framework Angular, build auto) → déploiement.
6. Vérifier accès URL Vercel.

## Open Questions

None.
