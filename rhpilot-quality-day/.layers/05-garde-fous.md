---
title: "05 - Les garde-fous, avant l'agent"
description: "Ajouter ESLint avec un seuil, réparer le test désactivé, figer le comportement de l'API par des tests de caractérisation, exiger une couverture, bloquer les dépendances vulnérables, brancher SonarQube, puis faire relire et fusionner"
---

Un agent de code travaille vite, et se trompe avec assurance. Avant de lui confier le remaniement, il faut que toute erreur se voie d'elle-même : un lint qui casse, un test qui échoue, une couverture qui baisse. Ce sont les étages « analyse statique » et « vérification » de la pyramide. Vous les posez à la main, dans la branche `feature/guardrails` créée à l'étape 04.

Dans Gitea, passez l'issue « Poser les garde-fous » en `status/doing`.

## 05.1 - La base de test sur votre poste

Les nouveaux tests vont interroger une vraie base PostgreSQL. Le kit en fournit une, vide, sur le port 5433 : `rhpilot_test`. Les scripts du projet liront son adresse dans un fichier `.env`, que `.gitignore` exclut déjà de Git. Créez-le :

```exec
cd ~/byte-layers/quality-day/rhpilot && printf 'DATABASE_URL=postgres://rhpilot:rhpilot@localhost:5433/rhpilot_test\nRECRUITER_TOKEN=jeton-de-dev\n' > .env && npm install
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `printf '…\n…\n' > .env` | écrit deux lignes dans `.env` ; `\n` est un retour à la ligne |
> | `DATABASE_URL=…` | l'adresse de la base de test : utilisateur, mot de passe, machine, port et nom de la base |
> | `RECRUITER_TOKEN=jeton-de-dev` | un jeton recruteur pour votre poste ; il servira à l'étape 06 |
> | `npm install` | installe les dépendances du projet dans `node_modules` |

```verify
F=~/byte-layers/quality-day/rhpilot/.env
grep -q '^DATABASE_URL=postgres://rhpilot:rhpilot@localhost:5433/rhpilot_test' "$F" 2>/dev/null || { echo "Le fichier $F ne contient pas l'adresse de la base de test : relancez la commande de la section 05.1."; exit 1; }
[ -d ~/byte-layers/quality-day/rhpilot/node_modules ] || { echo "Les dépendances ne sont pas installées : lancez npm install dans le dépôt."; exit 1; }
echo "La base de test est configurée, et les dépendances sont installées."
```

## 05.2 - ESLint, avec un seuil

**ESLint** vérifie le code JavaScript à chaque modification, en quelques secondes, sur votre poste comme dans le pipeline. Avec le plugin **eslint-plugin-sonarjs**, il applique une partie des règles de SonarQube, dont la complexité cognitive. Installez-les, en versions figées :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm install -D -E eslint@10.15.0 @eslint/js@10.0.1 eslint-plugin-sonarjs@4.2.2 globals@17.14.0 && cp ~/byte-layers/quality-day/course/kit/steps/05-guardrails/eslint.config.js .
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `npm install -D` | ajoute des dépendances de **développement** : utiles pour travailler, absentes de la production |
> | `-E` | écrit la version exacte dans `package.json`, sans `^` : tout le monde aura la même |
> | `@eslint/js`, `globals` | les règles de base d'ESLint, et la liste des variables globales de Node.js et du navigateur |
> | `cp …/eslint.config.js .` | copie la configuration fournie à la racine du dépôt |

Ouvrez [`eslint.config.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v3/kit/steps/05-guardrails/eslint.config.js) : il active les règles recommandées d'ESLint et de sonarjs, puis rétrograde en **avertissements** trois règles que le code actuel enfreint : `todo-tag`, `cognitive-complexity` et `no-default-utility-imports`. On ne peut pas tout corriger aujourd'hui, mais on peut interdire d'**ajouter** de la dette. C'est le principe du **cliquet**, vu dans le lab [Mesurer la dette avec Semgrep, ESLint et jscpd](https://byte-layers.com/fr/labs/measure-debt) : on fixe le nombre d'avertissements actuel comme plafond, et il ne pourra que baisser.

Lancez ESLint pour compter les avertissements :

```exec
cd ~/byte-layers/quality-day/rhpilot && npx eslint .
```

La dernière ligne donne le total : `✖ N problems (0 errors, N warnings)`.

**À vous** : créez le script `lint` du projet, avec ce nombre comme plafond. Remplacez `N` par le nombre affiché :

```bash
npm pkg set scripts.lint="eslint . --max-warnings N"
```

**Critère :** `npm run lint` réussit, et un avertissement de plus le ferait échouer.

```hint
Le total est la somme des avertissements de tous les fichiers. Si `npm run lint` affiche `ESLint found too many warnings`, le plafond est trop bas.
```

````solution
```bash
npm pkg set scripts.lint="eslint . --max-warnings 4"
```
````

```verify
D=~/byte-layers/quality-day/rhpilot
S=$(cd "$D" && npm pkg get scripts.lint | tr -d '"')
case "$S" in *"--max-warnings 4"*) ;; *) echo "Le script lint vaut « $S » : il doit contenir --max-warnings suivi du nombre d'avertissements actuel."; exit 1 ;; esac
(cd "$D" && npm run -s lint >/dev/null 2>&1) || { echo "npm run lint échoue : lancez-le pour lire l'erreur."; exit 1; }
echo "Le lint passe, et son plafond est à 4 avertissements."
```

## 05.3 - Réparer le test désactivé

Le test `normalizePhone retire les espaces` est marqué `test.skip`, avec le commentaire « flaky, à corriger plus tard ». Un test **flaky** échoue au hasard. Celui-ci n'a rien de flaky : vérifions-le. Dans `test/utils.test.js`, supprimez la ligne de commentaire et remplacez `test.skip(` par `test(`, puis lancez les tests :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm test
```

Le test échoue, et toujours de la même façon : il attend `'0612345678'` et reçoit `'0612 34 56 78'`. Le défaut est dans le code : `phone.replace(' ', '')` ne remplace que la **première** espace.

**À vous** : corrigez `normalizePhone` dans `src/utils.js` pour qu'elle retire toutes les espaces, puis relancez `npm test`.

```hint
La méthode `replaceAll` des chaînes de caractères remplace toutes les occurrences.
```

````solution
```js
export function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replaceAll(' ', '');
}
```
````

```verify
D=~/byte-layers/quality-day/rhpilot
grep -q 'test.skip' "$D/test/utils.test.js" && { echo "Le test est encore désactivé : remplacez test.skip( par test( dans test/utils.test.js."; exit 1; }
(cd "$D" && node --test test/utils.test.js >/dev/null 2>&1) || { echo "Les tests de test/utils.test.js échouent : corrigez normalizePhone dans src/utils.js."; exit 1; }
echo "Le test est réactivé, et il passe."
```

## 05.4 - Figer le comportement de l'API

Avant de remanier un code sans tests, on écrit des **tests de caractérisation** : ils ne disent pas ce que le code devrait faire, ils décrivent ce qu'il fait **aujourd'hui**. Si le remaniement change un comportement, un test casse, et on décide en connaissance de cause. Ces tests sont fournis : ils démarrent l'application, remplissent la base de test, puis appellent chaque route.

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/05-guardrails/test/api.test.js test/
```

