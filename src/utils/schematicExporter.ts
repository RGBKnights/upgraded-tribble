import { Build, Block } from '../types/Block';

interface SchematicData {
  version: number;
  dataVersion: number;
  width: number;
  height: number;
  length: number;
  blocks: number[];
  palette: { [key: string]: number };
  blockData: any[];
}

export const exportToSchematic = (build: Build, getBlockById: (id: number) => Block | undefined): Blob => {
  const { width, height: depth, layers } = build;
  const height = layers.length;
  
  // Create palette mapping
  const palette: { [key: string]: number } = {};
  const blocks: number[] = new Array(width * height * depth).fill(0); // Fill with air by default
  
  let paletteIndex = 0;
  
  // Add air to palette first
  palette['minecraft:air'] = paletteIndex++;
  
  // Process each layer
  layers.forEach((layer, layerIndex) => {
    Object.entries(layer.blocks).forEach(([posKey, blockId]) => {
      const [x, z] = posKey.split(',').map(Number);
      const block = getBlockById(blockId);
      
      if (!block || x >= width || z >= depth) return;
      
      const blockName = `minecraft:${block.name}`;
      
      // Add to palette if not exists
      if (!(blockName in palette)) {
        palette[blockName] = paletteIndex++;
      }
      
      // Calculate position in flat array (Y-Z-X order for Minecraft)
      const flatIndex = layerIndex * (width * depth) + z * width + x;
      blocks[flatIndex] = palette[blockName];
    });
  });

  // Create schematic data structure
  const schematicData: SchematicData = {
    version: 2,
    dataVersion: 2730, // Minecraft 1.17 data version
    width,
    height,
    length: depth,
    blocks,
    palette,
    blockData: []
  };

  // Convert to NBT-like JSON format for Bedrock
  const bedrockSchematic = {
    format_version: "1.17.0",
    size: [width, height, depth],
    structure: {
      block_indices: [
        blocks,
        new Array(blocks.length).fill(-1) // Second layer for additional block data
      ],
      entities: [],
      palette: {
        default: {
          block_palette: Object.entries(palette).map(([name, index]) => ({
            name,
            states: {},
            version: 17959425
          })),
          block_position_data: {}
        }
      }
    }
  };

  const jsonString = JSON.stringify(bedrockSchematic, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
};

export const downloadSchematic = (build: Build, getBlockById: (id: number) => Block | undefined) => {
  const blob = exportToSchematic(build, getBlockById);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${build.name.replace(/[^a-zA-Z0-9]/g, '_')}.mcstructure`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};