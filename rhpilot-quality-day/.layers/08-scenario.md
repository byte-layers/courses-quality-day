---
title: "08 - Le scénario complet : le droit à l'effacement"
description: "De l'issue vague du client à la fusion : spécification EARS, tests écrits avant le code, implémentation avec ou sans agent, test de bout en bout ressuscité, statuts, relecture, et en option une version livrée sur main"
---

Tout est en place : un code sain, des garde-fous, une forge qui cadre, un agent configuré. Il est temps de livrer ce que le client attend : le **droit à l'effacement**. Vous suivez l'issue de bob, que `init.sh` a créée avec les labels `status/backlog` et `type/feature`, d'un bout à l'autre, en changeant son statut à chaque étape, comme une équipe le ferait.

| Moment | Statut de l'issue |
|---|---|
| l'issue est vague | `status/backlog` |
| la spécification est validée par bob | `status/ready` |
| les tests sont écrits, le code commence | `status/doing` |
| la pull request attend sa relecture | `status/review` |
| fusionné | `status/done` |

## 08.1 - De l'issue à la spécification

Relisez l'issue de bob : « Un candidat nous a demandé de supprimer ses données. Il faut pouvoir le faire dans RHPilot. » Que supprimer ? qui en a le droit ? que répondre si le candidat est inconnu ? L'issue ne le dit pas. On écrit d'abord une **spécification**, avant toute ligne de code. Créez la branche :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch develop && git pull && git switch -c feature/erasure && mkdir -p specs
```

**Avec un agent**, demandez-lui : *« Utilise la skill issue-to-spec sur cette issue »*, et collez le texte de l'issue. S'il pose des questions, répondez comme le ferait bob : seuls les recruteurs peuvent effacer ; on efface par email, toutes les candidatures de la personne ; on ne garde pas l'email dans les journaux. **Sans agent**, écrivez-la vous-même en suivant la procédure de [la skill](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v2/kit/steps/07-prose/.agents/skills/issue-to-spec/SKILL.md).

**Critères** pour `specs/erasure.md` :

- une partie **Exigences**, avec au moins quatre exigences numérotées `E1`, `E2`…, chacune selon un motif EARS (« Quand … le système doit … », « Si … alors le système doit … ») ;
- elles couvrent l'effacement de toutes les candidatures d'un email, l'email inconnu (404), l'email absent (400), la demande sans jeton recruteur (401), et un journal sans l'email ;
- une partie **Interface** : la route `DELETE /api/applications?email=…` ;
- une partie **Hors périmètre**.

````solution
```markdown
# Spécification : droit à l'effacement

Issue : « Le client veut le droit à l'effacement ». Référence : RGPD, article 17.

## Exigences

- **E1** Quand un recruteur demande l'effacement d'un email, le système doit supprimer toutes les candidatures qui portent cet email, et répondre le nombre de candidatures supprimées.
- **E2** Si aucune candidature ne porte cet email, alors le système doit répondre 404.
- **E3** Si l'email est absent de la demande, alors le système doit répondre 400.
- **E4** Si la demande n'a pas de jeton recruteur valide, alors le système doit répondre 401 et ne rien supprimer.
- **E5** Le système doit tracer chaque effacement dans le journal sans y écrire l'email.

## Interface

`DELETE /api/applications?email=<email>`, avec l'en-tête `x-recruiter-token`. Réponse : `{ "deleted": <nombre> }`.

## Hors périmètre

- l'effacement dans les sauvegardes et les exports déjà envoyés (procédure à écrire avec la DPO du client) ;
- la durée de conservation des candidatures (issue à ouvrir : des candidatures de 2019 sont encore en base).
```
````

```verify
F=~/byte-layers/quality-day/rhpilot/specs/erasure.md
[ -f "$F" ] || { echo "Le fichier $F n'existe pas."; exit 1; }
N=$(grep -oE '(^|[^A-Za-z0-9])E[0-9]+' "$F" | wc -l)
[ "$N" -ge 4 ] || { echo "La spécification compte $N exigence(s) numérotée(s) E1, E2… : il en faut au moins quatre."; exit 1; }
grep -qi 'le système doit' "$F" || { echo "Les exigences ne suivent pas un motif EARS : « Quand …, le système doit … »."; exit 1; }
for c in 404 400 401 DELETE; do grep -q "$c" "$F" || { echo "La spécification ne mentionne pas $c."; exit 1; }; done
grep -qi 'hors p' "$F" || { echo "La partie Hors périmètre manque."; exit 1; }
echo "La spécification est écrite."
```

Publiez la branche avec la spécification. Ensuite, avec alice, montrez-la à bob en commentaire de l'issue (le lien vers le fichier dans Gitea suffit). Dans la fenêtre de bob, relisez la spécification ; si elle répond au besoin, passez l'issue en `status/ready`.

```exec
cd ~/byte-layers/quality-day/rhpilot && git add specs && git commit -m "Spécifie le droit à l'effacement" && git push -u origin feature/erasure
```

## 08.2 - Les tests d'abord

Les exigences deviennent des tests, **écrits avant le code**, par un humain. C'est la règle du TDD avec un agent : l'humain est maître des tests, l'agent fait passer les tests sans les modifier, et le hook de l'étape 07 l'en empêche. Les tests sont fournis : un par exigence, E1 à E4.

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/08-erasure/test/erasure.test.js test/ && npm test
```

