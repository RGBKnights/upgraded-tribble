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
    const blockList = blocks.slice(0, 100).map(b => 
      `${b.id}: ${b.displayName} (${b.name}) - Material: ${b.material}, Light: ${b.emitLight > 0 ? 'Yes' : 'No'}`
    ).join('\n');
    const maxX = dimensions.width - 1;
    const maxY = dimensions.layers - 1;
    const maxZ = dimensions.height - 1;
    
    let currentStateDescription = '';
    if (currentBuild && currentBuild.layers.length > 0) {
      currentStateDescription = '\n\nCURRENT BUILD STATE:\n';
      currentStateDescription += 'The build currently has ' + currentBuild.layers.length + ' layers:\n';
      
      currentBuild.layers.forEach((layer, index) => {
        const blockCount = Object.keys(layer.blocks).length;
        currentStateDescription += '- Layer ' + index + ' (' + layer.name + '): ' + blockCount + ' blocks placed\n';
        
        if (blockCount > 0) {
          currentStateDescription += '  Existing blocks:\n';
          Object.entries(layer.blocks).forEach(([position, blockId]) => {
            const [x, z] = position.split(',').map(Number);
            const block = blocks.find(b => b.id === blockId);
            if (block) {
              currentStateDescription += '    x:' + x + ', y:' + index + ', z:' + z + ' = ' + block.displayName + '\n';
            }
          });
        }
      });
      
      currentStateDescription += '\nWhen modifying the build:\n';
      currentStateDescription += '- You can keep existing blocks by not mentioning their positions\n';
      currentStateDescription += '- You can replace blocks by placing new ones at existing positions\n';
      currentStateDescription += '- You can remove blocks by placing air (blockId: 0) at their positions\n';
      currentStateDescription += '- You can add new blocks to empty positions\n';
      currentStateDescription += '- You can add new layers above the existing ones\n';
    }
    
    return 'You are a Minecraft build designer. Generate block placement instructions for 3D builds.\n\n' +
           'AVAILABLE BLOCKS:\n' +
           blockList + '\n\n' +
           'BUILD SPACE:\n' +
           '- Width (X): 0 to ' + maxX + '\n' +
           '- Height (Z): 0 to ' + maxZ + '\n' +
           '- Layers (Y): 0 to ' + maxY + ' (0 = bottom layer)\n\n' +
           currentStateDescription + '\n\n' +
           'COORDINATE SYSTEM:\n' +
           '- X: left to right (0 to ' + maxX + ')\n' +
           '- Y: layer/height (0 = bottom, ' + maxY + ' = top)\n' +
           '- Z: front to back (0 to ' + maxZ + ')\n\n' +
           'RESPONSE FORMAT - RETURN ONLY VALID JSON:\n' +
           'You must respond with ONLY a valid JSON object. Do not include:\n' +
           '- Comments (// or /* */)\n' +
           '- Markdown formatting (```json)\n' +
           '- Extra text before or after the JSON\n' +
           '- Any characters outside the JSON object\n\n' +
           'Example valid response:\n' +
           '{\n' +
           '  "explanation": "Brief description of what you\'re building and design approach",\n' +
           '  "instructions": [\n' +
           '    {"x": 0, "y": 0, "z": 0, "blockId": 1, "blockName": "stone"},\n' +
           '    {"x": 1, "y": 0, "z": 0, "blockId": 4, "blockName": "cobblestone"}\n' +
           '  ]\n' +
           '}\n\n' +
           'GUIDELINES:\n' +
           '1. Start from the bottom layer (y=0) and work up\n' +
          '2. ALWAYS use multiple layers for any structure taller than 1 block:\n' +
          '   - y=0: Foundation/ground floor\n' +
          '   - y=1: Second floor/walls\n' +
          '   - y=2: Third floor/roof\n' +
          '   - Continue upward as needed\n' +
          '3. For multi-story buildings:\n' +
          '   - Place foundation blocks on y=0\n' +
          '   - Build walls on y=1, y=2, etc.\n' +
          '   - Add roofs on the top layer\n' +
          '4. Example multi-layer house:\n' +
          '   - y=0: Stone foundation blocks\n' +
          '   - y=1: Wood plank walls with glass windows\n' +
          '   - y=2: Wood plank roof\n' +
          '5. Use appropriate blocks for the structure:\n' +
           '   - Stone/Cobblestone (ids: 1, 4) for foundations and walls\n' +
           '   - Wood planks (ids: 5, 126, 127, 128, 129, 130) for buildings and structures\n' +
           '   - Glass (id: 20) for windows\n' +
           '   - Air (id: 0) to remove blocks or create empty spaces\n' +
          '6. Consider structural integrity - use solid, heavy blocks for foundations\n' +
          '7. Be creative but practical with block choices\n' +
          '8. CRITICAL: Only use block IDs from the available blocks list above\n' +
          '9. Keep coordinates within the build space bounds\n' +
          '10. Consider the build from all angles - it should look good from different viewpoints\n' +
          '11. For air blocks or empty spaces, use blockId: 0 and blockName: "air"\n' +
          '12. IMPORTANT: Most builds should use at least 2-3 layers (y=0, y=1, y=2) for proper height\n\n' +
           'Remember: This is a layer-by-layer 3D build system. Each instruction places one block at specific coordinates.';
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