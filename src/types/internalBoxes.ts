import type { InstalledElectronicItem } from './electronics';

export type InternalBoxType = 'chest' | 'drawer' | 'slide_tray' | 'open' | 'slat_bed';
export type DrawerMode = 'drawer' | 'slide_tray'; // Gaveteiro fechado alto vs Bandeja corrediça rasa
export type InternalBoxMaterial = 'plywood' | 'dark_wood' | 'white_mdf' | 'aluminum_box';
export type RearShelfFinish = 'pine_block' | 'teak' | 'dark_wood' | 'plywood';
export type ChestHingeDirection = 'front' | 'rear' | 'left' | 'right';
export type SlatBedDirection = 'left' | 'right' | 'front' | 'rear';

export interface LedBaseboardConfig {
  enabled: boolean;          // Perfil de LED no rodapé do assoalho
  color: string;            // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#38bdf8' azul, '#f59e0b' âmbar)
  brightness: number;       // Brilho / Intensidade luminosa (0 a 100%)
}

export type BoxLedEdge = 'rear' | 'front' | 'left' | 'right';

export interface BoxLedConfig {
  enabled: boolean;          // Perfil de quina com LED na parte de baixo do módulo
  color?: string;            // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#38bdf8' azul, '#f59e0b' âmbar)
  brightness?: number;       // Brilho / Intensidade luminosa (0 a 100%)
  edges?: BoxLedEdge[];      // Quinas inferiores onde o perfil de cantoneira será instalado
}

export type FoldingBracketInches = 8 | 10 | 12 | 16 | 18 | 20;

export interface FoldingBracketSpec {
  inches: FoldingBracketInches;
  lengthMm: number;       // comprimento da haste horizontal (suporte da mesa)
  heightMm: number;       // altura da base vertical de fixação
  diagonalMm: number;     // comprimento da haste diagonal com trava
  minBoxHeightMm: number; // altura mínima recomendada do baú
  maxLoadKg: number;      // capacidade de carga recomendada do par (kg)
  label: string;          // ex: '20" (500 mm)'
}

export const FOLDING_BRACKET_SPECS: FoldingBracketSpec[] = [
  { inches: 8, lengthMm: 200, heightMm: 105, diagonalMm: 130, minBoxHeightMm: 220, maxLoadKg: 50, label: '8" (200 mm)' },
  { inches: 10, lengthMm: 250, heightMm: 120, diagonalMm: 160, minBoxHeightMm: 275, maxLoadKg: 60, label: '10" (250 mm)' },
  { inches: 12, lengthMm: 300, heightMm: 135, diagonalMm: 190, minBoxHeightMm: 325, maxLoadKg: 75, label: '12" (300 mm)' },
  { inches: 16, lengthMm: 400, heightMm: 165, diagonalMm: 225, minBoxHeightMm: 425, maxLoadKg: 100, label: '16" (400 mm)' },
  { inches: 18, lengthMm: 450, heightMm: 170, diagonalMm: 240, minBoxHeightMm: 475, maxLoadKg: 115, label: '18" (450 mm)' },
  { inches: 20, lengthMm: 500, heightMm: 170, diagonalMm: 250, minBoxHeightMm: 525, maxLoadKg: 130, label: '20" (500 mm)' }
];

/**
 * Calcula a mão francesa rebatível ideal com base na altura disponível do baú (em mm).
 * Suporta os tamanhos padronizados comerciais: 8", 10", 12", 16", 18" e 20".
 * Substitui pistões a gás por suporte mecânico de alta rigidez com trava rápida e gatilho.
 */
export function getFoldingBracketForHeight(boxHeightMm: number, manualInches?: number): FoldingBracketSpec {
  if (manualInches) {
    const found = FOLDING_BRACKET_SPECS.find((s) => s.inches === manualInches);
    if (found) return found;
  }
  // A prancha recolhida na vertical precisa caber na face do baú com folga de segurança de ~25mm
  const targetMaxL = Math.max(180, boxHeightMm - 25);
  const eligible = FOLDING_BRACKET_SPECS.filter((s) => s.lengthMm <= targetMaxL);
  if (eligible.length > 0) {
    return eligible[eligible.length - 1];
  }
  return FOLDING_BRACKET_SPECS[0];
}

