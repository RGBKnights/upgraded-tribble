import React, { useState, useEffect } from 'react';
import { BuildCanvas } from './components/BuildCanvas';
import { BlockPalette } from './components/BlockPalette';
import { LayerManager } from './components/LayerManager';
import { Toolbar } from './components/Toolbar';
import { BuildManager } from './components/BuildManager';
import { useBuild } from './hooks/useBuild';
import { useBlocks } from './hooks/useBlocks';
import { saveBuild } from './utils/buildStorage';
import { downloadSchematic } from './utils/schematicExporter';
import { Build } from './types/Block';
import { AIBuildChat } from './components/AIBuildChat';

function App() {
  const {
    build,
    setBuild,
    currentLayerIndex,
    setCurrentLayerIndex,
    selectedBlockId,
    setSelectedBlockId,
    placeBlock,
    addLayer,
    removeLayer,
    duplicateLayer,
    toggleLayerVisibility,
    undo,
    redo,
    canUndo,
    canRedo,
    resizeBuild
  } = useBuild();

  const {
    filteredBlocks,
    loading: blocksLoading,
    error: blocksError,
    searchTerm,
    setSearchTerm,
    loadBlocksFromJson,
    getBlockById
  } = useBlocks();

  const [showBuildManager, setShowBuildManager] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // Keyboard navigation for layers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'PageUp') {
        event.preventDefault();
        if (currentLayerIndex > 0) {
          setCurrentLayerIndex(currentLayerIndex - 1);
        }
      } else if (event.key === 'PageDown') {
        event.preventDefault();
        if (currentLayerIndex < build.layers.length - 1) {
          setCurrentLayerIndex(currentLayerIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLayerIndex, build.layers.length, setCurrentLayerIndex]);

  const handleSave = () => {
    try {
      saveBuild(build);
      alert('Build saved successfully!');
    } catch (error) {
      alert('Failed to save build: ' + error);
    }
  };

  const handleExport = () => {
    try {
      downloadSchematic(build, getBlockById);
    } catch (error) {
      alert('Failed to export schematic: ' + error);
      console.error('Export error:', error);
    }
  };

  const handleLoadBuild = (loadedBuild: Build) => {
    setBuild(loadedBuild);
    setCurrentLayerIndex(0);
  };

  const handleApplyAIBuild = (instructions: any[], explanation: string) => {
    console.log('Applying AI build with', instructions.length, 'instructions');
    console.log('Instructions:', instructions);
    
    // Start with current build
    const newBuild = { ...build };
    
    // Find the maximum Y coordinate to determine how many layers we need
    const maxY = Math.max(0, ...instructions.map(inst => inst.y || 0));
    console.log('Max Y coordinate:', maxY);
    
    // Ensure we have enough layers
    while (newBuild.layers.length <= maxY) {
      const newLayer = {
        id: `layer-${Date.now()}-${newBuild.layers.length}`,
        name: `Layer ${newBuild.layers.length + 1}`,
        blocks: {},
        visible: true
      };
      newBuild.layers.push(newLayer);
    };
    
    console.log('Build now has', newBuild.layers.length, 'layers');
    
    // Don't clear existing blocks - let AI decide what to keep/replace/remove
    
    // Track blocks per layer for debugging
    const layerCounts = {};
    
    // Apply AI instructions
    instructions.forEach(instruction => {
      const { x, y, z, blockId } = instruction;
      
      // Track layer usage
      layerCounts[y] = (layerCounts[y] || 0) + 1;
      
      // Validate coordinates and place block
      if (x >= 0 && x < build.width && 
          z >= 0 && z < build.height && 
          y >= 0 && y < newBuild.layers.length) {
        const key = `${x},${z}`;
        
        if (blockId === 0) {
          // Air block - remove any existing block at this position
          delete newBuild.layers[y].blocks[key];
        } else {
          // Place the block
          newBuild.layers[y].blocks[key] = blockId;
        }
      }
    });
    
    console.log('Blocks placed per layer:', layerCounts);
    
    newBuild.updatedAt = new Date().toISOString();
    setBuild(newBuild);
    setCurrentLayerIndex(0);
  };

  const currentLayer = build.layers[currentLayerIndex];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      <Toolbar
        buildName={build.name}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={handleSave}
        onLoad={() => setShowBuildManager(true)}
        onExport={handleExport}
        gridSize={{ width: build.width, height: build.height }}
        onResizeBuild={resizeBuild}
        onOpenAI={() => setShowAIChat(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <BlockPalette
          blocks={filteredBlocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLoadBlocks={loadBlocksFromJson}
          loading={blocksLoading}
          error={blocksError}
        />

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentLayer.name}
              </h2>
              <div className="text-gray-400 text-sm">
                Layer {currentLayerIndex + 1} of {build.layers.length} • 
                {Object.keys(currentLayer.blocks).length} blocks placed
              </div>
            </div>

            <BuildCanvas
              width={build.width}
              height={build.height}
              layers={build.layers}
              currentLayerIndex={currentLayerIndex}
              selectedBlockId={selectedBlockId}
              onPlaceBlock={placeBlock}
              getBlockById={getBlockById}
            />
          </div>
        </div>

        <LayerManager
          layers={build.layers}
          currentLayerIndex={currentLayerIndex}
          onSelectLayer={setCurrentLayerIndex}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onDuplicateLayer={duplicateLayer}
          onToggleVisibility={toggleLayerVisibility}
        />
      </div>

      <BuildManager
        isOpen={showBuildManager}
        onClose={() => setShowBuildManager(false)}
        onLoadBuild={handleLoadBuild}
      />

      <AIBuildChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        availableBlocks={filteredBlocks}
        build={build}
        onApplyBuild={handleApplyAIBuild}
        getBlockById={getBlockById}
      />
    </div>
  );
}

export default App;