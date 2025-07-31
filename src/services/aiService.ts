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

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateBuildInstructions(
    description: string,
    availableBlocks: Block[],
    buildDimensions: { width: number; height: number; layers: number }
  ): Promise<AIResponse> {
    const systemPrompt = this.createSystemPrompt(availableBlocks, buildDimensions);
    
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

  private createSystemPrompt(blocks: Block[], dimensions: { width: number; height: number; layers: number }): string {
    const blockList = blocks.slice(0, 50).map(b => `${b.id}: ${b.displayName} (${b.name})`).join('\n');
    const maxX = dimensions.width - 1;
    const maxY = dimensions.layers - 1;
    const maxZ = dimensions.height - 1;
    
    return `You are a Minecraft build designer. Generate block placement instructions for 3D builds.

AVAILABLE BLOCKS:
${blockList}

BUILD SPACE:
- Width (X): 0 to ${maxX}
- Height (Z): 0 to ${maxZ}  
- Layers (Y): 0 to ${maxY} (0 = bottom layer)

COORDINATE SYSTEM:
- X: left to right (0 to ${maxX})
- Y: layer/height (0 = bottom, ${maxY} = top)
- Z: front to back (0 to ${maxZ})

RESPONSE FORMAT - RETURN ONLY VALID JSON:
You must respond with ONLY a valid JSON object. Do not include:
- Comments (// or /* */)
- Markdown formatting (``\`json)
- Extra text before or after the JSON
- Any characters outside the JSON object

Example valid response:
{
  "explanation": "Brief description of what you're building and design approach",
  "instructions": [
    {"x": 0, "y": 0, "z": 0, "blockId": 1, "blockName": "stone"},
    {"x": 1, "y": 0, "z": 0, "blockId": 4, "blockName": "cobblestone"}
  ]
}

GUIDELINES:
1. Start from the bottom layer (y=0) and work up
2. Use appropriate blocks for the structure (stone for foundations, wood for buildings, etc.)
3. Consider structural integrity - use solid blocks for support
4. Be creative but practical with block choices
5. Only use block IDs from the available blocks list
6. Keep coordinates within the build space bounds
7. Consider the build from all angles - it should look good from different viewpoints

Remember: This is a layer-by-layer 3D build system. Each instruction places one block at specific coordinates.`;
  }

  private parseAIResponse(response: string, availableBlocks: Block[]): AIResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
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