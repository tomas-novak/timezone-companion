import fixtures from "./demoFixtures.json";

export const DEMO_NOW = "2026-10-13T08:00:00.000Z";

export interface Preset {
  id: keyof typeof fixtures;
  label: string;
  blurb: string;
  authorTz: string | null;
  text: string;
}

export const PRESETS: Preset[] = [
  { id: "exact", label: "Exact time", blurb: "You propose Thursday 3pm. See who it lands late for.", authorTz: null, text: "Can we meet Thursday at 3pm?" },
  { id: "doha-sunday", label: "Doha: Sunday review", blurb: "Sunday is a workday in Doha, but the weekend in Europe.", authorTz: "Asia/Qatar", text: "Can we do the review Sunday at 10am?" },
  { id: "arabic", label: "Doha in Arabic", blurb: "The same Sunday message, written in Arabic.", authorTz: "Asia/Qatar", text: "هل نعقد المراجعة يوم الأحد الساعة ١٠ صباحًا؟" },
  { id: "doha-time", label: "Doha time", blurb: "You name Doha's time. Everyone else gets it in theirs.", authorTz: null, text: "Lunch tomorrow 1pm Doha time" },
  { id: "unclear", label: "Unclear", blurb: "\"Your time\" could mean anyone's. Flagged, not guessed.", authorTz: null, text: "3pm your time?" },
  { id: "not-time", label: "Not a time", blurb: "A version number and a duration. Nothing to convert.", authorTz: null, text: "v2.50 is live, the build took 2h" },
];

export const fixtureFor = (id: Preset["id"]): unknown => fixtures[id];