export interface CentralTableConfig {
  enabled: boolean;          // Mesa dinette central instalada no vão
  lengthMm?: number;         // Comprimento do tampo da mesa (padrão ~650mm)
  widthMm?: number;          // Largura do tampo da mesa (padrão ~450mm)
  heightMm?: number;         // Altura em relação ao piso (400mm modo cama até 850mm modo trabalho)
  offsetX?: number;          // Deslocamento lateral em mm (-350mm a +350mm)
  offsetZ?: number;          // Deslocamento longitudinal em mm (-500mm a +500mm)
  rotationDeg?: number;      // Ângulo de rotação náutica do tampo (0° a 360°)
  finish?: RearShelfFinish;  // Acabamento da madeira do tampo
}

export type UpperCabinetSide = 'rear' | 'front' | 'left' | 'right';

export type CeilingType = 'slatted' | 'sheet'; // Ripado vs Chapa
export type CeilingSheetMaterial = 'white_mdf' | 'gray_mdf' | 'wood_mdf' | 'black_mdf' | 'sand_mdf' | 'plywood';
export type CeilingSlattedWood = 'pinus' | 'freijo' | 'teak' | 'dark_wood' | 'cedro' | 'plywood' | 'white_mdf';
export type CeilingLedType = 'strip_center' | 'strip_double' | 'strip_triple' | 'spots';

export interface CeilingLedConfig {
  enabled: boolean;          // Iluminação LED no teto
  type: CeilingLedType;      // Perfil linear (centro, duplo, triplo) ou Spots embutidos
  color: string;             // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#e0f2fe' 6000K, '#f59e0b' âmbar, '#38bdf8' azul)
  brightness: number;        // Intensidade luminosa (0 a 100%)
  spotsCount?: number;       // 2 | 4 | 6 | 8 spots circulares (quando type === 'spots')
}

export interface CeilingConfig {
  enabled: boolean;          // Teto instalado no projeto
  visibleIn3D?: boolean;     // Exibir / ocultar no 3D (para visualização livre do interior)
  opacity?: number;          // Opacidade no 3D (0.1 a 1.0, padrão 1.0)
  type: CeilingType;         // 'slatted' (ripado) | 'sheet' (chapa)

  // Opções para Teto de Chapa (MDF ou Compensado)
  sheetMaterial?: CeilingSheetMaterial; // 'white_mdf' | 'gray_mdf' | 'wood_mdf' | 'plywood'
  thicknessMm?: number;      // Espessura da chapa ou ripas em mm (ex: 6, 9, 12, 15mm)
  sheetPanels?: 'single' | 'split_longitudinal' | 'split_transverse'; // 1 chapa única, 2 longitudinais ou 3 transversais

  // Opções para Teto Ripado
  slattedWood?: CeilingSlattedWood; // Espécie / tom de madeira das ripas
  slatWidthMm?: number;      // Largura da ripa em mm (ex: 25, 30, 40, 50, 60mm; padrão 40mm)
  slatThicknessMm?: number;  // Espessura da ripa em mm (ex: 10, 12, 15, 18mm; padrão 12mm)
  slatGapMm?: number;        // Espaçamento / fenda entre ripas em mm (ex: 5, 8, 10, 15mm; padrão 10mm)
  slatDirection?: 'longitudinal' | 'transverse'; // Padrão longitudinal
  acousticFeltBacking?: boolean; // Fundo preto acústico / feltro automotivo atrás das ripas (padrão true)

  // Dimensões & Posição
  lengthMm?: number;         // Comprimento do forro de teto em mm (padrão: grid.lengthMm ou 1700mm)
  widthMm?: number;          // Largura do forro de teto em mm (padrão: grid.widthMm ou 1200mm)
  heightOffsetMm?: number;   // Ajuste fino na altura Y em mm (-100mm a +100mm)
  curvatureMm?: number;      // Curvatura / flecha do arco transversal do teto em mm (0 a 30mm máx, padrão ~25mm para acompanhar o teto da Doblò)

  // Iluminação LED
  led?: CeilingLedConfig;
}

export interface InternalBoxesPreviewOptions {
  openCabinets?: boolean;
  openBed?: boolean;
  showMattress?: boolean;
  hideCeiling?: boolean;
}

