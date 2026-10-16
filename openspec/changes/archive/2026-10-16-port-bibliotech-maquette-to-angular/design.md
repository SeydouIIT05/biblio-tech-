# Design

## Context

`src/bibliotech.html` est une maquette autonome (≈ 38 Ko) : un bloc `<style>` global, un DOM unique et un script vanilla avec un état global mutable (`B`, `L`, `R`, `M`, `T = 16 octobre 2026`) et des fonctions de rendu `rCat/rEmp/rRes/...` relançées par `all()`. Le dépôt est un squelette Angular 21 SSR (`outputMode: server`, hydratation activée) quasi vide : `app.html` contient encore la page de démonstration Angular, `app.routes.ts` est vide, aucun composant métier. Voir proposal.md pour le motif ; les exigences de comportement sont dans `specs/`.

Contraintes qui façonnent l'approche : fidélité absolue au design (l'utilisateur exige « exactement le même design et aucune différence »), budget de style Angular (`anyComponentStyle` : 4 ko avertissement / 8 ko erreur — le CSS de la maquette fait ≈ 8 ko au total), SSR/hydratation sans erreur, aucune donnée persistante ni backend.

## Goals / Non-Goals

**Goals:**

- Reproduire le DOM, le CSS et le comportement de la maquette avec des composants Angular standalone et des signaux.
- Extraire la logique métier (disponibilités, statuts, pénalités, promotions, validations) dans du code testable, avec des résultats identiques à ceux du script de la maquette.
- Garantir un rendu serveur/hydratation stable (données de démo et date de référence déterministes).

**Non-Goals:**

- Déploiement Vercel (étape séparée), backend, persistance, authentification réelle.
- Refonte du design, ajouts de fonctionnalités, changement des textes ou des règles métier.
- Introduction de routes/URLs par vue (voir décisions).

## Decisions

**D1 — Découpage composants : racine = châssis de la maquette, vues = composants enfants.**
`App` conserve dans son propre template les éléments structurels identiques à la maquette (`aside`, `main`, sprite SVG, `#bd`, `#pan`, `#toast`) et rend `Auth` si déconnecté, sinon la vue courante (`Catalogue`, `AddBook`, `Loans`, `Reservations`, `Penalties`, `Statistics`) commutée par un signal `view`. Composants secondaires : `BookPanel` (fiche), `Cover` (couverture image/générée, variantes vignette/aperçu), formulaires d'authentification. État partagé : `LibraryStore` (signaux : adhérents, livres, prêts, réservations, session, vue, sélection, toast) + `rules.ts` (fonctions pures) + `demo-data.ts` (jeu `M/B/L/R`, constantes `T=2026-10-16`, `P=14`, `TARIF=100`, `BLOQUE=500`).
*Alternatives écartées* : un composant par vue avec son propre état (duplication des dérivés et des compteurs) ; NgRx/dépendance d'état externe (lourd pour un état mémoire unique, non requis).

**D2 — Navigation par signal `view`, sans routes par vue.**
Les six sections commutent exactement comme dans la maquette (clic nav → section affichée, fiche fermée), sans changer l'URL et sans entrée d'historique. `provideRouter` reste configuré avec des routes vides (configuration du squelette conservée, `<router-outlet/>` retiré du template) ; l'entrée dans l'historique ne change pas de vue, comme dans la maquette.
*Alternatives écartées* : un chemin Angular par vue — introduit des URLs et un bouton « retour » absents de la maquette (différence observable) ; garde d'authentification par route — inutile avec un état de session local. Une navigation par URL pourra être ajoutée dans un changement ultérieur sans toucher aux specs métier.

**D3 — CSS global unique, copié verbatim ; adaptation minimale des sélecteurs structurels.**
Tout le bloc `<style>` de la maquette est déplacé tel quel dans `src/styles.css` (sélecteurs `body`, `aside`, `main`, `#pan`, médias queries… conservés à l'identique), les composants ne déclarant aucun style (ou uniquement des styles purement locaux non couvrants). Deux ajustements structurels, sans effet visuel : `app-root { display: contents }` pour que les enfants de `App` restent des éléments de grille du `body` (la maquette attachait `aside`/`main` directement au `body`), et le maintien de la classe `body.in` (bascule via un `effect` sur la session) pour que les règles `body{display:grid}` / `body:not(.in){display:block}` continuent de s'appliquer à l'identique. Les règles `body.in #auth` et `body:not(.in) aside/main` deviennent mortes avec le rendu `@if` de la session et sont neutralisées sans changer l'apparence. Les `<section hidden>` de la maquette sont remplacés par le rendu conditionnel `@if` de la vue courante (mêmes éléments visibles). Les `id` uniques de la maquette (`#pan`, `#toast`, `#bd`, `#auth`) sont conservés tels quels.
*Alternatives écartées* : styles par composant avec encapsulation — réécriture des sélecteurs (risque d'écart visuel) et dépassement quasi certain du budget `anyComponentStyle` de 8 ko ; adapter les sélecteurs `body` vers `:host` — plus de modifications, donc plus de risque, sans gain.

**D4 — Entrées de formulaire contrôlées par signaux, validations impératives copiées.**
Les champs sont pilotés par des signaux (`[value]`/`(input)`, `[checked]`/`(change)`, `(change)` pour le fichier), sans `FormsModule` ni validateurs Angular : les messages et l'**ordre** des contrôles sont repris mot pour mot du script (`login()`, `signup()`, `ab-go`, `loan()`) dans des fonctions pures testées. Le texte injecté par `esc()` dans la maquette est simplement interpolé (échappement automatique d'Angular), sauf pour les images de couverture (voir risques).
*Alternatives écartées* : validateurs Angular — ordre et messages différents de ceux de la maquette ; `ngModel` — double source de vérité entre DOM et signaux.

**D5 — Rendu serveur/hydratation déterministe.**
Session initialement fermée côté serveur et client ; données de démo et date de référence figées (jamais `Date.now()` dans le rendu) ; timers de toast et `scrollTo` déclenchés uniquement par des interactions utilisateur (jamais pendant le rendu serveur) ; aucun accès direct à `document`/`window` dans le corps des composants (classe `body.in` posée par un `effect` côté navigateur, lecture de fichier via événement `change`).
*Alternatives écartées* : marquer l'application entière non hydratée (perte de l'hydratation du squelette).

