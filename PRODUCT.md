# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A solo Ayurvedic practitioner (vaidya) who registers, examines and follows up patients themselves,
often in the middle of a consultation. There is no separate front-desk role today.

## Product Purpose
Ayurveda AI helps a vaidya run a consultation: record the patient speaking in Hindi, Marathi or
English, get a transcript and English translation, record the Ashtavidha Pariksha (eight-fold
examination) with red-flag screening, and surface relevant Charaka Samhita verses. An AI summary
screen (planned) will bring these together per patient. Success = less time on paperwork, safer
referrals, and a complete record per patient.

## Positioning
Built for Indian Ayurvedic practice specifically: multilingual voice capture (Hindi/Marathi), the
classical eight-fold examination as structured data, and retrieval from the Charaka Samhita, not
a generic EHR with Ayurvedic labels.

## Operating Context
- Backend: FastAPI + PostgreSQL (`../app`): consultations, audio → transcript → translation,
  append-only doctor edits, Ashtavidha Pariksha + Agni/Mala assessments, verse retrieval (pgvector).
- The backend has no patient entity yet; consultations are not linked to patients.
- This frontend is in its design phase: screens read stub data (`features/<x>/api/*-stubs.ts`),
  no API calls, hook names match the future Orval SDK.

## Capabilities and Constraints
- Patients (this phase): list, create, update, delete. Field set is "standard clinical":
  identity (auto patient ID, name, DOB → age, gender, phone, email, preferred language), address,
  Ayurvedic profile (Prakriti, chief complaint), safety (allergies, existing conditions, current
  medications, blood group), admin (status, registered on, last visit, notes).
- Next: AI summary screen built on the outputs the backend already produces.
- Undecided: how patients link to consultations in the backend; archive vs hard delete policy.

## Brand Commitments
Name "Ayurveda AI" (via `BrandLogo` only). Terminology: vaidya, Prakriti, Ashtavidha Pariksha,
Agni, Mala. Copy in sentence case.

## Evidence on Hand
No real patient data, testimonials or clinic names. Stub data must look realistic but stay fictional.

## Product Principles
1. The vaidya's attention belongs to the patient: every task must be fast mid-consultation.
2. Safety facts (allergies, red flags, medications) are never hidden behind extra clicks.
3. Raw clinical data is never silently overwritten.
4. Classical terminology is used as practitioners use it, not translated away.
