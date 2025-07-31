import React, { useState } from 'react';
import { X, Download, Trash2, Calendar } from 'lucide-react';
import { Build } from '../types/Block';
import { loadBuilds, deleteBuild, downloadBuildJson } from '../utils/buildStorage';

interface BuildManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadBuild: (build: Build) => void;
}

export const BuildManager: React.FC<BuildManagerProps> = ({
  isOpen,
  onClose,
  onLoadBuild
}) => {
  const [builds, setBuilds] = useState<Build[]>(loadBuilds());

  // Refresh builds list when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setBuilds(loadBuilds());
    }
  }, [isOpen]);

  const handleDelete = async (buildId: string) => {
    if (confirm('Are you sure you want to delete this build?')) {
      try {
        deleteBuild(buildId);
        setBuilds(loadBuilds());
      } catch (error) {
        alert('Failed to delete build');
      }
    }
  };

  const handleLoad = (build: Build) => {
    onLoadBuild(build);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-4xl w-full max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Saved Builds</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {builds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No saved builds found</div>
              <div className="text-gray-500 text-sm">
                Create and save your first build to see it here
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="bg-gray-700/50 rounded-lg border border-gray-600/50 p-4 hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium truncate mr-2">
                      {build.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => downloadBuildJson(build)}
                        className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                        title="Download JSON"
                      >
                        <Download className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(build.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Delete Build"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-3 space-y-1">
                    <div>Size: {build.width}×{build.height}</div>
                    <div>Layers: {build.layers.length}</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(build.updatedAt)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoad(build)}
                    className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 transition-colors"
                  >
                    Load Build
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};