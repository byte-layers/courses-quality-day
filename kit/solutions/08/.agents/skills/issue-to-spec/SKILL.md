---
name: issue-to-spec
description: Transforme une issue de la forge en spécification EARS dans specs/. À utiliser quand on reçoit une issue, une demande client ou un besoin flou à implémenter.
---

# De l'issue à la spécification

1. Lis l'issue entière. Note ce qui est demandé, et ce qui manque pour coder sans deviner.
2. S'il manque une information qui change le comportement (qui a le droit, que renvoyer, que garder),
   pose la question au lieu d'inventer la réponse.
3. Écris `specs/<sujet>.md` avec trois parties :
   - **Exigences**, numérotées E1, E2…, une phrase par exigence, chacune selon un motif EARS :
     - Toujours : « Le système doit <réponse>. »
     - Événement : « Quand <déclencheur>, le système doit <réponse>. »
     - Comportement indésirable : « Si <condition>, alors le système doit <réponse>. »
   - **Interface** : la route, ses paramètres, ses réponses.
   - **Hors périmètre** : ce qui n'est pas traité, et à qui le signaler.
4. Chaque exigence doit pouvoir devenir un test. Si tu ne sais pas comment la tester, réécris-la.
5. Ne touche à aucun fichier de code : la spécification se relit et se fusionne avant le code.
