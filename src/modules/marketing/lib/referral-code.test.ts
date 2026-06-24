import { describe, expect, it } from 'vitest';
import {
  cheminInscriptionParrainage,
  genererCodeParrainage,
  normaliserCodeParrainage,
} from './referral-code';

describe('normaliserCodeParrainage', () => {
  it('trim et uppercase', () => {
    expect(normaliserCodeParrainage('  kabiabc1  ')).toBe('KABIABC1');
  });
});

describe('genererCodeParrainage', () => {
  it('génère un code KABI + 6 caractères', () => {
    const code = genererCodeParrainage();
    expect(code).toMatch(/^KABI[A-Z2-9]{6}$/);
  });
});

describe('cheminInscriptionParrainage', () => {
  it('encode le code dans l’URL', () => {
    expect(cheminInscriptionParrainage('kabi12ab')).toBe('/inscription?parrain=KABI12AB');
  });
});
