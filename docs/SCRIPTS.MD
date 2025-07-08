# 📦 Scripts npm utiles

Voici les scripts clés pour le développement, le test, le déploiement et la maintenance de soundshine-bot.

| Script             | Description                                               | Usage exemple                |
|--------------------|-----------------------------------------------------------|-----------------------------|
| `npm run dev`        | Lance le bot en mode développement avec `.env.dev`       | `npm run dev`                |
| `npm run prod`       | Lance le bot en mode production avec `.env.prod`         | `npm run prod`               |
| `npm run deploy:dev`  | Déploie les commandes slash dans le serveur de dev       | `npm run deploy:dev`         |
| `npm run deploy:prod` | Déploie les commandes slash globalement                   | `npm run deploy:prod`        |
| `npm run test`       | Lance tous les tests unitaires                            | `npm run test`               |
| `npm run test:stress` | Lance les tests de charge et stress                       | `npm run test:stress`        |
| `npm run lint`       | Vérifie le style et les erreurs de code                   | `npm run lint`               |
| `npm run lint:fix`   | Corrige automatiquement les erreurs de style             | `npm run lint:fix`           |
| `npm run docker:build`| Compile l’image Docker du bot                              | `npm run docker:build`       |
| `npm run docker:run`  | Lance le conteneur Docker localement                      | `npm run docker:run`         |
| `npm run docker:compose` | Lance les services Docker en background                  | `npm run docker:compose`     |
| `npm run git-actions` | Lance le script local simulant la CI GitHub Actions      | `npm run git-actions`        |
| `npm run db:deploy`  | Déploie la base de données / crée tables                   | `npm run db:deploy`          |
| `npm run prepare`    | Installe Husky pour les hooks Git                           | (automatique à l’installation) |
| `npm run postinstall`| Installe Husky après l’installation des dépendances        | (automatique à l’installation) |
| `npm run context:md` | Génère la doc contexte projet en Markdown                  | `npm run context:md`         |
| `npm run deploy:git` | Lance le script interactif pour commit + création PR       | `npm run deploy:git`         |

---

### Notes

- Les scripts `dev` et `prod` utilisent `dotenv` pour charger les variables d’environnement appropriées.
- Le script `deploy:git` permet de fiabiliser le processus de commit et PR en demandant un titre et une description avant push.
- `git-actions` est un outil maison pour simuler localement le pipeline CI/CD de GitHub.
- `docker:compose` lance la stack complète, idéal pour dev local avec toutes les dépendances.