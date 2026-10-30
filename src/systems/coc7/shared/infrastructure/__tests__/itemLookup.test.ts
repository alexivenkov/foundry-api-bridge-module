import { cocIdOf, findCoc7Skill, requireCoc7Skill, requireCoc7Weapon } from '../itemLookup';
import { makeActor, makeSkill, makeWeapon } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('coc7 item lookup', () => {
  const dodge = makeSkill({ id: 'sk-dodge', name: 'Dodge', value: 35, cocid: 'i.skill.dodge' });
  const brawl = makeSkill({ id: 'sk-brawl', name: 'Fighting (Brawl)', skillName: 'Brawl', specialization: 'Fighting', value: 50 });
  const spot = makeSkill({ id: 'sk-spot', name: 'Spot Hidden', value: 45 });
  const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl });
  const actor = makeActor({ items: [dodge, brawl, spot, knife] });

  it('finds a skill by id, CoC ID or name, case-insensitively and through the specialization form', () => {
    expect(findCoc7Skill(actor, 'sk-spot')).toBe(spot);
    expect(findCoc7Skill(actor, 'i.skill.dodge')).toBe(dodge);
    expect(findCoc7Skill(actor, 'spot hidden')).toBe(spot);
    expect(findCoc7Skill(actor, 'Fighting (Brawl)')).toBe(brawl);
    expect(findCoc7Skill(actor, 'w-knife')).toBeUndefined();
    expect(() => requireCoc7Skill(actor, 'Library Use')).toThrow('Skill not found: Library Use');
  });

  it('finds a weapon by id or name and refuses other items', () => {
    expect(requireCoc7Weapon(actor, 'w-knife')).toBe(knife);
    expect(requireCoc7Weapon(actor, 'knife')).toBe(knife);
    expect(() => requireCoc7Weapon(actor, 'sk-spot')).toThrow('Item is not a weapon: Spot Hidden');
    expect(() => requireCoc7Weapon(actor, 'Revolver')).toThrow('Weapon not found: Revolver');
  });

  it('reads the CoC ID flag', () => {
    expect(cocIdOf(dodge)).toBe('i.skill.dodge');
    expect(cocIdOf(spot)).toBeUndefined();
  });
});
