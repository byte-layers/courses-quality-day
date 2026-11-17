---
title: "06 - Remodeler le code, avec ou sans agent"
description: "Donner un AGENTS.md à l'agent, remanier le module pour que le chemin facile soit le bon, puis verrouiller ce chemin par des règles de lint"
---

Les garde-fous sont en place : un remaniement qui casse un comportement fera échouer un test. On s'attaque maintenant à l'étage le plus solide de la pyramide, **le code lui-même**. L'idée : organiser le code pour que la bonne façon de faire soit la plus simple, puis le verrouiller par des outils.

| Constat | Ce que le code impose désormais | Ce qui le verrouille |
|---|---|---|
| SQL concaténé, `pg` appelé partout | un seul module, `src/db.js`, avec des requêtes paramétrées | la règle ESLint `no-restricted-imports` interdit `pg` ailleurs |
| données personnelles dans les journaux | un module `src/logger.js` qui masque emails et téléphones | la règle `no-console` interdit d'écrire sans lui |
| secrets dans le code, valeurs par défaut | `src/config.js` refuse de démarrer sans `DATABASE_URL` ni `RECRUITER_TOKEN` | l'application elle-même, et SonarQube |
| HTML construit avec des données | `textContent` et `createElement` | une règle `no-restricted-syntax` sur `innerHTML` |
| `==` au lieu de `===` | | la règle `eqeqeq` |
| validation et CSV copiés, filtre imbriqué | une fonction par besoin | sonarjs : complexité et duplication |

Avec alice, passez l'issue « Remanier le module candidatures » en `status/doing`, puis créez la branche :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch develop && git pull && git switch -c feature/refactor
```

## 06.1 - Un AGENTS.md pour l'agent

`AGENTS.md` est le fichier d'instructions que lisent la plupart des agents de code, dont Kilo Code. Copiez celui qui est fourni :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/06-refactor/AGENTS.md .
```

Ouvrez [`AGENTS.md`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/06-refactor/AGENTS.md) : il décrit le projet et ses commandes, puis aligne **douze règles numérotées**. C'est ce qu'on écrit d'habitude : un règlement, que l'agent est censé respecter. Gardez-le en tête : à l'étape 07, vous le réduirez.

```verify
[ -f ~/byte-layers/quality-day/rhpilot/AGENTS.md ] || { echo "AGENTS.md manque à la racine du dépôt : relancez la commande cp de la section 06.1."; exit 1; }
echo "AGENTS.md est en place."
```

## 06.2 - Remanier : choisissez votre chemin

Le remaniement touche une dizaine de fichiers. Deux chemins mènent au même résultat ; choisissez-en un.

### Chemin A : avec un agent

Ouvrez le dépôt dans VS Code, puis votre agent (Kilo Code, ou un autre qui lit `AGENTS.md`). Donnez-lui la consigne fournie dans [`prompt.md`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/06-refactor/prompt.md) : copiez son contenu dans la conversation.

```exec
cat ~/byte-layers/quality-day/course/kit/steps/06-refactor/prompt.md
```

Pendant qu'il travaille, observez : lit-il `AGENTS.md` ? Lance-t-il `npm run lint` et `npm test` ? Quand il rend la main, **relisez le diff** avant toute chose, en commençant par `test/` :

```exec
cd ~/byte-layers/quality-day/rhpilot && git status --short && git diff --stat
```

Si un fichier de `test/` apparaît modifié, refusez la modification (`git checkout -- test/` ; pour un fichier de test ajouté, `git clean -f test/`) et demandez à l'agent de corriger le code plutôt que les tests. Le résultat varie d'un modèle à l'autre : ce qui compte, c'est que les vérifications de la section 06.4 passent.

### Chemin B : sans agent

Copiez les fichiers remaniés fournis : ils remplacent ceux de `src/`, `public/` et `db/seed.js`, et en ajoutent cinq dans `src/` (`config.js`, `db.js`, `logger.js`, `validation.js`, `csv.js`).

```exec
cd ~/byte-layers/quality-day/rhpilot && cp -R ~/byte-layers/quality-day/course/kit/steps/06-refactor/without-agent/. .
```

