# catalogue Specification

## Purpose
Permet de consulter, filtrer et faire évoluer le fonds documentaire : recherche, statuts de disponibilité, vues tableau et mosaïque, fiche détaillée avec réservation et ajout d'un livre.

## Requirements

### Requirement: Sous-titre du catalogue
Le système SHALL afficher sous le titre le nombre total de titres, d'exemplaires, d'exemplaires disponibles et le nombre de lignes correspondant aux filtres courants.

#### Scenario: Filtres au repos
- **WHEN** le catalogue s'affiche sans filtre
- **THEN** le sous-titre indique les totaux du jeu de démonstration et que tous les titres sont affichés

### Requirement: Recherche par titre, auteur ou cote
Le système SHALL filtrer le catalogue à la saisie de la recherche sur la concaténation titre + auteur + cote, sans tenir compte de la casse.

#### Scenario: Recherche partielle
- **WHEN** l'utilisateur tape `kou`
- **THEN** seuls les livres dont le titre, l'auteur ou la cote contient « kou » restent affichés

#### Scenario: Aucun résultat
- **WHEN** aucune entrée ne correspond
- **THEN** le tableau affiche « Aucun livre ne correspond à cette recherche. » et la mosaïque le même message

### Requirement: Filtres statut et catégorie
Le système SHALL filtrer par statut via les segments « Tous », « Disponible », « Réservé », « Emprunté » et par catégorie via une liste déroulante « Toutes » puis les catégories présentes ; les filtres SHALL être combinés.

#### Scenario: Combinaison statut et catégorie
- **WHEN** le statut « Réservé » et la catégorie « Roman » sont sélectionnés
- **THEN** seuls les livres romans réservés sont affichés

### Requirement: Calcul du statut d'un livre
Le système SHALL calculer le statut ainsi : « Disponible » (vert) si au moins un exemplaire est libre ; sinon « Réservé » (ocre) si au moins une réservation est en attente ; sinon « Emprunté » (bleu). L'exemplaire libre vaut copies − prêts en cours − exemplaires réservés prêts.

#### Scenario: Livre entièrement prêté avec attente
- **WHEN** tous les exemplaires sont prêtés et qu'une réservation est en attente
- **THEN** le statut affiché est « Réservé » en ocre

### Requirement: Vues tableau et mosaïque
Le système SHALL proposer un bascule Tableau/Mosaïque ; le tableau SHALL montrer titre + auteur avec vignette, cote, catégorie, « disponibles sur total » et statut ; la mosaïque SHALL montrer une couverture par livre, son titre, son auteur et son statut.

#### Scenario: Bascule en mosaïque
- **WHEN** l'utilisateur choisit « Mosaïque »
- **THEN** le tableau est masqué et les livres s'affichent en grille de cartes cliquables

### Requirement: Couverture générée ou image
Le système SHALL afficher la couverture image du livre s'il en a une, sinon une couverture générée (fond de couleur tirée de la palette selon l'identifiant du livre, titre en serif et auteur en dessous) ; cette règle SHALL s'appliquer aux vignettes, à la mosaïque, à la fiche et à l'aperçu d'ajout.

#### Scenario: Livre sans image
- **WHEN** le livre n'a pas d'image de couverture
- **THEN** sa vignette montre une couverture colorée avec titre et auteur

### Requirement: Ouverture de la fiche livre
Le système SHALL ouvrir un panneau latéral droit (380 px, voile sombre derrière, focus sur le bouton de fermeture) au clic sur une ligne du tableau ou une carte de la mosaïque ; la fiche SHALL présenter couverture, titre, auteur, statut, résumé, puis cote, catégorie, année, exemplaires disponibles, emprunteurs avec date de retour et réservataires, et se ferme par la croix, le voile ou `Échap`.

#### Scenario: Clic sur une ligne
- **WHEN** l'utilisateur clique sur une ligne du catalogue
- **THEN** le panneau s'ouvre avec la fiche du livre sélectionné et le voile apparaît

### Requirement: Réservation depuis la fiche
Le système SHALL proposer dans la fiche une liste d'adhérents et un bouton « Réserver ce livre » ; il SHALL refuser avec un toast si un exemplaire est disponible (« enregistrez plutôt le prêt ») ou si l'adhérent a déjà une réservation active pour ce livre, sinon il SHALL créer une réservation en attente et confirmer par toast.

#### Scenario: Réservation créée
- **WHEN** aucun exemplaire n'est disponible et l'adhérent n'a pas réservé ce livre
- **THEN** une réservation en attente est créée pour ce jour et le toast confirme au nom de l'adhérent

### Requirement: Ajout d'un livre au catalogue
Le système SHALL valider le formulaire d'ajout dans l'ordre : titre, auteur, cote (unique, insensible à la casse), catégorie, au moins 1 exemplaire ; il SHALL accepter une image de couverture de 3 Mo maximum, afficher une erreur au-delà ; à la soumission valide, le livre SHALL apparaître immédiatement dans le tableau et la mosaïque, les champs se réinitialisent et un toast confirme l'ajout.

#### Scenario: Cote en double
- **WHEN** la cote saisie existe déjà (quelle que soit la casse)
- **THEN** le message « Cette cote existe déjà dans le catalogue. » s'affiche et le livre n'est pas ajouté

#### Scenario: Ajout réussi
- **WHEN** tous les champs sont valides et l'utilisateur clique « Ajouter au catalogue »
- **THEN** le livre est présent dans le catalogue avec son statut, le formulaire est vidé et le toast annonce son ajout

### Requirement: Aperçu de couverture en direct
Le système SHALL afficher dans l'espace d'aperçu la couverture qui sera créée (titre et auteur saisis, image choisie) et la SHALL mettre à jour à chaque frappe sur le titre, l'auteur ou le choix d'image.

#### Scenario: Saisie du titre
- **WHEN** l'utilisateur tape le titre et l'auteur
- **THEN** l'aperçu montre une couverture avec ces textes, avec un libellé par défaut si un champ est vide

### Requirement: Pictogramme de statut
Le système SHALL afficher devant chaque statut de livre (tableau, mosaïque, fiche) un pictogramme de la couleur du statut : une coche pour « Disponible », un marque-page pour « Réservé », deux flèches d'échange pour « Emprunté ».

#### Scenario: Catalogue au repos
- **WHEN** le catalogue s'affiche en vue tableau
- **THEN** « Une si longue lettre » montre une coche verte devant « Disponible » et « Les Soleils des indépendances » un marque-page ocre devant « Réservé »
