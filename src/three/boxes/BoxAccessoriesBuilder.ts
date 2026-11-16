import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import { buildRearFoldShelfAccessory } from './accessories/RearFoldShelfBuilder';
import { buildBoxLedCornerAccessory } from './accessories/BoxLedCornerBuilder';
import {
  buildFridgeApplianceAccessory,
  buildPortaPottiApplianceAccessory
} from './accessories/FridgePortaPottiBuilder';
import { buildStoveApplianceAccessory } from './accessories/StoveApplianceBuilder';

export class BoxAccessoriesBuilder {
  buildRearFoldShelf(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    buildRearFoldShelfAccessory(container, w, l, h, box, isSelected, isOpen);
  }

  buildBoxLedCorner(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    buildBoxLedCornerAccessory(container, w, l, h, box, isSelected);
  }

  buildFridgeAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    buildFridgeApplianceAccessory(container, w, l, h, box, isSelected);
  }

  buildPortaPottiAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    buildPortaPottiApplianceAccessory(container, w, l, h, box, isSelected);
  }

  buildStoveAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean = false,
    isBedOpen: boolean = false
  ) {
    buildStoveApplianceAccessory(container, w, l, h, box, isSelected, isOpen, isBedOpen);
  }
}