Les tests échouent : `E1`, `E3` et `E4` sont en rouge. `E2` passe déjà, par hasard : une route qui n'existe pas répond aussi 404. Un test qui passe avant le code ne prouve rien ; il prouvera quelque chose une fois la route écrite. Passez l'issue en `status/doing`.

```verify
[ -f ~/byte-layers/quality-day/rhpilot/test/erasure.test.js ] || { echo "test/erasure.test.js manque : relancez la commande cp de la section 08.2."; exit 1; }
echo "Les tests de l'effacement sont en place."
```

## 08.3 - Le code, avec ou sans agent

**Avec un agent**, ajoutez le label `agent` à l'issue, puis demandez : *« Implémente specs/erasure.md. Les tests de test/erasure.test.js doivent passer sans être modifiés. »* S'il essaie de modifier un test, le hook de l'étape 07 le bloque (avec OpenCode ou Claude Code), et le message lui dit de corriger le code ; avec un autre agent, c'est votre relecture qui l'arrête. Relisez son diff.

**Sans agent**, copiez la route fournie. Elle remplace tout le fichier, et suppose le code remanié fourni à l'étape 06 (`src/db.js`, `src/validation.js`) : si vous avez pris le chemin A en 06, ajoutez plutôt à la main la route `router.delete` de ce fichier dans le vôtre.

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/08-erasure/without-agent/src/routes/applications.js src/routes/
```

Elle ajoute une route `router.delete('/', …)` à [`src/routes/applications.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v2/kit/steps/08-erasure/without-agent/src/routes/applications.js). **À vous** : remplacez son `// TODO` par la réponse 404 de l'exigence E2.

```hint
`result.rowCount` donne le nombre de lignes supprimées. Les autres routes répondent une erreur avec `return res.status(…).json({ error: '…' });`.
```

````solution
```js
    if (result.rowCount === 0) return res.status(404).json({ error: 'aucune candidature pour cet email' });
```
````

