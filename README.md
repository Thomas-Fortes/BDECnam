# WEI 2026 — App du BDE

PWA mobile-first pour le week-end d'intégration : inscription en quelques
secondes (sans e-mail), programme avec compte à rebours, classement en temps
réel, espace orga pour distribuer des points et piloter l'événement.

Stack : Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui,
Supabase (Postgres, Auth anonyme, Realtime, Storage), déploiement Vercel.

## 1. Créer le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com/dashboard).
2. **Active l'auth anonyme** : Authentication → Providers → active *Anonymous
   Sign-Ins*. Indispensable, c'est ce qui permet aux participants de
   s'inscrire sans e-mail.
3. Va dans SQL Editor et exécute les fichiers de `supabase/migrations/` **dans
   l'ordre** (0001 → 0007). Chaque fichier est commenté et idempotent au sens
   où il ne doit être exécuté qu'une fois sur un projet neuf.
   - `0001_schema.sql` : tables, types, extension `pgcrypto`.
   - `0002_functions.sql` : fonctions RPC (inscription, PIN orga, etc.).
   - `0003_views.sql` : vues de classement et de lecture publique.
   - `0004_rls.sql` : policies RLS sur toutes les tables.
   - `0005_storage.sql` : buckets Storage (`avatars`, `challenges`,
     `settings`) et leurs policies.
   - `0006_seed_helpers.sql` : fonction réservée au script de seed
     (`service_role` uniquement).
   - `0007_hardening.sql` : durcissement suite à l'audit `get_advisors`
     (search_path, policies RLS optimisées, index FK manquants).
4. Récupère dans *Project Settings → API* : l'URL du projet, la clé `anon`
   et la clé `service_role`.

Si tu préfères le CLI Supabase (`supabase db push`), les mêmes fichiers dans
`supabase/migrations/` fonctionnent tels quels à condition de les lier à ton
projet (`supabase link`).

## 2. Variables d'environnement

Copie `.env.local.example` en `.env.local` et renseigne les valeurs
récupérées à l'étape précédente :

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # uniquement pour le seed, jamais côté client
SEED_WEI_CODE=WEI2026           # code utilisé par `npm run seed`
SEED_ORGA_PIN=1234              # PIN utilisé par `npm run seed`
```

`SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée par
`NEXT_PUBLIC_` et n'est utilisée que par `scripts/seed.ts` (exécuté côté
serveur/local, jamais bundlée dans l'appli).

## 3. Lancer en local

```bash
npm install
npm run seed   # données de démo : 4 équipes, ~30 participants, programme 3 jours…
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Le code du WEI et le
PIN orga de démo sont ceux de `.env.local` (`WEI2026` / `1234` par défaut).

Le script de seed (`scripts/seed.ts`) :
- crée 4 équipes, ~30 participants fictifs (dont 2 déjà marqués orga pour
  tester direct l'espace orga),
- un programme sur 3 jours (transport, repas, activités, soirées),
- quelques points déjà distribués et 2 annonces,
- 2 défis photo actifs.

Il est ré-exécutable : il nettoie les données précédemment seedées (comptes
`*@wei.local` marqués `user_metadata.seed = true`) avant de recréer.

### Notes techniques

- **PWA** : `public/manifest.webmanifest` + `public/sw.js` (cache-first sur
  les assets statiques Next.js, network-first avec repli cache pour le
  reste). Les dernières données affichées (programme, infos, classement)
  sont en plus mises en cache dans `localStorage` côté appli
  (`src/lib/offline-cache.ts`) pour un affichage "hors ligne, données du
  HH:mm" même sans service worker actif.
- **Compte à rebours** : calculé côté client à partir de `starts_at`, jamais
  de requête réseau à chaque seconde.
- **Photos** : recadrées en carré, redimensionnées à 400×400 et compressées
  en WebP côté client avant envoi (`src/lib/image.ts`), pour rester légères
  sur un réseau de camping.
- Les icônes PWA (`public/icons/*.png`, `public/apple-touch-icon.png`) sont
  générées par `npm run generate-icons` — un simple placeholder violet à
  remplacer par le vrai logo du BDE avant la mise en prod.

## 4. Déploiement sur Vercel

1. Pousse le repo sur GitHub/GitLab, importe-le dans
   [Vercel](https://vercel.com/new).
2. Renseigne dans *Project Settings → Environment Variables* :
   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pas besoin
   de `SUPABASE_SERVICE_ROLE_KEY` en prod, sauf si tu relances le seed depuis
   un environnement CI).
3. Déploie. Les migrations et le seed se font côté Supabase, pas au build.
4. Une fois en prod, ouvre le site sur un téléphone et utilise "Ajouter à
   l'écran d'accueil" (Android/Chrome) ou "Sur l'écran d'accueil" (Safari
   iOS) pour l'installer comme une app.

## 5. Changer le code du WEI et le PIN orga

Les deux sont hashés en base (`pgcrypto`, jamais stockés en clair) et ne se
changent jamais depuis le front en clair :

- **Depuis l'appli**, une fois connecté en orga : Profil → Espace orga →
  Réglages → *Code du WEI* / *PIN orga*. Ça appelle les fonctions RPC
  `set_wei_code` / `set_orga_pin`, réservées aux comptes présents dans la
  table `organizers`.
- **Depuis le SQL Editor Supabase**, en dépannage :
  ```sql
  select set_wei_code('NOUVEAU_CODE');
  select set_orga_pin('1234');
  ```
  (à exécuter authentifié en tant qu'un utilisateur déjà orga, ou directement
  en tant que `postgres`/`service_role` qui bypass la vérification RLS des
  RPC `security definer`).

Le PIN orga a un anti-bruteforce intégré : 5 tentatives puis blocage de 15
minutes par compte (table `orga_pin_attempts`, RPC `verify_orga_pin`).

## 6. Après le WEI

Depuis Orga → Réglages → *Supprimer toutes les photos* : remet toutes les
`photo_path` à `null` (avatars + soumissions de défis) et vide les buckets
Storage `avatars`/`challenges`. Utilise ce bouton une fois l'événement
terminé, conformément à la mention RGPD affichée à l'inscription.

## 7. Arborescence

```
supabase/migrations/   migrations SQL (schéma, RPC, vues, RLS, storage)
scripts/seed.ts         script de seed (service role)
src/app/                pages (inscription, accueil, programme, classement,
                         infos, profil, espace orga sous /orga)
src/components/         composants partagés (avatar, activité, classement,
                         layout, orga…) + primitives shadcn/ui dans ui/
src/hooks/               hooks de données (participant, classement temps
                         réel, activités, annonces, défis photo…)
src/lib/                 clients Supabase, auth, temps/fuseaux, images,
                         constantes, types
```

## 8. Limites connues / à compléter par le BDE

- Les valeurs d'événement (nom, dates, adresse, contacts…) sont des données
  de démo injectées par `npm run seed` — à changer depuis Orga → Réglages
  une fois le vrai projet Supabase en place.
- Les icônes PWA sont un placeholder généré, pas le logo du BDE.
- Le re-rattachement d'un participant qui change de téléphone se fait par
  réinscription + fusion des doublons (Orga → Participants → sélectionner 2
  profils → Fusionner), comme prévu au cahier des charges plutôt qu'une
  ré-association de session.
