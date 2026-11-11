/**
 * How the traveller got there: flights to the destination (trip level) and
 * how they reached each city (flight, car, boat, train, bus).
 * Stored as small JSON blobs: trips.travelInfo and cities.arrival.
 */

export interface FlightLeg {
  from: string;        // airport code or city, e.g. "YYZ"
  to: string;          // e.g. "JFK"
  airline: string;     // e.g. "Air Canada (AC)"
  flightNumber?: string;
}

export type TravelMode = 'flight' | 'car' | 'boat' | 'train' | 'bus';

export interface Arrival {
  mode: TravelMode | '';
  from: string;        // where they came from
  operator: string;    // airline / ferry / train / bus / car rental company
  details: string;     // free notes: flight number, drive time, tips
}

export const TRAVEL_MODES: { value: TravelMode; label: string; icon: string; operatorLabel: string; operatorHint: string }[] = [
  { value: 'flight', label: 'Flight', icon: '✈️', operatorLabel: 'Airline', operatorHint: 'Start typing an airline' },
  { value: 'car', label: 'Car', icon: '🚗', operatorLabel: 'Car / company', operatorHint: 'e.g. Rental from Hertz, or our own car' },
  { value: 'boat', label: 'Boat', icon: '⛴️', operatorLabel: 'Ferry / boat company', operatorHint: 'e.g. Blue Star Ferries' },
  { value: 'train', label: 'Train', icon: '🚆', operatorLabel: 'Train company', operatorHint: 'e.g. Trenitalia, Eurostar' },
  { value: 'bus', label: 'Bus', icon: '🚌', operatorLabel: 'Bus company', operatorHint: 'e.g. ADO, FlixBus' },
];

export const modeInfo = (m: string) => TRAVEL_MODES.find((x) => x.value === m);

/** Major airlines for the airline dropdown (any other airline can be typed in). */
export const AIRLINES: string[] = [
  'Aer Lingus (EI)', 'Aeroflot (SU)', 'Aerolíneas Argentinas (AR)', 'Aeroméxico (AM)', 'Air Arabia (G9)', 'Air Canada (AC)',
  'Air China (CA)', 'Air Europa (UX)', 'Air France (AF)', 'Air India (AI)', 'Air New Zealand (NZ)', 'Air Serbia (JU)',
  'Air Transat (TS)', 'AirAsia (AK)', 'Alaska Airlines (AS)', 'Allegiant Air (G4)', 'American Airlines (AA)', 'ANA – All Nippon Airways (NH)',
  'Asiana Airlines (OZ)', 'Austrian Airlines (OS)', 'Avianca (AV)', 'Azul (AD)', 'Bamboo Airways (QH)', 'Bangkok Airways (PG)',
  'British Airways (BA)', 'Brussels Airlines (SN)', 'Cathay Pacific (CX)', 'Cebu Pacific (5J)', 'China Airlines (CI)', 'China Eastern (MU)',
  'China Southern (CZ)', 'Condor (DE)', 'Copa Airlines (CM)', 'Croatia Airlines (OU)', 'Delta Air Lines (DL)', 'easyJet (U2)',
  'EgyptAir (MS)', 'El Al (LY)', 'Emirates (EK)', 'Ethiopian Airlines (ET)', 'Etihad Airways (EY)', 'EVA Air (BR)',
  'Finnair (AY)', 'flydubai (FZ)', 'Flair Airlines (F8)', 'Frontier Airlines (F9)', 'Garuda Indonesia (GA)', 'Gulf Air (GF)',
  'GOL (G3)', 'Hawaiian Airlines (HA)', 'Iberia (IB)', 'Icelandair (FI)', 'IndiGo (6E)', 'ITA Airways (AZ)',
  'Japan Airlines (JL)', 'Jet2 (LS)', 'JetBlue (B6)', 'Jetstar (JQ)', 'Kenya Airways (KQ)', 'KLM (KL)',
  'Korean Air (KE)', 'LATAM Airlines (LA)', 'LOT Polish Airlines (LO)', 'Lufthansa (LH)', 'Luxair (LG)', 'Malaysia Airlines (MH)',
  'Norwegian (DY)', 'Olympic Air (OA)', 'Oman Air (WY)', 'Pegasus Airlines (PC)', 'Philippine Airlines (PR)', 'Porter Airlines (PD)',
  'Qantas (QF)', 'Qatar Airways (QR)', 'Royal Air Maroc (AT)', 'Royal Jordanian (RJ)', 'Ryanair (FR)', 'SAS – Scandinavian Airlines (SK)',
  'Saudia (SV)', 'Scoot (TR)', 'Singapore Airlines (SQ)', 'South African Airways (SA)', 'Southwest Airlines (WN)', 'Spirit Airlines (NK)',
  'SriLankan Airlines (UL)', 'Sun Country Airlines (SY)', 'Sunwing (WG)', 'SWISS (LX)', 'TAP Air Portugal (TP)', 'Thai Airways (TG)',
  'Transavia (HV)', 'Turkish Airlines (TK)', 'United Airlines (UA)', 'VietJet Air (VJ)', 'Vietnam Airlines (VN)', 'Virgin Atlantic (VS)',
  'Virgin Australia (VA)', 'Viva Aerobus (VB)', 'Volaris (Y4)', 'Vueling (VY)', 'WestJet (WS)', 'Wizz Air (W6)',
  'Aegean Airlines (A3)', 'Air Astana (KC)', 'Air Mauritius (MK)', 'Air Tahiti Nui (TN)', 'Fiji Airways (FJ)', 'Kuwait Airways (KU)',
  'Middle East Airlines (ME)', 'Nok Air (DD)', 'RwandAir (WB)', 'Sky Airline (H2)', 'JetSMART (JA)', 'Arajet (DM)',
];

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function cleanLegs(input: unknown): FlightLeg[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 12)
    .map((l: any) => ({
      from: str(l?.from, 60),
      to: str(l?.to, 60),
      airline: str(l?.airline, 80),
      flightNumber: str(l?.flightNumber, 20),
    }))
    .filter((l) => l.from || l.to || l.airline);
}

