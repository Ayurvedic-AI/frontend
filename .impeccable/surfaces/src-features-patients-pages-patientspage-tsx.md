---
version: 1
slug: "src-features-patients-pages-patientspage-tsx"
primary_target: "src/features/patients/pages/PatientsPage.tsx"
related_targets: []
---

# Patients (register)

Scope: `/patients` list + add/edit drawer + delete. Mode: Operate.
Audience: solo vaidya, often mid-consultation. Task: find a patient fast, check safety facts, add/edit/delete.
Constraints: design-phase stubs only; common components only; tokens only.

## Direction contract

Seed: 21f8d5ba (surface, operate) · chosen: register (THE ROLL)

THESIS: The clinic's OPD register made live. A dense, scannable register, not a card wall or a generic admin table with safety buried in a detail view.

OWN-WORLD: The system world (see the app-shell brief): verdigris teal band and actions, copper bar only for the current place, warm-white page with white table surface, Mukta type, tabular figures for Reg. No., age and dates. Amber caution pills with an alert icon for allergies; red reserved for red flags and errors.

STORY: The vaidya sees who is registered, who was seen recently, and who carries an allergy, without opening anything.

FIRST VIEWPORT: Top nav (Patients active) → title + count + Add patient → search (name, phone, Reg. No.) with status and Prakriti filters → register table: Patient (name, Reg. No. · phone) · Allergies · Age/Sex · Prakriti · Last visit · actions → pagination.

SIGNATURE MOVE: The safety column. Allergies render as amber caution pills that never truncate; "None recorded" reads quietly; it sits right after the name on desktop; below md the column is hidden and the same uncut pills move under the patient's name, so safety facts show once and are never clipped.

RISK: Column count at small widths; mitigated by horizontal scroll inside the table container and by merging phone under the name.
