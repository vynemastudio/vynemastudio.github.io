# vynemastudio.github.io

User site for Vynema Studio, served at https://vynemastudio.github.io/. It holds **guide pages only**.

## Convention

- **Guide pages live here** at `/<film-slug>/` (one folder per film, e.g. `my-film/index.html`). Link them from the root `index.html`, and use the shared `/assets/style.css` for branding (bg `#0B0E13`, accent `#C5FF4A`, text `#F5F5F2`, Space Grotesk and Space Mono).
- **Installable tools and skills get their own repo** (e.g. [`vynemastudio/vibe-check`](https://github.com/vynemastudio/vibe-check)). That repo's own Pages site serves at `https://vynemastudio.github.io/<repo-name>/`, including its `install.sh`. A film's guide page links to its tool repo.
- **A film slug must never collide with a tool repo name served by its own project Pages.** If this repo had a `vibe-check/` folder, it would clash with the vibe-check project site and could break `https://vynemastudio.github.io/vibe-check/install.sh`. So **never add a `vibe-check/` folder here.** Before adding a folder, check that no repo under `vynemastudio` has that name with Pages enabled.

## Current guides

| Film / tool | Guide | Repo |
|---|---|---|
| Vibe Check | https://vynemastudio.github.io/vibe-check/ (served by the vibe-check repo) | https://github.com/vynemastudio/vibe-check |
| Undersea Cables | https://vynemastudio.github.io/undersea-cables/ | – (guide only) |
| The Content Explosion | https://vynemastudio.github.io/content-explosion/ | – (guide only) |

`.nojekyll` is present so files are served as-is.
