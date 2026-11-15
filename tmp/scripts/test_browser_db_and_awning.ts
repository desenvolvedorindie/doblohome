import { dbSet, dbGet, dbGetAllKeys, dbClear, migrateAllLocalStorageToIndexedDB } from '../../src/data/db';
import { SavedConfig, AwningConfig, CargoBoxPreset, SolarPanelPreset } from '../../src/types';

async function runTests() {
  console.log('🧪 Iniciando testes de persistência no Banco de Dados (IndexedDB) e Toldo (Awning)...');

  // 1. Limpa banco para começar teste limpo
  await dbClear();

  // 2. Teste do Toldo (Awning)
  console.log('\n--- 1. Testando Persistência do Toldo ---');
  const mockAwning: AwningConfig = {
    enabled: true,
    type: 'batwing_270',
    side: 'passenger',
    lengthMm: 2000,
    extensionMm: 2300,
    isOpen: true,
    fabricColor: '#38bdf8'
  };

  const fullConfig: SavedConfig = {
    stackLevels: 2,
    level1: { panels: 2, direction: 'rear', orientation: 'longitudinal' },
    level2: { panels: 2, direction: 'front', orientation: 'longitudinal' },
    structureMaterial: 'steel_tubing',
    steelProfileUnit: 'metalon_20x20',
    aluminumColor: 'black',
    metalonColor: '#475569',
    cargoBox: {
      enabled: true,
      length: 1200,
      width: 600,
      height: 330,
      verticalLiftMm: 50,
      isTelescopic: true,
      hingeSide: 'driver',
      tiltAngle: 0,
      lidAngle: 0
    },
    waterTank: {
      enabled: true,
      lengthMm: 2000,
      diameterMm: 200
    },
    awning: mockAwning,
    offsetZ: -0.40,
    offsetY: 0.05,
    expansionProgress: 0.75,
    b2bEngineHours: 2.5,
    panelPresetId: 'inohouse-200w',
    cargoBoxPresetId: 'preset-medium'
  };

  await dbSet('doblo_solar_config', fullConfig);

  const retrievedConfig = await dbGet<SavedConfig>('doblo_solar_config');
  if (!retrievedConfig) {
    throw new Error('Falha ao recuperar doblo_solar_config do banco de dados');
  }

  if (!retrievedConfig.awning || retrievedConfig.awning.enabled !== true) {
    throw new Error('Toldo não foi salvo ou enabled != true');
  }
  if (retrievedConfig.awning.type !== 'batwing_270') {
    throw new Error(`Tipo do toldo esperado batwing_270, obtido: ${retrievedConfig.awning.type}`);
  }
  if (retrievedConfig.awning.isOpen !== true) {
    throw new Error('Toldo isOpen != true');
  }
  if (retrievedConfig.b2bEngineHours !== 2.5) {
    throw new Error(`b2bEngineHours esperado 2.5, obtido: ${retrievedConfig.b2bEngineHours}`);
  }
  console.log('✅ Toldo e configurações completas persistidos e lidos com sucesso!');

  // 3. Teste de Migração do LocalStorage simulado
  console.log('\n--- 2. Testando Migração Automática do LocalStorage ---');
  // Cria mock de window.localStorage
  const mockStorage = new Map<string, string>();
  mockStorage.set('doblo_rack_offset_z', '0.450');
  mockStorage.set('doblo_solar_loads', JSON.stringify([{ id: 'app_1', name: 'Geladeira', watts: 45, hours: 24, qty: 1 }]));

  (global as any).window = {
    localStorage: {
      length: mockStorage.size,
      key: (i: number) => Array.from(mockStorage.keys())[i] || null,
      getItem: (k: string) => mockStorage.get(k) || null,
      setItem: (k: string, v: string) => mockStorage.set(k, v),
      removeItem: (k: string) => {
        mockStorage.delete(k);
        (global as any).window.localStorage.length = mockStorage.size;
      }
    }
  };

  await migrateAllLocalStorageToIndexedDB();

  // Verifica se o localStorage foi esvaziado
  if (mockStorage.size !== 0) {
    throw new Error(`LocalStorage ainda contém ${mockStorage.size} itens após migração`);
  }
  console.log('✅ LocalStorage esvaziado após migração!');

  // Verifica se os itens foram gravados no IndexedDB
  const migratedLoads = await dbGet<any[]>('doblo_solar_loads');
  if (!migratedLoads || migratedLoads.length === 0 || migratedLoads[0].name !== 'Geladeira') {
    throw new Error('Dados de cargas não migrados corretamente');
  }
  console.log('✅ Dados de cargas migrados com sucesso para o banco de dados!');

  const allKeys = await dbGetAllKeys();
  console.log(`✅ Chaves no banco de dados (${allKeys.length}):`, allKeys);

  console.log('\n🎉 Todos os testes de banco de dados e toldo passaram com sucesso!');
}

runTests().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
