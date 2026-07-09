# Word Traps Leaderboard Worker

Copie du Worker leaderboard de Pickleball Rules Quiz (version en production),
adaptée à Word Traps. Noms d'essai: `wt-leaderboard-test`.

Ce README décrit ce que fait le code réellement présent dans ce dossier.

## Etat actuel

- Worker: `src/index.js` — identique au Worker Pickleball déployé, avec:
  - origins autorisés: `wordtraps.com` / `www.wordtraps.com` (+ localhost)
  - answer key Word Traps (400 items) dans `src/content-key.js`
  - `LEADERBOARD_CONTENT_VERSION = "2026-07-09"` (doit matcher
    `WT_CONFIG.leaderboard.contentVersion` dans `config.js`)
- Frontend: branché mais inactif tant que:
  - `WT_CONFIG.leaderboard.apiBaseUrl` est vide
  - `WT_CONFIG.leaderboard.submitScores` est `false`
  - en attendant, la carte landing affiche les seeds locaux (noms d'essai)

## Routes

- `GET /leaderboard?window=weekly|all` — top 10 public
- `POST /player` — pseudo + opt-in (device_uuid)
- `DELETE /player?device_uuid=...` — retrait + purge des scores
- `POST /score` — soumission d'une RUN; le score est recalculé côté serveur
  depuis l'answer key; rejets: version de contenu, format, plausibilité
  (durée minimale par réponse, perfect runs improbables), rate limits

## Déploiement (à faire manuellement)

```bash
cd leaderboard-worker
cp wrangler.jsonc.example wrangler.jsonc
npx wrangler d1 create wt-leaderboard-test   # coller database_id dans wrangler.jsonc
npx wrangler d1 execute wt-leaderboard-test --remote --file=./schema.sql
npx wrangler deploy
```

Puis dans `config.js`:

1. renseigner `leaderboard.apiBaseUrl` avec l'URL du Worker déployé
2. vérifier lecture + création de pseudo en réel
3. passer `leaderboard.submitScores` à `true`
4. retirer les `seedScores` d'essai si tu veux l'état vide honnête

## Contrat contenu <-> Worker

Si `content.json` change (réponses) ou si `leaderboard.contentVersion` change:

```bash
node scripts/generate-leaderboard-content-key.mjs
```

puis redéployer le Worker. Sans ça, les soumissions sont rejetées en
`CONTENT_VERSION_MISMATCH` (comportement voulu, fail-closed).