Ouvrez [`test/api.test.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v3/kit/steps/05-guardrails/test/api.test.js) et lisez les titres : la liste des offres, le dépôt d'une candidature, les erreurs de validation, le refus sans jeton, la fusion des doublons par email, la recherche, les filtres, l'export CSV, la mise à jour. Deux détails comptent pour la suite :

- le test récupère le jeton recruteur en important `RECRUITER_TOKEN` depuis `src/auth.js` : il ne recopie pas le secret, et il marchera encore quand le jeton sera lu dans l'environnement ;
- il remplit la base avec `db/seed.js` : c'est pourquoi la base de test est séparée de la base de production.

Remplacez maintenant le script `test` pour qu'il lise `.env`, lance les fichiers de test l'un après l'autre (ils remplissent tous la même base), mesure la **couverture** de `src/` et exige au moins 75 % des lignes :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm pkg set scripts.test="node --env-file-if-exists=.env --test --test-concurrency=1 --experimental-test-coverage --test-coverage-include='src/**' --test-coverage-lines=75 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=lcov.info 'test/**/*.test.js'" && npm test
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `--env-file-if-exists=.env` | charge les variables de `.env` s'il existe ; dans le pipeline, il n'y en a pas, et les variables viennent du pipeline |
> | `--test-concurrency=1` | lance les fichiers de test l'un après l'autre |
> | `--experimental-test-coverage --test-coverage-include='src/**'` | mesure la couverture du code de `src/` |
> | `--test-coverage-lines=75` | fait échouer les tests si moins de 75 % des lignes sont exécutées |
> | `--test-reporter=spec … --test-reporter=lcov --test-reporter-destination=lcov.info` | deux sorties : le rapport lisible dans le terminal, et le fichier `lcov.info` que lira SonarQube ; `.gitignore` l'exclut déjà du dépôt |

Les 13 tests passent, et le tableau de couverture se termine par une ligne `all files` autour de 81 % des lignes. Dans la sortie, vous voyez aussi passer des lignes `Liste consultée : camille.martin@example.com, …` : ce sont les journaux de l'application, avec les emails des candidats. Ils iront dans les journaux du pipeline aussi : un constat de plus pour l'étape 06.

> ⚖️ **Pourquoi 75 % ?** La couverture dit quelles lignes sont exécutées, pas si le résultat est vérifié : le bit [Les tests dans la qualité](https://byte-layers.com/fr/bits/tests-and-quality) l'explique. Un seuil sert de cliquet : il empêche la couverture de baisser.

```verify
D=~/byte-layers/quality-day/rhpilot
[ -f "$D/test/api.test.js" ] || { echo "test/api.test.js manque : relancez la commande cp de la section 05.4."; exit 1; }
case "$(cd "$D" && npm pkg get scripts.test)" in *test-coverage-lines=75*) ;; *) echo "Le script test n'exige pas 75 % de couverture : relancez la commande npm pkg set de la section 05.4."; exit 1 ;; esac
(cd "$D" && npm test >/dev/null 2>&1) || { echo "npm test échoue : lancez-le pour lire l'erreur. Vérifiez que l'environnement du kit tourne (docker ps)."; exit 1; }
echo "Les tests de l'API passent, avec le seuil de couverture."
```

## 05.5 - La dépendance vulnérable

L'audit de l'étape 02 a signalé lodash 4.17.20. Montez-le à la version corrigée, puis relancez l'audit :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm install -E lodash@4.18.1 && npm audit --omit=dev --audit-level=high
```

