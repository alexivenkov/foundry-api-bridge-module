/**
 * The fields of a Midi-QOL OverTime spec, split exactly as Midi-QOL 14.0.16 `splitOvertimeSpec` does: a field is
 * `key=` at the start or right after a "," or "#", its value runs to the next such field, and a value that starts
 * with a quote runs to the matching quote.
 */
export function splitOverTimeSpec(spec: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const keyAt = /\s*([A-Za-z][A-Za-z0-9_]*)\s*=(?![=>])\s*/y;
  const keyFollows = (index: number): boolean => {
    keyAt.lastIndex = index;
    return keyAt.test(spec);
  };
  let position = 0;
  while (position < spec.length && /[\s,#]/.test(spec.charAt(position))) {
    position++;
  }
  while (position < spec.length) {
    keyAt.lastIndex = position;
    const match = keyAt.exec(spec);
    const key = match?.[1];
    if (key === undefined) {
      break;
    }
    const start = keyAt.lastIndex;
    let scanFrom = start;
    const quote = spec.charAt(start);
    if (quote !== '' && '"\'`'.includes(quote)) {
      const close = spec.indexOf(quote, start + 1);
      if (close > start) {
        scanFrom = close + 1;
      }
    }
    let next = spec.length;
    for (let index = scanFrom; index < spec.length; index++) {
      const char = spec.charAt(index);
      if ((char === ',' || char === '#') && keyFollows(index + 1)) {
        next = index;
        break;
      }
    }
    fields[key] = spec.slice(start, next).replace(/[\s,#]+$/, '').trim();
    position = next + 1;
  }
  return fields;
}
