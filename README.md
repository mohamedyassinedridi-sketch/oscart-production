# 🎬 OSC'ART Production — Site web officiel

Site vitrine professionnel pour la société de production audiovisuelle **OSC'ART Production**.

## 📂 Structure

```
oscar-production/
├── index.html          ← Accueil (hero, showreel, services, projets vedettes, CTA)
├── services.html       ← 6 services détaillés (Films, Clips, Documentaires, Pub, Événementiel, Post-prod)
├── portfolio.html      ← Portfolio filtrable + lightbox vidéo
├── about.html          ← Histoire, valeurs, équipe
├── contact.html        ← Coordonnées + formulaire (Formspree / mailto)
├── admin.html          ← Panneau d'administration local (édition rapide)
├── cms/                ← CMS en ligne Decap (édite via GitHub)
├── api/                ← Fonctions Vercel : pont OAuth GitHub pour le CMS
├── data/
│   ├── site.json       ← Coordonnées, réseaux sociaux, stats, showreel, logo
│   ├── portfolio.json  ← Projets (titre, catégorie, image, vidéo...)
│   ├── team.json       ← Membres de l'équipe
│   └── services.json   ← Cartes de services + détails page Services
├── css/style.css       ← Style unique (design sombre cinéma, doré, responsive)
└── js/
    ├── main.js         ← Header sticky, menu mobile, filtres, lightbox, formulaire
    └── site-data.js    ← Moteur : charge data/*.json et remplit toutes les pages
```

## ✏️ Modifier le contenu du site

**3 façons, de la plus simple à la plus pro :**

1. **`admin.html`** (local) — ouvrez la page, modifiez tout (coordonnées, réseaux,
   stats, showreel, logo, projets, équipe, services), cliquez **Enregistrer**.
   ⚠️ Les changements restent dans votre navigateur → utilisez **Exporter**
   puis transmettez le JSON si besoin.
2. **Fichiers `data/*.json`** — éditez directement les valeurs et redéployez.
3. **CMS en ligne `cms/`** — après configuration GitHub+Vercel (voir plus bas),
   éditez depuis n'importe quel navigateur ; chaque publication commite dans
   GitHub et redéploie Vercel automatiquement.

## ✅ À REMPLACER (balisez dans les fichiers)

Tous les `[À REMPLACER]` doivent être remplacés par vos vraies données :

| Quoi | Où |
|---|---|
| Coordonnées (téléphone, email, adresse) | Toutes les pages (footer + contact) |
| Liens réseaux sociaux | Footer de chaque page + section contact |
| Logo (image ou SVG) | `images/logo.svg` + remplacer l'emoji 🎬 dans `<span class="logo-mark">` |
| Statistiques (projets, clients, prix, années) | Section `.hero-stats` de index.html |
| Vidéo showreel | `index.html` — `iframe src="about:blank"` + `src` YouTube/Vimeo |
| Vignettes portfolio | Remplacer les vignettes CSS par vos images ou screenshots dans `images/` |
| Iframes projets | `portfolio.html` — `.lb-frame` + placeholder |
| Compte Formspree | `contact.html` — `action="https://formspree.io/f/VOTRE_ID"` |
| Contenu équipe | `about.html` — `.member` (noms, bios, photos) |
| Mentions légales & RGPD | `mentions-legales.html` (à créer) |

## 🚀 Déploiement sur Vercel (recommandé)

### Étape 1 — Mettre le site sur GitHub
1. Créez un dépôt sur https://github.com/new (ex. `oscart-production`, **public**)
2. Uploadez tout ce dossier :
   ```bash
   git init && git add . && git commit -m "Site OSC'ART Production"
   git remote add origin https://github.com/VOTRE_COMPTE/oscart-production.git
   git push -u origin main
   ```

### Étape 2 — Importer dans Vercel
1. Allez sur https://vercel.com/new et connectez votre GitHub
2. **Importez** le dépôt `oscart-production`
3. Framework Preset : **Other** (aucune config nécessaire) → **Deploy**
4. Votre site est en ligne : `https://oscart-production.vercel.app`

### Étape 3 — Activer le CMS en ligne (éditer depuis n'importe où)
1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name : `OSC'ART CMS`
   - Homepage URL : `https://VOTRE-PROJET.vercel.app`
   - Callback URL : `https://VOTRE-PROJET.vercel.app/api/callback`
   - Notez le **Client ID** puis générez un **Client Secret**
2. Dans `cms/index.html`, remplacez `VOTRE_COMPTE/VOTRE_REPO` par `VOTRE_COMPTE/oscart-production` (et poussez la modification)
3. Sur Vercel : **Settings → Environment Variables**, ajoutez :
   - `GITHUB_CLIENT_ID` = votre Client ID
   - `GITHUB_CLIENT_SECRET` = votre Client Secret
4. Redéployez, puis ouvrez `https://VOTRE-PROJET.vercel.app/cms/`
5. Connectez-vous avec GitHub → modifiez → **Publish** → le site se redéploie tout seul ✨

### Autres options d'hébergement
| Option | Comment |
|---|---|
| Netlify | Glissez-déposez le dossier sur https://app.netlify.com/drop |
| OVH / hébergeur classique | ZIP + upload FTP du contenu dans `/www/` |
| GitHub Pages | Push + Settings → Pages → branche `main` |

> ℹ️ Le panneau local `admin.html` fonctionne partout, mais ses modifications ne
> vivent que dans votre navigateur. Pour un site administrable en ligne par
> plusieurs personnes : utilisez le **CMS (`/cms/`)**.

## 🎨 Personnalisation rapide

- **Couleurs** : variables CSS en haut de `css/style.css` (`--gold`, `--bg`, `--accent`…)
- **Logo** : remplacer l'emoji 🎬 dans le header et le footer par votre `<img src="images/logo.svg">`
- **Police** : Google Fonts Playfair Display (titres) + Inter (texte). Remplaçables.
- **Hero background** : modifier `.hero-bg::after` (bandes de motifs) ou fournir une image en `<div class="hero-bg" style="background-image:url(images/hero.jpg)">`

## 🧰 Pour aller plus loin

- Ajouter une page **actualités/blog** (`news.html`)
- Ajouter un **espace privé clients** (galeries de rushes signées)
- Activer un **vrai back-office** (Strapi / Sanity) si vous voulez modifier depuis un navigateur
- SEO : créer un `sitemap.xml` + `robots.txt` + Google Search Console

---
© Oscar Production — Tous droits réservés.
