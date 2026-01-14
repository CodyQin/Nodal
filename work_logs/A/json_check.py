import json
from collections import defaultdict, Counter
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

json_data = {
  # 放入Gemini给出的json格式
}




nodes = json_data.get("nodes", [])
edges = json_data.get("edges", [])
declared_total = json_data.get("total_characters")

node_ids = [n.get("id") for n in nodes]
node_set = set(node_ids)

# 检查节点数是否与角色数一致
print("===== BASIC CHECK =====")
print(f"Declared total_characters: {declared_total}")
print(f"Actual node count: {len(nodes)}")
print("✅ total_characters matches nodes" if declared_total == len(nodes) else "⚠️ MISMATCH: total_characters != actual nodes")
print(f"Total edges: {len(edges)}")
print()


degree = Counter()
missing_endpoints = []

for e in edges:
    s = e.get("source")
    t = e.get("target")
    if s not in node_set:
        missing_endpoints.append(("source", s, e.get("id")))
    if t not in node_set:
        missing_endpoints.append(("target", t, e.get("id")))
    if s in node_set:
        degree[s] += 1
    if t in node_set:
        degree[t] += 1

if missing_endpoints:
    print("⚠️ Edge endpoints reference missing nodes:")
    for side, val, eid in missing_endpoints:
        print(f"  edge={eid} missing {side}={val}")
    print()

print("===== DEGREE (RELATION COUNT) PER CHARACTER =====")
for name, cnt in degree.most_common():
    print(f"{name:25s} : {cnt}")
print()


print("===== CENTRALITY / SIZE CHECK =====")
size_errors = []
centrality_map = {}

for n in nodes:
    cid = n.get("id")
    c = n.get("centrality", 0)
    centrality_map[cid] = c
    size = n.get("visual", {}).get("size")
    expected_size = c * 6 + 10
    if size != expected_size:
        size_errors.append((cid, c, size, expected_size))
# size是否是根据规则计算的
if not size_errors:
    print("✅ All node sizes follow: size = centrality * 6 + 10")
else:
    print("⚠️ Size mismatch found:")
    for cid, c, size, exp in size_errors:
        print(f"{cid} | centrality={c} | size={size} | expected={exp}")
print()


print("===== DEGREE vs CENTRALITY CHECK =====")

# 判断中心度和关系多少是否偏差太大，不过目前看起来比较稳定
DIFF_THRESHOLD = 5
RATIO_HIGH = 2.0
RATIO_LOW = 0.5

rows = []
for nid in node_ids:
    d = degree.get(nid, 0)
    c = centrality_map.get(nid, 0)
    diff = d - c
    ratio = (d / c) if c != 0 else (float("inf") if d > 0 else 1.0)
    flag = []
    if abs(diff) >= DIFF_THRESHOLD:
        flag.append("DIFF_BIG")
    if c != 0 and (ratio >= RATIO_HIGH or ratio <= RATIO_LOW):
        flag.append("RATIO_ODD")
    if c == 0 and d > 0:
        flag.append("CENTRALITY_ZERO_BUT_HAS_EDGES")
    rows.append((nid, d, c, diff, ratio, ",".join(flag)))


rows_sorted = sorted(rows, key=lambda x: abs(x[3]), reverse=True)
print(f"{'Character':25s} {'degree':>6s} {'cent':>6s} {'diff':>6s} {'ratio':>8s}  flags")
for nid, d, c, diff, ratio, flag in rows_sorted:
    ratio_str = f"{ratio:.2f}" if ratio != float("inf") else "inf"
    print(f"{nid:25s} {d:6d} {c:6d} {diff:6d} {ratio_str:>8s}  {flag}")
print()


type_counter = Counter()
type_colors = defaultdict(set)

for e in edges:
    r_type = e.get("relation", {}).get("type", "UNKNOWN")
    color = e.get("visual", {}).get("color", "#999999")
    type_counter[r_type] += 1
    type_colors[r_type].add(color)



# 关系类型分布（柱状图，按颜色上色；若一个type多色→用灰色）
plt.figure()
types = list(type_counter.keys())
counts = [type_counter[t] for t in types]

bar_colors = []
for t in types:
    cs = sorted(list(type_colors[t]))
    if len(cs) == 1:
        bar_colors.append(cs[0])
    else:
        bar_colors.append("#999999")  # mixed colors -> grey

plt.bar(types, counts, color=bar_colors)
plt.xlabel("Relation Type")
plt.ylabel("Count")
plt.title("Relation Type Distribution (colored by type color; mixed=grey)")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()

# 关系类型-颜色 对照表
# 每个 type 一行；如果多色，就画多个色块
plt.figure(figsize=(10, max(3, 0.5 * len(types))))
ax = plt.gca()
ax.set_xlim(0, 10)
ax.set_ylim(0, len(types) + 1)
ax.axis("off")

y = len(types)
for t in types:
    ax.text(0.2, y, f"{t} (n={type_counter[t]})", va="center", fontsize=10)

    # 画色块
    cs = sorted(list(type_colors[t]))
    x0 = 6.0
    w = 0.6
    gap = 0.15
    for i, c in enumerate(cs[:15]):  # 防止极端情况太多颜色
        rect = mpatches.Rectangle((x0 + i * (w + gap), y - 0.25), w, 0.5, facecolor=c, edgecolor="black")
        ax.add_patch(rect)

    # 如果颜色太多，提示
    if len(cs) > 15:
        ax.text(x0 + 15 * (w + gap), y, f"+{len(cs)-15} more", va="center", fontsize=9)

    # 混色警告
    if len(cs) > 1:
        ax.text(9.2, y, "⚠ mixed", va="center", fontsize=10)

    y -= 1

plt.title("Relation Type → Color Swatches")
plt.tight_layout()
plt.show()

print("===== SUMMARY =====")
print(f"Unique relation types: {len(type_counter)}")
mixed = [t for t in type_counter if len(type_colors[t]) > 1]
print(f"Types with mixed colors: {len(mixed)}")
if mixed:
    print("Mixed-color types:", mixed)

print("===== EDGE WEIGHT CHECK (HIGH → LOW) =====")

weighted_edges = []

for e in edges:
    if "weight" not in e:
        continue

    w = e["weight"]
    s = e.get("source", "UNKNOWN")
    t = e.get("target", "UNKNOWN")
    r_type = e.get("relation", {}).get("type", "UNKNOWN")
    eid = e.get("id", "")

    weighted_edges.append((w, s, t, r_type, eid))

if not weighted_edges:
    print("⚠️ No edges with weight found.")
else:
    weighted_edges.sort(key=lambda x: x[0], reverse=True)

    for i, (w, s, t, r_type, eid) in enumerate(weighted_edges, 1):
        print(f"{i:02d}. weight={w:<5} | {s} → {t} | type={r_type} | edge_id={eid}")

    labels = [f"{s}→{t}" for (w, s, t, r_type, eid) in weighted_edges]
    weights = [w for (w, s, t, r_type, eid) in weighted_edges]

# 权重图检查关系是否合适
    plt.figure(figsize=(10, max(4, len(weights) * 0.35)))
    plt.barh(labels, weights)
    plt.gca().invert_yaxis()
    plt.xlabel("Weight")
    plt.title("Edge Weights (High → Low)")
    plt.tight_layout()
    plt.show()
