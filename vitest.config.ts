import { defineConfig } from 'vitest/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Mirror next.config.ts's @council-data resolver: real dataset when the
// (private) submodule is present, committed 3-council fixture otherwise.
// CIVACCOUNT_FIXTURES=1 forces fixture mode either way.
const hasRealCouncilData = existsSync(resolve(__dirname, 'src/data/councils/index.ts'));
const useFixtures = process.env.CIVACCOUNT_FIXTURES === '1' || !hasRealCouncilData;
const councilDataPath = useFixtures
  ? resolve(__dirname, 'src/data/councils-fixtures/index.ts')
  : resolve(__dirname, 'src/data/councils/index.ts');

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: {
    alias: {
      '@council-data': councilDataPath,
      '@': resolve(__dirname, 'src'),
    },
  },
});
