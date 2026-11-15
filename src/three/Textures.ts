import { SolarTextures } from './textures/SolarTextures';
import { MetalTextures } from './textures/MetalTextures';
import { SpriteTextures } from './textures/SpriteTextures';
import { BatteryTextures } from './textures/BatteryTextures';

/**
 * Gerador de Texturas Procedurais e Sprites 3D
 * Painéis Solares Monocristalinos de Alta Eficiência, Metais e Cotas
 */
export const TextureGenerator = {
  createSolarPanelTexture: SolarTextures.createSolarPanelTexture,
  createFlexiblePanelTexture: SolarTextures.createFlexiblePanelTexture,
  createBrushedMetalTexture: MetalTextures.createBrushedMetalTexture,
  createExtrusionMetalTexture: MetalTextures.createExtrusionMetalTexture,
  createMetalonSteelTexture: MetalTextures.createMetalonSteelTexture,
  createDimensionSprite: SpriteTextures.createDimensionSprite,
  createMotobulEmblemTexture: SpriteTextures.createMotobulEmblemTexture,
  createKingboBatteryFrontTexture: BatteryTextures.createKingboBatteryFrontTexture,
  createKingboBmsScreenTexture: BatteryTextures.createKingboBmsScreenTexture,
  createKingboBatteryTopTexture: BatteryTextures.createKingboBatteryTopTexture
};

export { SolarTextures, MetalTextures, SpriteTextures, BatteryTextures };