Dans les deux cas, le lint et les tests doivent passer :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm run lint && npm test
```

```verify
D=~/byte-layers/quality-day/rhpilot
grep -q 'TODO' "$D/src/routes/applications.js" && { echo "src/routes/applications.js contient encore le // TODO."; exit 1; }
git -C "$D" diff --quiet develop -- test/api.test.js test/utils.test.js || { echo "Des tests existants ont été modifiés : annulez avec git checkout develop -- test/api.test.js test/utils.test.js."; exit 1; }
(cd "$D" && npm run -s lint >/dev/null 2>&1) || { echo "npm run lint échoue : lancez-le pour lire l'erreur."; exit 1; }
(cd "$D" && npm test >/dev/null 2>&1) || { echo "npm test échoue : lancez-le pour voir quel test est rouge."; exit 1; }
echo "La route d'effacement passe ses 4 tests, et le lint."
```

## 08.4 - Ressusciter le test de bout en bout

L'ancien test Playwright de `e2e/` n'a jamais tourné. Pour une fonction vue du client, on veut au moins un **test de bout en bout** : un vrai navigateur qui remplit le formulaire, comme un candidat. On le remet en état, et on l'ajoute au pipeline. Cette partie est faite par l'humain : la configuration des tests est protégée par le hook.

```exec
cd ~/byte-layers/quality-day/rhpilot && npm install -D -E @playwright/test@1.65.1 && cp ~/byte-layers/quality-day/course/kit/steps/08-erasure/playwright.config.js . && cp ~/byte-layers/quality-day/course/kit/steps/08-erasure/e2e/apply.spec.js e2e/ && cp ~/byte-layers/quality-day/course/kit/steps/08-erasure/.gitea/workflows/ci.yml .gitea/workflows/ && npm pkg set scripts.e2e="playwright test"
```

| Fichier | Ce qui a changé |
|---|---|
| [`playwright.config.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v2/kit/steps/08-erasure/playwright.config.js) | écrit en module ES ; `webServer` remplit la base et démarre l'application avant les tests |
| [`e2e/apply.spec.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v2/kit/steps/08-erasure/e2e/apply.spec.js) | deux parcours : un candidat postule et un recruteur le retrouve ; un nom qui contient du HTML reste du texte (le correctif XSS de l'étape 06) ; les éléments sont trouvés par leur libellé, comme les voit un utilisateur |
| [`.gitea/workflows/ci.yml`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v2/kit/steps/08-erasure/.gitea/workflows/ci.yml) | un job `e2e`, lancé après `checks` (`needs: checks`), dans l'image officielle de Playwright, qui contient les navigateurs, avec sa propre base `rhpilot_e2e` |

> 📖 [Playwright, le serveur web des tests (en anglais)](https://playwright.dev/docs/test-webserver) · [Playwright dans Docker (en anglais)](https://playwright.dev/docs/docker)

La version de `@playwright/test` doit être celle de l'image : 1.65.1. Le test tourne dans le pipeline ; inutile d'installer les navigateurs sur votre poste.

Pour que le job `e2e` bloque lui aussi la fusion, ajoutez le motif `CI / e2e (pull_request)` aux statuts exigés des règles de `develop` et de `main` (**Settings**, **Branches**).

```verify
D=~/byte-layers/quality-day/rhpilot
grep -q 'module.exports' "$D/playwright.config.js" && { echo "playwright.config.js est encore l'ancienne version : relancez la commande de la section 08.4."; exit 1; }
grep -q '"@playwright/test": "1.65.1"' "$D/package.json" || { echo "@playwright/test n'est pas en version 1.65.1 dans package.json."; exit 1; }
grep -q '^  e2e:' "$D/.gitea/workflows/ci.yml" || { echo "Le pipeline n'a pas de job e2e : relancez la commande de la section 08.4."; exit 1; }
echo "Le test de bout en bout est prêt, et branché dans le pipeline."
```

## 08.5 - Relecture et fusion

```exec
cd ~/byte-layers/quality-day/rhpilot && git add -A && git commit -m "Ajoute le droit à l'effacement et le test de bout en bout" && git push
```

Ouvrez la pull request vers `develop` (vérifiez la base : Gitea propose `main`), en citant l'issue, et passez celle-ci en `status/review`. Le pipeline lance `checks`, puis `e2e` : le premier lancement télécharge l'image de Playwright, environ 2 Go, comptez plusieurs minutes.

Avec bob, relisez avec la Definition of Done sous les yeux. Un point mérite une question : l'effacement est **définitif**, sans corbeille ni confirmation. C'est ce que demande la spécification ; si bob veut une confirmation dans l'interface, c'est une nouvelle issue, pas un changement de dernière minute. Approuvez, fusionnez, puis passez l'issue en `status/done` et fermez-la.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
A=http://localhost:3300/api/v1/repos/rhpilot/rhpilot
curl -fs -u "$U" "$A/contents/test/erasure.test.js?ref=develop" >/dev/null || { echo "develop ne contient pas test/erasure.test.js : la pull request n'est pas encore fusionnée."; exit 1; }
R=$(curl -fs -u "$U" "$A/actions/runs?branch=develop&event=push&limit=1")
echo "$R" | grep -q '"status":"completed"' || { echo "Le pipeline de develop tourne encore : attendez qu'il se termine."; exit 1; }
echo "$R" | grep -q '"conclusion":"success"' || { echo "Le dernier pipeline de develop a échoué : ouvrez ses jobs checks et e2e dans l'onglet Actions."; exit 1; }
I=$(curl -fs -u "$U" "$A/issues?state=all&type=issues&labels=type/feature&limit=50")
echo "$I" | grep -q 'status/done' || { echo "L'issue du droit à l'effacement n'a pas le label status/done."; exit 1; }
echo "Le droit à l'effacement est livré dans develop, testé de bout en bout."
```

## 08.6 - Option : livrer la version 1.1.0

En gitflow, une version passe par une branche `release/*`, qui part de `develop` et arrive sur `main`. Créez-la, et changez le numéro de version :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch develop && git pull && git switch -c release/1.1.0 && npm version 1.1.0 --no-git-tag-version && git commit -am "Version 1.1.0" && git push -u origin release/1.1.0
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `npm version 1.1.0 --no-git-tag-version` | écrit la version dans `package.json` et `package-lock.json`, sans créer de commit ni d'étiquette Git : on les fait nous-mêmes |
> | `git commit -am "…"` | commite tous les fichiers suivis et modifiés, ici les deux fichiers de version |
> | `git push -u origin release/1.1.0` | publie la branche sur Gitea |

Ouvrez une pull request de `release/1.1.0` vers `main`, faites-la approuver par bob et fusionnez-la. Créez ensuite l'étiquette `v1.1.0` sur `main`, depuis **Releases**, **New Release**. Pour finir, `develop` doit récupérer le commit de version : une pull request de `main` vers `develop` s'en charge. Le gitflow classique fusionne plutôt `release/1.1.0` dans `develop` ; partir de `main` revient au même ici, et récupère aussi le commit de fusion.

```acknowledge
J'ai livré la version 1.1.0 sur main, ou j'ai choisi de passer cette option.
```

> 💡 **Rattrapage.** Restez sur la branche de l'étape, lancez `sh ~/byte-layers/quality-day/course/kit/catch-up.sh 08`, puis `git add -A && git commit -m "Rattrapage de l'étape 08" && git push`, et terminez par la pull request et la fusion décrites plus haut.
