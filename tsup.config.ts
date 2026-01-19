import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    plugin: 'src/plugin.ts',
    config: 'src/config.ts',
    'event-types': 'src/event-types.ts',
    'context-helpers': 'src/context-helpers.ts',
  },
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  bundle: false,
  external: ['mongoose'],
});
