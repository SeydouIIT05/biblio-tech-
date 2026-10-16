# reservations Specification

## Purpose
Permet de suivre la file des réservations : rang, retrait au comptoir, expiration et annulation avec remise en file des suivantes.

## Requirements

### Requirement: Sous-titre des réservations
Le système SHALL afficher le nombre de demandes actives, dont le nombre à retirer au comptoir, suivi de la règle « Un exemplaire rendu est gardé 3 jours. »

#### Scenario: Une prête sur trois
- **WHEN** deux réservations attendent et une est prête
- **THEN** le sous-titre indique « 3 demandes actives, dont 1 à retirer au comptoir. Un exemplaire rendu est gardé 3 jours. »

### Requirement: Liste des réservations actives
Le système SHALL lister les réservations en attente et prêtes avec rang, adhérent (nom + carte), titre, date de demande, situation et bouton « Annuler » ; les réservations annulées ou honorées SHALL être exclues.

#### Scenario: Vue d'ensemble
- **WHEN** des réservations actives existent
- **THEN** chaque ligne montre l'adhérent, le livre, la date de demande et soit « En attente, tous les exemplaires sont prêtés », soit « À retirer avant le <date> » en vert

### Requirement: Rang dans la file
Le système SHALL afficher « — » pour une réservation prête, sinon le rang du demandeur parmi les réservations en attente du même livre, ordonnées par date de demande.

#### Scenario: Deuxième de la file
- **WHEN** deux réservations en attente portent sur le même livre et la demande est la plus récente
- **THEN** son rang affiché est 2

### Requirement: Expiration du retrait
Une réservation prête SHALL comporter une date limite de retrait de 3 jours après son activation ; la situation affichée SHALL mentionner cette date.

#### Scenario: Activation le jour de référence
- **WHEN** une réservation est promue prête à la date de référence
- **THEN** son échéance de retrait est fixée à 3 jours plus tard et affichée dans sa ligne

### Requirement: Annulation d'une réservation
Le système SHALL annuler une réservation via « Annuler » : elle quitte la file, un toast annonce « Réservation annulée. » et, si elle était prête, une réservation en attente suivante pour ce livre SHALL être promue dès qu'un exemplaire est libre.

#### Scenario: Annulation d'une réservation prête
- **WHEN** l'utilisateur annule une réservation à retirer alors qu'un exemplaire est libre
- **THEN** la réservation suivante de la file est promue et le toast annonce l'annulation

### Requirement: Liste vide
Quand aucune réservation n'est active, le système SHALL afficher « Aucune réservation en cours. » à la place des lignes.

#### Scenario: File vide
- **WHEN** toutes les réservations sont annulées ou honorées
- **THEN** le tableau montre le message d'état vide
