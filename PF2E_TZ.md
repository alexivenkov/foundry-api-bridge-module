# ТЗ — поддержка системы Pathfinder 2e (PF2e)

> Самому себе / будущей сессии. Следующая крупная фаза: добавить PF2e как **вторую**
> игровую систему рядом с dnd5e.
>
> **Фундамент уже готов** (отгружено в v8.6.0 / v8.7.0): все 7 system-зависимых
> dnd5e roll/item-команд переведены на `dnd5e/*` имена и стоят за строгим DDD в
> `src/systems/`. Принцип соблюдён: **ни одного `if (system === …)` вне `src/systems/`**.
> PF2e теперь *встаёт рядом*, а не переписывает существующее.

---

## Задача 1 — детально проштудировать API системы PF2e

PF2e (`foundryvtt/pf2e`) — радикально другой API, чем dnd5e. Ключевое — система **`Statistic`**
и namespace **`game.pf2e`** (аналог `game.dnd5e` / `CONFIG`).

**Роллы (Statistic API):**
```js
actor.skills[slug].check.roll({ dc: { value: 20 } })   // навык (16 слагов, не dnd5e-аббревиатуры)
actor.saves.fortitude.check.roll({ dc: { value: 20 } }) // спасбросок: fortitude | reflex | will
actor.perception.check.roll(...)                         // perception — отдельный стат, НЕ навык
game.pf2e.Check.roll(check, context)                     // низкоуровневый общий вход
```
**Удары (strikes) — не `activities`:**
```js
// PC: strikes синтезируются в actor.system.actions; NPC: это items типа melee/ranged
const strike = actor.system.actions.find(a => a.slug === '...');
await strike.variants[0].roll({ event });  // [0]=обычная, [1]=MAP -5, [2]=MAP -10
await strike.damage({ event });            // урон
await strike.critical({ event });          // крит-урон
```
**Условия (богаче dnd5e — valued conditions, не бинарные):**
```js
await actor.increaseCondition('frightened', { value: 2 });
await actor.decreaseCondition('grabbed', { forceRemove: true });
actor.hasCondition('prone');  actor.getCondition('frightened')?.value;
// 48 слагов; хранятся как embedded-items типа 'condition'; менеджер game.pf2e.ConditionManager
```
**Модель данных — ключевые отличия:**
- ⚠️ Remaster **убрал ability scores** — только модификатор `system.abilities.str.mod` (поля `.value` нет).
- 16 навыков (Acrobatics…Thievery) + Lore с подтипами, slug'и другие, чем у dnd5e.
- Спасброски: только fortitude / reflex / will. Инициатива обычно от Perception.
- Item types: ancestry, background, class, feat, action, spell, weapon, armor, consumable, treasure…
- Rarity: common / uncommon / rare / **unique**. Вместо weight — **bulk**; вместо school+level — **tradition** (arcane/divine/occult/primal) + **rank**; повсюду **traits**.
- `roll-ability` концептуально хромает: в PF2e «голых» ability-checks почти нет → переосмыслить или пометить unsupported.

**Источники (сверять с УСТАНОВЛЕННОЙ версией системы — внутренний JS-API PF2e дрейфует между релизами):**
- Исходники: https://github.com/foundryvtt/pf2e
- Гайды: https://mintlify.wiki/foundryvtt/pf2e/guides/checks-and-rolls и `/guides/conditions`

---

## Задача 2 — выделить system-специфичные ручки и внимательно их изучить

System-зависимые ручки (их собственный код ассумит модель системы). Изучить каждую как
основу для PF2e-аналога:

| Группа | Команды | dnd5e-вызов | PF2e-эквивалент |
|---|---|---|---|
| Actor-роллы | `dnd5e/roll-skill`, `roll-ability`, `roll-save` | `actor.rollSkill/rollAbilityCheck/rollSavingThrow` | `actor.skills[slug].check.roll`, `actor.saves[slug]`, perception |
| Item-роллы | `dnd5e/roll-attack`, `roll-damage` | `item.system.activities.find(type='attack').rollAttack/rollDamage` | strikes: `actor.system.actions[…].variants[n].roll/damage` |
| Item-actions | `dnd5e/use-item`, `activate-item` | `activity.use` / `item.use` + Midi-QOL | PF2e item use / strike automation (другая модель) |
| Эффекты/условия | `toggle-actor-status` (сейчас generic core) | `actor.toggleStatusEffect` | **апгрейд**: `increaseCondition/decreaseCondition` (valued) → возможно новые команды `set-condition` |
| Фильтрация | `filter-actors`, `filter-items` | domain кодирует dnd5e (ability scores, item types, spell school…) | **отложенный** гибридный domain-рефактор |

Реальные текущие файлы (читать перед имплементацией):
`src/commands/handlers/actor/Roll{Skill,Ability,Save,Attack,Damage}Handler.ts`,
`src/commands/handlers/item/{UseItem,ActivateItem}Handler.ts`,
`src/commands/handlers/effect/ToggleActorStatusHandler.ts`,
`src/filtering/{actors,items}/`.

