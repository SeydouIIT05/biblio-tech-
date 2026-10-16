# Spec Delta

## ADDED Requirements

### Requirement: Pictogramme de situation
Le système SHALL afficher devant chaque situation de règlement un pictogramme de sa couleur : une horloge pour « Non rendu, le montant augmente », une coche pour « Réglée », une pièce pour « À encaisser ».

#### Scenario: Prêt rendu non réglé
- **WHEN** un prêt rendu en retard n'est pas encore encaissé
- **THEN** sa situation « À encaisser » est précédée d'une pièce bleue
