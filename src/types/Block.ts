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
  blocks: { [key: string]: number }; // position key -> block id
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