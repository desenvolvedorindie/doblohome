import { SavedConfig } from './solar';
import { InternalBoxItem, InternalGridConfig } from './internalBoxes';
import { PartsGroupFilter } from './structure';

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  templateId?: string;
  modulesCount: number;
  panelsCount: number;
  tags?: string[];
}

export interface ProjectData {
  config: SavedConfig;
  internalBoxes: InternalBoxItem[];
  internalGrid: InternalGridConfig;
  partsFilter?: PartsGroupFilter;
}

export interface Project extends ProjectMetadata {
  data: ProjectData;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon?: string;
  createData: () => ProjectData;
}
