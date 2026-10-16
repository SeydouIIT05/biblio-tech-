# Spec Delta

## Purpose

Permet de présenter la situation du comptoir : indicateurs clés, livres les plus empruntés, répartition par catégorie et adhérents les plus actifs.

## ADDED Requirements

### Requirement: Sous-titre des statistiques
Le système SHALL afficher « Situation au 16 oct., d'après les prêts, réservations et pénalités enregistrés. » (date de référence formatée en français).

#### Scenario: Ouverture de l'onglet
- **WHEN** l'utilisateur ouvre Statistiques
- **THEN** le sous-titre indique la date de référence et la source des données

### Requirement: Huit cartes d'indicateurs
Le système SHALL afficher huit cartes avec icône et valeur : Titres, Exemplaires, Prêts en cours, Prêts en retard, Réservations actives, Retours enregistrés, Adhérents, À encaisser (montant FCFA) ; les valeurs SHALL refléter l'état courant des données.

#### Scenario: Valeurs après un retour
- **WHEN** un retour est enregistré puis les statistiques affichées
- **THEN** « Retours enregistrés » a augmenté et « Prêts en cours » a diminué

### Requirement: Livres les plus empruntés
Le système SHALL lister les 5 livres ayant le plus de prêts (toutes périodes), avec vignette, titre, auteur et nombre de prêts, par ordre décroissant.

#### Scenario: Classement
- **WHEN** le livre le plus prêté totalise 10 prêts
- **THEN** il figure en tête du tableau avec « 10 »

### Requirement: Tableau par catégorie
Le système SHALL lister chaque catégorie avec son nombre de titres, d'exemplaires et de prêts, dans l'ordre d'apparition du catalogue.

#### Scenario: Catégorie Roman
- **WHEN** le catalogue contient des romans et d'autres catégories
- **THEN** la ligne « Roman » totalise ses titres, exemplaires et prêts cumulés

### Requirement: Adhérents les plus actifs
Le système SHALL lister les adhérents ayant au moins un prêt, du plus actif au moins actif (par nombre total de prêts), avec nom et carte, prêts en cours, total des prêts et pénalités impayées.

#### Scenario: Classement
- **WHEN** un adhérent a le plus grand nombre total de prêts
- **THEN** il apparaît en premier avec son cumul de pénalités impayées

### Requirement: Fraîcheur des indicateurs
Le système SHALL recalculer indicateurs et tableaux à chaque affichage de l'onglet à partir de l'état courant (prêts, réservations, encaissements).

#### Scenario: Après un encaissement
- **WHEN** l'utilisateur encaisse une pénalité puis rouvre Statistiques
- **THEN** la carte « À encaisser » reflète le nouveau total
