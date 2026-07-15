// Cross-pack name search semantics: an empty needle is a legal value meaning
// "match nothing" (the caller returns [] instead of erroring), so unlike the
// kernel SubstringQuery this VO must not throw on empty input.
export class NameNeedle {
  public readonly value: string;

  constructor(raw: string) {
    this.value = raw.toLowerCase().trim();
  }

  get isEmpty(): boolean {
    return this.value === '';
  }

  matches(name: string): boolean {
    return name.toLowerCase().includes(this.value);
  }
}
