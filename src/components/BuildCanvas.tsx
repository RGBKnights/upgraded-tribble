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
  viewMode: '2d' | '3d';
}

export const BuildCanvas: React.FC<BuildCanvasProps> = ({
  width,
  height,
  layers,
  currentLayerIndex,
  selectedBlockId,
  onPlaceBlock,
  getBlockById,
  viewMode
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'place' | 'erase'>('place');

  const handleMouseDown = useCallback((x: number, z: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDrawing(true);
    
    if (event.button === 0) { // Left click
      setDrawMode('place');
      onPlaceBlock(x, z, selectedBlockId);
    } else if (event.button === 2) { // Right click
      setDrawMode('erase'); 
      onPlaceBlock(x, z, 0); // Air block (id 0)
    }
  }, [selectedBlockId, onPlaceBlock]);

  const handleMouseEnter = useCallback((x: number, z: number) => {
    if (!isDrawing) return;
    
    if (drawMode === 'place') {
      onPlaceBlock(x, z, selectedBlockId);
    } else {
      onPlaceBlock(x, z, 0); // Air block (id 0)
    }
  }, [isDrawing, drawMode, selectedBlockId, onPlaceBlock]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Get all blocks in 3D space
  const getAllBlocks = () => {
    const allBlocks: Array<{ blockId: number; x: number; y: number; z: number; layerIndex: number; visible: boolean }> = [];
    
    layers.forEach((layer, layerIndex) => {
      if (!layer.visible) return;
      
      Object.entries(layer.blocks).forEach(([key, blockData]) => {
        if (typeof blockData === 'number') {
          // Legacy format - convert
          const [x, z] = key.split(',').map(Number);
          allBlocks.push({
            blockId: blockData,
            x,
            y: layerIndex,
            z,
            layerIndex,
            visible: true
          });
        } else {
          // New format with 3D coordinates
          allBlocks.push({
            ...blockData,
            layerIndex,
            visible: true
          });
        }
      });
    });
    
    return allBlocks;
  };

  const renderBlock = (blockData: { blockId: number; x: number; y: number; z: number; layerIndex: number; visible: boolean }) => {
    const block = getBlockById(blockData.blockId);
    if (!block || block.name === 'air' || blockData.blockId === 0) return null;

    const isCurrentLayer = blockData.layerIndex === currentLayerIndex;
    const blockSize = 32; // Size of each block in pixels
    
    const key = `${blockData.x}-${blockData.y}-${blockData.z}`;
    
    return (
      <div
        key={key}
        className={`absolute cursor-crosshair transition-all duration-200 border ${
          isCurrentLayer ? 'z-20 ring-2 ring-blue-400/50' : 'z-10'
        }`}
        style={{
          width: `${blockSize}px`,
          height: `${blockSize}px`,
          left: `${blockData.x * blockSize}px`,
          top: `${blockData.z * blockSize}px`,
          transform: `translateZ(${blockData.y * blockSize}px)`,
          backgroundImage: `url(${block.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isCurrentLayer ? 1 : 0.8,
          transformStyle: 'preserve-3d'
        }}
        onMouseDown={(e) => handleMouseDown(blockData.x, blockData.z, e)}
        onMouseEnter={() => handleMouseEnter(blockData.x, blockData.z)}
        onContextMenu={(e) => e.preventDefault()}
        title={`${block.displayName} (${blockData.x}, ${blockData.y}, ${blockData.z})`}
      />
    );
  };

  // Render 3D blocks and grid
  const render3DBlocks = () => {
    const blockSize = 32;
    const elements = [];
    
    // Render grid for current layer
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        // Check if there's already a block at this position
        const key = `${x},${z}`;
        const currentLayer = layers[currentLayerIndex];
        const hasBlock = currentLayer?.blocks[key];
        
        elements.push(
          <div
            key={`grid-${x}-${z}`}
            className={`absolute border border-gray-600/50 hover:border-blue-400/60 hover:bg-blue-400/20 transition-all cursor-crosshair ${
              hasBlock ? 'bg-gray-800/20' : 'bg-transparent'
            }`}
            style={{
              width: `${blockSize}px`,
              height: `${blockSize}px`,
              left: `${x * blockSize}px`,
              top: `${z * blockSize}px`,
              transform: `translateZ(${currentLayerIndex * blockSize}px)`,
              transformStyle: 'preserve-3d'
            }}
            onMouseDown={(e) => handleMouseDown(x, z, e)}
            onMouseEnter={() => handleMouseEnter(x, z)}
            onContextMenu={(e) => e.preventDefault()}
          />
        );
      }
    }
    
    // Add all blocks
    allBlocks.forEach(blockData => {
      const blockElement = renderBlock(blockData);
      if (blockElement) elements.push(blockElement);
    });
    
    return elements;
  };

  const allBlocks = getAllBlocks();
  const containerWidth = (width + height) * 16 + 200; // Approximate width for isometric view
  const containerHeight = (width + height) * 8 + (layers.length * 32) + 200; // Approximate height

  // 2D View Rendering
  const render2DView = () => {
    const currentLayer = layers[currentLayerIndex];
    if (!currentLayer) return null;

    const cellSize = 32;
    const gridWidth = width * cellSize;
    const gridHeight = height * cellSize;

    return (
      <div 
        className="relative bg-gray-900/10 rounded-lg border border-gray-700/30 overflow-hidden select-none"
        style={{ 
          width: `${gridWidth}px`, 
          height: `${gridHeight}px`
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 2D Grid */}
        <div className="absolute inset-0">
          {Array.from({ length: height }).map((_, z) =>
            Array.from({ length: width }).map((_, x) => {
              const key = `${x},${z}`;
              const blockData = currentLayer.blocks[key];
              let block = null;
              
              if (blockData) {
                const blockId = typeof blockData === 'number' ? blockData : blockData.blockId;
                block = getBlockById(blockId);
              }

              return (
                <div
                  key={`${x}-${z}`}
                  className={`absolute border border-gray-600/30 hover:border-blue-400/60 hover:bg-blue-400/10 transition-all cursor-crosshair ${
                    block ? 'bg-gray-800/20' : 'bg-transparent'
                  }`}
                  style={{
                    left: `${x * cellSize}px`,
                    top: `${z * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundImage: block && block.name !== 'air' ? `url(${block.url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onMouseDown={(e) => handleMouseDown(x, z, e)}
                  onMouseEnter={() => handleMouseEnter(x, z)}
                  onContextMenu={(e) => e.preventDefault()}
                  title={block ? `${block.displayName} (${x}, ${currentLayerIndex}, ${z})` : `Empty (${x}, ${currentLayerIndex}, ${z})`}
                >
                  {block && block.name === 'air' && (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px]">
                      AIR
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2D Layer indicator */}
        <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-sm z-30">
          Layer {currentLayerIndex + 1} of {layers.length}
          <div className="text-xs text-gray-300 mt-1">
            {Object.keys(currentLayer.blocks).length} blocks
          </div>
        </div>

        {/* 2D Controls hint */}
        <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-xs z-30">
          <div>Left click: Place | Right click: Erase</div>
          <div>2D Top-Down View</div>
        </div>
      </div>
    );
  };
  
  // 3D View Rendering  
  const render3DView = () => (
    <div 
      className="relative bg-gray-900/10 rounded-lg border border-gray-700/30 overflow-hidden select-none"
      style={{ 
        width: '800px', 
        height: '600px',
        minWidth: '600px',
        minHeight: '400px'
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 3D Scene Container with isometric transform */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotateX(60deg) rotateY(-45deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Render 3D blocks and grid */}
        {render3DBlocks()}
      </div>
      
      {/* Layer indicator - positioned outside 3D transform */}
      <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-sm z-30">
        Layer {currentLayerIndex + 1} of {layers.length}
        <div className="text-xs text-gray-300 mt-1">
          {Object.keys(layers[currentLayerIndex]?.blocks || {}).length} blocks
        </div>
      </div>
      
      {/* 3D Controls hint - positioned outside 3D transform */}
      <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-xs z-30">
        <div>Left click: Place | Right click: Erase</div>
        <div>3D Isometric View</div>
      </div>
    </div>
  );

  return (
    <div>
      {viewMode === '2d' ? render2DView() : render3DView()}
    </div>
  );
};