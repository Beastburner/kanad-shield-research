# How To Push This To Your GitHub

This folder is already a git repo with one commit. To get it onto your GitHub
(github.com/Beastburner), do ONE of the following.

## Option A — New repo via GitHub CLI (fastest, if you have `gh`)

```bash
cd kanad-shield-research
gh repo create kanad-shield-2026 --private --source=. --remote=origin --push
```

## Option B — New repo manually

1. On github.com, create a new EMPTY repo named `kanad-shield-2026`
   (no README, no .gitignore — it's empty so it doesn't conflict).
2. Then in this folder:

```bash
cd kanad-shield-research
git remote add origin https://github.com/Beastburner/kanad-shield-2026.git
git branch -M main
git push -u origin main
```

(If you use SSH instead:
`git remote add origin git@github.com:Beastburner/kanad-shield-2026.git`)

## Option C — Add to an existing repo

```bash
cd kanad-shield-research
git remote add origin https://github.com/Beastburner/<existing-repo>.git
git push -u origin main
# if the remote already has commits, you may need:
# git pull --rebase origin main   (then resolve, then push)
```

## Notes
- `.gitignore` already excludes `.env`, API keys, and secrets — do NOT commit your
  Indian Kanoon / Groq keys. Put them in a local `.env` (already ignored).
- The first commit is already made as "Beastburner". Adjust author if you want:
  `git commit --amend --author="Your Name <you@email>"` before pushing.
