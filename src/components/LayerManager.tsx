import React from 'react';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { BuildLayer } from '../types/Block';

interface LayerManagerProps {
  layers: BuildLayer[];
  currentLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onAddLayer: () => void;
  onRemoveLayer: (index: number) => void;
  onDuplicateLayer: (index: number) => void;
  onToggleVisibility: (index: number) => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  currentLayerIndex,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onDuplicateLayer,
  onToggleVisibility
}) => {
  return (
    <div className="w-64 bg-gray-900/90 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Layers</h2>
          <button
            onClick={onAddLayer}
            className="p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors"
            title="Add Layer"
          >
            <Plus className="w-4 h-4 text-green-400" />
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Layer {currentLayerIndex + 1} of {layers.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`
              p-3 rounded-lg border transition-all duration-200 cursor-pointer
              ${index === currentLayerIndex
                ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                : 'bg-gray-800/30 border-gray-600/30 hover:bg-gray-800/50 hover:border-gray-500/50'
              }
            `}
            onClick={() => onSelectLayer(index)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{layer.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(index);
                  }}
                  className={`p-1 rounded transition-colors ${
                    layer.visible 
                      ? 'hover:bg-green-500/20 text-green-400' 
                      : 'hover:bg-gray-500/20 text-gray-500'
                  }`}
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(index);
                  }}
                  className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                  title="Duplicate Layer"
                >
                  <Copy className="w-3 h-3 text-blue-400" />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer(index);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    title="Remove Layer"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              {Object.keys(layer.blocks).length} blocks
            </div>
            
            
          </div>
        ))}
      </div>
    </div>
  );
};