`--audit-level=high` fait échouer la commande s'il reste une faille de niveau `high` ou plus. L'audit répond `found 0 vulnerabilities`.

```verify
D=~/byte-layers/quality-day/rhpilot
(cd "$D" && npm audit --omit=dev --audit-level=high >/dev/null 2>&1) || { echo "npm audit signale encore une faille high : lancez la commande de la section 05.5."; exit 1; }
echo "Plus aucune faille high dans les dépendances de production."
```

## 05.6 - Le pipeline

Il reste à faire tourner tout cela dans le pipeline, pour qu'aucune pull request ne puisse l'oublier. Copiez le pipeline et la configuration de SonarQube fournis :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/05-guardrails/.gitea/workflows/ci.yml .gitea/workflows/ci.yml && cp ~/byte-layers/quality-day/course/kit/steps/05-guardrails/sonar-project.properties .
```

Ouvrez [`.gitea/workflows/ci.yml`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v3/kit/steps/05-guardrails/.gitea/workflows/ci.yml) :

| Partie | Rôle |
|---|---|
| `on: push: branches: [main, develop]` et `pull_request:` | le pipeline tourne sur chaque pull request, et après chaque fusion dans `develop` ou `main` |
| `jobs: checks:` | le job dont la protection de branche attend le statut |
| `services: postgres:` | une base PostgreSQL neuve, démarrée pour le job seulement, joignable sous le nom `postgres` |
| `env: DATABASE_URL: …` | l'adresse de cette base, lue par les tests |
| `npm ci`, `npm run lint`, `npm test` | installation exacte depuis `package-lock.json`, lint avec son plafond, tests avec leur seuil |
| `Analyse SonarQube (develop seulement)` | le scanner, avec l'adresse et le jeton que `init.sh` a rangés dans la variable `SONAR_HOST_URL` et le secret `SONAR_TOKEN` du dépôt ; `sonar.qualitygate.wait=true` fait échouer l'étape si la gate est rouge |
| `continue-on-error: true` | l'étape SonarQube peut échouer sans faire échouer le job : la gate restera rouge jusqu'à l'étape 06 |

Pourquoi SonarQube seulement sur `develop` ? L'édition Community n'analyse qu'**une** branche, la branche principale du projet, que `init.sh` a nommée `develop`. Une analyse lancée depuis une pull request écraserait celle de `develop`. Les pull requests sont donc protégées par le lint, les tests, la couverture et l'audit ; SonarQube suit `develop` après chaque fusion. Les éditions payantes analysent aussi les branches et les pull requests.

**À vous** : le fichier contient une ligne `# TODO`. Remplacez-la par l'étape d'audit des dépendances, avec la commande de la section 05.5.