Prenez quelques minutes pour lire [`src/routes/applications.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/06-refactor/without-agent/src/routes/applications.js) : la fonction de recherche de 60 lignes est devenue `buildFilters`, qui construit une clause `WHERE` avec des paramètres `$1`, `$2`, et `keepFirstByEmail`, qui dédoublonne en un seul passage.

**À vous** : `src/logger.js` contient un `// TODO`. La fonction `mask` remplace déjà les emails ; complétez-la pour qu'elle remplace aussi les numéros de téléphone par `[téléphone]`, avec l'expression régulière `PHONE` définie en haut du fichier.

```hint
La méthode `replace(motif, remplacement)` d'une chaîne remplace toutes les correspondances quand le motif porte l'option `g`, ce qui est le cas de `PHONE`.
```

````solution
```js
export function mask(text) {
  const words = String(text).split(' ').map((word) => (word.includes('@') ? '[email]' : word));
  return words.join(' ').replace(PHONE, '[téléphone]');
}
```
````

### Ce que vous devez obtenir, quel que soit le chemin

```verify
D=~/byte-layers/quality-day/rhpilot
for f in config.js db.js logger.js; do [ -f "$D/src/$f" ] || { echo "src/$f manque : le remaniement n'est pas terminé."; exit 1; }; done
grep -rln "from 'pg'\|from \"pg\"" "$D/src" | grep -v 'src/db.js$' | grep -q . && { echo "Un fichier de src/ autre que db.js importe encore pg."; exit 1; }
grep -rn 'console\.' "$D/src" | grep -v 'src/logger.js' | grep -q . && { echo "Un fichier de src/ autre que logger.js utilise encore console."; exit 1; }
grep -q 'innerHTML' "$D/public/app.js" && { echo "public/app.js utilise encore innerHTML."; exit 1; }
grep -rq 'rhp_live_' "$D/src" && { echo "Le jeton rhp_live_… est encore écrit dans src/."; exit 1; }
M=$(cd "$D" && node --input-type=module -e 'const { mask } = await import("./src/logger.js"); console.log(mask("camille@example.com 06 12 34 56 78"))' 2>/dev/null)
[ "$M" = "[email] [téléphone]" ] || { echo "mask ne masque pas l'email et le téléphone (résultat : « $M »)."; exit 1; }
git -C "$D" diff --quiet develop -- test/ || { echo "Des fichiers de test/ ont été modifiés par rapport à develop : annulez avec git checkout develop -- test/."; exit 1; }
echo "Le code est remanié, et les tests n'ont pas été touchés."
```

## 06.3 - Verrouiller le chemin

Le code offre maintenant un bon chemin. Rien n'empêche encore un humain ou un agent d'importer `pg` dans une route, ou d'ajouter un `console.log`. Cette partie se fait **à la main, sur les deux chemins** : c'est la configuration des outils, celle que l'agent ne doit pas pouvoir modifier.

Remplacez la configuration ESLint par la version fournie, qui ajoute les règles du tableau de début d'étape :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/06-refactor/eslint.config.js .
```

**À vous** : le fichier contient un `// TODO`. Remplacez-le par la règle `no-restricted-imports`, qui interdit d'importer le module `pg` dans `src/`. Le bloc qui suit dans le fichier l'autorise déjà dans `src/db.js`.

```hint
La règle prend un niveau, puis un objet `{ paths: [{ name: 'pg', message: '…' }] }`. Le message s'affiche à qui l'enfreint : dites-lui quoi faire à la place.
```

````solution
```js
      'no-restricted-imports': ['error', { paths: [{ name: 'pg', message: 'Passez par src/db.js.' }] }],
```
````

Le code ne contient plus de dette connue : le plafond d'avertissements passe à zéro, et lodash, qui ne sert plus, quitte le projet. Dans le pipeline, la gate SonarQube devient bloquante : supprimez de `.gitea/workflows/ci.yml` la ligne `continue-on-error: true` et ses deux lignes de commentaire. Lancez enfin le lint et les tests :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm pkg set scripts.lint="eslint . --max-warnings 0" && npm uninstall lodash && npm run lint && npm test
```

Les 13 tests de caractérisation passent **sans avoir été modifiés** : le comportement vérifié est le même. Avec le code fourni (chemin B), un comportement a pourtant changé sans qu'aucun test ne le voie : le filtre par statut ignorait la date `from`, il en tient compte désormais. C'était un défaut, et le corriger au passage est un raccourci : dans une vraie équipe, on le corrige dans un commit à part, avec un test et une décision notée dans l'issue. Un test de caractérisation complet l'aurait d'ailleurs figé, et obligé à cette décision.

Si vous avez pris le chemin A, il est possible que le lint signale ici ce que l'agent a écrit : une expression régulière trop coûteuse (dont le temps de calcul explose sur certaines entrées, ce qui permet un déni de service), un `==`. C'est le rôle de cette barrière ; corrigez, ou demandez à l'agent de corriger.

```verify
D=~/byte-layers/quality-day/rhpilot
grep -q 'TODO' "$D/eslint.config.js" && { echo "eslint.config.js contient encore le // TODO."; exit 1; }
grep -q "no-restricted-imports" "$D/eslint.config.js" || { echo "La règle no-restricted-imports manque dans eslint.config.js."; exit 1; }
grep -q 'continue-on-error' "$D/.gitea/workflows/ci.yml" && { echo "Le pipeline contient encore continue-on-error : supprimez cette ligne et son commentaire."; exit 1; }
case "$(cd "$D" && npm pkg get scripts.lint)" in *"--max-warnings 0"*) ;; *) echo "Le plafond d'avertissements n'est pas à 0 : relancez la commande npm pkg set de la section 06.3."; exit 1 ;; esac
grep -q '"lodash"' "$D/package.json" && { echo "lodash est encore dans package.json : lancez npm uninstall lodash."; exit 1; }
(cd "$D" && npm run -s lint >/dev/null 2>&1) || { echo "npm run lint échoue : lancez-le pour lire l'erreur."; exit 1; }
(cd "$D" && npm test >/dev/null 2>&1) || { echo "npm test échoue : lancez-le pour lire l'erreur."; exit 1; }
echo "Le chemin est verrouillé : lint à zéro avertissement, tests verts."
```

## 06.4 - Relecture, fusion, et nouvelle analyse

Publiez, comme à l'étape 05 :

```exec
cd ~/byte-layers/quality-day/rhpilot && git add -A && git commit -m "Remanie le module candidatures : base, journal, configuration, filtres" && git push -u origin feature/refactor
```

Ouvrez la pull request vers `develop`, passez l'issue en `status/review`, faites relire et approuver par bob, puis fusionnez. Une relecture utile tient en trois questions : les tests ont-ils changé ? la configuration des outils a-t-elle changé, et pourquoi ? le code fait-il ce que dit l'issue, et rien d'autre ?

Après la fusion, le pipeline de `develop` lance SonarQube, cette fois sans filet. La quality gate **RHPilot audit** passe au vert : sécurité A, fiabilité A, couverture au-dessus de 90 %, duplication à zéro. La dette mesurée est tombée à une dizaine de minutes. Passez l'issue en `status/done` et fermez-la.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
SA="admin:$(sed -n 's/^SONAR_PASSWORD=//p' "$E")"
curl -fs -u "$U" "http://localhost:3300/api/v1/repos/rhpilot/rhpilot/contents/src/db.js?ref=develop" >/dev/null || { echo "develop ne contient pas src/db.js : la pull request n'est pas encore fusionnée."; exit 1; }
R=$(curl -fs -u "$U" "http://localhost:3300/api/v1/repos/rhpilot/rhpilot/actions/runs?branch=develop&event=push&limit=1")
echo "$R" | grep -q '"status":"completed"' || { echo "Le pipeline de develop tourne encore : attendez qu'il se termine."; exit 1; }
echo "$R" | grep -q '"conclusion":"success"' || { echo "Le dernier pipeline de develop a échoué : ouvrez son journal dans l'onglet Actions."; exit 1; }
S=$(curl -fs -u "$SA" "http://localhost:9300/api/qualitygates/project_status?projectKey=rhpilot" | sed -n 's/^{"projectStatus":{"status":"\([A-Z]*\)".*/\1/p')
[ "$S" = "OK" ] || { echo "La quality gate est « $S » : ouvrez le projet dans SonarQube pour voir la condition en échec."; exit 1; }
echo "Le remaniement est fusionné, et la quality gate RHPilot audit est verte."
```

> 💡 **Rattrapage.** Restez sur la branche de l'étape, lancez `sh ~/byte-layers/quality-day/course/kit/catch-up.sh 06`, puis `git add -A && git commit -m "Rattrapage de l'étape 06" && git push`, et terminez par la pull request et la fusion décrites plus haut.
