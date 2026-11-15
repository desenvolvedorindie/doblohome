import { dbSet, dbGet } from '../../src/data/db';
import { SavedConfig, AwningConfig } from '../../src/types';

async function testAwningPersistence() {
  console.log('Testing Awning Persistence...');

  const mockAwning: AwningConfig = {
    enabled: true,
    type: 'batwing_270',
    side: 'passenger',
    lengthMm: 2000,
    extensionMm: 2300,
    isOpen: true,
    fabricColor: '#c2b280'
  };

  const mockConfig: SavedConfig = {
    stackLevels: 1,
    level1: { panels: 1, direction: 'rear', orientation: 'longitudinal' },
    level2: { panels: 1, direction: 'rear', orientation: 'longitudinal' },
    structureMaterial: 'aluminum_extrusion',
    aluminumColor: 'black',
    awning: mockAwning
  };

  // 1. Save to db
  await dbSet('doblo_solar_config', mockConfig);
  console.log('Saved config with awning to IndexedDB.');

  // 2. Read from db
  const loadedConfig = await dbGet<SavedConfig>('doblo_solar_config');
  console.log('Loaded config awning:', loadedConfig?.awning);

  if (
    loadedConfig &&
    loadedConfig.awning &&
    loadedConfig.awning.enabled === true &&
    loadedConfig.awning.type === 'batwing_270' &&
    loadedConfig.awning.side === 'passenger' &&
    loadedConfig.awning.fabricColor === '#c2b280' &&
    loadedConfig.awning.isOpen === true
  ) {
    console.log('✅ PASS: Awning successfully persisted and loaded from database!');
  } else {
    console.error('❌ FAIL: Awning not loaded or mismatch!');
    process.exit(1);
  }
}

testAwningPersistence();

