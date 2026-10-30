import { capSanityLoss, sanityAfterLoss, sanityLossFormula } from '../sanityLossRule';

describe('sanityLossFormula', () => {
  it('takes the passed loss on a success, the failed loss otherwise, maximized on a fumble', () => {
    expect(sanityLossFormula({ isSuccess: true, isFumble: false, lossPassed: 1, lossFailed: '1d6' })).toEqual({ formula: '1', maximize: false });
    expect(sanityLossFormula({ isSuccess: false, isFumble: false, lossPassed: 1, lossFailed: '1d6' })).toEqual({ formula: '1d6', maximize: false });
    expect(sanityLossFormula({ isSuccess: null, isFumble: false, lossPassed: 1, lossFailed: '1d6' })).toEqual({ formula: '1d6', maximize: false });
    expect(sanityLossFormula({ isSuccess: false, isFumble: true, lossPassed: 1, lossFailed: '1d6' })).toEqual({ formula: '1d6', maximize: true });
  });
});

describe('capSanityLoss', () => {
  it('caps at the reason maximum and halves for Mythos hardened investigators', () => {
    expect(capSanityLoss({ rolled: 6, reasonCap: undefined, mythosHardened: false })).toEqual({ loss: 6, limitedByReason: false });
    expect(capSanityLoss({ rolled: 6, reasonCap: 3, mythosHardened: false })).toEqual({ loss: 3, limitedByReason: true });
    expect(capSanityLoss({ rolled: 2, reasonCap: 3, mythosHardened: false })).toEqual({ loss: 2, limitedByReason: false });
    expect(capSanityLoss({ rolled: 7, reasonCap: undefined, mythosHardened: true })).toEqual({ loss: 3, limitedByReason: false });
    expect(capSanityLoss({ rolled: 7, reasonCap: 5, mythosHardened: true })).toEqual({ loss: 2, limitedByReason: true });
    expect(capSanityLoss({ rolled: -2, reasonCap: undefined, mythosHardened: false })).toEqual({ loss: 0, limitedByReason: false });
  });
});

describe('sanityAfterLoss', () => {
  it('subtracts the loss, counts it against the day and flags Temporary Insanity at 5+', () => {
    expect(sanityAfterLoss({ san: 60, sanMax: 99, dailyLoss: 0, dailyLimit: 12, loss: 4 })).toEqual({
      sanAfter: 56,
      dailyLossAfter: 4,
      temporaryInsanity: false,
      indefiniteInsanity: false,
      permanentInsanity: false
    });
    expect(sanityAfterLoss({ san: 60, sanMax: 99, dailyLoss: 0, dailyLimit: 12, loss: 5 })).toMatchObject({ sanAfter: 55, temporaryInsanity: true });
  });

  it('flags Indefinite Insanity at the daily limit but never for a limit of 0', () => {
    expect(sanityAfterLoss({ san: 60, sanMax: 99, dailyLoss: 10, dailyLimit: 12, loss: 3 })).toMatchObject({ dailyLossAfter: 13, indefiniteInsanity: true });
    expect(sanityAfterLoss({ san: 60, sanMax: 99, dailyLoss: 10, dailyLimit: 0, loss: 3 })).toMatchObject({ indefiniteInsanity: false });
    expect(sanityAfterLoss({ san: 60, sanMax: 99, dailyLoss: 12, dailyLimit: 12, loss: 0 })).toMatchObject({ indefiniteInsanity: false });
  });

  it('clamps at 0 and flags permanent insanity there', () => {
    expect(sanityAfterLoss({ san: 4, sanMax: 99, dailyLoss: 0, dailyLimit: 0, loss: 6 })).toMatchObject({ sanAfter: 0, permanentInsanity: true, temporaryInsanity: true });
    expect(sanityAfterLoss({ san: 0, sanMax: 99, dailyLoss: 0, dailyLimit: 0, loss: 0 })).toMatchObject({ sanAfter: 0, permanentInsanity: false });
  });
});
