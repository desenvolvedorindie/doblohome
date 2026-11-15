export type AwningType = 'rear' | 'batwing_270';
export type AwningSide = 'passenger' | 'driver';

export interface AwningConfig {
  enabled: boolean;          // Toldo instalado no rack de teto
  type: AwningType;          // Toldo Traseiro Reto vs Asa de Morcego 270°
  side: AwningSide;          // Lado de fixação do toldo asa de morcego ('passenger' ou 'driver')
  lengthMm: number;          // Comprimento do estojo fechado (1400mm a 2000mm)
  extensionMm: number;       // Extensão/Projeção da lona aberta (2000mm a 2500mm)
  isOpen: boolean;           // Aberto / estendido cobrindo acampamento
  fabricColor: string;       // Cor da lona impermeável (ex: '#c2b280', '#374151', '#4b5320', '#18181b')
}
