import React, { useCallback, useState } from 'react';
import { Block, BuildLayer } from '../types/Block';

interface BuildCanvasProps {
  width: number;
  height: number;
  layers: BuildLayer[];
  currentLayerIndex: number;
  selectedBlockId: number;
  onPlaceBlock: (x: number, y: number, blockId: number) => void;
  getBlockById: (id: number) => Block | undefined;
}

export const BuildCanvas: React.FC<BuildCanvasProps> = ({
  width,
  height,
  layers,
  currentLayerIndex,
  selectedBlockId,
  onPlaceBlock,
  getBlockById
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'place' | 'erase'>('place');

  const handleMouseDown = useCallback((x: number, y: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDrawing(true);
    
    if (event.button === 0) { // Left click
      setDrawMode('place');
      onPlaceBlock(x, y, selectedBlockId);
    } else if (event.button === 2) { // Right click
      setDrawMode('erase'); 
      onPlaceBlock(x, y, 0); // Air block (id 0 in the new data)
    }
  }, [selectedBlockId, onPlaceBlock]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    
    if (drawMode === 'place') {
      onPlaceBlock(x, y, selectedBlockId);
    } else {
      onPlaceBlock(x, y, 0); // Air block (id 0 in the new data)
    }
  }, [isDrawing, drawMode, selectedBlockId, onPlaceBlock]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const renderCell = (x: number, y: number) => {
    const key = `${x},${y}`;
    
    // Get all visible layers at this position, from bottom to top
    const stackedBlocks = layers
      .map((layer, index) => ({
        layer,
        layerIndex: index,
        blockId: layer.blocks[key]
      }))
      .filter(item => item.layer.visible && item.blockId && item.blockId !== 0)
      .reverse(); // Reverse to render from bottom to top
    
    const isCurrentLayer = (layerIndex: number) => layerIndex === currentLayerIndex;
    
    return (
      <div
        key={key}
        className={`
          w-8 h-8 border border-gray-600/30 cursor-crosshair relative
          transition-all duration-75 hover:border-blue-400/60 bg-gray-800/20 hover:bg-gray-700/30
        `}
        onMouseDown={(e) => handleMouseDown(x, y, e)}
        onMouseEnter={() => handleMouseEnter(x, y)}
        onContextMenu={(e) => e.preventDefault()}
        title={stackedBlocks.length > 0 ? stackedBlocks[stackedBlocks.length - 1].layer.name : 'Empty'}
      >
        {/* Render stacked blocks */}
        {stackedBlocks.map((item, stackIndex) => {
          const block = getBlockById(item.blockId);
          if (!block || block.name === 'air') return null;
          
          return (
            <div
              key={`${item.layerIndex}-${stackIndex}`}
              className={`
                absolute inset-0 bg-cover bg-center
                ${isCurrentLayer(item.layerIndex) ? 'z-10' : `z-${stackIndex}`}
                ${isCurrentLayer(item.layerIndex) ? 'opacity-100' : 'opacity-70'}
              `}
              style={{
                backgroundImage: `url(${block.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          );
        })}
        
        {/* Current layer editing overlay */}
        {isCurrentLayer && (
          <div className="absolute inset-0 border-2 border-blue-400/20 pointer-events-none" />
        )}
      </div>
    );
  };

  return (
    <div 
      className="inline-block bg-gray-900/10 p-4 rounded-lg border border-gray-700/30"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="grid gap-0 select-none"
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
      >
        {Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => renderCell(x, y))
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Left click: Place | Right click: Erase | Drag to paint
      </div>
    </div>
  );
};