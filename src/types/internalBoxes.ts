import type { InstalledElectronicItem } from './electronics';

export type InternalBoxType = 'chest' | 'drawer' | 'slide_tray' | 'open' | 'slat_bed';
export type DrawerMode = 'drawer' | 'slide_tray'; // Gaveteiro fechado alto vs Bandeja corrediça rasa
export type InternalBoxMaterial = 'plywood' | 'dark_wood' | 'white_mdf' | 'aluminum_box';
export type RearShelfFinish = 'pine_block' | 'teak' | 'dark_wood' | 'plywood';
export type ChestHingeDirection = 'front' | 'rear' | 'left' | 'right';
export type SlatBedDirection = 'left' | 'right' | 'front' | 'rear';
export type BoxSlideDirection = 'rear' | 'front' | 'left' | 'right';

export interface BoxSlideDirectionOption {
  direction: BoxSlideDirection;
  label: string;
  icon: string;
  isAvailable: boolean;
  blockedBy?: string;
}

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

export type BoxJointStyle =
  | 'sides_outside'   // Laterais externas passantes (tampo, base e fundo embutidos entre as laterais)
  | 'top_bottom_cap'  // Tampo e base maiores cobrindo por cima e por baixo das laterais
  | 'back_over_all';  // Fundo traseiro sobreposto total cobrindo todas as bordas traseiras (5 partes)

export type BackPanelCoverMode =
  | 'inset'           // Fundo interno embutido nas 4 partes em volta (entre laterais, tampo e base)
  | 'overlay_all';    // Fundo sobreposto maior fechando as 5 partes por trás (cobre topo, base e laterais)

export type UpperCabinetClosure = 'doors' | 'sliding_doors' | 'open' | 'drawer';

export function getUpperCabinetClosure(box: { upperCabinetClosure?: UpperCabinetClosure; upperCabinetDoors?: boolean }): UpperCabinetClosure {
  if (box.upperCabinetClosure) {
    if (box.upperCabinetClosure === 'drawer') return 'sliding_doors';
    return box.upperCabinetClosure;
  }
  if (box.upperCabinetDoors === false) return 'open';
  if (box.upperCabinetDoors === true) return 'doors';
  return 'sliding_doors';
}

/**
 * Retorna o desconto frontal (em mm) das prateleiras internas do armário aéreo para permitir o
 * fechamento livre das portas ou o deslize dos trilhos sem colisão.
 * Padrão marcenaria: 30mm para portas de correr (trilho duplo de alumínio + folga), 25mm para porta basculante (chapa + fecho push-lock), 15mm para friso anti-queda do nicho aberto.
 */
export function getUpperCabinetShelfDoorDiscountMm(box: {
  upperCabinetClosure?: UpperCabinetClosure;
  upperCabinetDoors?: boolean;
  upperCabinetShelfDoorDiscountMm?: number;
}): number {
  if (box.upperCabinetShelfDoorDiscountMm !== undefined && box.upperCabinetShelfDoorDiscountMm >= 0) {
    return box.upperCabinetShelfDoorDiscountMm;
  }
  const closure = getUpperCabinetClosure(box);
  if (closure === 'sliding_doors') return 30;
  if (closure === 'doors') return 25;
  return 15;
}

/**
 * Calcula quais direções estão desobstruídas (vazias) para o deslizamento de uma gaveta ou bandeja corrediça.
 * Se houver outro módulo adjacente na direção correspondente, a direção é marcada como bloqueada.
 */
export function getAvailableSlideDirections(
  box: InternalBoxItem,
  allBoxes: InternalBoxItem[]
): BoxSlideDirectionOption[] {
  const otherBoxes = allBoxes.filter((b) => b.id !== box.id);

  // 1. Traseira (rear): desce no grid (row > box.rowStart + box.rowSpan - 1)
  const rearBlocker = otherBoxes.find(
    (b) =>
      b.rowStart === box.rowStart + box.rowSpan &&
      Math.max(b.colStart, box.colStart) < Math.min(b.colStart + b.colSpan, box.colStart + box.colSpan)
  );

  // 2. Frente (front): sobe no grid (row < box.rowStart)
  const frontBlocker = otherBoxes.find(
    (b) =>
      b.rowStart + b.rowSpan === box.rowStart &&
      Math.max(b.colStart, box.colStart) < Math.min(b.colStart + b.colSpan, box.colStart + box.colSpan)
  );

  // 3. Lateral Esquerda (left): col < box.colStart
  const leftBlocker = otherBoxes.find(
    (b) =>
      b.colStart + b.colSpan === box.colStart &&
      Math.max(b.rowStart, box.rowStart) < Math.min(b.rowStart + b.rowSpan, box.rowStart + box.rowSpan)
  );

  // 4. Lateral Direita (right): col > box.colStart + box.colSpan - 1
  const rightBlocker = otherBoxes.find(
    (b) =>
      b.colStart === box.colStart + box.colSpan &&
      Math.max(b.rowStart, box.rowStart) < Math.min(b.rowStart + b.rowSpan, box.rowStart + box.rowSpan)
  );

  return [
    {
      direction: 'rear',
      label: 'Traseira (Porta-Malas)',
      icon: '▼',
      isAvailable: !rearBlocker,
      blockedBy: rearBlocker?.name
    },
    {
      direction: 'front',
      label: 'Frente (Cabine / Corredor)',
      icon: '▲',
      isAvailable: !frontBlocker,
      blockedBy: frontBlocker?.name
    },
    {
      direction: 'left',
      label: 'Lateral Esquerda (Motorista)',
      icon: '◀',
      isAvailable: !leftBlocker,
      blockedBy: leftBlocker?.name
    },
    {
      direction: 'right',
      label: 'Lateral Direita (Passageiro)',
      icon: '▶',
      isAvailable: !rightBlocker,
      blockedBy: rightBlocker?.name
    }
  ];
}

