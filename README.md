# FlowAudioEdit Demo

Static GitHub Pages package for the FlowAudioEdit project demo.

This directory intentionally contains only the assets referenced by the active page:

- `index.html`
- `styles.css`
- `script.js`
- `showcase_v6_data.js`
- `showcase_v6_all_samples.csv`
- `audio/showcase_v6/{tangoflux,sa3}/...`

The audio folder includes only the currently displayed examples.

## Deploy

Create a new GitHub repository, then run:

```bash
cd /home/dcase_tsk1/flowaudioedit-github-pages
git init
git add .
git commit -m "Deploy FlowAudioEdit demo"
git branch -M main
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```

In GitHub, enable Pages from `Settings -> Pages -> Deploy from a branch`, then choose `main` and `/root`.
