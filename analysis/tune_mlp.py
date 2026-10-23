"""Try several MLP settings on the same student-based split and report mean ± std over 5 seeds.
Run:  python tune_mlp.py simulated_dataset.csv"""
import sys, numpy as np, pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, brier_score_loss

df = pd.read_csv(sys.argv[1] if len(sys.argv) > 1 else "simulated_dataset.csv")
if "event" in df.columns: df = df[df["event"] == "attempt"]
F = [c for c in df.columns if c.startswith("f_")]
X, y = df[F].astype(float).values, df["label_first_try"].astype(int).values
g = df["learner" if "learner" in df.columns else "participant"].astype(str).values
tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42).split(X, y, g))
sc = StandardScaler().fit(X[tr]); Xtr, Xte = sc.transform(X[tr]), sc.transform(X[te])

def score(p):
    return roc_auc_score(y[te], p), accuracy_score(y[te], p >= .5), f1_score(y[te], p >= .5), brier_score_loss(y[te], p)

rows = []
for layers in [(8,), (16,), (16, 8), (32, 16), (64, 32)]:
    for lr in [0.001, 0.01]:
        res = []
        for seed in range(5):
            m = MLPClassifier(hidden_layer_sizes=layers, activation="relu", solver="adam", learning_rate_init=lr,
                              max_iter=300, early_stopping=True, random_state=seed).fit(Xtr, y[tr])
            res.append(score(m.predict_proba(Xte)[:, 1]))
        r = np.array(res)
        rows.append((f"MLP {layers} lr={lr}", *r.mean(0), r[:, 0].std()))
lrm = LogisticRegression(max_iter=1000).fit(Xtr, y[tr]); s = score(lrm.predict_proba(Xte)[:, 1])
rows.append(("Logistic regression", *s, 0.0))
print(f"{'Model':28s} {'AUC':>6s} {'±':>6s} {'Acc':>6s} {'F1':>6s} {'Brier':>6s}")
for name, auc, acc, f1, br, sd in sorted(rows, key=lambda r: -r[1]):
    print(f"{name:28s} {auc:6.3f} {sd:6.3f} {acc:6.3f} {f1:6.3f} {br:6.3f}")
