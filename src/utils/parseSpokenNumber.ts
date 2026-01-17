const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const MULTIPLIERS: Record<string, number> = {
  lakh: 100000,
  lakhs: 100000,
  crore: 10000000,
  crores: 10000000,
  thousand: 1000,
  thousands: 1000,
};

export function parseSpokenNumber(text: string): number | null {
  if (!text) return null;

  const lower = text.toLowerCase();

  // ✅ DIGIT + UNIT → "10 lakh"
  let match = lower.match(/(\d+(\.\d+)?)\s*(lakh|lakhs|crore|crores|thousand|thousands)/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[3];
    return Math.round(num * MULTIPLIERS[unit]);
  }

  // ✅ WORD + UNIT → "ten lakh"
  match = lower.match(
    /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(lakh|lakhs|crore|crores|thousand|thousands)/
  );
  if (match) {
    const num = WORD_NUMBERS[match[1]];
    const unit = match[2];
    return num * MULTIPLIERS[unit];
  }

  // ✅ UNIT ONLY → "lakh income" → assume 1 lakh
  match = lower.match(/\b(lakh|lakhs|crore|crores|thousand|thousands)\b/);
  if (match) {
    return MULTIPLIERS[match[1]];
  }

  // ✅ Fallback plain number
  match = lower.match(/\b\d+\b/);
  if (match) {
    return parseInt(match[0], 10);
  }

  return null;
}
