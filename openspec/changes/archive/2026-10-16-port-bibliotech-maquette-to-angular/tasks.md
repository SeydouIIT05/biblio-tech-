# Tasks

## 1. Fondations (styles globaux, index, nettoyage du squelette)

- [x] 1.1 Copier verbatim le bloc `<style>` de `src/bibliotech.html` dans `src/styles.css` (sélecteurs, valeurs, médias queries inchangés) et vérifier par diff textuel qu'aucune règle n'a été reformatée ni renommée
- [x] 1.2 Mettre à jour `src/index.html` (`lang="fr"`, titre « BiblioTech — Gestion de bibliothèque », preconnect + feuille Google Fonts Hanken Grotesk/Newsreader/IBM Plex Mono) et vérifier que les trois polices se chargent dans le navigateur
- [x] 1.3 Ajouter la ligne `app-root { display: contents }` aux styles globaux et vérifier que le squelette Angular s'affiche sans décalage ni barre de défilement parasite
- [x] 1.4 Vider la page de démonstration Angular de `src/app/app.html` et `src/app/app.css`, retirer `<router-outlet/>`, et vérifier que `npm run build` passe (budgets de styles inchangés)
- [x] 1.5 Remplacer `src/app/app.spec.ts` par une base de test qui monte le composant racine, et vérifier que `npm test` s'exécute

## 2. État, données de démonstration et règles métier

- [x] 2.1 Créer `src/app/state/demo-data.ts` avec les jeux `M`, `B`, `L`, `R` et les constantes (`T = 16 octobre 2026`, `P = 14`, `TARIF = 100`, `BLOQUE = 500`) strictement identiques à la maquette, et vérifier les valeurs par lecture croisée du script
- [x] 2.2 Implémenter `src/app/state/rules.ts` (disponibilité, statut, retard, pénalité, impayés, promotion, formats date `d()` et FCFA `fr()`) avec les mêmes formules que la maquette, et vérifier par tests unitaires (prêt non rendu de 20 j → 2 000 FCFA ; exemplaires libres = copies − prêts − réservations prêtes)
- [x] 2.3 Créer `LibraryStore` (signaux : membres, livres, prêts, réservations, session, vue, sélection, toast) avec les mutateurs d'ajout/prêt/retour/encaissement/annulation/réservation, et vérifier par tests unitaires qu'un retour promeut la réservation en attente la plus ancienne quand un exemplaire se libère
- [x] 2.4 Ajouter les dérivés `computed` (compteur de retards, réservations actives, totaux du catalogue) et vérifier par tests qu'ils se recalculent après une mutation

## 3. Authentification (capacité `auth`)

- [x] 3.1 Créer le composant d'authentification (panneau de marque + onglets Connexion/Inscription + formulaires) avec l'ouverture/fermeture de session, et vérifier que `App` bascule auth ↔ châssis selon la session
- [x] 3.2 Implémenter les validations de connexion et d'inscription dans l'ordre exact de la maquette (messages et seuils identiques) et vérifier par tests unitaires chaque refus puis chaque succès
- [x] 3.3 Implémenter l'affichage/masquage du mot de passe, « Mot de passe oublié ? », les liens de bascule d'onglet et la soumission par `Entrée`, et vérifier le comportement manuellement contre la maquette
- [x] 3.4 Implémenter la déconnexion (réinitialisation des champs, case « Rester connecté » par défaut, mots de passe re-masqués, retour sur Connexion, fiche fermée) et vérifier que l'écran revient identique à la maquette
- [x] 3.5 Poser la classe `body.in` via un `effect` sur la session et vérifier que la grille `body{display:grid}` s'applique uniquement connecté (comparaison visuelle avec la maquette)

## 4. Châssis, navigation et notifications (capacité `app-shell`)

