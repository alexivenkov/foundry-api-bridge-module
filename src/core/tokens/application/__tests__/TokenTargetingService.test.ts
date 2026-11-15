import { CanvasTokensUnavailableError, TokenNotOnCanvasError } from '../../domain';
import { TokenTargetingService } from '../TokenTargetingService';
import { FakeTargeting } from './fakePorts';

describe('TokenTargetingService', () => {
  it('targets a token that is on the canvas', () => {
    const targeting = new FakeTargeting();

    new TokenTargetingService({ targeting }).setTarget({ tokenId: 't1', targeted: true, releaseOthers: false });

    expect(targeting.calls).toEqual([{ tokenId: 't1', targeted: true, releaseOthers: false }]);
  });

  it('fails when there is no canvas tokens layer', () => {
    const targeting = new FakeTargeting();
    targeting.available = false;
    const act = (): void => {
      new TokenTargetingService({ targeting }).setTarget({ tokenId: 't1', targeted: true, releaseOthers: true });
    };

    expect(act).toThrow(CanvasTokensUnavailableError);
    expect(act).toThrow('Canvas tokens layer not available');
  });

  it('fails for a token that is not on the canvas', () => {
    const act = (): void => {
      new TokenTargetingService({ targeting: new FakeTargeting() }).setTarget({
        tokenId: 'elsewhere',
        targeted: true,
        releaseOthers: true
      });
    };

    expect(act).toThrow(TokenNotOnCanvasError);
    expect(act).toThrow('Token not found on canvas: elsewhere');
  });

  it('releases every target and reports how many there were', () => {
    const service = new TokenTargetingService({ targeting: new FakeTargeting() });

    expect(service.clearTargets()).toBe(2);
    expect(service.clearTargets()).toBe(0);
  });
});
