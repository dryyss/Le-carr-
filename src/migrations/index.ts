import * as migration_20261124_081924_initial from './20261124_081924_initial';

export const migrations = [
  {
    up: migration_20261124_081924_initial.up,
    down: migration_20261124_081924_initial.down,
    name: '20261124_081924_initial'
  },
];
