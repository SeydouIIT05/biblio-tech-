# Spec Delta

## MODIFIED Requirements

### Requirement: Configuration Vercel minimale
Le projet DOIT inclure un fichier `vercel.json` à la racine précisant `buildCommand`, `outputDirectory`, `framework: "angular"` et un `rewrites` redirigeant vers `/index.html` toutes les routes inconnues sauf celles de l'API (`/api/*`), qui SHALL atteindre les fonctions Vercel du dossier `api/`.

#### Scenario: Configuration Vercel présente et cohérente
- **WHEN** `vercel.json` existe à la racine du projet
- **THEN** il contient `buildCommand: "npm run build"`
- **THEN** il contient `outputDirectory: "dist/BiblioTech/browser"`
- **THEN** il contient `framework: "angular"`
- **THEN** il contient une règle `rewrites` `{ "source": "/((?!api/).*)", "destination": "/index.html" }`

#### Scenario: Appel de l'API
- **WHEN** le navigateur appelle `/api/state`
- **THEN** la requête est traitée par la fonction `api/state.mjs` et non par `index.html`