- [x] 4.1 Reproduire `aside` (logo, sept entrées, pied d'utilisateur avec nom, lieu, date fixe, bouton de déconnexion) et le sprite SVG des icônes dans le template racine, et vérifier l'absence d'icône manquante
- [x] 4.2 Implémenter la commutation de vue par signal (section affichée, entrée active, fiche fermée, `scrollTo` à la connexion) et vérifier que chaque entrée affiche la bonne section
- [x] 4.3 Ajouter les compteurs de la navigation (retards, réservations actives, vides à zéro) et vérifier par test qu'ils suivent les mutations du store
- [x] 4.4 Implémenter le toast (message, apparition, disparition après ~4 s, remplacement du précédent) et vérifier le déclenchement sur un retour et un encaissement
- [x] 4.5 Vérifier le responsive (≤ 900 px barre horizontale défilante et pied masqué ; ≤ 560 px colonne unique) et `prefers-reduced-motion` en comparant aux points de rupture de la maquette

## 5. Catalogue : consultation, filtres et couvertures (capacité `catalogue`)

- [x] 5.1 Implémenter la vue Catalogue (sous-titre de totaux, recherche, segments de statut, sélecteur de catégorie, bascule Tableau/Mosaïque, états vides) et vérifier par tests de filtrage combiné
- [x] 5.2 Implémenter le calcul du statut et l'affichage tableau/mosaïque (couleurs, « disponibles sur total », états vides) et vérifier les trois statuts sur le jeu de démo
- [x] 5.3 Créer le composant de couverture (image ou générée depuis titre/auteur avec couleur de palette, variantes vignette/aperçu) et vérifier le rendu sur un livre avec et sans image

## 6. Fiche du livre et réservation depuis la fiche (capacité `catalogue`)

- [x] 6.1 Implémenter l'ouverture de la fiche (clic ligne/carte, voile, focus du bouton de fermeture) et vérifier l'ouverture au clic et la fermeture par croix, voile et `Échap`
- [x] 6.2 Reproduire le contenu de la fiche (couverture, titre, auteur, statut, résumé, cote, catégorie, année, disponibles, emprunteurs avec dates, réservataires) et le comparer à la maquette pour un livre prêté et un livre libre
- [x] 6.3 Implémenter la réservation depuis la fiche (refus si stock disponible ou doublon, création sinon, toasts) et vérifier par tests les trois cas

## 7. Ajout d'un livre (capacité `catalogue`)

- [x] 7.1 Implémenter le formulaire d'ajout (champs, datalist des catégories, image 3 Mo max, aperçu de couverture en direct) et vérifier la mise à jour de l'aperçu à la frappe et au choix d'image
- [x] 7.2 Implémenter la validation ordonnée (titre, auteur, cote unique, catégorie, exemplaires ≥ 1) et l'ajout immédiat au catalogue avec réinitialisation et toast, et vérifier par tests le cas cote en double et le cas nominal
- [x] 7.3 Vérifier que le nouveau livre apparaît dans le tableau et la mosaïque et que `ng build` reste dans le budget de styles

## 8. Emprunts et retours (capacité `loans`)

- [x] 8.1 Implémenter le formulaire de prêt (datalists adhérent/cote, message de statut, tampon de date de retour) et vérifier le tampon (date, titre, adhérent) après un prêt valide
- [x] 8.2 Implémenter la validation ordonnée (carte, cote, blocage à 500 FCFA, disponibilité ou réservation prête) et vérifier par tests chaque message d'erreur et l'honoré de réservation
- [x] 8.3 Implémenter la liste « Prêts en cours » (tri par échéance, colonnes, états « Retard de N j » / « Aujourd'hui » / « dans N j ») et vérifier le sous-titre et le tri
- [x] 8.4 Implémenter l'enregistrement d'un retour (clôture, toast avec ou sans pénalité, promotion de réservation) et vérifier par tests le prêt tardif (9 j → 900 FCFA au nom de l'adhérent) et le retour sans retard

## 9. Réservations (capacité `reservations`)

- [x] 9.1 Implémenter la vue Réservations (sous-titre, liste des demandes actives, rang, situation, état vide) et vérifier l'affichage du rang et de la date limite de retrait (3 jours)
- [x] 9.2 Implémenter l'annulation (retrait de la file, toast, promotion suivante si la réservation annulée était prête) et vérifier par tests les deux cas d'annulation

## 10. Pénalités (capacité `penalties`)

- [x] 10.1 Implémenter la vue Pénalités (cartouches de règles, sous-titre distinguant à encaisser et en cours, tableau trié, bouton Encaisser) et vérifier le tri impayés d'abord puis montant décroissant
- [x] 10.2 Implémenter l'encaissement (marquage réglé, toast, mise à jour du total) et vérifier par test que le total à encaisser diminue et qu'un prêt rendu non réglé n'a plus de bouton
- [x] 10.3 Vérifier l'interaction avec le blocage des prêts (adhérent à 500 FCFA refusé jusqu'à encaissement) par un test de bout en bout du store

## 11. Statistiques (capacité `statistics`)

- [x] 11.1 Implémenter les huit cartes d'indicateurs et le sous-titre daté, et vérifier que les valeurs correspondent au jeu de démo
- [x] 11.2 Implémenter les trois tableaux (5 livres les plus prêtés, catégories, adhérents actifs) et vérifier le classement et les cumuls par tests
- [x] 11.3 Vérifier le recalcul après un retour, un prêt et un encaissement (cartes et tableaux à jour à l'ouverture de l'onglet)

## 12. Intégration et vérification finale

- [x] 12.1 Vérifier le rendu serveur et l'hydratation (`npm run build` puis `npm run serve:ssr:BiblioTech`) sans erreur de coupure d'hydratation sur l'écran d'authentification
- [x] 12.2 Comparer côte à côte chaque vue de l'application connectée avec `src/bibliotech.html` (catalogue, ajout, emprunts, réservations, pénalités, statistiques, fiche, toasts, états vides) et corriger tout écart
- [x] 12.3 Parcourir un scénario de bout en bout (connexion → ajout d'un livre → prêt → retour en retard → encaissement → statistiques) et vérifier que chaque étape produit les mêmes messages et montants que la maquette
- [x] 12.4 Vérifier que `src/bibliotech.html` n'a pas été modifié (diff git) et que `npm test` passe entièrement

## Workflow follow-up

- Archiver le changement après revue des artefacts et validation de l'implémentation.
- Le déploiement Vercel fera l'objet d'un changement ultérieur distinct.
