# ODC Academy — Frontend

Interface web de la plateforme ODC Academy, développée avec Angular standalone, TypeScript et Tailwind CSS. Elle communique avec l’API Spring Boot du projet.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Configuration des environnements](#configuration-des-environnements)
- [Structure du projet](#structure-du-projet)
- [Rôles et navigation](#rôles-et-navigation)
- [Tests et build](#tests-et-build)
- [Déploiement](#déploiement)
- [Dépannage](#dépannage)

## Fonctionnalités

- Catalogue public des formations avec images, recherche et filtres par catégorie.
- Écrans de connexion, inscription apprenant, authentification Google facultative et réinitialisation de mot de passe.
- Espaces pour les rôles **ADMIN**, **FORMATEUR** et **APPRENANT**.
- Gestion des formations, catégories, utilisateurs, inscriptions et apparence pour l’administration.
- Cours, leçons, documents PDF, vidéos, quiz, devoirs et suivi pédagogique.
- Lecture des PDF dans le lecteur intégré ; DOCX/PPTX sont téléchargeables.
- Profil utilisateur modifiable et photo de profil.
- Forums, messagerie et séances en direct Jitsi.
- En-tête fixe avec navigation par catégories et menus de profil.

## Prérequis

- Node.js 22.22.3 ou ultérieur.
- npm 11.19.0 (version déclarée par le projet) ou compatible.
- API ODC Academy démarrée ; en développement local, l’URL attendue par défaut est `http://localhost:8000`.

## Installation et lancement

Depuis le dossier frontend :

```powershell
npm ci
npm start
```

Ouvrez [http://localhost:4200](http://localhost:4200). La commande `npm start` lance Angular CLI avec le proxy configuré dans `proxy.conf.json`. La configuration de l’application dans `src/environments/environment.ts` pointe vers `http://localhost:8000/api/v1`.

Pour que l’application complète fonctionne, démarrez également PostgreSQL et le backend. Le démarrage du backend est documenté dans le [README Backend](../../ODC-Academy-Back/README.md).

## Configuration des environnements

Les URLs et paramètres utilisés par le frontend se trouvent dans :

- Développement : `src/environments/environment.ts`
- Production : `src/environments/environment.prod.ts`

La configuration de développement utilise `http://localhost:8000/api/v1`; la configuration de production utilise le chemin relatif `/api/v1`, qui suppose un reverse proxy servant frontend et API sur la même origine. Jitsi utilise par défaut `meet.jit.si` ; le domaine est configurable par `jitsiDomain`.

Le fichier `proxy.conf.json` redirige `/api` vers `http://localhost:8080`, alors que l’URL d’API Angular configurée actuellement cible directement le port `8000`. Les appels de l’application qui utilisent `environment.apiUrl` suivent cette URL directe. Le proxy est utile seulement aux requêtes relatives `/api` ; si vous choisissez cette approche de proxy, alignez les environnements Angular et l’URL du proxy sur le port où tourne réellement le backend.

Pour un backend sur un autre hôte ou port, modifiez l’URL de l’environnement correspondant, puis reconstruisez le frontend. Ne placez pas de clés privées ou secrets dans les fichiers Angular : le code client est public.

## Structure du projet

```text
src/
├── app/
│   ├── core/          Services API/auth, modèles, guards et interceptors
│   ├── features/      Catalogue, cours, profil, tableaux de bord et administration
│   ├── layouts/       Layouts authentifié et d’authentification
│   └── shared/        Header, pied de page, avatar et composants partagés
├── environments/      URLs et configuration dev/prod
├── main.ts            Bootstrap Angular
└── styles.css         Styles globaux et classes de design
public/                Images, polices et ressources servies telles quelles
```

L’application s’appuie sur Angular standalone et charge les pages métier en lazy loading depuis `src/app/app.routes.ts`.

## Rôles et navigation

| Rôle | Espace après connexion |
|---|---|
| **ADMIN** | `/dashboard/admin` |
| **FORMATEUR** | `/dashboard/formateur` |
| **APPRENANT** | `/dashboard/apprenant` |

Les routes authentifiées utilisent des guards ; les écrans d’administration sont en plus limités au rôle ADMIN côté interface. L’API doit également faire respecter ces autorisations côté serveur.

Le catalogue public est accessible avant connexion. Les formations actives sont listées dans le menu par catégorie ; celles sans catégorie apparaissent sous « Autres formations ».

## Tests et build

Exécutez les tests frontend :

```powershell
npm test -- --watch=false
```

Créez un build de production :

```powershell
npm run build
```

Les fichiers sont générés dans `dist/ODC-Academy/browser`. Pour le développement, le mode watch est disponible avec :

```powershell
npm run watch
```

## Déploiement

1. Configurez l’URL d’API de production dans `src/environments/environment.prod.ts` (par défaut `/api/v1`).
2. Construisez l’application avec `npm run build`.
3. Publiez le contenu de `dist/ODC-Academy/browser` sur un serveur web HTTPS.
4. Si le frontend utilise `/api/v1`, configurez le reverse proxy de même origine pour transmettre `/api/` au backend.
5. Configurez le serveur web pour renvoyer les routes Angular vers `index.html` (fallback SPA).
6. Ne mettez pas de secrets serveur dans le code frontend ou dans les fichiers d’environnement compilés.

Consultez le [README Backend](../../ODC-Academy-Back/README.md) pour la configuration PostgreSQL, les variables serveur, Flyway et le déploiement de l’API.

## Dépannage

### Erreur réseau ou requêtes refusées

- Vérifiez que le backend est démarré et que le port correspond à `environment.ts`.
- Vérifiez la console du navigateur et l’onglet réseau pour distinguer une erreur CORS, une URL incorrecte ou une réponse HTTP du backend.
- Si vous utilisez le proxy Angular, vérifiez que `proxy.conf.json` pointe sur le port réel du backend et que les requêtes utilisent des URLs relatives `/api`.
- Vérifiez la configuration CORS côté backend si le frontend et l’API utilisent des origines différentes.

### Les formations ne figurent pas dans le header

Seules les formations actives sont affichées. Les formations catégorisées apparaissent sous la catégorie correspondante ; sans catégorie, elles apparaissent sous « Autres formations ». Rechargez la page et vérifiez l’état de la formation dans l’administration.

### Les images ou documents ne s’affichent pas

Les fichiers sont servis par le backend. Vérifiez que le média existe dans le répertoire `ODC_UPLOAD_DIR` du serveur et que l’URL retournée par l’API correspond à l’hôte/port backend accessible par le navigateur. Pour la lecture d’un PDF, vérifiez aussi que l’API autorise l’origine du frontend dans `CORS_ORIGINS`; le PDF est téléchargé par l’application puis affiché dans le lecteur intégré.

## Documentation associée

- [README Backend](../../ODC-Academy-Back/README.md)
- [Procédures et scénarios de test](../../README-TESTS.md)
