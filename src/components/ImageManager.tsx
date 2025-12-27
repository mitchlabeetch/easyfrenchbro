import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Upload, Trash2, Image, FolderOpen, X, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// IMAGE MANAGER COMPONENT
// Gallery for managing local assets with drag-and-drop support
// ─────────────────────────────────────────────────────────────────

interface Asset {
  name: string;
  path: string;
  size: number;
  modified: string;
}

interface ImageManagerProps {
  onSelectImage?: (path: string) => void;
  onInsertImage?: (path: string, alt: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const API_BASE = 'http://localhost:3001';

export const ImageManager: React.FC<ImageManagerProps> = ({
  onSelectImage,
  onInsertImage,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Fetch assets list
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/assets-list`);
      if (!response.ok) throw new Error('Failed to load assets');
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!collapsed) {
      fetchAssets();
    }
  }, [collapsed, fetchAssets]);

  // Upload file
  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }
      
      await fetchAssets(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete asset
  const deleteAsset = async (filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/assets/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      await fetchAssets();
      if (selectedAsset?.name === filename) {
        setSelectedAsset(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ''; // Reset input
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  // Handle image drag for insertion
  const handleImageDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/x-image', JSON.stringify({
      type: 'image',
      path: asset.path,
      name: asset.name,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Open assets folder
  const openAssetsFolder = async () => {
    try {
      await fetch(`${API_BASE}/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'assets' }),
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (collapsed) {
    return (
      <div className="border-b bg-gray-50 p-2">
        <button
          onClick={onToggleCollapse}
          className="w-full text-left text-xs font-medium text-gray-600 flex items-center gap-2"
        >
          <Image size={14} />
          <span>Image Manager</span>
          <span className="ml-auto text-gray-400">{assets.length}</span>
          <span>▼</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-b bg-gray-50">
      {/* Header */}
      <div className="p-2 border-b bg-white flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
          <Image size={14} />
          Image Manager
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchAssets}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAssetsFolder}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Open folder"
          >
            <FolderOpen size={12} />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              ▲
            </button>
          )}
        </div>
      </div>

      {/* Upload area */}
      <div
        className={clsx(
          'p-3 border-2 border-dashed m-2 rounded-lg transition-colors',
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
          uploading && 'opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center cursor-pointer">
          <Upload size={20} className="text-gray-400" />
          <span className="text-xs text-gray-500 mt-1">
            {uploading ? 'Uploading...' : 'Drop image or click to upload'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-2 mb-2 p-2 bg-red-50 text-red-600 text-xs rounded flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="ml-2">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Asset grid */}
      <div className="p-2 max-h-48 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 text-xs py-4">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-4">No images yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => (
              <div
                key={asset.name}
                draggable
                onDragStart={(e) => handleImageDragStart(e, asset)}
                onClick={() => {
                  setSelectedAsset(asset);
                  onSelectImage?.(asset.path);
                }}
                onDoubleClick={() => onInsertImage?.(asset.path, asset.name)}
                className={clsx(
                  'relative aspect-square rounded border overflow-hidden cursor-grab group',
                  'hover:border-blue-400 transition-colors',
                  selectedAsset?.name === asset.name && 'ring-2 ring-blue-500'
                )}
                title={`${asset.name}\n${formatSize(asset.size)}\nDrag to insert`}
              >
                <img
                  src={`${API_BASE}${asset.path}`}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAsset(asset.name);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full 
                             flex items-center justify-center opacity-0 group-hover:opacity-100 
                             transition-opacity text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={10} />
                </button>

                {/* Filename overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5
                                text-[8px] text-white truncate opacity-0 group-hover:opacity-100">
                  {asset.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected asset info */}
      {selectedAsset && (
        <div className="p-2 border-t bg-white text-xs">
          <div className="flex justify-between items-center">
            <div className="truncate flex-1">
              <div className="font-medium truncate">{selectedAsset.name}</div>
              <div className="text-gray-400">{formatSize(selectedAsset.size)}</div>
            </div>
            <button
              onClick={() => onInsertImage?.(selectedAsset.path, selectedAsset.name)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="p-2 text-[10px] text-gray-400 border-t bg-white">
        💡 Double-click or drag images onto your page
      </div>
    </div>
  );
};

export default ImageManager;
