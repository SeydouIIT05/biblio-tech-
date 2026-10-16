# Proposal

## Why

Le projet BiblioTech (logiciel de gestion de bibliothèque) n'existe pour l'instant que sous forme d'une maquette statique autonome, `src/bibliotech.html` (HTML + CSS + JS inline). Le squelette Angular 21 (SSR) du dépôt est vide : aucune route, aucun composant métier. Il faut découper la maquette en composants Angular avec un rendu et un comportement strictement identiques pour pouvoir faire évoluer le projet (et ultérieurement le déployer sur Vercel).

## What Changes

- Conversion intégrale de `src/bibliotech.html` en application Angular 21 (standalone components, signals, router), fidèle au pixel près : mêmes couleurs, polices Google (Hanken Grotesk, Newsreader, IBM Plex Mono), grille, médias queries et composants (tableaux, mosaïque, panneau latéral, toast, écran d'authentification).
- Découpage en composants par vue : écran connexion/inscription, shell (aside + navigation), catalogue (tableau/mosaïque), formulaire d'ajout, emprunts et retours, réservations, pénalités, statistiques, panneau « fiche du livre », toast.
- Reprise à l'identique de la logique métier de la maquette : données de démo en mémoire (adhérents, livres, prêts, réservations), date de référence fixe (16 octobre 2026), règles de prêt (14 jours, 100 FCFA/jour, blocage à 500 FCFA), promotions de réservation à l'arrivée d'un retour, validations de formulaire (connexion fictive : tout e-mail valide + mot de passe ≥ 6 caractères).
- Styles extraits du bloc `<style>` de la maquette vers les fichiers de styles globaux/composants Angular, sans aucune différence visuelle.
- Aucune persistance ni backend ajoutés : comportement strictement équivalent à la maquette (données perdues au rechargement).

Hors périmètre (étape séparée, confirmée avec l'utilisateur) : le déploiement sur Vercel.

## Capabilities

### New Capabilities

- `auth`: écran d'authentification (Connexion / Inscription), validations de saisie fictives, affichage/masquage du mot de passe, ouverture et fermeture de session.
- `app-shell`: layout applicatif (barre latérale + zone principale), navigation entre vues avec état actif et compteurs (emprunts en retard, réservations actives), notifications toast, affichage de l'utilisateur et de la date, comportement responsive.
- `catalogue`: consultation du catalogue (recherche, filtres statut/catégorie, vues tableau et mosaïque), statuts de disponibilité, fiche livre en panneau latéral, réservation depuis la fiche, ajout d'un livre avec aperçu de couverture.
- `loans`: enregistrement d'un prêt (carte adhérent + cote, règles de blocage, tampon de date de retour), liste des prêts en cours et enregistrement des retours.
- `reservations`: file des réservations actives (rang, retrait, expiration), annulation et promotion automatique lors du retour d'un exemplaire.
- `penalties`: calcul et affichage des pénalités de retard (règles, montants dus, encaissement).
- `statistics`: indicateurs clés et tableaux de synthèse (prêts, catégories, adhérents les plus actifs).

### Modified Capabilities

_(aucune — aucun spec existant dans `openspec/specs/`)_

## Impact

- **Code** : `src/index.html` (titre, langues, polices Google), `src/styles.css` (styles globaux issus de la maquette), `src/app/*` (nouveaux composants, signaux d'état, routes, suppression/neutralisation du contenu de démo actuel de `app.html`).
- **Référence** : `src/bibliotech.html` reste la source de vérité du design et du comportement ; il n'est pas modifié dans ce changement.
- **Dépendances** : aucune nouvelle (Angular 21, router et forms déjà présents ; `@angular/forms` si nécessaire pour la gestion des formulaires).
- **Tests** : `src/app/app.spec.ts` existant (vitest) devra être adapté ; tests unitaires ciblés des règles métier (pénalités, promotion, validations).
- **Non impacté** : configuration de déploiement (Vercel hors périmètre), backend/API (inexistant).