export interface BoxPanelsConfig {
  front?: boolean;   // Parede frontal (voltada para os bancos dianteiros: +Z)
  rear?: boolean;    // Parede traseira/fundo (voltada para o porta-malas: -Z)
  left?: boolean;    // Parede lateral esquerda (+X olhando da traseira)
  right?: boolean;   // Parede lateral direita (-X olhando da traseira)
  top?: boolean;     // Tampo superior ou tampa basculante (+Y)
  bottom?: boolean;  // Chapa inferior de fundo própria (-Y)
}

export interface BoxPanelThicknessConfig {
  front?: number;    // Espessura da parede frontal em mm (ex: 6, 9, 12, 15, 18, 20, 25)
  rear?: number;     // Espessura da parede traseira/fundo em mm
  left?: number;     // Espessura da lateral esquerda em mm
  right?: number;    // Espessura da lateral direita em mm
  top?: number;      // Espessura do tampo superior / tampa basculante em mm
  bottom?: number;   // Espessura do piso / base do módulo em mm
  cabinet?: number;  // Espessura das chapas do armário aéreo em mm
  slat?: number;     // Espessura das ripas da cama retrátil em mm
  shelf?: number;    // Espessura da mesa/prateleira rebatível traseira em mm
}

export type UpperCabinetClosure = 'doors' | 'sliding_doors' | 'open' | 'drawer';

export function getUpperCabinetClosure(box: { upperCabinetClosure?: UpperCabinetClosure; upperCabinetDoors?: boolean }): UpperCabinetClosure {
  if (box.upperCabinetClosure) {
    if (box.upperCabinetClosure === 'drawer') return 'sliding_doors';
    return box.upperCabinetClosure;
  }
  if (box.upperCabinetDoors === false) return 'open';
  return 'doors';
}

