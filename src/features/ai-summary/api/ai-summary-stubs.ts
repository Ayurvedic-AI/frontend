/**
 * Design-phase AI summary stubs — stand-ins for the Orval-generated consultation endpoints.
 * Response shapes copy the FastAPI app (backend/app/main.py) exactly:
 *   GET /consultations/{cid}/transcripts   → Transcript[]
 *   GET /consultations/{cid}/examination   → Examination | {}
 *   GET /consultations/{cid}/verses        → VersesResult (400 when there is nothing to search)
 * The red flags, queries and verses below are real output of the backend's triage + Charaka retrieval
 * (app/triage.py, app/rag.py) run on these fictional cases — not hand-written.
 * NOT yet in the backend: GET /consultations (list) and the consultation → patient link.
 */
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ApiError } from '../../../api/client';

// ── Types (mirror backend/app/main.py responses) ────────────────────────────
export interface Transcript {
  transcript_id: number;
  speaker: string;
  language: 'hi' | 'mr' | 'en' | string;
  raw_text: string;
  /** Latest vaidya edit of the original, if any. */
  edited_text: string | null;
  translation_id: number | null;
  translated_text: string | null;
  /** Latest vaidya edit of the English text, if any. */
  edited_translation: string | null;
}

export type FindingValue = string | number | boolean | string[];
/** {section: {field: value}}; keys per backend/app/pariksha.py. */
export type Findings = Record<string, Record<string, FindingValue>>;

export interface Examination {
  id: number;
  examiner: string;
  findings: Findings;
  recorded_at: string;
}

export interface Verse {
  /** "<sthana> <chapter>.<verse_id>", e.g. "Cikitsasthana 26.8". */
  ref: string;
  /** Which query clauses retrieved it ("patient says", "stool", …). */
  matched: string[];
  text: string;
}

export interface VersesResult {
  urgent: boolean;
  red_flags: string[];
  advice: string | null;
  queries: string[];
  verses: Verse[];
}

/** Proposed list endpoint (not in the backend yet). */
export interface ConsultationListItem {
  id: number;
  patient_id: string;
  created_at: string;
  urgent: boolean;
}

// ── Seed data ───────────────────────────────────────────────────────────────
const at = (daysAgo: number, time: string) =>
  `${dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD')}T${time}:00`;

const CONSULTATIONS: ConsultationListItem[] = [
  { id: 104, patient_id: 'AYU-0001', created_at: at(0, '11:15'), urgent: false },
  { id: 103, patient_id: 'AYU-0014', created_at: at(0, '10:30'), urgent: false },
  { id: 102, patient_id: 'AYU-0013', created_at: at(0, '09:45'), urgent: true },
  { id: 101, patient_id: 'AYU-0012', created_at: at(1, '17:05'), urgent: false },
];

