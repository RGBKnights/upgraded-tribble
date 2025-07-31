import React from 'react';
import { Search, Upload } from 'lucide-react';
import { Block } from '../types/Block';

interface BlockPaletteProps {
  blocks: Block[];
  selectedBlockId: number;
  onSelectBlock: (blockId: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onLoadBlocks: (blocks: Block[]) => void;
  loading?: boolean;
  error?: string | null;
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  searchTerm,
  onSearchChange,
  onLoadBlocks,
  loading = false,
  error = null
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          onLoadBlocks(jsonData);
        } else {
          alert('Invalid JSON format. Expected an array of blocks.');
        }
      } catch (error) {
        alert('Failed to parse JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-80 bg-gray-900/90 backdrop-blur-sm border-r border-gray-700/50 flex flex-col overflow-x-hidden">
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-3">Block Palette</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 min-w-0"
          />
        </div>

        
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Loading blocks...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="text-red-400 text-sm font-medium mb-1">Error loading blocks</div>
            <div className="text-red-300 text-xs">{error}</div>
          </div>
        )}
        
        {!loading && !error && blocks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">No blocks available</div>
          </div>
        )}
        
        <div className="grid grid-cols-6 gap-2 min-w-0">
          {blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`
                relative w-8 h-8 border-2 transition-all duration-200 group flex-shrink-0
                ${selectedBlockId === block.id 
                  ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25' 
                  : 'border-gray-600/50 hover:border-gray-500 hover:bg-gray-800/30'
                }
              `}
              title={block.displayName}
            >
              <div 
                className="w-full h-full bg-cover bg-center bg-gray-800/30"
                style={{
                  backgroundImage: block.name !== 'air' ? `url(${block.url})` : undefined
                }}
              >
                {block.name === 'air' && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px]">
                    AIR
                  </div>
                )}
              </div>
              
              {/* Light emission indicator */}
              {block.emitLight > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border border-gray-800 text-[10px] flex items-center justify-center text-black font-bold">
                  ✦
                </div>
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {block.displayName}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};