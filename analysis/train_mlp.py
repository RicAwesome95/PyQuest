"""
Train and evaluate an MLP that predicts: will the student solve the next challenge on the first try?

Works with:
  - simulated_dataset.csv  (from the game's Thesis evaluation -> "Download simulated dataset")
  - real play logs         (PyQuest / Serpent's Dungeon "Download all runs" CSV)

Run:
  pip install pandas scikit-learn
  python train_mlp.py simulated_dataset.csv
"""
import sys
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, brier_score_loss

# ---------- 1. Load the data ----------
path = sys.argv[1] if len(sys.argv) > 1 else "simulated_dataset.csv"
df = pd.read_csv(path)
if "event" in df.columns:                      # real play logs also contain survey / pre-test rows
    df = df[df["event"] == "attempt"]
if "answer_shown" in df.columns:               # drop rooms played with "show answer" on
    df = df[df["answer_shown"] != 1]
if "response_s" in df.columns:                 # drop guess-clicking (too fast to have read the code)
    df = df[df["response_s"] >= 3]

# ---------- 2. Pick the inputs (X) and the label (y) ----------
FEATURES = [c for c in df.columns if c.startswith("f_")]   # the 18 inputs the game computes
X = df[FEATURES].astype(float).values
y = df["label_first_try"].astype(int).values

# ---------- 3. Split by STUDENT, not by row ----------
# the same student must never appear in both train and test
group_col = "learner" if "learner" in df.columns else "participant" if df.get("participant") is not None and df["participant"].notna().any() else "session"
groups = df[group_col].astype(str).values
split = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(split.split(X, y, groups))
X_train, X_test, y_train, y_test = X[train_idx], X[test_idx], y[train_idx], y[test_idx]
print(f"{len(df)} attempts, {len(set(groups))} students -> train {len(train_idx)} / test {len(test_idx)} attempts")

# ---------- 4. Scale the inputs (MLPs train better on similar-sized numbers) ----------
scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)

# ---------- 5. Train the MLP ----------
mlp = MLPClassifier(
    hidden_layer_sizes=(16, 8),   # 2 hidden layers: 16 neurons, then 8
    activation="relu",
    solver="adam",
    learning_rate_init=0.001,
    max_iter=300,
    early_stopping=True,          # stops when validation score stops improving
    random_state=42,
)
mlp.fit(X_train_s, y_train)

# baseline to compare against
logreg = LogisticRegression(max_iter=1000).fit(X_train_s, y_train)

# ---------- 6. Evaluate on students the models never saw ----------
def report(name, model):
    p = model.predict_proba(X_test_s)[:, 1]
    pred = (p >= 0.5).astype(int)
    print(f"{name:20s} acc {accuracy_score(y_test, pred):.3f}  prec {precision_score(y_test, pred, zero_division=0):.3f}  "
          f"rec {recall_score(y_test, pred):.3f}  F1 {f1_score(y_test, pred):.3f}  "
          f"AUC {roc_auc_score(y_test, p):.3f}  Brier {brier_score_loss(y_test, p):.3f}")

print(f"first-try success in test data: {y_test.mean():.1%}")
report("MLP (16-8)", mlp)
report("Logistic regression", logreg)
