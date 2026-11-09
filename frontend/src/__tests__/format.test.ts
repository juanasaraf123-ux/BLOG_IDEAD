import { fmtCurrency, fmtDate, fmtValue, label } from '../shared/format';

describe('formatos colombianos', () => {
  it('formatea pesos de forma compacta', () => {
    expect(fmtCurrency(42_000_000_000)).toBe('$42.000 millones');
    expect(fmtCurrency(1_500_000_000_000)).toBe('$1,5 billones');
  });
  it('formatea porcentajes y nulos', () => {
    expect(fmtValue(88.46, 'percent')).toBe('88,5 %');
    expect(fmtValue(null, 'count')).toBe('—');
  });
  it('no desplaza fechas puras por zona horaria', () => {
    expect(fmtDate('2026-11-09')).toContain('9 de noviembre de 2026');
  });
  it('traduce estados', () => {
    expect(label('en_revision')).toBe('En revisión');
  });
});
