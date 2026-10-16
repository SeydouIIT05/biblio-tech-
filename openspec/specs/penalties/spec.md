# penalties Specification

## Purpose
Permet de calculer, afficher et encaisser les pénalités de retard des prêts, selon les règles tarifaires du comptoir.

## Requirements

### Requirement: Cartouches de règles
Le système SHALL afficher au-dessus du tableau trois cartouches : « 14 jours » de prêt par livre, « 100 FCFA » par jour de retard, « 3 jours » pour retirer un livre réservé.

#### Scenario: Affichage des règles
- **WHEN** l'onglet Pénalités est ouvert
- **THEN** les trois cartouches de règles sont visibles au-dessus du tableau

### Requirement: Sous-titre des pénalités
Le système SHALL afficher le tarif (100 FCFA par jour de retard), le total à encaisser (prêts rendus non réglés), le montant en cours de calcul (prêts non rendus) et le seuil de blocage (500 FCFA impayés).

#### Scenario: Deux montants distincts
- **WHEN** un prêt rendu reste impayé et qu'un autre est en cours de retard
- **THEN** le sous-titre distingue le montant à encaisser du montant en cours de calcul

### Requirement: Calcul de la pénalité
Le système SHALL calculer le retard en jours entre la date d'échéance et la date de retour (ou la date de référence si non rendu), jamais négatif, et la pénalité = jours de retard × 100 FCFA.

#### Scenario: Prêt non rendu de 20 jours
- **WHEN** un prêt a 20 jours de retard et n'est pas rendu
- **THEN** sa pénalité affichée est de 2 000 FCFA

### Requirement: Tri et colonnes du tableau
Le système SHALL lister les prêts avec pénalité, impayés d'abord puis par montant décroissant, avec adhérent (nom + carte), titre, retard en jours, montant, situation et bouton « Encaisser » réservé aux prêts rendus non réglés.

#### Scenario: Situation d'un prêt non rendu
- **WHEN** un prêt en retard n'est pas encore rendu
- **THEN** sa situation est « Non rendu, le montant augmente » en ocre et aucun bouton d'encaissement n'apparaît

### Requirement: Statuts de règlement
Le système SHALL afficher « Réglée » en vert pour un prêt encaissé, « À encaisser » en bleu pour un prêt rendu non réglé, « Non rendu, le montant augmente » en ocre sinon.

#### Scenario: Après encaissement
- **WHEN** un prêt est encaissé
- **THEN** sa situation devient « Réglée » et son bouton disparaît

### Requirement: Encaissement
Le système SHALL marquer le prêt comme réglé via « Encaisser » et confirmer par un toast « X FCFA encaissés auprès de <adhérent>. » ; le total à encaisser du sous-titre SHALL diminuer d'autant.

#### Scenario: Encaissement complet
- **WHEN** l'utilisateur encaisse une pénalité de 300 FCFA
- **THEN** le toast confirme 300 FCFA au nom de l'adhérent et cette pénalité n'est plus dans le total à encaisser

### Requirement: Blocage du prêt au seuil
Un adhérent atteignant 500 FCFA de pénalités impayées SHALL être refusé à l'enregistrement d'un nouveau prêt (voir capacité `loans`) tant que le montant reste atteint.

#### Scenario: Seuil atteint
- **WHEN** l'impayé d'un adhérent atteint 500 FCFA
- **THEN** tout nouveau prêt à son nom est refusé jusqu'à encaissement

### Requirement: Pictogramme de situation
Le système SHALL afficher devant chaque situation de règlement un pictogramme de sa couleur : une horloge pour « Non rendu, le montant augmente », une coche pour « Réglée », une pièce pour « À encaisser ».

#### Scenario: Prêt rendu non réglé
- **WHEN** un prêt rendu en retard n'est pas encore encaissé
- **THEN** sa situation « À encaisser » est précédée d'une pièce bleue
