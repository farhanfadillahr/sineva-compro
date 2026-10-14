import * as migration_20261014_134327_initial_users from './20261014_134327_initial_users';

export const migrations = [
  {
    up: migration_20261014_134327_initial_users.up,
    down: migration_20261014_134327_initial_users.down,
    name: '20261014_134327_initial_users'
  },
];