export function cleanArrival(input: unknown): Arrival | null {
  const a: any = input;
  const mode = TRAVEL_MODES.some((m) => m.value === a?.mode) ? (a.mode as TravelMode) : '';
  const out: Arrival = { mode, from: str(a?.from, 80), operator: str(a?.operator, 100), details: str(a?.details, 1000) };
  return out.mode || out.from || out.operator || out.details ? out : null;
}

/** Parse a stored JSON blob safely. */
export function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return (raw && typeof raw === 'object' ? (raw as T) : fallback);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** "YYZ → JFK → ATH" from flight legs (joins connections; separate trips shown with " · "). */
export function routeText(legs: FlightLeg[]): string {
  const parts: string[] = [];
  let chain: string[] = [];
  for (const l of legs) {
    const from = l.from.toUpperCase();
    const to = l.to.toUpperCase();
    if (chain.length && chain[chain.length - 1] === from) {
      if (to) chain.push(to);
    } else {
      if (chain.length) parts.push(chain.join(' → '));
      chain = [from, to].filter(Boolean);
    }
  }
  if (chain.length) parts.push(chain.join(' → '));
  return parts.join(' · ');
}

/** Airline names without the "(XX)" code, de-duplicated, for short summaries. */
export function airlinesText(legs: FlightLeg[]): string {
  const names = legs.map((l) => l.airline.replace(/\s*\([A-Z0-9]{2}\)\s*$/, '').trim()).filter(Boolean);
  return Array.from(new Set(names)).join(', ');
}

/** Flights for a trip: to the destination and back home. */
export interface TravelInfo {
  outbound: FlightLeg[];
  return: FlightLeg[];
}

/** Accepts the stored value in either form: an array (older trips: flights there) or {outbound, return}. */
export function cleanTravel(input: unknown): TravelInfo {
  const v: any = typeof input === 'string' ? parseJson(input, null) : input;
  if (Array.isArray(v)) return { outbound: cleanLegs(v), return: [] };
  return { outbound: cleanLegs(v?.outbound), return: cleanLegs(v?.return) };
}

/** JSON to store, or null when there are no flights. */
export function travelToStore(input: unknown): string | null {
  const t = cleanTravel(input);
  return t.outbound.length || t.return.length ? JSON.stringify(t) : null;
}
