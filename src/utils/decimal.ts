
export interface DecimalLike {
  toNumber(): number;
}

export function decimalToNumber(
  value: DecimalLike | number | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  return value.toNumber();
}
