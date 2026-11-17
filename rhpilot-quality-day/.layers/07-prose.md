---
title: "07 - Réduire la prose, protéger les garde-fous"
description: "Classer chaque règle d'AGENTS.md selon ce qui la fait respecter, réécrire AGENTS.md en plan de travail, puis ajouter une skill, des permissions et un hook qui empêche l'agent de toucher aux garde-fous"
---

Relisez les douze règles de l'`AGENTS.md` de l'étape 06. Depuis, beaucoup d'entre elles sont imposées par le code, le lint ou le pipeline. Une règle vérifiée par un outil n'a plus besoin d'être écrite : la prose doit garder ce qu'aucun outil ne vérifie, et dire **comment travailler**. C'est l'étage « prose » de la pyramide, remis à sa place.

Créez la branche de cette étape :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch develop && git pull && git switch -c feature/agent-config
```

## 07.1 - Qui fait respecter chaque règle ?

Pour chacune des douze règles d'`AGENTS.md`, demandez-vous ce qui l'impose **aujourd'hui** dans le projet :

| Catégorie | Veut dire |
|---|---|
| `code` | le code ou le lint l'impose : l'enfreindre fait échouer `npm run lint`, ou empêche l'application de démarrer |
| `hook` | rien ne l'impose encore, mais un hook pourra l'imposer à l'agent : vous l'écrivez en 07.4 |
| `forge` | le pipeline ou la protection de branche l'impose : sans elle, la pull request ne peut pas être fusionnée |
| `prose` | aucun outil ne la vérifie : elle doit rester écrite |

**À vous** : écrivez vos réponses dans `~/byte-layers/quality-day/classement.txt`, une ligne par règle, au format `R1=code`, de `R1` à `R12`.

```hint
Relisez `eslint.config.js` : chaque règle de lint couvre une règle d'`AGENTS.md`. Pour la règle 1, demandez-vous si un outil verrait `query("… " + valeur)` dans une route.
```

```hint
Les règles 6 et 7 interdisent de modifier certains fichiers : ni le lint ni le pipeline ne savent qui a fait une modification. La règle 10 demande de lancer des commandes que le pipeline lance de toute façon.
```

````solution
```text
R1=prose
R2=code
R3=code
R4=code
R5=code
R6=hook
R7=hook
R8=code
R9=code
R10=forge
R11=prose
R12=prose
```

La règle 1 est le piège : `src/db.js` offre des requêtes paramétrées, mais rien n'empêche d'écrire `query("… WHERE nom = '" + q + "'")` dans une route. Ni le lint ni SonarQube Community ne le voient, vous l'avez constaté à l'étape 02. Elle reste donc écrite. La règle 11 est en partie imposée par la forge (pas de push direct sur `develop`), mais pas le nom des branches : `forge` est accepté aussi.
````

```verify
F=~/byte-layers/quality-day/classement.txt
[ -f "$F" ] || { echo "Le fichier $F n'existe pas : créez-le avec une ligne par règle."; exit 1; }
v() { tr -d '\r ' < "$F" | tr 'A-Z' 'a-z' | sed -n "s/^r$1=//p" | tail -1; }
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  case "$(v $i)" in code|hook|forge|prose) ;; *) echo "La ligne R$i manque, ou sa valeur n'est pas code, hook, forge ou prose."; exit 1 ;; esac
done
OK=0; BAD=""
for p in 1:prose 2:code 3:code 4:code 5:code 6:hook 7:hook 8:code 9:code 10:forge 11:prose 12:prose; do
  i=${p%%:*}; e=${p#*:}
  if [ "$(v $i)" = "$e" ] || { [ "$i" = 11 ] && [ "$(v $i)" = forge ]; }; then OK=$((OK+1)); else BAD="$BAD R$i"; fi
done
[ "$OK" -eq 12 ] || { echo "$OK réponses justes sur 12. À revoir :$BAD."; exit 1; }
echo "Les douze règles sont bien classées."
```

## 07.2 - Un AGENTS.md qui devient un plan

Remplacez `AGENTS.md` par la version réduite :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp ~/byte-layers/quality-day/course/kit/steps/07-prose/AGENTS.md . && git diff --stat AGENTS.md
```

Ouvrez-le. Il ne garde que les règles classées `prose` : les requêtes paramétrées, les branches, la langue des messages. Il dit **comment travailler** : une issue devient d'abord une spécification, avec la skill de la section suivante. Il dit aussi ce qui est vérifié à la place de l'agent, et ce qu'il doit faire s'il est bloqué : s'arrêter et expliquer, pas contourner.

Le premier `AGENTS.md` était un **règlement de police**, une liste d'interdictions qu'on espère respectées. Le second est un **plan de travail** : il ne répète pas ce que le code impose déjà, il oriente l'agent vers la bonne démarche.

## 07.3 - Une skill et des permissions

Une **skill** est une procédure que l'agent charge quand il en a besoin. Celle du projet transforme une issue en spécification au format EARS, comme dans le lab [De l’issue floue à la spécification](https://byte-layers.com/fr/labs/issue-to-spec). Les **permissions** disent ce que l'agent peut faire sans demander, ce qu'il doit demander, et ce qui lui est interdit. Copiez les fichiers fournis :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp -R ~/byte-layers/quality-day/course/kit/steps/07-prose/.agents ~/byte-layers/quality-day/course/kit/steps/07-prose/opencode.json .
```

| Fichier | Contenu |
|---|---|
| [`.agents/skills/issue-to-spec/SKILL.md`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/07-prose/.agents/skills/issue-to-spec/SKILL.md) | la skill : lire l'issue, poser les questions manquantes, écrire `specs/<sujet>.md` avec des exigences numérotées, une interface et un hors périmètre |
| [`opencode.json`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/07-prose/opencode.json) | les permissions au format d'OpenCode : `.env` illisible, `package.json` modifiable seulement avec votre accord (valeur `ask`), `npm test` et `npm run lint` libres, toute autre commande sur accord, `git push` interdit |

`.agents/skills/` est l'emplacement de skills que lisent plusieurs agents, dont Kilo Code et OpenCode. Les permissions, elles, n'ont pas de format commun : Kilo Code les lit dans `kilo.jsonc`, sous la même clé `permission`, et Claude Code dans `.claude/settings.json`. Le bit [Où chaque harness range sa configuration](https://byte-layers.com/fr/bits/agent-config-crosswalk) donne le fichier de chaque outil.

```verify
D=~/byte-layers/quality-day/rhpilot
[ -f "$D/.agents/skills/issue-to-spec/SKILL.md" ] || { echo "La skill manque : relancez la commande cp de la section 07.3."; exit 1; }
[ -f "$D/opencode.json" ] || { echo "opencode.json manque : relancez la commande cp de la section 07.3."; exit 1; }
echo "La skill et les permissions sont en place."
```

## 07.4 - Un hook qui protège les garde-fous

Une permission porte sur un outil, parfois restreint à des chemins : `.env` illisible, `package.json` sur accord. Mais un test se modifie par plusieurs outils (édition, écriture, réécriture complète), et chacun demanderait sa règle. Pour refuser **certains** fichiers, quel que soit l'outil d'écriture, on écrit un **hook** : du code appelé avant chaque action de l'agent. Celui-ci refuse toute modification des tests et de la configuration des outils. C'est la règle classée `hook` en 07.1.

Le hook existe en deux versions, car chaque outil a son format : un plugin JavaScript pour OpenCode, et un script shell pour Claude Code. Le kit ne fournit ni hook ni permissions pour Kilo Code ou pour un autre agent : avec eux, seule votre relecture du diff protège les tests, et c'est l'occasion de chercher dans leur documentation l'équivalent. Copiez-les :

```exec
cd ~/byte-layers/quality-day/rhpilot && cp -R ~/byte-layers/quality-day/course/kit/steps/07-prose/.opencode ~/byte-layers/quality-day/course/kit/steps/07-prose/.claude .
```

Le plugin OpenCode, [`.opencode/plugins/protect-guardrails.js`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/07-prose/.opencode/plugins/protect-guardrails.js), se lit ainsi :

| Ligne | Rôle |
|---|---|
| `GUARDED` | des expressions régulières : `test/`, `e2e/`, `.gitea/`, `eslint.config.js`, `sonar-project.properties`, `playwright.config.js` |
| `WRITERS` | les outils qui écrivent : modifier, écrire, appliquer un patch |
| `'tool.execute.before'` | la fonction appelée avant chaque appel d'outil ; `input.tool` donne son nom, `output.args.filePath` le fichier visé |

Pour refuser un appel, le hook lance une erreur : OpenCode n'exécute pas l'outil, et renvoie le message au modèle.

**À vous** : remplacez le `// TODO` par une condition qui lance une erreur, commençant par `Bloqué par le hook`, quand `path` correspond à l'un des motifs de `GUARDED`.

```hint
`GUARDED.some((pattern) => pattern.test(path))` vaut `true` si au moins un motif correspond. Une erreur se lance avec `throw new Error("…")`.
```

````solution
```js
    if (GUARDED.some((pattern) => pattern.test(path))) {
      throw new Error(`Bloqué par le hook : ${path} est un garde-fou. Corrigez le code, ou demandez à un humain.`);
    }
```
````

Testez-le sans modèle, en l'appelant comme le ferait OpenCode, avec deux faux appels : l'un vise un test, l'autre un fichier de `src/`.

```exec
cd ~/byte-layers/quality-day/rhpilot && node --input-type=module -e '
const { ProtectGuardrails } = await import("./.opencode/plugins/protect-guardrails.js");
const hook = (await ProtectGuardrails())["tool.execute.before"];
for (const filePath of ["test/api.test.js", "src/db.js"]) {
  try {
    await hook({ tool: "edit" }, { args: { filePath } });
    console.log("accepté :", filePath);
  } catch (error) {
    console.log("refusé :", error.message);
  }
}'
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `node --input-type=module -e '…'` | exécute le code entre apostrophes comme un module JavaScript |
> | `await import("./.opencode/plugins/…")` | charge votre plugin |
> | `for (const filePath of [...])` | répète l'essai pour chaque fichier de la liste |
> | `hook({ tool: "edit" }, { args: { filePath } })` | appelle le hook comme OpenCode avant une modification |
> | `try { … } catch (error) { … }` | si le hook refuse, affiche son message au lieu d'arrêter le programme |

La réponse attendue :

```text
refusé : Bloqué par le hook : test/api.test.js est un garde-fou. Corrigez le code, ou demandez à un humain.
accepté : src/db.js
```

La version Claude Code fait la même chose dans [`.claude/hooks/protect-guardrails.sh`](https://github.com/byte-layers/courses-quality-day/blob/rhpilot-quality-day/v1/kit/steps/07-prose/.claude/hooks/protect-guardrails.sh), déclarée dans `.claude/settings.json` : Claude Code lui envoie l'appel en JSON, et le **code de sortie 2** bloque l'appel (une réponse JSON avec `permissionDecision` à `deny` le peut aussi). Le lab [Hooks : demander ou garantir](https://byte-layers.com/fr/labs/agent-hooks) détaille les deux formats.

```verify
D=~/byte-layers/quality-day/rhpilot
P="$D/.opencode/plugins/protect-guardrails.js"
[ -f "$P" ] || { echo "Le plugin manque : relancez la commande cp de la section 07.4."; exit 1; }
grep -q 'TODO' "$P" && { echo "Le plugin contient encore le // TODO."; exit 1; }
R=$(cd "$D" && node --input-type=module -e '
const { ProtectGuardrails } = await import("./.opencode/plugins/protect-guardrails.js");
const hook = (await ProtectGuardrails())["tool.execute.before"];
const out = [];
for (const [tool, filePath] of [["edit","test/api.test.js"],["write","/x/rhpilot/.gitea/workflows/ci.yml"],["edit","eslint.config.js"],["edit","src/db.js"],["read","test/api.test.js"]]) {
  try { await hook({ tool }, { args: { filePath } }); out.push("ok"); } catch (e) { out.push(e.message.startsWith("Bloqué par le hook") ? "bloque" : "autre"); }
}
console.log(out.join(","));' 2>&1)
[ "$R" = "bloque,bloque,bloque,ok,ok" ] || { echo "Le hook ne réagit pas comme attendu (résultat : $R). Il doit refuser test/, .gitea/ et eslint.config.js, laisser passer src/db.js et les lectures, et son message doit commencer par Bloqué par le hook."; exit 1; }
(cd "$D" && npm run -s lint >/dev/null 2>&1) || { echo "npm run lint échoue sur le plugin : lancez-le pour lire l'erreur."; exit 1; }
echo "Le hook refuse les modifications des garde-fous, et laisse passer le reste."
```

> ⚖️ **Ce que le hook ne protège pas.** Il regarde les outils d'écriture. Une commande shell comme `sed -i … test/api.test.js` lui échappe : c'est pourquoi `opencode.json` fait demander toute commande autre que les tests et le lint. Et un humain peut toujours modifier un test : c'est voulu, mais dans un commit à part, que la relecture doit repérer.

## 07.5 - Publier

```exec
cd ~/byte-layers/quality-day/rhpilot && git add -A && git commit -m "Configure les agents : AGENTS.md réduit, skill, permissions, hook" && git push -u origin feature/agent-config
```

Ouvrez la pull request vers `develop`, faites-la approuver par bob, puis fusionnez.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
curl -fs -u "$U" "http://localhost:3300/api/v1/repos/rhpilot/rhpilot/contents/.opencode/plugins/protect-guardrails.js?ref=develop" >/dev/null || { echo "develop ne contient pas le plugin : la pull request n'est pas encore fusionnée."; exit 1; }
echo "La configuration des agents est fusionnée dans develop."
```

> 💡 **Rattrapage.** Restez sur la branche de l'étape, lancez `sh ~/byte-layers/quality-day/course/kit/catch-up.sh 07`, puis `git add -A && git commit -m "Rattrapage de l'étape 07" && git push`, et terminez par la pull request et la fusion décrites plus haut.