---

## Задача 3 — изучить DDD-паттерн проекта и system-aware код dnd5e, по аналогии имплементировать PF2e

### Эталон (изучить досконально)

```
src/systems/
  shared/                              # кросс-системный kernel (НЕ дублировать)
    domain/RollOutcome.ts              # нейтральный результат ролла
    domain/errors/                     # DomainError, ValidationError, ActorNotFoundError,
                                       # ItemNotFoundError, ActivityResolutionError,
                                       # RollResolutionError, TargetTokenNotFoundError
    validation/formatZodError.ts
  dnd5e/
    rolls/        # skill/ability/save — ActorRollPort + Dnd5eActorRollGateway (rollD20 helper),
                  #   value-objects SkillKey/AbilityKey, Dnd5eRollService, Zod-валидация
    item-rolls/   # attack/damage — ItemRollPort + Dnd5eItemRollGateway, attackActivityResolver
    item-actions/ # use/activate — ItemUsePort/ItemActivationPort/TargetingPort/MidiWorkflowPort
```
Слои в каждом контексте: **domain** (value-objects + `ports/` интерфейсы) → **application**
(`*Service` тонкий делегатор + `*Factory` + `*Commands`) → **infrastructure** (`*Gateway` =
anti-corruption над Foundry + mapper + `foundry*Types.ts`) → **validation** (Zod + request→command).
Точка входа — **тонкий хендлер** в `src/commands/handlers/...` (см. `RollSkillHandler.ts`):
`safeParse → request→command → new Gateway(game) → service → map outcome → wire result`.

### План имплементации PF2e

1. **Ввести композиционный шов `getGameSystem(game.system.id)`** (его сейчас нет — хендлеры
   хардкодят `new Dnd5eXGateway(...)`). Это единственное место выбора системы:
   ```ts
   // src/systems/getGameSystem.ts
   function getGameSystem(id: string) {
     switch (id) { case 'pf2e': return PF2E_ADAPTERS; default: return DND5E_ADAPTERS; }
   }
   ```
   Хендлер: `const gateway = getGameSystem(game.system.id).actorRoll;` вместо хардкода.

2. **`src/systems/pf2e/`** зеркалит контексты dnd5e. PF2e-гейтвеи реализуют **те же
   доменные порты** (`ActorRollPort`, `ItemRollPort`, …), но зовут PF2e API. Сервис/порты/
   `RollOutcome` переиспользуются; меняется только infrastructure-гейтвей + value-objects.

3. **Архитектурная развилка (решить ДО кода):** порт `ActorRollPort.rollSkill(actorId, skill: SkillKey, …)`
   типизирован dnd5e value-object'ом `SkillKey`. У PF2e слаги другие. Варианты:
   - **(a)** сделать `skill` нейтральной строкой, валидировать per-system в гейтвее (порт становится система-нейтральным → промоутнуть в `systems/shared`/`systems/contracts`);
   - **(b)** per-system порты.
   Рекомендация: **(a)** — порт нейтральный, value-object'ы (SkillKey/PF2eSkill) живут в своих
   системных контекстах и валидируют вход в gateway/mapper. Это и есть тот «гибридный» подход.

4. **Условия PF2e** — не маппить на `toggleStatusEffect`, а ввести богатые команды
   (`pf2e/set-condition` с value) поверх `increaseCondition/decreaseCondition`.

5. **Фильтрация** (`filter-actors`/`filter-items`) — отдельной поздней фазой (гибридный snapshot:
   нейтральное ядро + per-system `ext`, открытые словари вместо закрытых enum'ов).

### Конвенции (НЕ нарушать — как в dnd5e-рефакторинге)

- Строгий TS (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, без `any`).
- Кросс-директорийные импорты — `@/`-алиасы, **никогда `../`** (барели `./`, тесты `../Unit`).
- Тесты по слоям (value-object / service с fake-портом / gateway с моками Foundry).
- **Никаких `if (system === …)` вне `src/systems/`.**
- dnd5e behavior-preserving — существующие хендлер-тесты должны оставаться зелёными.
- Перед кодом — `mcp serena` (`initial_instructions`, `find_symbol`, `get_symbols_overview`),
  нативный Read; **никаких bash-пайплайнов для поиска по коду**.

### Рекомендуемая последовательность

1. Шов `getGameSystem` + рефактор dnd5e-хендлеров на выбор через него (поведение не меняется).
2. PF2e роллы: skill / save / perception (Statistic API) — самый востребованный геймплей.
3. PF2e условия (`increaseCondition/decreaseCondition`) + новые команды.
4. PF2e удары (strikes) — attack/damage.
5. PF2e item use / automation.
6. (Поздно) гибридный рефактор фильтрации.

После каждой под-фазы — `npm run all` зелёный, чек-ин.
