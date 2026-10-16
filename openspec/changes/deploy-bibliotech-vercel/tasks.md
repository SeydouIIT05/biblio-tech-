# Tasks

## 1. Configuration (build statique + Vercel)

- [ ] 1.1 Modifier `angular.json` : passer `outputMode` à `"static"` dans l'option de build (`projects.BiblioTech.architect.build.options.outputMode`) et vérifier par lecture/validation JSON que la modification est correcte.
- [ ] 1.2 Ajouter `vercel.json` à la racine du projet avec : `buildCommand: "npm run build"`, `outputDirectory: "dist/BiblioTech/browser"`, `framework: "angular"`, et rewrites `"/(.*)" → "/index.html"`. Vérifier la syntaxe JSON.
- [ ] 1.3 Vérifier que `ng build --configuration production` produit `dist/BiblioTech/browser/index.html` et les assets. Constater l'absence/absence requise de `dist/BiblioTech/server/` (déploiement statique). Corriger tout écart.

## 2. Vérification (tests + comportement)

- [ ] 2.1 Exécuter `npm test -- --watch=false` et s'assurer que tous les tests passent (86 attendus). Vérifier aucun échec.
- [ ] 2.2 Build production statique réussi : `npm run build` aboutit sans erreur, dossier `dist/BiblioTech/browser/` créé. Vérifier `index.html` présent.
- [ ] 2.3 Vérifier que le comportement fonctionnel est préservé (authentification, catalogue, emprunts/réservations/pénalités/statistiques, fiche livre, toasts) via tests existants et aperçu rapide du contenu prérendu (`dist/BiblioTech/browser/index.html` contient `id="auth"`).

## 3. Git & Déploiement (GitHub + Vercel)

- [ ] 3.1 Configurer (déjà fait localement) l'identité git repo-local : `user.name="Seydou Diabagate"`, `user.email="seydou.diabagate@iit.ci"`. Vérifier `git config user.name; git config user.email`.
- [ ] 3.2 Créer le dépôt GitHub `biblio-tech` (public) sur le compte école via token (ou via commande avec `GH_TOKEN`) : vérifier que le repo est créé (réponse API ou URL).
- [ ] 3.3 Ajouter le remote `origin` vers `https://github.com/<login-compte-ecole>/biblio-tech.git` (login confirmé au moment de l'exécution). Vérifier `git remote -v`.
- [ ] 3.4 Commiter les modifications (`angular.json`, `vercel.json`) avec message clair, ex. `chore(deploy): configure static build and vercel.json for Vercel deployment`.
- [ ] 3.5 Pousser sur `main`/`master` (branche actuelle `master`) : `git push -u origin master`. Vérifier push réussi (dépôt GitHub contient les fichiers).
- [ ] 3.6 Connecter le dépôt `biblio-tech` sur Vercel (dashboard Vercel → Import Git Repository → sélectionner le repo, framework Angular détecté, Build Command `npm run build`, Output Directory `dist/BiblioTech/browser`) et déclencher un premier déploiement. Vérifier que le déploiement réussit et obtenir l'URL de production/prévisualisation.

## Workflow follow-up

- Mettre à jour le changement OpenSpec `deploy-bibliotech-vercel` (état des tâches) après exécution.
- Archiver le changement `deploy-bibliotech-vercel` une fois les artefacts validés et le déploiement opérationnel (conformément au workflow OpenSpec).
- Ajouter la persistance localStorage dans une mise à jour ultérieure (hors périmètre de ce changement).
