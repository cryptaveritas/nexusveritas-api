# Archived: pre-archetype era + one-off patches (2026-06-10/12)

pipeline.sh + enrich_creators.js: an earlier pipeline architecture
(find_tokens -> enrich_creators -> find_hubs L1 clustering -> build_graph L2
graph) — predates operator_classify.js / vector_v2 / the creators table
entirely. Superseded by the archetype+vector approach (2026-06-12+) and the
current manual round-based workflow using enrich_parallel.js (2026-06-14+).

fix_pipeline.js, fix_tokens.js, fix_infra_hub.js, patch_classifier.js,
patch_timeout.js: self-modifying one-time patch scripts (read target file,
apply text transformation, write back) — already applied, do not re-run.

check_tmp.js, check_creators.js, outgoing.js, outgoing_tmp.js, snap.js: ad-hoc
RPC diagnostic scripts from early exploration.

Kept for historical reference only.