**D6 — Logique métier en fonctions pures, recalcul réactif par signaux computed.**
`rules.ts` reprend les fonctions de la maquette (`avail`, `status`, `late`, `fine`, `unpaid`, `promote`, dates `d()`, FCFA `fr()`) avec les mêmes formules. Les dérivés visibles (compteurs de nav, sous-titres, totaux, listes filtrées) sont des `computed()` sur les signaux du store : toute mutation (ajout, prêt, retour, encaissement) met à jour les vues, comme le faisait `all()`.
*Alternatives écartées* : recopier les fonctions dans chaque vue (duplication, divergences possibles).

**D7 — Images de couverture via `background-image` avec style de confiance.**
Le markup `<div class="cv" style="background-image:url('...')">` est reproduit avec un binding `[style.background-image]` alimenté par `DomSanitizer.bypassSecurityTrustStyle` (URL de démonstration ou data-URL produite par l'utilisateur lui-même via `FileReader`), les couleurs générées restant liées en clair (`[style.background-color]`).

**D8 — Tests.**
Vitest (configuration existante, `ng test`) : unitaires de `rules.ts` (disponibilité, statuts, pénalités, promotion), des validations (`login`, `signup`, ajout, prêt) et d'intégration légère de `App` (bascule session/vue). `app.spec.ts` du squelette est remplacé. Vérification visuelle : ouvrir `src/bibliotech.html` et l'app côte à côte pour comparer les vues, états vides, toasts, panneaux et points de rupture (1280, 900, 560 px).

## Risks / Trade-offs

- [Écart CSS involontaire lors du déplacement du CSS] → copie verbatim sans reformatage, comparaison visuelle systématique contre `src/bibliotech.html` (conservé comme référence), aucun renommage de classes.
- [Sélecteurs `body` vs imbrication Angular (`app-root`)] → `app-root{display:contents}` + maintien de `body.in` : les règles globales restent valables ; vérifier le rendu de la grille avant/après chaque vue.
- [Coupure d'hydratation (état serveur ≠ client)] → état initial identique de part et d'autre (session fermée, données figées, date fixe) ; pas d'API ni d'horloge dans le rendu.
- [Sanitisation Angular des data-URL en `background-image`] → `bypassSecurityTrustStyle` limité aux images de couverture (source : jeu de démo ou fichier local de l'utilisateur) ; aucun contenu tiers non maîtrisé.
- [Budget de styles composant dépassé] → D3 : styles globaux uniquement ; vérifier `ng build` (budgets inchangés).
- [`display:contents` sur `app-root` : comportement d'accessibilité historiquement discutable] → élément personnalisé non sémantique sans rôle, risque résiduel nul pour l'usage ; alternative documentée : poser la grille directement sur `app-root` si un problème d'AT est détecté.
- [Comportements purement DOM de la maquette (focus du bouton de fermeture du panneau, `Échap`, `Entrée`)] → reproductibles via les écouteurs Angular standard (`(keydown.document)`, `focus()` après rendu) ; à vérifier manuellement.

## Migration Plan

Aucune donnée utilisateur à migrer. Déploiement incrémental par commits : (1) styles globaux + `index.html` (titre, `lang="fr"`, polices Google) ; (2) store/règles/données de démo + `App` (session, sprite, structure `aside/main`) ; (3) vue Catalogue + panneau + couvertures ; (4) Ajouter, Emprunts, Réservations, Pénalités, Statistiques ; (5) tests et nettoyage de la page de démonstration Angular. Rollback : révert des commits (le squelette Angular reste fonctionnel à chaque étape car `bibliotech.html` n'est jamais modifié). Critère d'acceptation : chaque vue comparée à la maquette avant de passer à la suivante.

## Open Questions

- L'introduction éventuelle d'une navigation par URL (routes par vue) relèvera d'un changement ultérieur ; elle n'est pas requise par les specs actuelles et ne doit pas modifier le comportement décrit ici.
