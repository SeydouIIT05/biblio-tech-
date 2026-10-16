# Spec Delta

## ADDED Requirements

### Requirement: Connexion avec un compte
Le système SHALL vérifier côté serveur l'adresse e-mail (sans tenir compte de la casse) et le mot de passe du compte ; en cas d'échec il SHALL afficher « E-mail ou mot de passe incorrect. » sous le formulaire, et après 10 échecs en 15 minutes pour une adresse il SHALL refuser les tentatives avec « Trop de tentatives : réessayez dans 15 minutes. ». Le bouton SHALL être désactivé et afficher « Connexion… » pendant l'appel.

#### Scenario: Identifiants valides
- **WHEN** l'utilisateur saisit l'e-mail et le mot de passe d'un compte existant puis clique sur « Se connecter »
- **THEN** la session s'ouvre avec le nom de l'administrateur et le nom de sa bibliothèque, et ses données sont chargées

#### Scenario: Mauvais mot de passe
- **WHEN** le mot de passe ne correspond pas au compte
- **THEN** le message « E-mail ou mot de passe incorrect. » apparaît et la session ne s'ouvre pas

#### Scenario: Serveur injoignable
- **WHEN** le serveur ne répond pas
- **THEN** le message « Serveur injoignable : vérifiez la connexion puis réessayez. » apparaît

#### Scenario: E-mail invalide
- **WHEN** l'utilisateur saisit un e-mail sans `@` et valide
- **THEN** le message « Saisissez une adresse e-mail valide. » apparaît sans appel au serveur

### Requirement: Mot de passe oublié
Le système SHALL afficher « Contactez l'administrateur de votre bibliothèque pour réinitialiser votre mot de passe. » au clic sur « Mot de passe oublié ? », sans quitter la page ni annoncer d'envoi d'e-mail.

#### Scenario: Clic sur le lien
- **WHEN** l'utilisateur clique sur « Mot de passe oublié ? »
- **THEN** le message renvoyant vers l'administrateur apparaît sous le formulaire

## MODIFIED Requirements

### Requirement: Inscription avec validations ordonnées
Le système SHALL valider le formulaire d'inscription dans l'ordre : nom de bibliothèque, nom complet, téléphone (10 chiffres, avec ou sans préfixe `+225`), e-mail, mot de passe (8 caractères minimum dont un chiffre), confirmation identique, conditions acceptées ; le premier message d'erreur en ordre SHALL être affiché et bloquer la création. Le serveur SHALL refaire ces validations, créer le compte administrateur et l'espace de sa bibliothèque (nom, type, ville), et refuser une adresse déjà utilisée avec « Un compte existe déjà avec cette adresse e-mail. ».

#### Scenario: Inscription valide
- **WHEN** tous les champs sont valides et la case des conditions est cochée
- **THEN** le compte est créé, la session s'ouvre avec le nom complet saisi comme rôle « administrateur » et le nom de la bibliothèque comme espace, et la bibliothèque contient les données de démonstration

#### Scenario: Adresse déjà inscrite
- **WHEN** un compte existe déjà avec la même adresse, quelle que soit la casse
- **THEN** le message « Un compte existe déjà avec cette adresse e-mail. » apparaît et aucune session ne s'ouvre

#### Scenario: Téléphone invalide
- **WHEN** le numéro ne correspond pas à 10 chiffres (avec ou sans `+225`)
- **THEN** le message « Numéro de téléphone invalide : 10 chiffres, avec ou sans +225. » apparaît

#### Scenario: Confirmation différente
- **WHEN** la confirmation du mot de passe diffère du mot de passe
- **THEN** le message « Les deux mots de passe ne correspondent pas. » apparaît

### Requirement: Session conservée au rechargement
Le système SHALL conserver la session, son jeton et l'onglet ouvert au rechargement : dans le `localStorage` quand « Rester connecté » est coché (jeton valable 30 jours), dans le `sessionStorage` sinon (jeton valable 1 jour, session fermée avec le navigateur). Un jeton refusé par le serveur SHALL ramener à l'écran de connexion avec « Votre session a expiré : reconnectez-vous. ». La déconnexion SHALL fermer la session sur le serveur, effacer la session des deux stockages et effacer les données du compte de ce poste.

#### Scenario: Rechargement avec « Rester connecté »
- **WHEN** l'utilisateur se connecte avec la case cochée, ouvre Pénalités puis recharge la page
- **THEN** il reste connecté et la vue Pénalités est affichée

#### Scenario: Navigateur fermé sans « Rester connecté »
- **WHEN** l'utilisateur s'est connecté case décochée puis rouvre le navigateur
- **THEN** l'écran de connexion s'affiche

#### Scenario: Session expirée
- **WHEN** le serveur refuse le jeton enregistré
- **THEN** l'écran de connexion s'affiche avec le message de session expirée

#### Scenario: Pas de clignotement
- **WHEN** une session est enregistrée et la page se charge
- **THEN** l'écran de connexion n'apparaît à aucun moment avant l'application

## REMOVED Requirements

### Requirement: Connexion avec identifiants fictifs
**Reason**: la connexion est désormais vérifiée par le serveur avec de vrais comptes.
**Migration**: créer un compte depuis l'onglet « Inscription », puis se connecter avec ses identifiants.

### Requirement: Mot de passe oublié fictif
**Reason**: annoncer un e-mail de réinitialisation qui n'est jamais envoyé induisait en erreur.
**Migration**: remplacé par « Mot de passe oublié », qui renvoie vers l'administrateur de la bibliothèque.
