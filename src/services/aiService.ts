interface Block {
  id: number;
  name: string;
  displayName: string;
}

interface BuildInstruction {
  x: number;
  y: number;
  z: number;
  blockId: number;
  blockName: string;
}

interface AIResponse {
  instructions: BuildInstruction[];
  explanation: string;
}

interface CurrentBuildState {
  width: number;
  height: number;
  layers: Array<{
    name: string;
    blocks: { [key: string]: number };
    visible: boolean;
  }>;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateBuildInstructions(
    description: string,
    availableBlocks: Block[],
    buildDimensions: { width: number; height: number; layers: number },
    currentBuild?: CurrentBuildState
  ): Promise<AIResponse> {
    const systemPrompt = this.createSystemPrompt(availableBlocks, buildDimensions, currentBuild);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Minecraft Build Designer'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Create a Minecraft build for: ${description}`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content;

      if (!aiMessage) {
        throw new Error('No response from AI');
      }

      return this.parseAIResponse(aiMessage, availableBlocks);
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to generate build instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSystemPrompt(
blocks: Block[],
dimensions: { width: number; height: number; layers: number },
currentBuild?: CurrentBuildState
): string {
const maxX = dimensions.width - 1; // X: 0..maxX
const maxY = dimensions.layers - 1; // Y: 0..maxY (layers)
const maxZ = dimensions.height - 1; // Z: 0..maxZ (depth)

// Compact block list to save tokens, but clear and unambiguous
const blockList = blocks.slice(0, 120)
.map(b => ${b.id}: ${b.displayName} (${b.name}))
.join('\n');

// Build simple palettes to guide material choices
const palettes = this.buildBlockPalettes(blocks);

// Summarize current build concisely
let currentState = '';
if (currentBuild && currentBuild.layers?.length) {
currentState += `CURRENT BUILD STATE:

Layers present: ${currentBuild.layers.length}

Bounds: X 0..${maxX}, Y 0..${maxY}, Z 0..${maxZ}

Existing blocks per layer (count):
`;

currentBuild.layers.forEach((layer, idx) => {
currentState +=   - y=${idx} "${layer.name}" blocks: ${Object.keys(layer.blocks || {}).length}\n;
});

currentState += `
Edit rules:

Keep existing blocks by not mentioning their positions.

Replace by placing a new block at the same (x,y,z).

Remove by placing air (blockId: 0), but ONLY if air is in the available blocks list.

You may add new layers above existing ones within Y 0..${maxY}.
`;
}

// Clear, consistent environment and contract
return [
'ROLE',
'You are a 3D voxel structure planner for a Minecraft-like builder. Your job is to design a coherent structure that fits within bounds and looks good from all sides, then output exact block placements.',
'',
'COORDINATE SYSTEM AND BOUNDS',
`- Axes:

X: width, left(0) -> right(${maxX})
Z: depth, front(0) -> back(${maxZ})
Y: height/layers, bottom(0) -> top(${maxY})
Origin (0,0,0) is bottom-left-front when looking from the front.

All placements MUST be within: 0<=X<=${maxX}, 0<=Y<=${maxY}, 0<=Z<=${maxZ},   '',   'AVAILABLE BLOCKS (only use these blockIds)',   blockList,   '',   'MATERIAL PALETTES (suggestions, still only use allowed ids above)',   - foundationCandidates: ${JSON.stringify(palettes.foundation)}

wallCandidates: ${JSON.stringify(palettes.walls)}

windowCandidates: ${JSON.stringify(palettes.windows)}

roofCandidates: ${JSON.stringify(palettes.roof)}

lightCandidates: ${JSON.stringify(palettes.lighting)}

stairsCandidates: ${JSON.stringify(palettes.stairs)}

slabCandidates: ${JSON.stringify(palettes.slabs)}

doorCandidates: ${JSON.stringify(palettes.doors)}

airId: ${palettes.air ?? 'none in palette'},   '',   currentState,   'DESIGN PROTOCOL',   1) Plan first:

Choose a footprint that fits in X..Z bounds (e.g., centered rectangle).
Choose a target height (number of layers) within 0..${maxY}.
Assign roles to layers (e.g., y=0: foundation, y=1-2: walls and openings, top: roof).
Prefer symmetry unless the user asks otherwise.
Build layer-by-layer:
y=0 (foundation): perimeter first, then floor fill. Use sturdy blocks from foundationCandidates.
Middle layers (walls): build perimeters; leave door(s) and window openings; place windows using windowCandidates if provided.
Top layer(s) (roof): cap neatly; stairs/slabs can create slopes; ensure overhangs fit bounds.
Aesthetics & practicality:
Center door(s) on front (Z small side) unless description specifies orientation.
Keep window heights consistent.
Use lighting blocks sparingly and symmetrically if present.
Strict constraints:
Only use blockIds listed in AVAILABLE BLOCKS.
Do not invent ids or names.
If air is not in the list, do not place air.
Keep coordinates inside bounds, no duplicates, no collisions beyond purposeful replacement.
Sorting & density:
Sort placements by y, then z, then x.
Prefer perimeter-first, then fill, to reduce overlaps and keep structure clean.,   '',   'OUTPUT CONTRACT (JSON ONLY)',   Return ONLY a valid JSON object with:
{
"explanation": string,
"plan": {
"footprint": string, // brief description
"usedLayers": number[], // e.g., [0,1,2]
"materials": { // optional, but helps coherence
"foundation": number[],
"walls": number[],
"windows": number[],
"roof": number[],
"lighting": number[]
}
},
"layers": [ // optional for your own reasoning
{ "y": number, "summary": string }
],
"instructions": [ // REQUIRED: this is what will be executed
{ "x": number, "y": number, "z": number, "blockId": number, "blockName": string }
]
}
instructions must be within bounds and deduplicated.

blockName should match the "name" or "displayName" of the used blockId from the available list.,   '',   'IMPORTANT',   - If the requested design cannot fit, scale it down.

If a suggested category (e.g., windows) is unavailable, choose the closest alternative from the list and explain that choice.

Use at least 2–3 layers for most structures unless the user description clearly indicates a 1-layer object.`,
].join('\n');
}

  // Helper to build palettes from block names
private buildBlockPalettes(blocks: Block[]) {
  const has = (re: RegExp) => (b: Block) => re.test(b.name) || re.test(b.displayName);
  const ids = (f: (b: Block) => boolean) => blocks.filter(f).map(b => b.id);
  
  const foundation = ids(/stone|cobble|brick|deepslate|basalt|concrete|terracotta|andesite|diorite|granite/i);
  const walls = ids(/plank|wood|log|stone|brick|quartz|concrete|terracotta|deepslate/i);
  const windows = ids(/glass|pane/i);
  const roof = ids(/slab|stair|tile|brick|plank|deepslate|copper|shingle/i);
  const lighting = ids(/torch|lantern|glow|shroom|sea.?lantern|lamp|redstone.?lamp/i);
  const stairs = ids(/stair/i);
  const slabs = ids(/slab/i);
  const doors = ids(/door/i);
  
  // Try to find air if present
  const airBlock = blocks.find(b => b.name === 'air' || b.displayName.toLowerCase() === 'air' || b.id === 0);
  const air = airBlock ? airBlock.id : undefined;
  
  return { foundation, walls, windows, roof, lighting, stairs, slabs, doors, air };
}



  private parseAIResponse(response: string, availableBlocks: Block[]): AIResponse {
    try {
      // Clean the response by removing markdown and comments
      let cleanedResponse = response;
      
      // Remove markdown code block fences
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      
      // Remove single-line comments (// ...)
      cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, '');
      
      // Remove multi-line comments (/* ... */)
      cleanedResponse = cleanedResponse.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Try to extract JSON from the cleaned response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
        throw new Error('Invalid response format: missing instructions array');
      }

      // Validate and filter instructions
      const validInstructions = parsed.instructions.filter((instruction: any) => {
        const hasRequiredFields = 
          typeof instruction.x === 'number' &&
          typeof instruction.y === 'number' &&
          typeof instruction.z === 'number' &&
          typeof instruction.blockId === 'number';

        if (!hasRequiredFields) return false;

        // Check if block exists
        const blockExists = availableBlocks.some(block => block.id === instruction.blockId);
        return blockExists;
      });

      return {
        instructions: validInstructions,
        explanation: parsed.explanation || 'AI generated build'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }
}