const DATA: {
  transcripts: Record<number, Transcript[]>;
  exams: Record<number, Examination | Record<string, never>>;
  verses: Record<number, VersesResult>;
} = {
  "transcripts": {
    103: [
      {
        "transcript_id": 31,
        "speaker": "patient",
        "language": "mr",
        "raw_text": "सकाळी उठल्यावर दोन्ही गुडघे खूप आखडतात, चालायला सुरुवात केल्यावर थोडं बरं वाटतं. थंडीत दुखणं वाढतं.",
        "edited_text": null,
        "translation_id": 31,
        "translated_text": "Both my knees are very stiff when I wake up in the morning, it gets a little better once I start walking. The pain increases in cold weather.",
        "edited_translation": null
      },
      {
        "transcript_id": 32,
        "speaker": "patient",
        "language": "mr",
        "raw_text": "शौचाला कडक होते आणि एक दिवसाआड जाते. संध्याकाळी पोट फुगल्यासारखं वाटतं.",
        "edited_text": null,
        "translation_id": 32,
        "translated_text": "Stool is hard and I go every other day. In the evening the stomach feels swollen.",
        "edited_translation": "My stools are hard and I go only every second day. My stomach feels bloated in the evening."
      }
    ],
    102: [
      {
        "transcript_id": 21,
        "speaker": "patient",
        "language": "hi",
        "raw_text": "सीढ़ियाँ चढ़ते समय साँस फूल जाती है, और पिछले दो हफ़्ते से टखनों में सूजन है। रात को दो तकिए लगाकर सोता हूँ।",
        "edited_text": null,
        "translation_id": 21,
        "translated_text": "I get breathless while climbing stairs, and my ankles have been swollen for the last two weeks. At night I sleep with two pillows.",
        "edited_translation": null
      }
    ],
    101: [
      {
        "transcript_id": 11,
        "speaker": "patient",
        "language": "en",
        "raw_text": "I get a burning feeling in my chest and throat about an hour after lunch, especially after spicy food or tea. Sometimes sour water comes up at night.",
        "edited_text": null,
        "translation_id": null,
        "translated_text": null,
        "edited_translation": null
      }
    ],
    104: []
  },
  "exams": {
    103: {
      "id": 53,
      "examiner": "dr.demo",
      "findings": {
        "nadi": {
          "pulse_rate": 78,
          "rhythm": "regular",
          "strength": "moderate",
          "dosha_observation": "vata-pitta",
          "method": "manual"
        },
        "mala": {
          "frequency_per_day": 0,
          "consistency": "hard",
          "bowel_pattern": "constipation",
          "incomplete_evacuation": true
        },
        "jihva": {
          "colour": "pink",
          "coating": "white",
          "moisture": "dry",
          "cracks": true
        },
        "sparsha": {
          "temperature": "normal",
          "skin": "dry",
          "tenderness": true,
          "texture": "rough",
          "notes": "tenderness over both knee joints, crepitus on flexion"
        },
        "akriti": {
          "build": "lean",
          "nourishment": "normal",
          "gait": "normal",
          "strength": "moderate"
        },
        "agni": {
          "agni": "vishamagni",
          "symptoms": [
            "bloating/gas",
            "irregular hunger"
          ]
        },
        "mala_assessment": {
          "frequency": "less than once daily",
          "consistency": "hard/dry",
          "concerns": [
            "constipation",
            "bloating/gas"
          ],
          "dosha_pattern": "vata"
        }
      },
      "recorded_at": at(0, '10:42')
    },
    102: {
      "id": 52,
      "examiner": "dr.demo",
      "findings": {
        "nadi": {
          "pulse_rate": 104,
          "rhythm": "irregular",
          "strength": "weak",
          "dosha_observation": "kapha",
          "method": "manual"
        },
        "shabda": {
          "voice": "weak",
          "speech_comfort": "effortful",
          "breathless_while_speaking": true
        },
        "sparsha": {
          "temperature": "normal",
          "skin": "normal",
          "oedema": true,
          "notes": "pitting oedema both ankles"
        },
        "akriti": {
          "build": "heavy",
          "nourishment": "over",
          "oedema": true,
          "strength": "weak"
        },
        "agni": {
          "agni": "mandagni",
          "symptoms": [
            "heaviness after meals",
            "low appetite"
          ]
        }
      },
      "recorded_at": at(0, '09:58')
    },
    101: {
      "id": 51,
      "examiner": "dr.demo",
      "findings": {
        "nadi": {
          "pulse_rate": 82,
          "rhythm": "regular",
          "strength": "strong",
          "dosha_observation": "pitta",
          "method": "manual"
        },
        "jihva": {
          "colour": "red",
          "coating": "yellow",
          "moisture": "normal"
        },
        "sparsha": {
          "temperature": "warm",
          "skin": "oily",
          "sweating": "excess"
        },
        "agni": {
          "agni": "tikshnagni",
          "symptoms": [
            "acidity/burning"
          ]
        },
        "mala_assessment": {
          "frequency": "more than once daily",
          "consistency": "loose/watery",
          "concerns": [
            "none"
          ],
          "dosha_pattern": "pitta"
        }
      },
      "recorded_at": at(1, '17:20')
    },
    104: {}
  },
  "verses": {
    103: {
      "urgent": false,
      "red_flags": [],
      "advice": null,
      "queries": [
        "patient says: Both my knees are very stiff when I wake up in the morning, it gets a little better once I start walking. The pain increases in cold weather. My stools are hard and I go only every second day. My stomach feels bloated in the evening.",
        "pulse: pulse rate 78, dosha observation vata-pitta",
        "stool: consistency hard, bowel pattern constipation, incomplete evacuation",
        "tongue: colour pink, coating white, moisture dry, cracks",
        "touch: skin dry, tenderness, texture rough, notes tenderness over both knee joints, crepitus on flexion",
        "appetite & digestion: agni vishamagni, symptoms bloating/gas irregular hunger",
        "bowel habit: frequency less than once daily, consistency hard/dry, concerns constipation bloating/gas, dosha pattern vata"
      ],
      "verses": [
        {
          "ref": "Cikitsasthana 26.8",
          "matched": [
            "patient says",
            "stool",
            "touch"
          ],
          "text": "The patient passes, with difficulty and after a long delay, dry stools or stools that are thin, dry, rough and cold. There follow the disorders of fever, dysuria, dysentery, gastric disorders and assimilation disorders."
        },
        {
          "ref": "Cikitsasthana 19.5",
          "matched": [
            "patient says"
          ],
          "text": "The patient may pass stools that are fully digested or hardened, in very scanty measure, attended with sound and colicky pain, that is frothy and slimy and accompanied with griping pain, horripilation, groans, parching of the mouth, pain in the waist, thigh, hips, knees, back and sides and attended with prolapse of rectum. He passes stools frequently in scybalous masses owing to morbid Vata. Some call it scybalous diarrhea as the stools contain scybalous masses due to Vata."
        },
        {
          "ref": "Cikitsasthana 15.59-64",
          "matched": [
            "patient says",
            "appetite & digestion"
          ],
          "text": "By pungent, bitter, astringent, very dry and cold articles of diet, or measured and limited diet, by fasting, excessive wayfaring, suppression, of the natural urges and excessive sexual indulgence, the Vata gets provoked and shrouding the gastric fire, renders it weak. In such a condition, the food is digested painfully. There is acid fermentation, roughness of limbs, dryness of throat and mouth, increase of hunger and thirst, faintness, noises in the ear and, frequent attacks of pain in the sides, thighs, groins and the neck. There is acute gastro-intestinal irritation, cardiac pain, emaciation, debility, dysgeusia, griping pain, craving for all kinds of tastes, asthenia of the mind, distension of stomach during and at the end ofdigestion, and relief after taking food. The condition of the patient may lead to a suspicion of Gulma of the Vata type, stomach-disorder or splenic disorder. In condition due to Vata, the patient passes stools frequently with painful straining for a long time and accompanied with sounds. The stools are liquid, dry, thin, undigested and frothy; and the patient is afflicted with cough and dyspnea."
        },
        {
          "ref": "Cikitsasthana 15.53",
          "matched": [
            "patient says",
            "stool"
          ],
          "text": "The patient passes stools which are large and hard or liquid. He is afflicted with thirst, anorexia, dysgeusia, ptyalism and asthma;"
        },
        {
          "ref": "Cikitsasthana 19.9-(2)",
          "matched": [
            "patient says",
            "stool"
          ],
          "text": "If the blood and other bodyelements are excessively vitiated, the stools are yellow, green, blue, coffee-brown, of the color of flesh-washed water, red, black, white or of the color of hog’s fat; the patient passes stools with much pain or slight pain. The above colors are seen individually or combined. The patient passes indeterminately hard and undigested stools or even digested stools. He may not suffer from great loss of flesh, blood or vitality, his gastric fire gets dull; he suffers loss of taste in the mouth. Such a case is to be known as of a formidable type."
        }
      ]
    },
    102: {
      "urgent": true,
      "red_flags": [
        "chest pain or breathlessness",
        "breathless while speaking"
      ],
      "advice": "Red flags present: assess for urgent medical care before any Ayurvedic interpretation.",
      "queries": [
        "patient says: I get breathless while climbing stairs, and my ankles have been swollen for the last two weeks. At night I sleep with two pillows.",
        "pulse: pulse rate 104, rhythm irregular, strength weak, dosha observation kapha",
        "voice: voice weak, speech comfort effortful, breathless while speaking",
        "touch: oedema, notes pitting oedema both ankles",
        "build: build heavy, nourishment over, oedema, strength weak",
        "appetite & digestion: agni mandagni, symptoms heaviness after meals low appetite"
      ],
      "verses": [
        {
          "ref": "Cikitsasthana 5.51-51½",
          "matched": [
            "patient says",
            "touch"
          ],
          "text": "On finding the swelling to be hard and protuberant and accompanied with constipation and obstipation, it shoved be first skilfully sweated and on its being sweated, the physician should try to get the swelling dissolved by finger-massage."
        },
        {
          "ref": "Cikitsasthana 12.8",
          "matched": [
            "patient says",
            "touch"
          ],
          "text": "When the morbid Vata, having reached the peripheral vessels, vitiates the Kapha, the blood and the Pitta, and getting obstructed by them tries to spread in the body, it causes edema with its pathognomic symptom of swelling."
        },
        {
          "ref": "Sutrasthana 21.58",
          "matched": [
            "patient says"
          ],
          "text": "There is a sleep born of tamas and a sleep born of Kapha; there is a sleep born of the weariness of mind and body; there is a sleep which forebodes diseases; there is also a sleep which comes in the wake of disease. There is, finally, the sleep which is born of the very nature of the night."
        },
        {
          "ref": "Siddhisthana 9.48½",
          "matched": [
            "patient says"
          ],
          "text": "When the bladder is twisted and displaced, there will occur cardiac distress, fainting and dyspnea"
        },
        {
          "ref": "Sutrasthana 21.59",
          "matched": [
            "patient says"
          ],
          "text": "Sleep that is known to be born of the nature of the night is called by the experts “The Omnibenevolent Mother-sleep—the nourisher of creatures”. Sleep which is born of the quality of tamas, they call, the Root of Evil. The remaining are included in disease conditions."
        }
      ]
    },
    101: {
      "urgent": false,
      "red_flags": [],
      "advice": null,
      "queries": [
        "patient says: I get a burning feeling in my chest and throat about an hour after lunch, especially after spicy food or tea. Sometimes sour water comes up at night.",
        "pulse: pulse rate 82, strength strong, dosha observation pitta",
        "tongue: colour red, coating yellow",
        "touch: temperature warm, skin oily, sweating excess",
        "appetite & digestion: agni tikshnagni, symptoms acidity/burning",
        "bowel habit: frequency more than once daily, consistency loose/watery, concerns none, dosha pattern pitta"
      ],
      "verses": [
        {
          "ref": "Cikitsasthana 19.6-(1)",
          "matched": [
            "pulse",
            "bowel habit"
          ],
          "text": "In a person of Pitta habitus, Pitta gets provoked by excessive use of acid, salt, pungent, alkaline, hot and acute articles of diet, by the impairment of the body by the strong effects of long exposure to fire, sun heat and hot winds. By the effects of strong emotions of anger and envy too, the Pitta gets provoked. The provoked Pitta, due to its fluid nature, impairing the vital heat, flows into the colon; by its qualities of heat, liquidity and fluidity it breaks up. the stools and prodaces diarrhea [atisara]."
        },
        {
          "ref": "Cikitsasthana 16.20-22",
          "matched": [
            "tongue",
            "appetite & digestion"
          ],
          "text": "The person becomes yellowish or greenish in tinge, afflicted with fever and burning, has craving for fluids, fainting and thirst; he passes yellowish urine and feces, perspires excessively, craves for cold things, does not relish food and has a pungent taste in the mouth. Hot as well as acid things are not homo-logatory to him, and he suffers from acid eructations and heart-burn due to the misdigestion of food, and also from body-fetor, looseness of stools, prostration and faintness."
        },
        {
          "ref": "Sutrasthana 26.43-(5)",
          "matched": [
            "patient says"
          ],
          "text": "On account of its fiery quality it leads to the suppuration of the inflammations induced by various kinds of trauma, such as wounds, contagious bites, burns, fractures, swellings, dislocation, toxic urine, or contact of venomous creatures, bruise, excision, incision, separation, puncture, crushing and similar injuries. It causes an allround sensation of burning in the throat, chest and heart."
        },
        {
          "ref": "Sutrasthana 27c.53-55½",
          "matched": [
            "patient says"
          ],
          "text": "The creatures that eat their food after tearing it from its place are known as tearers or of the tearer group of creatures. Owing to making their lodgement in holes in the earth, such creatures are called burrowing creatures. Those that dwell in wetland are known as wetland creatures. Owing to their living in water, some creatures are known as aquatic creatures or water dwellers. Those that move about in water are known as water-roamers or amphibious creatures. Those that dwell and roam on the jangala type of land are known as jangala creatures. Those that scatter the food with their claws and pick it up are known as gallinaceous birds and those that peck at and pick up their food are called peckers. These are the eight varieties of the sources of flesh."
        },
        {
          "ref": "Sutrasthana 20.15-(1)",
          "matched": [
            "pulse",
            "bowel habit"
          ],
          "text": "In all the above mentioned Pitta-disorders and in those not mentioned too, the experts will make an undoubted diagnosis of Pitta-discordance in a particular organ, by observing all or some of the innate qualities of Pitta or the modified effects of the action of Pitta on the body."
        }
      ]
    }
  }
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
interface Envelope<T> {
  data: T;
  status: number;
  headers: Headers;
}
const ok = <T,>(data: T): Envelope<T> => ({ data, status: 200, headers: new Headers() });

// ── Queries ─────────────────────────────────────────────────────────────────
export const useConsultationsList = () =>
  useQuery({
    queryKey: ['/api/v1/consultations'],
    queryFn: async () => (await delay(), ok(CONSULTATIONS)),
  });

export const useConsultationsTranscripts = (cid: number | null) =>
  useQuery({
    queryKey: ['/api/v1/consultations', cid, 'transcripts'],
    enabled: cid !== null,
    queryFn: async () => (await delay(), ok(DATA.transcripts[cid!] ?? [])),
  });

export const useConsultationsExamination = (cid: number | null) =>
  useQuery({
    queryKey: ['/api/v1/consultations', cid, 'examination'],
    enabled: cid !== null,
    queryFn: async () => (await delay(), ok(DATA.exams[cid!] ?? {})),
  });

export const useConsultationsVerses = (cid: number | null) =>
  useQuery({
    queryKey: ['/api/v1/consultations', cid, 'verses'],
    enabled: cid !== null,
    retry: false,
    queryFn: async () => {
      await delay(500);
      const v = DATA.verses[cid!];
      if (!v) throw new ApiError(400, { detail: 'nothing to search: save an examination or upload audio first' });
      return ok(v);
    },
  });
