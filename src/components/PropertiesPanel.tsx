import React from 'react';
import { useStore } from '../store';
import { Trash2 } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
    const {
        selectedElementId,
        selectedElementType,
        arrows,
        updateArrow,
        removeArrow,
        theme,
        updateTheme
    } = useStore();

    if (!selectedElementId && !selectedElementType) {
        return (
            <div className="w-64 bg-white border-l p-4">
                <h2 className="font-bold text-sm uppercase text-gray-500 mb-4">Global Theme</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                        <select
                            className="w-full border rounded p-1 text-sm"
                            value={theme.fontSize}
                            onChange={(e) => updateTheme({ fontSize: e.target.value })}
                        >
                            <option value="14px">Small (14px)</option>
                            <option value="16px">Medium (16px)</option>
                            <option value="18px">Large (18px)</option>
                            <option value="20px">Extra Large (20px)</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedElementType === 'arrow') {
        const arrow = arrows.find(a => a.id === selectedElementId);
        if (!arrow) return null;

        return (
            <div className="w-64 bg-white border-l p-4">
                 <h2 className="font-bold text-sm uppercase text-gray-500 mb-4">Arrow Properties</h2>

                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Curvature</label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={arrow.curvature}
                            onChange={(e) => updateArrow(arrow.id, { curvature: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                        <div className="text-right text-xs text-gray-400">{arrow.curvature}</div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {theme.highlightColors.map(c => (
                                <button
                                    key={c}
                                    className={`w-6 h-6 rounded-full border ${arrow.color === c ? 'ring-2 ring-blue-500' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => updateArrow(arrow.id, { color: c })}
                                />
                            ))}
                             <button
                                className={`w-6 h-6 rounded-full border bg-black ${arrow.color === '#000000' ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => updateArrow(arrow.id, { color: '#000000' })}
                            />
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs text-gray-500 mb-1">Label</label>
                         <input
                            type="text"
                            value={arrow.label || ''}
                            onChange={(e) => updateArrow(arrow.id, { label: e.target.value })}
                            className="w-full border rounded p-1 text-sm"
                            placeholder="Label..."
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            onClick={() => removeArrow(arrow.id)}
                            className="w-full py-2 bg-red-50 text-red-600 rounded flex items-center justify-center gap-2 hover:bg-red-100"
                        >
                            <Trash2 size={16} /> Delete Arrow
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    return null;
};
