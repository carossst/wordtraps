# Word Traps Leaderboard Worker

Copie du Worker leaderboard de Pickleball Rules Quiz (version en production),
adaptée à Word Traps. Sert aussi `POST /redeem-code` (codes admin/invité).

## État actuel — ✅ DÉPLOYÉ ET ACTIF (2026-08-27)

- Worker: `https://wt-leaderboard.carolestromboni.workers.dev`
  (`wrangler.jsonc`: name `wt-leaderboard`)
- D1: `wt-leaderboard` (id dans `wrangler.jsonc`), 4 tables — `players`,
  `score_submissions`, `leaderboard_best`, `code_redemptions`
- `src/content-key.js` : answer key des 400 items,
  `LEADERBOARD_CONTENT_VERSION = "3.6-release-400"` (= `content.json` `version`
  = `WT_CONFIG.leaderboard.contentVersion`)
- Origins autorisés: `wordtraps.com` / `www.wordtraps.com` (+ localhost)
- Secrets `ADMIN_CODE` / `GUEST_CODE` définis (valeurs dans le
  `.dev.vars` git-ignoré de ce dossier)
- Frontend **actif** : `WT_CONFIG.leaderboard.apiBaseUrl` renseigné,
  `submitScores: true`. La même URL alimente `storage.js:
  tryRedeemPremiumCodeRemote` (`POST /redeem-code`).
- Les `seedScores` de `config.js` ne s'affichent plus que tant que le
  classement réel est vide (fallback dans `buildWindowRows`).

## Routes

- `GET /leaderboard?window=weekly|all` — top 10 public
- `POST /player` — pseudo + opt-in (device_uuid)
- `DELETE /player?device_uuid=...` — retrait + purge des scores
- `POST /score` — soumission d'une RUN; le score est recalculé côté serveur
  depuis l'answer key; rejets: version de contenu, format, plausibilité
  (durée minimale par réponse, perfect runs improbables), rate limits
- `POST /redeem-code` — vérifie un code admin/guest côté serveur (voir
  "Codes admin et invite" plus bas); ne connaît pas encore les vrais codes
  clients (Stripe) — c'est tracé à part

## Codes admin et invite

`POST /redeem-code` vérifie deux codes spéciaux côté serveur, en plus du
flow client existant (regex locale, pas encore corrigé — c'est le vrai bug
de paywall, suivi à part). Ces deux codes ne sont jamais envoyés au client:
ils vivent uniquement comme secrets Cloudflare.

- `ADMIN_CODE`
  - marche sur autant d'appareils que tu veux, sans limite d'usage
  - à usage interne (tes propres tests)
- `GUEST_CODE`
  - limité à 10 rédemptions au total (compteur côté serveur, table
    `code_redemptions`)
  - au-delà de 10, le Worker répond `403 GUEST_CODE_EXHAUSTED`
  - pour "changer" le code, il suffit de mettre à jour le secret: une
    nouvelle valeur repart automatiquement à 0 usage, puisque le compteur
    est indexé sur la valeur du code, pas sur un nom fixe

Pour les définir (ou les changer):

```bash
npx wrangler secret put ADMIN_CODE
npx wrangler secret put GUEST_CODE
```

Chaque commande demande la valeur en interactif et ne l'affiche jamais dans
les logs. Choisis des chaînes longues et peu devinables (ce ne sont pas des
identifiants publics comme `WT-0000-0000`, donc pas besoin de suivre ce
format).

Côté frontend, le champ "code d'activation" du jeu (`storage.js:
tryRedeemPremiumCodeRemote`) essaie d'abord ce endpoint; si le Worker ne
reconnaît pas le code (ou est injoignable), il retombe sur l'ancienne
vérification locale par format — donc les vrais codes clients (format
`WT-XXXX-XXXX`) continuent de marcher pendant qu'on met en place la
vérification Stripe réelle.

## Redéploiement (déjà fait une fois — pour référence)

```bash
cd leaderboard-worker
# wrangler.jsonc est déjà commité (name wt-leaderboard + database_id)
npx wrangler d1 execute wt-leaderboard --remote --file=./schema.sql   # idempotent
npx wrangler deploy
```

Pour (re)définir les secrets : `npx wrangler secret put ADMIN_CODE` /
`GUEST_CODE`.

Pour désactiver le classement côté jeu : `WT_CONFIG.leaderboard.enabled` ou
`.submitScores` à `false` dans `config.js` (pas besoin de toucher au Worker).

## Contrat contenu <-> Worker

Si `content.json` change (réponses) ou si `leaderboard.contentVersion` change,
mets d'abord à jour `WT_CONFIG.leaderboard.contentVersion` dans `config.js`, puis:

```bash
npm run generate:leaderboard-key   # (= node scripts/generate-leaderboard-content-key.mjs)
```

puis redéploie le Worker. Sans ça, les soumissions sont rejetées en
`CONTENT_VERSION_MISMATCH` (comportement voulu, fail-closed). Le test
`tests/leaderboard-content-contract.test.js` vérifie l'alignement.
