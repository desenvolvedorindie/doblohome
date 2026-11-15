export interface StovePreset {
  id: string;
  name: string;
  brand: string;
  model: string;
  burnersCount: number;         // Quantidade de bocas / queimadores
  burnerType: string;           // Tipo de queimador (ex: 'Cerâmica Infravermelho')
  fuelType: string;             // Combustível suportado (ex: 'Flex Fuel (Campgás + Botijão GLP)')
  gasConsumptionGh: number;     // Consumo nominal de gás em g/h (ex: 145)
  ignitionType: string;         // Sistema de acendimento (ex: 'Automática Piezoelétrica')

  // Dimensões em milímetros (mm)
  width: number;                // Largura (L) em mm
  depth: number;                // Profundidade (P) em mm
  height: number;               // Altura (A) em mm
  weightKg: number;             // Peso líquido em kg

  material: string;             // Material da estrutura e base
  hasCarryCase: boolean;        // Acompanha maleta plástica de transporte
  dualFuelAdapter: boolean;     // Compatível com cartucho Campgás e botijão GLP
  windResistant: boolean;       // Queimador resistente ao vento
  safetyLock: boolean;          // Trava de segurança do cartucho/gás
  features: string[];
  description: string;
  isDefault?: boolean;
}
