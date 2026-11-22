# Care Atlas: find the right care in India, and know how much to trust it

**CMU DSC × Databricks Datathon, Fall 2026 · Challenge: "Find the right care"**

Team: Joyce, Tim, Daniel · Built entirely on **Databricks Free Edition**

Given a service (dialysis, emergency C-section, cataract surgery, … any of 2,531 services) and a place in India, we recommend nearby facilities, show the evidence behind each recommendation, and say plainly how sure we are.

The data are facility records in which every facility describes itself. A record can say "NICU" or "dialysis" with nothing to back it up. So our core idea is simple: **score every claim by the evidence in the facility's own record, test the score by hand, and only call a claim "Verified" when the evidence is strong.**

---

## Results at a glance

| | |
|---|---|
| Facility × service claims scored | **487,051** (9,986 facilities, 2,531 services) |
| Trust levels | **Verified 35,753 (7%)** · Likely 238,823 (49%) · Claimed only 212,475 (44%) |
| Fair test on unseen rows (round 2) | **11 of 12 Verified were correct, 0 wrong** |
| Data quality | 21% of facilities carry at least one warning; of 50 facilities checked online, 15 websites did not mention the claimed service |
| Care gaps (NFHS-5 districts) | **140 high-need districts** have no Verified emergency C-section or NICU within 100 km (e.g. Bastar 211 km, Rayagada 175 km) |
| Cheapest fix | In **84 districts** a facility within 25 km already *claims* emergency C-section but nobody has verified it; checking those claims would bring trusted care about **125 km closer** |

---

## Pipeline (medallion architecture, all in Unity Catalog `workspace.default`)

```
Marketplace share (Virtue Foundation dataset)
        │
   BRONZE  raw copies, unchanged            notebooks 00, 01
        │
   SILVER  cleaned facilities, locations,   notebooks 02, 03
           data-quality flags
        │
   GOLD    one row per facility × service   notebooks 04 (v1, location lookup), 05 (final v2)
           with trust score, level, evidence, explanation
        │
   ANALYSIS  validation + care gaps          notebook 06
        │
   APP     Care Atlas (Databricks App)      app/
```

| Notebook | What it does | Main output tables |
|---|---|---|
| `01_bronze_explore` | Copies the three Marketplace tables (facilities, India Post PIN directory, NFHS-5 districts) into the workspace without changing them | `bronze_*` |
| `00_bronze_source_inventory` | Profiles the three Bronze tables: schema, columns, row counts | – |
| `01_bronze_daniel` | Daniel's versioned copy of the raw tables | `bronze_*_daniel` |
| `02_silver_joyce` | First cleaning pass (types, names, specialties, contacts) | `silver_facilities_joyce` |
| `03_silver_master` | Final Silver: cleaned fields, location checks against India Post PIN codes, data-quality flags | `silver_facilities` |
| `04_gold_scoring` | Gold **v1** (first scoring rules) and the place → coordinates lookup | `gold_location_lookup`, v1 Gold |
| `05_gold_all_services` | **Final Gold v2**: scores every facility × service, explains each score, search function, all validation rounds | `gold_facility_services`, `gold_services` |
| `06_analysis` | Exploration, validation summary, distance to trusted care per NFHS-5 district, findings and recommendations | `analysis_district_access` |

---

## How a claim is scored

Each facility × service pair starts at 0. The service is matched in each part of the facility's own record.

**Evidence points:** procedure / capability text +30 · equipment +25 · description +15 · listed specialty +10 · concrete numbers ("17 dialysis machines") +10 · several separate statements +10 · large hospital (200+ beds) +10 · 24/7 or emergency wording +5 · size known +5

**Penalties:** dentist or pharmacy claiming a hospital-level service −40 · eye / dental / ENT / skin specialist claiming emergency or maternity care −40 · homeopathy / ayurveda / unani facility claiming modern medicine −30 · record that mixes two facilities −30 · pseudo-science wording −20 · evidence that names a different, similarly-named facility −20 · clinic with no beds claiming a hospital-level service −15 · state mismatch −15 · duplicates, implausible counts, too many specialties −10 each · coordinates far from the PIN code −5

The score is capped to 0–100 and turned into a level:

| Level | Rule | Meaning for a patient |
|---|---|---|
| **Verified** | score ≥ 60, at least 2 independent kinds of evidence, no serious problem, no "different facility" warning | strong evidence in the record |
| **Likely** | score ≥ 35 and at least one direct piece of evidence (procedure, equipment or description) | some direct evidence, not fully confirmed |
| **Claimed only** | everything else | listed, but no real evidence: call before you go |

