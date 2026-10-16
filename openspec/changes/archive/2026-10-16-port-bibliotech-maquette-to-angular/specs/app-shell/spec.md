# Spec Delta

## Purpose

Fournit le châssis de l'application une fois connecté : barre latérale de navigation, zone principale, compteurs, notifications toast, identité affichée et adaptation aux petits écrans.

## ADDED Requirements

### Requirement: Barre latérale de navigation
Le système SHALL afficher une barre latérale sombre collante à gauche contenant le logo BiblioTech, sept entrées de navigation (Catalogue, Ajouter un livre, Emprunts et retours, Réservations, Pénalités, Statistiques, et « Déconnexion » visible uniquement sur petit écran) et un pied d'écran d'utilisateur.

#### Scenario: Structure de la barre
- **WHEN** l'application est ouverte sur un écran large
- **THEN** la barre occupe une colonne fixe de 224 px à gauche, sur toute la hauteur de la fenêtre

### Requirement: Activation de la vue courante
Le système SHALL afficher uniquement la section correspondant à l'entrée active, SHALL marquer cette entrée avec un fond plus clair, une bordure rouille et un libellé blanc, et SHALL refermer le panneau de fiche à chaque changement de section.

#### Scenario: Clic sur « Pénalités »
- **WHEN** l'utilisateur clique sur l'entrée « Pénalités »
- **THEN** seule la section Pénalités est visible, l'entrée est marquée active et la fiche éventuellement ouverte se referme

### Requirement: Compteurs de la navigation
Le système SHALL afficher à côté de « Emprunts et retours » le nombre de prêts en retard et à côté de « Réservations » le nombre de réservations actives ; les compteurs SHALL être vides (sans chiffre) quand leur valeur est nulle.

#### Scenario: Deux prêts en retard
- **WHEN** deux prêts ont une date de retour passée
- **THEN** l'entrée « Emprunts et retours » affiche « 2 » et « Réservations » affiche le nombre de demandes actives

### Requirement: Pied d'écran utilisateur et date
Le système SHALL afficher dans le pied de la barre le nom de session, son rôle/lieu, la date de référence du jeu de démonstration (« vendredi 16 octobre 2026 ») et un bouton « Se déconnecter » ; ce pied SHALL être masqué sur petit écran.

#### Scenario: Session connectée
- **WHEN** l'utilisateur est connecté sur un écran large
- **THEN** le pied montre le nom de session, « Bibliothèque centrale », la date fixe et le bouton de déconnexion

### Requirement: Notification toast
Le système SHALL afficher un toast sombre en bas à gauche (décalé de la barre latérale) pour chaque retour, réservation, encaissement ou ajout signalé, et le SHALL masquer automatiquement après environ 4 secondes ; un nouveau toast SHALL remplacer le précédent.

#### Scenario: Retour enregistré
- **WHEN** un retour sans retard est enregistré
- **THEN** le toast affiche « Retour enregistré, sans retard. » puis disparaît sans intervention

### Requirement: Adaptation aux petits écrans
Le système SHALL basculer sous 900 px en empilement (barre horizontale défilante au-dessus du contenu, compteurs de pied masqués, panneau pleine largeur, toast à 16 px du bord) et sous 560 px en colonne unique pour les lignes de formulaires ; les transitions SHALL être neutralisées si l'utilisateur préfère les animations réduites.

#### Scenario: Navigation mobile
- **WHEN** la fenêtre fait 560 px de large
- **THEN** les entrées de navigation défilent horizontalement, l'entrée active est soulignée de rouille et le contenu passe en une colonne

### Requirement: Fermeture du panneau par clavier
Le système SHALL fermer la fiche ouverte lorsque l'utilisateur presse `Échap`.

#### Scenario: Échap
- **WHEN** la fiche d'un livre est ouverte et l'utilisateur presse `Échap`
- **THEN** le panneau et son voile se referment
