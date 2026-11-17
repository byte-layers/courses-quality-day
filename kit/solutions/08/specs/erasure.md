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
