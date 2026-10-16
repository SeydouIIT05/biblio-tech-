# Spec Delta

## MODIFIED Requirements

### Requirement: Pied d'écran utilisateur et date
Le système SHALL afficher dans le pied de la barre le nom et le rôle de l'administrateur connecté, le nom de sa bibliothèque, la date de référence du jeu de démonstration (« vendredi 16 octobre 2026 »), un bouton « Se déconnecter » et un bouton « Réinitialiser la démo » ; ce pied SHALL être masqué sur petit écran.

#### Scenario: Session connectée
- **WHEN** l'utilisateur est connecté sur un écran large
- **THEN** le pied montre « <Nom>, administrateur », le nom de la bibliothèque, la date fixe et les deux boutons

#### Scenario: Base reliée
- **WHEN** l'API a répondu avec succès
- **THEN** aucun indicateur de sauvegarde n'est affiché : l'enregistrement se fait sans action de l'utilisateur
