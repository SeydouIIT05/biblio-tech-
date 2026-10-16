# Spec Delta

## ADDED Requirements

### Requirement: Session conservée au rechargement
Le système SHALL conserver la session et l'onglet ouvert au rechargement : dans le `localStorage` quand « Rester connecté » est coché (la session survit à la fermeture du navigateur), dans le `sessionStorage` sinon (elle dure jusqu'à la fermeture). La déconnexion SHALL effacer la session des deux stockages sans toucher aux données.

#### Scenario: Rechargement avec « Rester connecté »
- **WHEN** l'utilisateur se connecte avec la case cochée, ouvre Pénalités puis recharge la page
- **THEN** il reste connecté et la vue Pénalités est affichée

#### Scenario: Navigateur fermé sans « Rester connecté »
- **WHEN** l'utilisateur s'est connecté case décochée puis rouvre le navigateur
- **THEN** l'écran de connexion s'affiche

#### Scenario: Pas de clignotement
- **WHEN** une session est enregistrée et la page se charge
- **THEN** l'écran de connexion n'apparaît à aucun moment avant l'application
