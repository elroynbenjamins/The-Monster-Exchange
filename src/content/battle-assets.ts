// Source filenames are preserved; aliases resolve known spelling differences only.
export const NATIVE_BATTLE_ASSET_ROOT = 'assets/pixel/battle/monster-exchange-battle-sprites-v1-176';
export const NATIVE_SPRITE_ALIASES: Readonly<Record<string, string>> = {
  bogcrumbler: 'bogrumbler', knubback: 'knobback', pufflece: 'puffleece',
  voltgazer: 'voltgrazer', cloudrim: 'cloudrum', sickletue: 'sickletoe',
  // Confirmed against cards 129/130, matching types and the two-stage evolution line.
  sandscuttle: 'duneclasp', shardscorp: 'cragsting',
};
export const UNASSIGNED_SPRITES: readonly string[] = [];
