const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', '..', 'js', 'solarSystem.js');
const destPath = path.join(__dirname, '..', '..', 'src', 'three', 'SolarSystem.ts');

let content = fs.readFileSync(srcPath, 'utf8');

// Imports necessários no topo
const header = `import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { TextureGenerator } from './Textures';
import { SlideDirection, PanelOrientation, StructureMaterial, AluminumColor, StackLevels } from '../types';

`;

// Substitui declaração de classe para export
content = content.replace(/^class SolarSystem\s*\{/m, 'export class SolarSystem {');

// Tipar campos da classe
const classProps = `
  scene: THREE.Scene;
  group: THREE.Group;
  RACK_OFFSET_Z: number;
  BASE_Y: number;
  BASE_PROFILE_H: number;
  TRAY_PROFILE_H: number;
  DRAWER_STAGE_H: number;
  GAP_THERMAL: number;
  Y_LEVEL1_LOWER: number;
  Y_LEVEL1_UPPER: number;
  Y_LEVEL2: number;
  UPPER_TRAY_Y: number = 0;
  PANEL_SPECS: any;
  stackLevels: StackLevels;
  level1: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  level2: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  expansionProgress: number;
  explodedProgress: number;
  structureMaterial: StructureMaterial;
  aluminumColor: AluminumColor;
  showDimensions: boolean;
  showCableChain: boolean;
  upperTransparent: boolean;
  fixedFrameGroup: THREE.Group;
  upperLayerGroup: THREE.Group;
  slidingLayerGroup1: THREE.Group;
  slidingLayerGroup2: THREE.Group;
  slidingLayerGroup3: THREE.Group;
  intermediateRailsGroup1: THREE.Group;
  intermediateRailsGroup2: THREE.Group;
  intermediateRailsGroup3: THREE.Group;
  intermediateRailsGroup4: THREE.Group;
  dimensionsGroup: THREE.Group;
  cableChainGroup: THREE.Group;
  batteryGroup: THREE.Group;
  weldGussetsGroup: THREE.Group;
  aluminumBracketsGroup: THREE.Group;
  mpptGroup: THREE.Group;
  slidingLayers: THREE.Group[];
  rackMeshes: THREE.Mesh[];
  currentTrayDims: any;
  groupOffsetZ?: number;
  groupOffsetY?: number;
  level1Motion?: any;
  level2Motion?: any;
`;

content = content.replace(/(export class SolarSystem \{\s*\n)/, `$1${classProps}\n`);

// Tipar construtor
content = content.replace(/^(\s*)constructor\(scene\)\s*\{/m, '$1constructor(scene: THREE.Scene) {');

// Fix set panelsPerLevel
content = content.replace(/set panelsPerLevel\(val\)\s*\{[\s\S]*?this\.level2\.panels = v;\s*\}/m, `set panelsPerLevel(val: any) {
    const v = parseInt(val);
    if (![1, 2, 3, 4].includes(v)) return;
    this.level1.panels = v;
    this.level2.panels = v;
  }`);

content = content.replace(/set slideDirection\(val\)\s*\{[\s\S]*?this\.level2\.slideDirection = val;\s*\}/m, `set slideDirection(val: SlideDirection) {
    this.level2.slideDirection = val;
  }`);

content = content.replace(/set panelOrientation\(val\)\s*\{[\s\S]*?this\.level2\.orientation = val;\s*\}/m, `set panelOrientation(val: PanelOrientation) {
    this.level1.orientation = val;
    this.level2.orientation = val;
  }`);

content = content.replace(/setStackLevels\(levels\)\s*\{[\s\S]*?const val = parseInt\(levels\);/m, `setStackLevels(levels: any) {
    const val = parseInt(levels) as StackLevels;`);

content = content.replace(/^(\s*)setLevel1Panels\(count\)\s*\{/m, '$1setLevel1Panels(count: any) {');
content = content.replace(/^(\s*)setLevel2Panels\(count\)\s*\{/m, '$1setLevel2Panels(count: any) {');
content = content.replace(/^(\s*)setLevel1Direction\(direction\)\s*\{/m, '$1setLevel1Direction(direction: any) {');
content = content.replace(/^(\s*)setLevel2Direction\(direction\)\s*\{/m, '$1setLevel2Direction(direction: any) {');
content = content.replace(/^(\s*)setLevel1Orientation\(orientation\)\s*\{/m, '$1setLevel1Orientation(orientation: any) {');
content = content.replace(/^(\s*)setLevel2Orientation\(orientation\)\s*\{/m, '$1setLevel2Orientation(orientation: any) {');
content = content.replace(/^(\s*)setSlideDirection\(direction\)\s*\{/m, '$1setSlideDirection(direction: any) {');
content = content.replace(/^(\s*)setPanelOrientation\(orientation\)\s*\{/m, '$1setPanelOrientation(orientation: any) {');
content = content.replace(/^(\s*)setPanelsPerLevel\(count\)\s*\{/m, '$1setPanelsPerLevel(count: any) {');
content = content.replace(/^(\s*)setStructureMaterial\(type\)\s*\{/m, '$1setStructureMaterial(type: any) {');
content = content.replace(/^(\s*)setAluminumColor\(color\)\s*\{/m, '$1setAluminumColor(color: any) {');
content = content.replace(/^(\s*)setCableChainVisible\(visible\)\s*\{/m, '$1setCableChainVisible(visible: boolean) {');
content = content.replace(/^(\s*)setDimensionsVisible\(visible\)\s*\{/m, '$1setDimensionsVisible(visible: boolean) {');
content = content.replace(/^(\s*)setUpperTransparency\(transparent\)\s*\{/m, '$1setUpperTransparency(transparent: boolean) {');
content = content.replace(/^(\s*)setGroupOffsetZ\(z\)\s*\{/m, '$1setGroupOffsetZ(z: number) {');
content = content.replace(/^(\s*)setGroupOffsetY\(y\)\s*\{/m, '$1setGroupOffsetY(y: number) {');

// Fix child traverse
content = content.replace(/this\.upperLayerGroup\.traverse\(child => \{/g, 'this.upperLayerGroup.traverse((child: any) => {');

// Fix buildStackStructure() call with argument
content = content.replace(/this\.buildStackStructure\(trayDimsL2\);/g, 'this.buildStackStructure();');

// Fix risersPos set(...p)
content = content.replace(/riser\.position\.set\(\.\.\.p\);/g, 'riser.position.set(p[0], p[1], p[2]);');

// Fix method declarations ONLY
content = content.replace(/^(\s*)calculateTrayDimensions\(panelCount,\s*orientation\)\s*\{/m, '$1calculateTrayDimensions(panelCount?: any, orientation?: any): any {');
content = content.replace(/^(\s*)buildBaseRack\(trayDims\)\s*\{/m, '$1buildBaseRack(trayDims?: any) {');
content = content.replace(/^(\s*)buildTrayLevel\(([^)]*)\)\s*\{/m, '$1buildTrayLevel(targetGroup: any, trayDims: any, xCenter: number, yLevel: number, zCenter: number, levelIndex: number, labelText: string) {');
content = content.replace(/^(\s*)createFlexiblePanelMesh\(([^)]*)\)\s*\{/m, '$1createFlexiblePanelMesh(width: number, length: number, thickness: number, labelText?: string) {');
content = content.replace(/^(\s*)addSpacerPosts\(([^)]*)\)\s*\{/m, '$1addSpacerPosts(targetGroup: any, l2Width: number, l2Length: number, yFrom: number, yTo: number, zCenter: number, slideDir: string = "longitudinal") {');
content = content.replace(/^(\s*)addTelescopicRails\(([^)]*)\)\s*\{/m, '$1addTelescopicRails(fixedGroup: any, intermediateGroup: any, movingGroup: any, width: number, length: number, xCenter: number, yLevel: number, zCenter: number, directionSign: number) {');
content = content.replace(/^(\s*)addLateralTelescopicRails\(([^)]*)\)\s*\{/m, '$1addLateralTelescopicRails(fixedGroup: any, intermediateGroup: any, movingGroup: any, width: number, length: number, xCenter: number, yLevel: number, zCenter: number, directionSign: number) {');
content = content.replace(/^(\s*)buildDimensionLines\(trayDims\)\s*\{/m, '$1buildDimensionLines(trayDims: any) {');
content = content.replace(/^(\s*)createDimensionCallout\(([^)]*)\)\s*\{/m, '$1createDimensionCallout(ptA: any, ptB: any, title: string, subtitle?: string, spritePos?: any) {');
content = content.replace(/^(\s*)updateExpansion\(progress\)\s*\{/m, '$1updateExpansion(progress: number) {');
content = content.replace(/^(\s*)applyLevelMotion\(([^)]*)\)\s*\{/m, '$1applyLevelMotion(config: any, motionInfo: any, groupA: any, groupB: any, interA: any, interB: any, progress: number) {');
content = content.replace(/^(\s*)updateExploded\(progress\)\s*\{/m, '$1updateExploded(progress: number) {');
content = content.replace(/^(\s*)updateCableChains\(progress\)\s*\{/m, '$1updateCableChains(progress: number) {');
content = content.replace(/^(\s*)clearGroup\(grp\)\s*\{/m, '$1clearGroup(grp: any) {');

fs.writeFileSync(destPath, header + content, 'utf8');
console.log('✅ SolarSystem.ts gerado com métodos devidamente tipados!');
