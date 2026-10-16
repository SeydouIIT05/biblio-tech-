# Proposal

## Why

Déployer l'application BiblioTech (Angular SSR, état complet) sur Vercel via GitHub afin d'avoir une prévisualisation/démo accessible, sans compromettre la portée (backend/reporting ajouté plus tard). 

## What Changes

- Basculer le build Angular vers **outputMode: "static"** : produire un site statique (`dist/BiblioTech/browser`) plus simple et robuste à déployer sur Vercel (pas de fonction serverless SSR nécessaire). 
- Ajouter un fichier `vercel.json` minimal : configurer `buildCommand`, `outputDirectory`, `framework: angular` et `rewrites` pour servir `index.html` sur les routes inconnues (anticiper d'éventuelles navigations). 
- Ne pas modifier le comportement fonctionnel (session, catalogue, prêts/réservations/pénalités/statistiques, auth, panneau, toasts) — hormis l'hydratation au premier chargement.
- Ne pas ajouter de backend/DB — session et données restent en mémoire (comme la maquette). Persistence optionnelle non ajoutée ici.
- Placer la source sur GitHub (dépôt `biblio-tech`, public, compte école) et préparer la connexion Vercel.

## Capabilities

### New Capabilities

- `deployment/vercel-static`: mise à disposition d'une application Angular statique déployée sur Vercel avec configuration minimale (`vercel.json`), instructions de build/output.

### Modified Capabilities

None (aucun changement de comportement fonctionnel spécifié dans les specs existantes). 

## Impact

- Fichiers : `angular.json` (outputMode), `vercel.json` (nouveau).
- Build : production produit `dist/BiblioTech/browser` (site statique).
- Déploiement : GitHub → Vercel (framework Angular, build statique).
- Pas d'impact sur les specs fonctionnelles existantes.
