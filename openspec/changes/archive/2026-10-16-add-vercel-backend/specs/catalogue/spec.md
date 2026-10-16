# Spec Delta

## ADDED Requirements

### Requirement: Pictogramme de statut
Le système SHALL afficher devant chaque statut de livre (tableau, mosaïque, fiche) un pictogramme de la couleur du statut : une coche pour « Disponible », un marque-page pour « Réservé », deux flèches d'échange pour « Emprunté ».

#### Scenario: Catalogue au repos
- **WHEN** le catalogue s'affiche en vue tableau
- **THEN** « Une si longue lettre » montre une coche verte devant « Disponible » et « Les Soleils des indépendances » un marque-page ocre devant « Réservé »
