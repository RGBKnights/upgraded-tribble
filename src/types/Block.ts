export interface Block {
  id: number;
  name: string;
  displayName: string;
  hardness: number;
  resistance: number;
  stackSize: number;
  diggable: boolean;
  material: string;
  transparent: boolean;
  emitLight: number;
  filterLight: number;
  defaultState: number;
  minStateId: number;
  maxStateId: number;
  drops: number[];
  boundingBox: string;
  url: string;
}

export interface BuildLayer {
  id: string;
  name: string;
  blocks: { [key: string]: { blockId: number; x: number; y: number; z: number } }; // position key -> block with 3D coords
  visible: boolean;
}

export interface Build {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: BuildLayer[];
  createdAt: string;
  updatedAt: string;
}