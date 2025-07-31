import { useState, useCallback } from 'react';
import { Build, BuildLayer, Block } from '../types/Block';

export const useBuild = () => {
  const [build, setBuild] = useState<Build>({
    id: 'default',
    name: 'New Build',
    width: 16,
    height: 16,
    layers: [
      {
        id: 'layer-0',
        name: 'Layer 1',
        blocks: {},
        visible: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1); // Stone by default (first non-air block)
  const [history, setHistory] = useState<Build[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((newBuild: Build) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...newBuild });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const placeBlock = useCallback((x: number, y: number, blockId: number) => {
    const key = `${x},${y}`;
    const newBuild = { ...build };
    const currentLayer = { ...newBuild.layers[currentLayerIndex] };
    
    if (blockId === 0) { // Air block - remove
      delete currentLayer.blocks[key];
    } else {
      currentLayer.blocks[key] = blockId;
    }
    
    newBuild.layers[currentLayerIndex] = currentLayer;
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
  }, [build, currentLayerIndex, saveToHistory]);

  const addLayer = useCallback(() => {
    const newBuild = { ...build };
    const newLayer: BuildLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${newBuild.layers.length + 1}`,
      blocks: {},
      visible: true
    };
    newBuild.layers.push(newLayer);
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
    setCurrentLayerIndex(newBuild.layers.length - 1);
  }, [build, saveToHistory]);

  const removeLayer = useCallback((layerIndex: number) => {
    if (build.layers.length <= 1) return;
    
    const newBuild = { ...build };
    newBuild.layers.splice(layerIndex, 1);
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
    
    if (currentLayerIndex >= newBuild.layers.length) {
      setCurrentLayerIndex(newBuild.layers.length - 1);
    } else if (currentLayerIndex > layerIndex) {
      setCurrentLayerIndex(currentLayerIndex - 1);
    }
  }, [build, currentLayerIndex, saveToHistory]);

  const duplicateLayer = useCallback((layerIndex: number) => {
    const newBuild = { ...build };
    const layerToDuplicate = newBuild.layers[layerIndex];
    const newLayer: BuildLayer = {
      id: `layer-${Date.now()}`,
      name: `${layerToDuplicate.name} Copy`,
      blocks: { ...layerToDuplicate.blocks },
      visible: true
    };
    newBuild.layers.splice(layerIndex + 1, 0, newLayer);
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
    setCurrentLayerIndex(layerIndex + 1);
  }, [build, saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBuild(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBuild(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const resizeBuild = useCallback((width: number, height: number) => {
    const newBuild = { ...build, width, height };
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
  }, [build, saveToHistory]);

  const toggleLayerVisibility = useCallback((layerIndex: number) => {
    const newBuild = { ...build };
    newBuild.layers[layerIndex] = {
      ...newBuild.layers[layerIndex],
      visible: !newBuild.layers[layerIndex].visible
    };
    newBuild.updatedAt = new Date().toISOString();
    
    saveToHistory(build);
    setBuild(newBuild);
  }, [build, saveToHistory]);

  return {
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
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    resizeBuild,
    toggleLayerVisibility
  };
};