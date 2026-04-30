export interface TimeZoneConfig {
  id: string;
  city: string;
  country: string;
  defaultWorkingDays: number[];
  defaultWorkingStart: string;
  defaultWorkingEnd: string;
  defaultReasonableStart: string;
  defaultReasonableEnd: string;
}

// Default working days: 1=Mon, 2=Tue, ... 7=Sun
export const TIMEZONE_CONFIGS: TimeZoneConfig[] = [
  {
    id: "Africa/Tunis",
    city: "Tunis",
    country: "Tunisia",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Europe/Prague",
    city: "Prague",
    country: "Czech Republic",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Europe/London",
    city: "London",
    country: "United Kingdom",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Muscat",
    city: "Muscat",
    country: "Oman",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Qatar",
    city: "Doha",
    country: "Qatar",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Baghdad",
    city: "Baghdad",
    country: "Iraq",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Kolkata",
    city: "New Delhi",
    country: "India",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
];

export const DAYS_OF_WEEK = [
  { value: 1, short: "Mon", full: "Monday" },
  { value: 2, short: "Tue", full: "Tuesday" },
  { value: 3, short: "Wed", full: "Wednesday" },
  { value: 4, short: "Thu", full: "Thursday" },
  { value: 5, short: "Fri", full: "Friday" },
  { value: 6, short: "Sat", full: "Saturday" },
  { value: 7, short: "Sun", full: "Sunday" },
];
