# Spec Delta

## ADDED Requirements

### Requirement: API de comptes
Le système SHALL exposer `POST /api/auth/signup` (201 `{ token, user, place }`, 409 si l'adresse existe, 400 si une validation échoue), `POST /api/auth/login` (200 `{ token, user, place }`, 401 si les identifiants sont faux, 429 après 10 échecs en 15 minutes) et `POST /api/auth/logout` (204).

#### Scenario: Connexion acceptée
- **WHEN** `POST /api/auth/login` reçoit l'e-mail et le mot de passe d'un compte
- **THEN** la réponse 200 contient un jeton, « <Nom>, administrateur » et le nom de la bibliothèque

### Requirement: Protection des mots de passe et des sessions
Le système SHALL hacher les mots de passe avec `scrypt` et un sel aléatoire, et SHALL enregistrer les sessions dans Redis sous l'empreinte SHA-256 du jeton, avec une expiration de 30 jours (« Rester connecté ») ou d'un jour.

#### Scenario: Mot de passe protégé
- **WHEN** un compte est créé
- **THEN** la base ne contient que l'empreinte `scrypt` du mot de passe, jamais le mot de passe lui-même

#### Scenario: Déconnexion
- **WHEN** l'utilisateur se déconnecte
- **THEN** le jeton est supprimé et tout appel suivant avec ce jeton reçoit 401

## MODIFIED Requirements

### Requirement: API d'état partagé
Le système SHALL exposer `GET /api/state`, qui renvoie `{ version, data }` de la bibliothèque du compte connecté (`data` vaut `null` tant que rien n'est enregistré), et `PUT /api/state` avec `{ version, data }`, qui enregistre l'état de cette bibliothèque et renvoie la nouvelle version. Chaque appel SHALL porter `Authorization: Bearer <jeton>` ; sans jeton valide, l'API SHALL répondre 401. L'API SHALL refuser un corps invalide (400), un état de plus de 3 Mo (413), toute autre méthode (405), et SHALL répondre 503 quand aucune base n'est reliée au projet.

#### Scenario: Enregistrement réussi
- **WHEN** un poste connecté envoie `PUT /api/state` avec la version qu'il a lue
- **THEN** l'état de sa bibliothèque est enregistré dans Upstash Redis et la réponse contient la version suivante

#### Scenario: Bibliothèques séparées
- **WHEN** deux comptes différents enregistrent des opérations
- **THEN** chacun ne voit que les données de sa propre bibliothèque

#### Scenario: Sans jeton
- **WHEN** `GET /api/state` est appelé sans en-tête `Authorization`
- **THEN** la réponse est 401

### Requirement: Données de démonstration au premier chargement
Le système SHALL déposer dans chaque nouvelle bibliothèque les données de démonstration de la maquette (8 adhérents, 10 titres, 17 exemplaires, 10 prêts, 4 réservations), puis SHALL afficher l'état du serveur à chaque connexion et à chaque chargement.

#### Scenario: Base neuve
- **WHEN** un administrateur vient de créer son compte
- **THEN** sa bibliothèque contient le jeu de démonstration en version 1

### Requirement: Fonctionnement sans serveur
Le système SHALL exiger le serveur pour se connecter et créer un compte ; une fois connecté, il SHALL continuer à fonctionner avec le stockage du navigateur quand l'API devient injoignable.

#### Scenario: API indisponible
- **WHEN** `/api/state` ne répond plus pendant une session ouverte
- **THEN** toutes les opérations restent possibles et sont conservées dans le navigateur