```hint
Une étape de commande s'écrit `- run: …`, avec la même indentation que `- run: npm test`.
```

````solution
```yaml
      - run: npm test
      - run: npm audit --omit=dev --audit-level=high
```
````

```verify
F=~/byte-layers/quality-day/rhpilot/.gitea/workflows/ci.yml
grep -q 'TODO' "$F" && { echo "Le pipeline contient encore la ligne # TODO : remplacez-la par l'étape d'audit."; exit 1; }
grep -qE '^      - run: npm audit --omit=dev --audit-level=high *$' "$F" || { echo "L'étape d'audit manque, ou n'a pas la bonne indentation : six espaces, puis - run: npm audit --omit=dev --audit-level=high."; exit 1; }
echo "Le pipeline lance l'audit des dépendances."
```

## 05.7 - La pull request, relue par bob

Publiez la branche :

```exec
cd ~/byte-layers/quality-day/rhpilot && git add -A && git commit -m "Pose les garde-fous : lint, tests de l'API, couverture, audit, SonarQube" && git push -u origin feature/guardrails
```

Dans Gitea, avec alice, ouvrez la **pull request** : bouton **New Pull Request**, base `develop`, branche `feature/guardrails`. Dans la description, collez le contenu de `.gitea/pull_request_template.md` (votre Definition of Done), indiquez l'issue (`#` suivi de son numéro), puis créez-la. Passez l'issue en `status/review`.

> ⚠️ **Vérifiez la base.** Gitea propose `main` comme base, parce que c'est la branche par défaut du dépôt : choisissez `develop` dans la liste. Une pull request fusionnée dans `main` n'arrive pas dans `develop`, et les étapes suivantes partiraient d'un `develop` sans garde-fous. Si c'est déjà fait, ouvrez une pull request de `main` vers `develop` : une fois approuvée et fusionnée, `develop` est rattrapée.

Le pipeline démarre : onglet **Actions**, ou le statut affiché dans la pull request. Le premier lancement télécharge l'image PostgreSQL ; comptez une à deux minutes. Le job `checks` doit passer au vert.

Passez maintenant dans la fenêtre privée de **bob**. Ouvrez la pull request, onglet **Files Changed**, et relisez. Cliquez **Review**, choisissez **Approve**, puis validez. Revenez à alice : la pull request est fusionnable. Fusionnez-la avec **Create merge commit**.

La fusion déclenche le pipeline sur `develop`, avec l'étape SonarQube cette fois. Ouvrez son journal : la quality gate est `FAILED`, et l'étape est marquée en échec, mais le job reste vert grâce à `continue-on-error`. Dans SonarQube, la couverture est maintenant mesurée.

Pour finir, avec alice, passez l'issue en `status/done` et fermez-la. Elle ne se ferme pas seule : Gitea ne ferme une issue citée par une pull request que si celle-ci est fusionnée dans la branche par défaut, `main`.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
A=http://localhost:3300/api/v1/repos/rhpilot/rhpilot
curl -fs -u "$U" "$A/contents/eslint.config.js?ref=develop" >/dev/null || { echo "develop ne contient pas eslint.config.js : la pull request n'est pas encore fusionnée."; exit 1; }
R=$(curl -fs -u "$U" "$A/actions/runs?branch=develop&event=push&limit=1")
echo "$R" | grep -q '"status":"completed"' || { echo "Le pipeline de develop tourne encore : attendez qu'il se termine."; exit 1; }
echo "$R" | grep -q '"conclusion":"success"' || { echo "Le dernier pipeline de develop a échoué : ouvrez-le dans l'onglet Actions pour lire l'erreur."; exit 1; }
echo "Les garde-fous sont fusionnés dans develop, et son pipeline est vert."
```

> 💡 **Rattrapage.** Pour récupérer l'état de fin d'étape : restez sur la branche de l'étape, lancez `sh ~/byte-layers/quality-day/course/kit/catch-up.sh 05`, puis `git add -A && git commit -m "Rattrapage de l'étape 05" && git push`, et terminez par la pull request et la fusion décrites plus haut.
