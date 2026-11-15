export interface PortaPottiPreset {
  id: string;
  name: string;
  brand: string;
  model: string;
  wasteCapacityLiters: number;      // Volume do tanque de dejetos (Litros)
  freshWaterCapacityLiters: number; // Volume do tanque de descarga / água limpa (Litros)

  // Dimensões em milímetros (mm)
  width: number;  // Largura (L) em mm (transversal)
  depth: number;  // Profundidade / Comprimento (P) em mm (longitudinal)
  height: number; // Altura (A) em mm (vertical)

  weightEmptyKg: number; // Peso vazio (kg)
  weightFullKg: number;  // Peso com tanques cheios (kg)
  maxLoadKg: number;     // Capacidade máxima de peso suportado (kg)

  material: string;
  hasSoftClose: boolean;       // Fechamento suave do assento/tampa
  flushType: string;           // Bomba de pistão, fole ou elétrica
  antiLeakValve: boolean;      // Válvula hermética dupla antivazamento e antiodor
  rotatingSpout: boolean;      // Bico de despejo rotativo para esvaziamento
  airReliefValve: boolean;     // Botão de despressurização / alívio de ar
  levelIndicator: boolean;     // Indicador visual de nível do tanque
  features: string[];
  description: string;
  isDefault?: boolean;
}