export type MattressFoamDensity = 'D28' | 'D33' | 'D45' | 'AG80' | 'D33_SOFT';

export function getMattressFoamName(foam?: MattressFoamDensity): string {
  switch (foam) {
    case 'D28':
      return 'Espuma D28';
    case 'D45':
      return 'Espuma D45';
    case 'AG80':
      return 'Espuma AG80';
    case 'D33_SOFT':
      return 'Espuma D33 Soft';
    case 'D33':
    default:
      return 'Espuma D33';
  }
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
  slideDirection?: BoxSlideDirection; // Direção de deslizamento da gaveta ou bandeja corrediça ('rear', 'front', 'left', 'right')
  slatExtensionPercent?: number; // Porcentagem de extensão ao abrir (50% a 100%, padrão 85%)
  slatWidthMm?: number;          // Largura nominal de cada ripa em mm (padrão ~70mm)
  mattressParts?: 1 | 2 | 3 | 4 | 5; // Divisão do colchão/estofado (1 = Inteiro, 2 = Bipartido, 3 = Tripartido, 5 = Total c/ Caixas de Roda)
  mattressFoam?: MattressFoamDensity; // Densidade/tipo da espuma do colchão ('D28', 'D33', 'D45', 'AG80', 'D33_SOFT')
  mattressThicknessMm?: number;       // Espessura da espuma em mm (50mm a 120mm, padrão 80mm)
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
  isUpperCabinetOpen?: boolean;  // Estado aberto/fechado individual das portas do armário aéreo
  upperCabinetShelves?: number;  // Quantidade de prateleiras internas (1 a 3, padrão 1)
  upperCabinetShelfDoorDiscountMm?: number; // Desconto/recuo frontal da prateleira para as portas (em mm, padrão automático: 30mm p/ correr, 25mm p/ abrir, 15mm p/ nicho)
  upperCabinetHasBasePanel?: boolean; // Chapa de fundo inferior do armário: true = 5 faces (com base), false = 4 faces (sem base, encosta na caixa abaixo), undefined = automático
  upperCabinetJointStyle?: BoxJointStyle; // Tipo de montagem das chapas do armário aéreo: 'sides_outside' (laterais passantes), 'top_bottom_cap' (tampo e base maiores) ou 'back_over_all' (fundo cobrindo tudo)
  upperCabinetBackCoverMode?: BackPanelCoverMode; // Modo de fechamento do fundo do armário aéreo: 'inset' (embutido nas 4 partes) ou 'overlay_all' (tampo traseiro cobrindo as 5 partes)
  boxJointStyle?: BoxJointStyle; // Tipo de montagem das chapas do módulo/baú inferior: 'sides_outside', 'top_bottom_cap' ou 'back_over_all'
  boxBackCoverMode?: BackPanelCoverMode; // Modo de fechamento do fundo do módulo/baú inferior: 'inset' (embutido nas 4 partes em volta) ou 'overlay_all' (tampo fechando as 5 partes)
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
  hasBattery?: boolean;          // Bateria LiFePO4 instalada no interior do módulo
  batteryPresetId?: string;      // ID do preset de bateria selecionado
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

export type RulerSnapType = 'vertex' | 'midpoint' | 'face_center' | 'edge' | 'face';
export type RulerAxisLock = 'x' | 'y' | 'z' | null;

export interface RulerSnapInfo {
  point: { x: number; y: number; z: number };
  snapType: RulerSnapType;
  snapLabel: string;
  partName: string;
}

export interface RulerMeasurement {
  id: string;
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  distanceMm: number;
  deltaXMm: number;
  deltaYMm: number;
  deltaZMm: number;
  axis: RulerAxisLock;
  startLabel: string;
  endLabel: string;
}

export interface RulerLiveState {
  isActive: boolean;
  lockedAxis: RulerAxisLock;
  inferredAxis: RulerAxisLock;
  hasStartPoint: boolean;
  startSnap: RulerSnapInfo | null;
  currentSnap: RulerSnapInfo | null;
  previewDistanceMm: number | null;
  previewDeltaXMm: number | null;
  previewDeltaYMm: number | null;
  previewDeltaZMm: number | null;
  measurements: RulerMeasurement[];
}
