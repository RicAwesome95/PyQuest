# PyQuest

An educational programming game where a **Multilayer Perceptron (MLP)** picks Python code-tracing challenges matched to each player's skill.

Thesis project for CCS9 Thesis Writing 1, University of the Cordilleras (CITCS 3B-A):

> **Multilayer Perceptron-Based Dynamic Difficulty Adjustment with Procedurally Generated Python Code-Tracing Challenges in an Educational Programming Game for Computer Science Students**

Team: Ric D. Armando · Van Casey Louis R. Beligan

## Play

- **Online:** turn on GitHub Pages for this repository (see below), then open `https://<your-username>.github.io/<repo-name>/`
- **Offline:** download the repository and open `index.html` in any modern browser. No install, no internet needed.

## How it works

1. **Pre-test:** 15 Python code-tracing questions, one per level, the same for every player. The game never uses these answers. They are only for checking the difficulty match afterward.
2. **Play:** fight monsters and bosses by predicting what Python code prints. A boss needs 3 correct answers.
3. **After every answer:**
   - The game generates about 14 candidate challenges from 34 program templates, at levels within 3 of the last one.
   - The MLP predicts the player's chance of solving each one on the first try.
   - The game serves the candidate closest to **85%**. Every 5th challenge is picked at random (an exploration question) so prediction accuracy can be measured fairly.
4. **Survey:** after each boss, players rate the difficulty from 1 (too easy) to 5 (too hard).

**The MLP:**
- Shape: 18 inputs → 16 → 8 → 1, with ReLU, a sigmoid output, Adam and binary cross-entropy.
- It is pretrained in the browser on simulated learners and keeps learning from each answer during play.

**Baselines compared:** a rule-based staircase, logistic regression and Bayesian Knowledge Tracing (BKT). You can run them from the **Thesis evaluation** screen.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | The complete game in one file (built from `src/`) |
| `src/` | Source parts: `head.html`, `style.css`, `body.html`, `game.js` (generator, interpreter, models, simulation, game), `tail.html` |
| `src/build.py` | Rebuilds `index.html` from `src/` |
| `analysis/train_mlp.py` | Trains and evaluates the MLP vs. logistic regression on a CSV (split by student) |
| `analysis/tune_mlp.py` | Compares MLP settings over 5 seeds |
| `analysis/simulated_dataset.csv` | 9,600 simulated attempts to practice on |
| `prototypes/` | Earlier side prototypes (Serpent's Dungeon code builder, PyFill), not the thesis version |

## Editing the game

1. Edit the files in `src/`. Most logic is in `src/game.js`.
2. Rebuild: `python src/build.py`
3. Open `index.html` to test, then commit both `src/` and `index.html`.

## Running the analysis

```
pip install pandas scikit-learn
python analysis/train_mlp.py analysis/simulated_dataset.csv
python analysis/tune_mlp.py analysis/simulated_dataset.csv
```

The scripts also read the game's own CSV export (**Download all runs on this device**).

## Data and privacy

- Play logs are stored only in the player's browser (localStorage) until someone downloads the CSV.
- **Never commit real participant data** to this repository. Use participant codes (P01, P02…) and keep the name list private.
- Study participants must be 18+ and give consent.

## Turning on GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Pick the **main** branch and the **/ (root)** folder, then click **Save**.
4. The site appears at `https://<your-username>.github.io/<repo-name>/` within a minute or two.
