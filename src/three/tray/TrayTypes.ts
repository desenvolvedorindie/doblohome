import { SlideDirection } from '../../types';

export interface TrayDimensions {
  panelW: number;
  panelL: number;
  cols: number;
  rows: number;
  panelCount: number;
  trayWidth: number;
  trayLength: number;
}

export interface MotionPlan {
  dir: SlideDirection;
  travelA: number;
  travelB: number;
}