export interface InternalBoxItem {
  id: string;
  name: string;
  type: InternalBoxType;
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
  heightMm: number;
  color: string;
  material: InternalBoxMaterial;
  chestHingeDirection?: ChestHingeDirection;
  slatBedDirection?: SlatBedDirection;
  slatExtensionPercent?: number; // Porcentagem de extensão ao abrir (50% a 100%, padrão 85%)
  slatWidthMm?: number;          // Largura nominal de cada ripa em mm (padrão ~70mm)
  mattressParts?: 1 | 2 | 3 | 4 | 5; // Divisão do colchão/estofado (1 = Inteiro, 2 = Bipartido, 3 = Tripartido, 5 = Total c/ Caixas de Roda)
  topPerforated?: boolean;       // Tampo/Tampa superior vazado para alívio de peso e aeração do colchão
  perforationHoleDiameterMm?: number; // Diâmetro dos furos passantes CNC em mm (ex: 15mm a 80mm, padrão ~40mm)
  perforationSpacingMm?: number;      // Espaçamento entre centros dos furos em mm (ex: 50mm a 150mm, padrão ~85mm)
  rearFoldShelf?: boolean;       // Decoração em madeira na face traseira que abre para cima como prateleira/mesa rebatível
  rearShelfFinish?: RearShelfFinish; // Acabamento da madeira da prateleira decorativa
  rearShelfBracketInches?: number;   // Medida comercial em polegadas da mão francesa (8", 10", 12", 14", 16", 18", 20", 24"). Se omitido, calcula automaticamente pela altura!
  isRearShelfOpen?: boolean;     // Estado aberto/fechado da prateleira traseira
  upperCabinet?: boolean;        // Armário aéreo de quina sobre a caixa até o teto da Doblò
  upperCabinetDepthMm?: number;  // Largura para trás / Profundidade longitudinal em mm (Z) ou transversal (X) se lateral
  upperCabinetWidthMm?: number;  // Largura transversal do armário em mm (X) ou comprimento (Z) se lateral
  upperCabinetBottomGapMm?: number; // Espaçamento inferior em mm entre a bancada/caixa e a base do armário aéreo (padrão 0mm)
  upperCabinetOffsetMm?: number;    // Deslocamento longitudinal sobre a caixa em mm (limitado entre o início e o fim da caixa)
  upperCabinetPositionMode?: 'on_box' | 'behind_box'; // Posicionamento longitudinal: 'on_box' (sobre a caixa) ou 'behind_box' (atrás do móvel)
  upperCabinetBehindOffsetMm?: number; // Recuo para trás do móvel em mm (quando posicionado atrás do móvel)
  upperCabinetTransverseMode?: 'on_box' | 'beside_box'; // Posicionamento transversal: 'on_box' (sobre a caixa) ou 'beside_box' (ao lado / fora do móvel no eixo transversal)
  upperCabinetBesideOffsetMm?: number; // Recuo / afastamento para fora do móvel no eixo transversal em mm
  upperCabinetBesideSide?: 'corridor' | 'outer'; // Direção para fora transversal ('corridor' = em direção ao centro/corredor, 'outer' = em direção à parede/lataria)
  upperCabinetDepthOffsetMm?: number; // Recuo em profundidade / afastamento da borda ou parede em mm
  upperCabinetAlign?: UpperCabinetSide | 'all'; // Alinhamento no eixo longitudinal/lateral ou todas as faces
  upperCabinetSides?: UpperCabinetSide[]; // Lista de lados com armário aéreo ativo ('rear' | 'front' | 'left' | 'right')
  upperCabinetDoors?: boolean;   // Porta fechada com puxador (padrão true) ou nicho aéreo aberto (legado)
  upperCabinetClosure?: UpperCabinetClosure; // Tipo de fechamento: 'sliding_doors' (portas de correr bipartidas 2 folhas), 'doors' (porta basculante), 'open' (nicho aberto)
  upperCabinetShelves?: number;  // Quantidade de prateleiras internas (1 a 3, padrão 1)
  drawerMode?: DrawerMode;       // Alternância entre 'drawer' (gaveteiro alto fechado) ou 'slide_tray' (bandeja corrediça rasa)
  hasCentralTable?: boolean;     // Mesa dinette central removível c/ pedestal náutico
  centralTable?: CentralTableConfig; // Configuração dimensional e de deslocamento da mesa central
  hasLedCorner?: boolean;        // Perfil cantoneira de quina com LED na parte de baixo do módulo
  ledCorner?: BoxLedConfig;      // Configuração de iluminação e quinas da base com perfil LED
  hasFridge?: boolean;           // Geladeira portátil 12V instalada no interior do módulo (gavetão ou baú)
  fridgePresetId?: string;       // ID do preset de geladeira selecionado (ex: 'resfriar-35l')
  hasPortaPotti?: boolean;       // Vaso sanitário químico portátil instalado no interior do módulo (gavetão, bandeja ou baú)
  portaPottiPresetId?: string;   // ID do preset de porta potti selecionado (ex: 'seaflo-20l')
  hasStove?: boolean;            // Fogareiro portátil instalado no módulo (interior, tampo ou mesa traseira)
  stovePresetId?: string;        // ID do preset de fogareiro selecionado (ex: 'ntk-duo-ceramik')
  stovePlacement?: 'inside' | 'top' | 'rear_shelf'; // Local de instalação do fogareiro no módulo
  stoveRotation?: 0 | 90;        // Rotação horizontal do fogareiro (0° ou 90°)
  isOpen?: boolean;
  panels?: BoxPanelsConfig;
  thicknessMm?: number;          // Espessura padrão das chapas de madeira do módulo em mm (padrão: 15mm)
  panelThickness?: BoxPanelThicknessConfig; // Espessura individual por face/parte do módulo
  electronics?: InstalledElectronicItem[]; // Componentes elétricos instalados no interior deste módulo
}

export interface InternalGridConfig {
  lengthMm: number; // Comprimento total da área de carga (padrão 1700mm)
  widthMm: number;  // Largura total da área de carga (padrão 1200mm)
  heightMm: number; // Altura padrão do estrado/baús (padrão 400mm)
  floorThicknessMm?: number; // Espessura da chapa do assoalho base em mm (padrão 15mm)
  colsX: number;    // Divisórias na largura (X: 1 a 6)
  rowsZ: number;    // Divisórias no comprimento (Z: 1 a 8)
  offsetX?: number; // Deslocamento lateral em metros (padrão 0)
  offsetY?: number; // Deslocamento vertical de altura em metros (padrão 0)
  offsetZ?: number; // Deslocamento longitudinal frente/trás em metros (padrão 0)
  ledBaseboard?: LedBaseboardConfig; // Iluminação em perfil de LED no rodapé do assoalho
  centralTable?: CentralTableConfig; // Mesa dinette central fixada na chapa de compensado naval de 15mm (assoalho)
  ceiling?: CeilingConfig;           // Teto e forro do campervan (ripado ou chapa MDF/compensado com LED)
}

export interface InternalBoxesPreset {
  id: string;
  name: string;
  description: string;
  grid: InternalGridConfig;
  boxes: InternalBoxItem[];
}
