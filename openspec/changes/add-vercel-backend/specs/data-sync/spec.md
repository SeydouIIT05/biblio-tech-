# Spec Delta

## Purpose

Conserve les données du comptoir au rechargement et les partage entre les postes grâce à une API serverless gratuite hébergée sur Vercel.

## ADDED Requirements

### Requirement: Sauvegarde dans le navigateur
Le système SHALL enregistrer les adhérents, livres, prêts et réservations dans le `localStorage` du navigateur après chaque ajout de livre, prêt, retour, réservation, annulation, encaissement ou réinitialisation, et SHALL les relire au chargement suivant.

#### Scenario: Retour conservé au rechargement
- **WHEN** l'utilisateur enregistre un retour puis recharge la page
- **THEN** le prêt apparaît toujours comme rendu et la pénalité correspondante reste à encaisser

#### Scenario: Données illisibles
- **WHEN** le stockage du navigateur contient des données invalides
- **THEN** l'application repart des données de démonstration sans erreur

#### Scenario: Stockage plein
- **WHEN** le navigateur refuse l'écriture faute de place
- **THEN** un toast prévient que les dernières modifications ne seront pas conservées au rechargement

### Requirement: API d'état partagé
Le système SHALL exposer `GET /api/state`, qui renvoie `{ version, data }` (`data` vaut `null` tant que rien n'est enregistré), et `PUT /api/state` avec `{ version, data }`, qui enregistre l'état et renvoie la nouvelle version. L'API SHALL refuser un corps invalide (400), un état de plus de 3 Mo (413), toute autre méthode (405), et SHALL répondre 503 quand aucune base n'est reliée au projet.

#### Scenario: Enregistrement réussi
- **WHEN** un poste envoie `PUT /api/state` avec la version qu'il a lue
- **THEN** l'état est enregistré dans Upstash Redis et la réponse contient la version suivante

### Requirement: Données de démonstration au premier chargement
Le système SHALL déposer dans une base vide les données de démonstration de la maquette (8 adhérents, 10 titres, 17 exemplaires, 10 prêts, 4 réservations), puis SHALL afficher l'état du serveur à chaque chargement.

#### Scenario: Base neuve
- **WHEN** l'application se connecte pour la première fois à une base vide
- **THEN** la base contient le jeu de démonstration en version 1

### Requirement: Conflit entre deux postes
Le système SHALL refuser (409) une écriture faite sur une version périmée et SHALL renvoyer l'état le plus récent ; l'application SHALL alors afficher cet état et le toast « Un autre poste vient de modifier les données : l'affichage est à jour, refaites votre dernière opération si besoin. ».

#### Scenario: Deux postes enregistrent presque en même temps
- **WHEN** le poste B enregistre un retour après une écriture du poste A qu'il n'a pas encore reçue
- **THEN** l'écriture de B est refusée, B affiche l'état de A et le toast de conflit

#### Scenario: Retour sur l'onglet
- **WHEN** l'onglet redevient visible
- **THEN** l'application relit l'état du serveur et affiche les opérations faites ailleurs

### Requirement: Fonctionnement sans serveur
Le système SHALL continuer à fonctionner avec le seul stockage du navigateur quand l'API est injoignable ou qu'aucune base n'est reliée.

#### Scenario: API indisponible
- **WHEN** `/api/state` ne répond pas ou répond 503
- **THEN** toutes les opérations restent possibles et sont conservées dans le navigateur

### Requirement: Réinitialisation de la démo
Le système SHALL remettre les données de démonstration, ici et sur le serveur, via le bouton « Réinitialiser la démo », SHALL fermer la fiche ouverte, effacer le tampon de retour et afficher le toast « Données de démonstration rétablies. ».

#### Scenario: Après une démonstration
- **WHEN** l'utilisateur clique sur « Réinitialiser la démo » après avoir ajouté un livre et enregistré des retours
- **THEN** le catalogue revient à 10 titres et les prêts à leur état initial sur tous les postes