Every row also has an `explanation` sentence, up to 5 quoted pieces of `evidence`, and the `problems` that cost points, so a recommendation can always be traced back to the facility's own words.

## How we know it works

| Check | Result |
|---|---|
| Round 1: 100 rows scored by v1, checked by hand (website + record) | Verified 75% correct, Likely 56%, Claimed only 33%. The errors were used to design fixes A–G |
| Two reviewers on the same 10 rows | agreed on 9 of 10 |
| **Round 2: 30 unseen rows scored by v2 (the fair test)** | **Verified 11/12 correct, 0 wrong (92%)**; Likely 40%; Claimed only 25% |
| Round 3: 20 rows that became Verified only after fix H | 15 of 19 judged correct, 0 wrong |
| Famous-hospital test | well-known hospitals in the data rank near the top for their known services (e.g. Kidwai and Tata Memorial for cancer treatment) |
| App check (fix I) | an eye hospital appeared as a "Likely" emergency C-section → name-based specialist rule added; 542 rows changed, none of the results above changed |

A higher trust level means a claim is more often confirmed by a human. That is the property the app relies on.

## What we found

1. **Claims cannot be taken at face value.** Only 7% of claims are Verified; 44% have no real evidence.
2. **Trusted life-saving care is far for many districts.** The median NFHS-5 district is 74 km from the nearest Verified emergency C-section, 66 km from a Verified NICU and 61 km from Verified dialysis; 223, 211 and 178 of 655 placed districts are more than 100 km away.
3. **Need and distance overlap.** 140 districts have above-median mother & newborn need (low institutional births, high anaemia in pregnancy) and no Verified emergency C-section or NICU within 100 km. The states with the most such districts are Madhya Pradesh (21), Assam (15), Chhattisgarh (11) and Odisha (10). 82 districts have high blood sugar and no Verified dialysis within 100 km.
4. **Often the gap is verification, not buildings.** In 84 districts a facility within 25 km claims emergency C-section while the nearest Verified one is over 100 km away (median 129 km difference); 31 districts for NICU, 34 for dialysis.

**Recommendations:** verify before you build (start with the 84 / 31 / 34 "unlock" districts); route emergencies by trust level; target new capacity where need is high and no claim exists; tie insurance empanelment (PM-JAY) to the same evidence; ask facilities to publish structured service data ("10 dialysis machines", "20-bed NICU").

## The app: Care Atlas

A Streamlit app deployed as a **Databricks App**, reading the Gold tables live through a SQL warehouse:

- pick a service and a starting point (city, area or PIN), choose a radius;
- results are ranked by `trust_score − 0.2 × distance_km` (0.5 for emergency services), Verified and Likely first, Claimed only in a separate "Unverified claims" section;
- every card shows the trust level, the score, a one-line reason, and a warning when the location may be inaccurate;
- the detail panel shows the quoted evidence, cautions, phone and website.

The app runs inside our Databricks workspace (sign-in required), so it is shown in our video. Its code is in `app/`.

## How to run it yourself (Databricks Free Edition)

1. Get the Marketplace share **databricks_virtue_foundation_dataset_dais_2026** in your workspace.
2. Import the notebooks in `notebooks/` (Workspace → Import).
3. Run them in order on serverless compute: `01_bronze_explore` → (`00_bronze_source_inventory`, optional) → `02_silver_joyce` → `03_silver_master` → `04_gold_scoring` → `05_gold_all_services` → `06_analysis`. Each notebook says at the top which tables it reads and writes.
4. In a workspace that already has the final Gold, do **not** re-run the scoring cells of `04_gold_scoring`: they would overwrite Gold v2 with v1. `05` and `06` are safe to "Run all".

## Limits (stated honestly)

- The system can only judge what is in the dataset: about 10,000 facilities, not every facility in India. "Far from trusted care" means far *within this data*, so the district results are a priority list for verification, not proof that no care exists.
- Trust is based on what a facility writes about itself. A Verified label means strong written evidence, not an inspection.
- About 5% of facilities have coordinates that disagree with their city or PIN code. These are flagged (`flag_location_uncertain`) and shown with a warning; they were not corrected.
- The hand-check samples are small (8–40 rows per level and round), so the percentages are rough.

## Data

- Virtue Foundation facility dataset (Databricks Marketplace, DAIS 2026)
- India Post PIN code directory (place → coordinates, used to check locations)
- NFHS-5 district health indicators (need per district)
