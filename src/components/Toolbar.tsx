import React from 'react';
import { 
  Undo, 
  Redo, 
  Save, 
  FolderOpen, 
  Download, 
  Grid,
  Maximize,
  Sparkles,
  Box,
  Square
} from 'lucide-react';

interface ToolbarProps {
  buildName: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  gridSize: { width: number; height: number };
  onResizeBuild: (width: number, height: number) => void;
  onOpenAI: () => void;
  viewMode: '2d' | '3d';
  onToggleView: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  buildName,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onLoad,
  onExport,
  gridSize,
  onResizeBuild,
  onOpenAI,
  viewMode,
  onToggleView
}) => {
  const [showResizeDialog, setShowResizeDialog] = React.useState(false);
  const [newWidth, setNewWidth] = React.useState(gridSize.width);
  const [newHeight, setNewHeight] = React.useState(gridSize.height);

  const handleResize = () => {
    onResizeBuild(newWidth, newHeight);
    setShowResizeDialog(false);
  };

  return (
    <>
      <div className="h-16 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Minecraft Build Designer</h1>
          </div>
          <div className="text-gray-400 text-sm">
            {buildName} ({gridSize.width}×{gridSize.height})
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Controls */}
          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`
                p-2 rounded-lg transition-colors
                ${canUndo 
                  ? 'hover:bg-gray-700/50 text-white' 
                  : 'text-gray-600 cursor-not-allowed'
                }
              `}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`
                p-2 rounded-lg transition-colors
                ${canRedo 
                  ? 'hover:bg-gray-700/50 text-white' 
                  : 'text-gray-600 cursor-not-allowed'
                }
              `}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* File Operations */}
          <button
            onClick={onOpenAI}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-purple-400"
            title="AI Build Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          <button
            onClick={onToggleView}
            className={`p-2 hover:bg-gray-700/50 rounded-lg transition-colors ${
              viewMode === '3d' ? 'text-blue-400' : 'text-white'
            }`}
            title={`Switch to ${viewMode === '2d' ? '3D' : '2D'} View`}
          >
            {viewMode === '2d' ? <Box className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowResizeDialog(true)}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-white"
            title="Resize Build"
          >
            <Maximize className="w-4 h-4" />
          </button>
          
          <button
            onClick={onSave}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-white"
            title="Save Build"
          >
            <Save className="w-4 h-4" />
          </button>
          
          <button
            onClick={onLoad}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-white"
            title="Load Build"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors text-green-300 flex items-center gap-2"
            title="Export as Schematic"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Resize Dialog */}
      {showResizeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Resize Build</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  min="1"
                  max="128"
                  value={newWidth}
                  onChange={(e) => setNewWidth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  min="1"
                  max="128"
                  value={newHeight}
                  onChange={(e) => setNewHeight(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResizeDialog(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResize}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Resize
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};