# auth Specification

## Purpose
Permet d'ouvrir et fermer une session fictive sur le comptoir BiblioTech via un écran de connexion et d'inscription aux règles de validation identiques à la maquette, sans backend.

## Requirements

### Requirement: Écran d'authentification avant l'application
Le système SHALL afficher l'écran d'authentification (panneau de marque à gauche, formulaire à droite) tant qu'aucune session n'est ouverte, et le SHALL masquer au profit de l'application (barre latérale et zone principale) dès qu'une session est ouverte.

#### Scenario: Première visite
- **WHEN** l'application se charge sans session
- **THEN** seule la vue Connexion/Inscription est visible et la navigation principale est masquée

#### Scenario: Après connexion
- **WHEN** une connexion ou une inscription validée a ouvert la session
- **THEN** l'écran d'authentification est masqué et l'application (navigation + vue Catalogue) est affichée

### Requirement: Connexion avec identifiants fictifs
Le système SHALL accepter toute adresse e-mail au format valide et tout mot de passe d'au moins 6 caractères ; il SHALL refuser avec un message d'erreur sous le formulaire dans le cas contraire.

#### Scenario: Identifiants valides
- **WHEN** l'utilisateur saisit `nom@bibliotheque.ci` et `secret123` puis clique sur « Se connecter »
- **THEN** la session s'ouvre et la session affiche « Salimata D., comptoir 1 » et « Bibliothèque centrale »

#### Scenario: E-mail invalide
- **WHEN** l'utilisateur saisit un e-mail sans `@` et valide
- **THEN** le message « Saisissez une adresse e-mail valide. » apparaît et la session ne s'ouvre pas

#### Scenario: Mot de passe trop court
- **WHEN** l'e-mail est valide mais le mot de passe contient moins de 6 caractères
- **THEN** le message « Le mot de passe doit contenir au moins 6 caractères. » apparaît et la session ne s'ouvre pas

### Requirement: Inscription avec validations ordonnées
Le système SHALL valider le formulaire d'inscription dans l'ordre : nom de bibliothèque, nom complet, téléphone (10 chiffres, avec ou sans préfixe `+225`), e-mail, mot de passe (8 caractères minimum dont un chiffre), confirmation identique, conditions acceptées ; le premier message d'erreur en ordre SHALL être affiché et bloquer la création.

#### Scenario: Inscription valide
- **WHEN** tous les champs sont valides et la case des conditions est cochée
- **THEN** la session s'ouvre avec le nom complet saisi comme rôle « administrateur » et le nom de la bibliothèque comme espace

#### Scenario: Téléphone invalide
- **WHEN** le numéro ne correspond pas à 10 chiffres (avec ou sans `+225`)
- **THEN** le message « Numéro de téléphone invalide : 10 chiffres, avec ou sans +225. » apparaît

#### Scenario: Confirmation différente
- **WHEN** la confirmation du mot de passe diffère du mot de passe
- **THEN** le message « Les deux mots de passe ne correspondent pas. » apparaît

### Requirement: Bascule des onglets Connexion et Inscription
Le système SHALL basculer entre les formulaires Connexion et Inscription via les onglets et les liens (« Créer un compte », « Se connecter »), en réinitialisant les messages d'erreur à chaque changement.

#### Scenario: Depuis un lien du formulaire
- **WHEN** l'utilisateur clique sur « Nouvelle bibliothèque ? Créer un compte »
- **THEN** le formulaire d'inscription devient actif et le formulaire de connexion est masqué

### Requirement: Affichage et masquage du mot de passe
Le système SHALL basculer le type des champs mot de passe entre masqué et visible via le bouton (« Afficher »/« Masquer »).

#### Scenario: Révélation
- **WHEN** l'utilisateur clique sur « Afficher » à côté d'un mot de passe masqué
- **THEN** le texte devient lisible et le bouton affiche « Masquer »

### Requirement: Mot de passe oublié fictif
Le système SHALL afficher « Un lien de réinitialisation a été envoyé à <e-mail>. » si un e-mail valide est saisi, sinon « Saisissez votre e-mail ci-dessus pour recevoir le lien. » ; l'action SHALL ne jamais quitter la page.

#### Scenario: E-mail saisi et valide
- **WHEN** l'utilisateur clique sur « Mot de passe oublié ? » avec un e-mail valide dans le champ
- **THEN** le message de confirmation avec l'adresse apparaît sous le formulaire de connexion

### Requirement: Déconnexion et réinitialisation de l'écran
Le système SHALL fermer la session via « Se déconnecter » (ou l'entrée mobile « Déconnexion »), effacer le panneau de fiche ouvert, réinitialiser tous les champs d'authentification à leurs valeurs par défaut (y compris la case « Rester connecté » cochée, les mots de passe re-masqués et l'onglet Connexion actif) et afficher de nouveau l'écran d'authentification.

#### Scenario: Retour à l'écran de connexion
- **WHEN** l'utilisateur déconnecte après avoir rempli les formulaires
- **THEN** l'écran Connexion réapparaît vide, cocher « Rester connecté » par défaut et l'onglet Connexion est actif

### Requirement: Soumission au clavier
Le système SHALL soumettre le formulaire de connexion ou d'inscription lorsque l'utilisateur presse `Entrée` dans un de ses champs.

#### Scenario: Entrée dans un champ de connexion
- **WHEN** l'utilisateur presse `Entrée` dans l'e-mail de connexion
- **THEN** la tentative de connexion est déclenchée avec la même validation que le bouton

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
