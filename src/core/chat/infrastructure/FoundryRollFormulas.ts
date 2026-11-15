import { globalGameProvider } from '@/core/shared';
import type { RollDataSpec, RollFormulaInspector } from '@/core/chat/domain';
import { FoundryRollData } from './FoundryRollData';
import type { FoundryRollDataGame, FoundryRollStatics, RollFormulaGlobalsProvider } from './foundryRollTypes';
import { findRollReferences } from './rollReferences';

/** The core's own formula checks: `Roll.validate`, `Roll.replaceFormulaData`, `Roll.simulate`. */
export class FoundryRollFormulas implements RollFormulaInspector {
  constructor(
    private readonly globals: RollFormulaGlobalsProvider,
    private readonly rollData: FoundryRollData = new FoundryRollData(globalGameProvider<FoundryRollDataGame>())
  ) {}

  isValid(formula: string, data: RollDataSpec | undefined): boolean {
    const { Roll } = this.globals();
    return Roll.validate(data === undefined ? formula : this.substitute(Roll, formula, data));
  }

  /** The core is asked about each reference alone: one it cannot resolve comes back unchanged. */
  findUnresolvedReferences(formula: string, data: RollDataSpec | undefined): readonly string[] {
    const { Roll } = this.globals();
    const values = data === undefined ? {} : this.rollData.materialize(data);
    return findRollReferences(formula).filter((reference) => Roll.replaceFormulaData(reference, values) === reference);
  }

  async simulate(formula: string, data: RollDataSpec | undefined, iterations: number): Promise<readonly number[]> {
    const { Roll } = this.globals();
    const totals = await Roll.simulate(data === undefined ? formula : this.substitute(Roll, formula, data), iterations);
    return [...totals];
  }

  /** What the core's own parse step does with roll data first: an unset reference becomes 0. */
  private substitute(Roll: FoundryRollStatics, formula: string, data: RollDataSpec): string {
    return Roll.replaceFormulaData(formula, this.rollData.materialize(data), { missing: '0' });
  }
}
