# Spec Delta

## MODIFIED Requirements

### Requirement: Pied d'écran utilisateur et date
Le système SHALL afficher dans le pied de la barre le nom de session, son rôle/lieu, la date de référence du jeu de démonstration (« vendredi 16 octobre 2026 »), un indicateur de sauvegarde (« Données partagées sur le serveur » avec une pastille verte quand le dernier échange avec l'API a réussi, « Données gardées dans ce navigateur » sinon), un bouton « Se déconnecter » et un bouton « Réinitialiser la démo » ; ce pied SHALL être masqué sur petit écran.

#### Scenario: Session connectée
- **WHEN** l'utilisateur est connecté sur un écran large
- **THEN** le pied montre le nom de session, « Bibliothèque centrale », la date fixe, l'indicateur de sauvegarde et les deux boutons

#### Scenario: Base reliée
- **WHEN** l'API a répondu avec succès
- **THEN** l'indicateur affiche « Données partagées sur le serveur »
