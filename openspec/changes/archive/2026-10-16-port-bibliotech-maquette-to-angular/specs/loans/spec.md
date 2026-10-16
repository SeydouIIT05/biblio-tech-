# Spec Delta

## Purpose

Permet d'enregistrer les prêts au comptoir et d'y rattacher les retours, avec les règles de durée, de blocage et de tampon de date de retour.

## ADDED Requirements

### Requirement: Sous-titre des emprunts
Le système SHALL afficher sous le titre le nombre de prêts en cours, dont le nombre en retard, ainsi que la durée de prêt (14 jours).

#### Scenario: Deux retards
- **WHEN** deux prêts sur six sont échus
- **THEN** le sous-titre indique « 6 prêts en cours, dont 2 en retard. Durée de prêt : 14 jours. »

### Requirement: Validation d'un nouveau prêt
Le système SHALL valider un prêt dans l'ordre : carte adhérent connue, cote présente au catalogue, pénalités impayées inférieures à 500 FCFA, exemplaire disponible ou réservation prête de l'adhérent ; le premier refus SHALL s'afficher dans le message de statut sans créer de prêt.

#### Scenario: Carte inconnue
- **WHEN** la carte saisie n'existe pas
- **THEN** le message « Carte adhérent inconnue. » s'affiche et aucun prêt n'est créé

#### Scenario: Blocage pour pénalités
- **WHEN** l'adhérent doit 500 FCFA ou plus de pénalités impayées
- **THEN** un message de blocage indique le montant et renvoie vers l'onglet Pénalités

#### Scenario: Aucun exemplaire libre
- **WHEN** le livre est entièrement prêté et l'adhérent n'a pas de réservation prête pour ce titre
- **THEN** le message « Aucun exemplaire disponible. Enregistrez une réservation depuis le catalogue. » s'affiche

### Requirement: Enregistrement du prêt et tampon de retour
Sur un prêt accepté, le système SHALL créer un prêt dû 14 jours plus tard que la date de référence, SHALL vider les deux champs, SHALL remplacer le cadre d'attente par un tampon rouge incliné indiquant « À rendre avant le », la date, le titre et l'adhérent, et SHALL honorer la réservation prête de l'adhérent le cas échéant.

#### Scenario: Prêt enregistré
- **WHEN** carte et cote sont valides avec un exemplaire disponible
- **THEN** le tampon affiche la date d'échéance (14 jours) avec le titre et l'adhérent, et le prêt figure dans la liste

### Requirement: Liste des prêts en cours
Le système SHALL lister les prêts non rendus par échéance croissante avec adhérent (nom + carte), titre, date d'emprunt (échéance − 14 jours), date d'échéance et état d'échéance : « Retard de N j » en rouge si passé, « Aujourd'hui » si aujourd'hui, sinon « dans N j ».

#### Scenario: Prêt du jour
- **WHEN** l'échéance du prêt est la date de référence
- **THEN** la colonne Échéance affiche « Aujourd'hui » en ocre

### Requirement: Enregistrement d'un retour
Le système SHALL enregistrer le retour via le bouton « Enregistrer le retour » : le prêt est clôturé à la date de référence, un toast annonce « Retour enregistré, sans retard. » ou, si en retard, « Retour enregistré. Pénalité de X FCFA pour <adhérent>. » avec X = jours de retard × 100.

#### Scenario: Retour tardif
- **WHEN** un prêt rendu 9 jours après l'échéance est retourné
- **THEN** le toast annonce une pénalité de 900 FCFA au nom de l'adhérent

### Requirement: Promotion d'une réservation au retour
Lors d'un retour, le système SHALL promouvoir la réservation en attente la plus ancienne pour ce livre si un exemplaire est redevenu libre ; le toast SHALL alors annoncer la réservation prête avec sa date limite de retrait (3 jours après).

#### Scenario: File d'attente
- **WHEN** un exemplaire rendu libère la place et qu'une réservation est en attente
- **THEN** la réservation passe à l'état prêt et le toast annonce « Réservation de <adhérent> prête, à retirer avant le <date>. »
