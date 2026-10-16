# deployment/vercel-static Specification

## Purpose
Fournir une configuration de déploiement statique pour l'application BiblioTech sur Vercel (build statique, routes SPA, configuration minimale) afin de permettre le déploiement depuis GitHub sans serveurless SSR.

## Requirements

### Requirement: Build statique Vercel
Le système DOIT pouvoir être construit en `outputMode: "static"` afin de produire `dist/BiblioTech/browser` (HTML, CSS, JS, assets) prêt à être servi par un hébergeur statique.

#### Scenario: Build statique réussi
- **WHEN** `ng build --configuration production` est exécuté avec `outputMode: "static"`
- **THEN** le répertoire `dist/BiblioTech/browser` existe et contient `index.html` et les bundles générés
- **THEN** aucun dossier `dist/BiblioTech/server` n'est requis pour le déploiement statique

### Requirement: Configuration Vercel minimale
Le projet DOIT inclure un fichier `vercel.json` à la racine précisant `buildCommand`, `outputDirectory`, `framework: "angular"` et un `rewrites` redirigeant vers `/index.html` toutes les routes inconnues sauf celles de l'API (`/api/*`), qui SHALL atteindre les fonctions Vercel du dossier `api/`.

#### Scenario: Configuration Vercel présente et cohérente
- **WHEN** `vercel.json` existe à la racine du projet
- **THEN** il contient `buildCommand: "npm run build"`
- **THEN** il contient `outputDirectory: "dist/BiblioTech/browser"`
- **THEN** il contient `framework: "angular"`
- **THEN** il contient une règle `rewrites` `{ "source": "/((?!api/).*)", "destination": "/index.html" }`

#### Scenario: Appel de l'API
- **WHEN** le navigateur appelle `/api/state`
- **THEN** la requête est traitée par la fonction `api/state.mjs` et non par `index.html`

### Requirement: Déploiement GitHub-Vercel
Le dépôt GitHub `biblio-tech` (public, sur le compte spécifié) DOIT pouvoir être connecté à Vercel pour un déploiement automatique à chaque push sur la branche principale.

#### Scenario: Déploiement automatique configuré
- **WHEN** le dépôt est poussé sur GitHub et connecté à Vercel
- **THEN** Vercel déclenche un build via `buildCommand`
- **THEN** le déploiement utilise `outputDirectory` et sert l'application statique
- **THEN** l'application est accessible via l'URL de prévisualisation/déploiement Vercel

### Requirement: Préservation du comportement fonctionnel
Le passage au build statique NE DOIT PAS modifier le comportement fonctionnel de l'application (authentification, catalogue, prêts/réservations/pénalités/statistiques, panneau de livre, toasts). Le rendu initial reste déterministe.

#### Scenario: Fonctionnalité inchangée après passage statique
- **WHEN** l'application est buildée en statique et servie
- **THEN** l'écran d'authentification s'affiche initialement (session nulle)
- **THEN** après connexion, la navigation via la barre latérale fonctionne
- **THEN** les messages, compteurs et montants correspondent aux données de démo
