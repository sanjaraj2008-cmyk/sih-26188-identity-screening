/**
 * Verhoeff Checksum Algorithm
 * Used officially by UIDAI for Indian Aadhaar 12-digit numbers
 */
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function generateVerhoeffCheckDigit(numStr: string): number {
  const clean = numStr.replace(/\s+/g, '');
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[(i + 1) % 8][reversed[i]]];
  }
  return inv[c];
}

export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(clean)) return false;

  let c = 0;
  const reversed = clean.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][reversed[i]]];
  }

  return c === 0;
}

/**
 * Validates Indian PAN card format (10 characters: 5 letters, 4 digits, 1 letter)
 * 4th character must be P (Person), C (Company), H (HUF), F (Firm), A (AOP), T (Trust), B (BOI), L (Local), J (Artificial), G (Government)
 */
export function validatePanCard(panStr: string): { isValid: boolean; entityType?: string } {
  const clean = panStr.toUpperCase().replace(/\s+/g, '');
  const panRegex = /^[A-Z]{3}([PCHFATBLJG])[A-Z]\d{4}[A-Z]$/;
  const match = clean.match(panRegex);

  if (!match) return { isValid: false };

  const typeMap: Record<string, string> = {
    P: 'Individual / Person',
    C: 'Company',
    H: 'Hindu Undivided Family',
    F: 'Partnership Firm',
    A: 'Association of Persons',
    T: 'Trust',
    B: 'Body of Individuals',
    G: 'Government Entity'
  };

  return {
    isValid: true,
    entityType: typeMap[match[1]] || 'Registered Entity'
  };
}

/**
 * Checks Date of Birth plausibility
 */
export function validateDateOfBirth(dobStr: string): { isValid: boolean; age?: number; error?: string } {
  // Support DD/MM/YYYY or YYYY-MM-DD
  let date: Date | null = null;
  const dmyMatch = dobStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    date = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  } else {
    date = new Date(dobStr);
  }

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Unparseable date format' };
  }

  const now = new Date();
  if (date > now) {
    return { isValid: false, error: 'Date of birth is in the future' };
  }

  const ageDiffMs = now.getTime() - date.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  if (age < 0 || age > 125) {
    return { isValid: false, age, error: 'Implausible age (>125 or <0)' };
  }

  return { isValid: true, age };
}
