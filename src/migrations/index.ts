import * as migration_20261124_081924_initial from './20261124_081924_initial';
import * as migration_20261125_223950_site_complet from './20261125_223950_site_complet';

export const migrations = [
  {
    up: migration_20261124_081924_initial.up,
    down: migration_20261124_081924_initial.down,
    name: '20261124_081924_initial',
  },
  {
    up: migration_20261125_223950_site_complet.up,
    down: migration_20261125_223950_site_complet.down,
    name: '20261125_223950_site_complet'
  },
];
