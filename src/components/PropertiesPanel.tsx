import React, { useState } from 'react';
import { useStore } from '../store';
import { Trash2, Palette, Layout, Settings, Plus, Save, Type, Copy, RefreshCw } from 'lucide-react';
import { ArrowStyle, ArrowHeadStyle, WordGroupType, PageSize, AnecdoteType } from '../types';

const WORD_TYPE_LABELS: Record<WordGroupType, string> = {
  subject: 'Subject',
  verb: 'Verb',
  complement: 'Complement',
  article: 'Article',
  adjective: 'Adjective',
  adverb: 'Adverb',
  custom: 'Custom'
};

const ANECDOTE_TYPE_LABELS: Record<AnecdoteType, string> = {
  grammar: 'Grammar',
  spoken: 'Spoken Language',
  history: 'History & Culture',
  falseFriend: 'False Friend',
  pronunciation: 'Pronunciation',
  vocab: 'Vocabulary'
};

const ARROW_STYLES: { value: ArrowStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const ARROW_HEAD_STYLES: { value: ArrowHeadStyle; label: string }[] = [
  { value: 'arrow', label: 'Arrow' },
  { value: 'dot', label: 'Dot' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'none', label: 'None' }
];

const PAGE_SIZES: { value: PageSize; label: string; width: string; height: string }[] = [
  { value: 'A4', label: 'A4 (210x297mm)', width: '210mm', height: '297mm' },
  { value: 'Letter', label: 'Letter (8.5x11")', width: '215.9mm', height: '279.4mm' },
  { value: 'Legal', label: 'Legal (8.5x14")', width: '215.9mm', height: '355.6mm' },
  { value: 'Custom', label: 'Custom', width: '210mm', height: '297mm' }
];

const CUSTOM_FONTS = [
    { label: 'Serif', value: 'serif' },
    { label: 'Sans-Serif', value: 'sans-serif' },
    { label: 'Georgia', value: "'Georgia', serif" },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Arial', value: "'Arial', sans-serif" },
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Roboto', value: "'Roboto', sans-serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Verdana', value: "'Verdana', sans-serif" },
    { label: 'Tahoma', value: "'Tahoma', sans-serif" },
    { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
    { label: 'Impact', value: "'Impact', sans-serif" },
    { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" }, // Requested for completeness/variety
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
    { label: 'Lato', value: "'Lato', sans-serif" },
    { label: 'Montserrat', value: "'Montserrat', sans-serif" },
    { label: 'Merriweather', value: "'Merriweather', serif" },
    { label: 'Raleway', value: "'Raleway', sans-serif" }
];

export const PropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    selectedElementType,
    arrows,
    wordGroups,
    palettes,
    templates,
    updateArrow,
    removeArrow,
    updateWordGroup,
    removeWordGroup,
    theme,
    updateTheme,
    addPalette,
    updatePalette,
    removePalette,
    setActivePalette,
    addTemplate,
    removeTemplate
  } = useStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'palette' | 'layout' | 'templates'>('theme');
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'layout' | 'arrow' | 'project' | 'anecdote'>('arrow');

  // Get active palette
  const activePalette = palettes.find(p => p.id === theme.activePaletteId) || palettes.find(p => p.isDefault) || palettes[0];
  
  const handleCreatePalette = () => {
    if (!newPaletteName.trim()) return;
    addPalette({
      name: newPaletteName,
      colors: { ...activePalette.colors, custom: [...activePalette.colors.custom] },
      isDefault: false
    });
    setNewPaletteName('');
  };

  const handleCreateTemplate = () => {
    if(!newTemplateName.trim()) return;
    // Basic implementation: Create a placeholder template
    // Ideally this would grab current state (e.g. arrow style)
    let templateData = {};
    if (templateType === 'arrow') {
        templateData = {
            style: 'solid',
            headStyle: 'arrow',
            color: '#000000',
            strokeWidth: 2,
            curvature: 0.5
        };
    }
    
    addTemplate({
        name: newTemplateName,
        type: templateType,
        data: templateData
    });
    setNewTemplateName('');
  };

  // No selection - show Global Settings
  if (!selectedElementId || !selectedElementType) {
    return (
      <div className="w-80 bg-white border-l flex flex-col h-full bg-gray-50">
        <div className="flex border-b bg-white">
          <button
            className={`flex-1 p-3 text-xs font-medium flex flex-col items-center gap-1 ${activeTab === 'theme' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('theme')}
          >
            <Settings size={16} /> Theme
          </button>
          <button
            className={`flex-1 p-3 text-xs font-medium flex flex-col items-center gap-1 ${activeTab === 'layout' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('layout')}
          >
            <Layout size={16} /> Page
          </button>
          <button
            className={`flex-1 p-3 text-xs font-medium flex flex-col items-center gap-1 ${activeTab === 'palette' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('palette')}
          >
            <Palette size={16} /> Palette
          </button>
           <button
            className={`flex-1 p-3 text-xs font-medium flex flex-col items-center gap-1 ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('templates')}
          >
            <Copy size={16} /> Templ.
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Typography Setup</h3>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size ({theme.fontSize})</label>
                <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="10" 
                      max="32" 
                      step="1"
                      className="flex-1 cursor-pointer accent-blue-600"
                      value={parseInt(theme.fontSize)}
                      onChange={(e) => updateTheme({ fontSize: `${e.target.value}px` })}
                    />
                    <span className="text-xs w-8">{theme.fontSize}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Line Height ({theme.lineHeight})</label>
                 <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1.0" 
                      max="3.0" 
                      step="0.1"
                      className="flex-1 cursor-pointer accent-blue-600"
                      value={theme.lineHeight}
                      onChange={(e) => updateTheme({ lineHeight: e.target.value })}
                    />
                     <span className="text-xs w-8">{theme.lineHeight}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">French Text</h4>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={theme.frenchFontFamily}
                    onChange={(e) => updateTheme({ frenchFontFamily: e.target.value })}
                  >
                    {CUSTOM_FONTS.map(font => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
              </div>

              <div className="border-t pt-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">English Text</h4>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={theme.englishFontFamily}
                    onChange={(e) => updateTheme({ englishFontFamily: e.target.value })}
                  >
                     {CUSTOM_FONTS.map(font => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Page Layout</h3>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Paper Size</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={theme.pageLayout?.size || 'A4'}
                  onChange={(e) => {
                    const sizeKey = e.target.value as PageSize;
                    const preset = PAGE_SIZES.find(p => p.value === sizeKey);
                    updateTheme({
                      pageLayout: {
                        ...(theme.pageLayout || { margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, orientation: 'portrait' }),
                        size: sizeKey,
                        width: preset?.width || '210mm',
                        height: preset?.height || '297mm'
                      }
                    });
                  }}
                >
                  {PAGE_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* ... (Existing Margins code preserved but simplified for brevity in this full rewrite if needed, 
                     but I will include it to ensure no regression) ... */}
               <div className="border-t pt-4">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Margins</h3>
                 <div className="grid grid-cols-2 gap-2">
                    {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                         <div key={side}>
                           <label className="block text-[10px] text-gray-400 capitalize">{side}</label>
                           <input 
                             type="text" 
                             className="w-full border rounded p-1 text-sm"
                             value={theme.pageLayout?.margins[side] || '20mm'}
                             onChange={(e) => updateTheme({ 
                                 pageLayout: { 
                                     ...theme.pageLayout!, 
                                     margins: { ...theme.pageLayout!.margins, [side]: e.target.value } 
                                 } 
                             })}
                           />
                         </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'palette' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold text-gray-500 uppercase">Palette Manager</h3>
                 <button onClick={() => {}} className="text-gray-400 hover:text-blue-500" title="Refresh">
                     <RefreshCw size={14} />
                 </button>
              </div>
              
              <div className="bg-gray-100 p-2 rounded">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Current Palette</label>
                  <select
                    className="w-full border rounded p-2 text-sm bg-white"
                    value={theme.activePaletteId || ''}
                    onChange={(e) => setActivePalette(e.target.value)}
                  >
                    {palettes.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
                    ))}
                  </select>
              </div>

              <div className="space-y-4">
                   {/* Word Roles Colors */}
                   <div className="space-y-2">
                       <h4 className="text-xs font-semibold text-gray-700 border-b pb-1">Word Roles</h4>
                       <div className="grid grid-cols-2 gap-2">
                           {Object.entries(WORD_TYPE_LABELS).map(([key, label]) => {
                               if (key === 'custom') return null;
                               return (
                                   <div key={key} className="flex items-center justify-between bg-white p-1 rounded border">
                                       <span className="text-[10px] text-gray-600">{label}</span>
                                       <input 
                                           type="color" 
                                           value={activePalette.colors[key as keyof typeof activePalette.colors] as string}
                                            onChange={(e) => updatePalette(activePalette.id, { 
                                              colors: { ...activePalette.colors, [key]: e.target.value } 
                                            })}
                                           disabled={activePalette.isDefault}
                                           className="w-5 h-5 border-none p-0 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                       />
                                   </div>
                               );
                           })}
                       </div>
                   </div>

                   {/* Anecdote Colors */}
                   <div className="space-y-2">
                       <h4 className="text-xs font-semibold text-gray-700 border-b pb-1">Anecdotes</h4>
                       <div className="grid grid-cols-2 gap-2">
                           {Object.entries(ANECDOTE_TYPE_LABELS).map(([key, label]) => {
                               if (key === 'vocab') return null; // Vocab might not have a distinct color in basic set or reused
                               return (
                                   <div key={key} className="flex items-center justify-between bg-white p-1 rounded border">
                                       <span className="text-[10px] text-gray-600 truncate mr-1" title={label}>{label}</span>
                                       <input 
                                           type="color" 
                                           value={activePalette.colors[key as keyof typeof activePalette.colors] as string || '#ffffff'}
                                            onChange={(e) => updatePalette(activePalette.id, { 
                                              colors: { ...activePalette.colors, [key]: e.target.value } 
                                            })}
                                           disabled={activePalette.isDefault}
                                           className="w-5 h-5 border-none p-0 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                       />
                                   </div>
                               );
                           })}
                       </div>
                   </div>
                   
                   {/* Text Color */}
                   <div className="flex items-center justify-between bg-white p-2 rounded border">
                       <span className="text-xs font-semibold text-gray-700">Base Text Color</span>
                       <input 
                           type="color" 
                           value={activePalette.colors.text}
                            onChange={(e) => updatePalette(activePalette.id, { 
                              colors: { ...activePalette.colors, text: e.target.value } 
                            })}
                           disabled={activePalette.isDefault}
                           className="w-6 h-6 border-none p-0 rounded cursor-pointer disabled:opacity-50"
                       />
                   </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Create Palette</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    placeholder="New Palette Name"
                    className="flex-1 border rounded p-2 text-sm"
                  />
                  <button
                    onClick={handleCreatePalette}
                    disabled={!newPaletteName.trim()}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              {!activePalette.isDefault && (
                 <button
                    onClick={() => removePalette(activePalette.id)}
                    className="w-full mt-2 py-2 bg-red-50 text-red-600 rounded text-xs flex items-center justify-center gap-2 hover:bg-red-100"
                 >
                   <Trash2 size={14} /> Delete Active Palette
                 </button>
              )}
            </div>
          )}

        {activeTab === 'templates' && (
            <div className="space-y-4">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Template Manager</h3>
                 
                 <div className="bg-blue-50 p-3 rounded border border-blue-200">
                     <label className="block text-[10px] font-bold text-blue-800 uppercase mb-2">Create New Template</label>
                     <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Template Name..."
                        className="w-full border rounded p-2 text-sm mb-2"
                      />
                      <select 
                        className="w-full border rounded p-2 text-sm mb-3"
                        value={templateType}
                        onChange={(e) => setTemplateType(e.target.value as any)}
                      >
                          <option value="arrow">Arrow Style</option>
                          <option value="layout" disabled>Page Layout (Coming Soon)</option>
                          <option value="anecdote" disabled>Anecdote (Coming Soon)</option>
                      </select>
                      <button
                        onClick={handleCreateTemplate}
                        disabled={!newTemplateName.trim()}
                        className="w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
                      >
                          Save Current as Template
                      </button>
                 </div>

                 <div className="space-y-2">
                     <h4 className="text-xs font-bold text-gray-500">Saved Templates</h4>
                     {templates.length === 0 ? (
                         <p className="text-xs text-gray-400 italic">No templates saved.</p>
                     ) : (
                         templates.map(t => (
                             <div key={t.id} className="bg-white border rounded p-2 flex justify-between items-center group">
                                 <div>
                                     <div className="font-semibold text-sm">{t.name}</div>
                                     <div className="text-[10px] text-gray-400 uppercase">{t.type}</div>
                                 </div>
                                 <button 
                                   onClick={() => removeTemplate(t.id)}
                                   className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <Trash2 size={14} />
                                 </button>
                             </div>
                         ))
                     )}
                 </div>
            </div>
        )}
        </div>
      </div>
    );
  }

  // Element Selection Mode (Arrow or WordGroup)
  return (
    <div className="w-80 bg-white border-l flex flex-col h-full bg-gray-50">
       <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
         <h2 className="font-bold text-sm uppercase text-gray-600 flex items-center gap-2">
            {selectedElementType === 'wordGroup' ? 'Word Group' : 'Arrow Connection'}
         </h2>
         <button onClick={() => useStore.getState().setSelectedElement(null, null)} className="text-gray-400 hover:text-gray-600">
             <Layout size={14} title="Back to Settings" />
         </button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedElementType === 'wordGroup' && (() => {
            const group = wordGroups.find(g => g.id === selectedElementId);
            if (!group) return <div className="text-gray-400 text-xs">Selection not found</div>;
            
            return (
              <>
                <div className="space-y-3">
                   <label className="block text-xs font-bold text-gray-500 uppercase">Grammar Type</label>
                   <div className="grid grid-cols-2 gap-2">
                      {Object.entries(WORD_TYPE_LABELS).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => {
                             const newType = type as WordGroupType;
                             const newColor = activePalette.colors[newType] || '#000000';
                             updateWordGroup(group.id, { 
                               type: newType, 
                               color: (newType !== 'custom' && typeof newColor === 'string') ? newColor : group.color 
                             });
                          }}
                          className={`p-2 text-xs border rounded transition-all ${group.type === type ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="block text-xs font-bold text-gray-500 uppercase">Appearance</label>
                   <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={group.color}
                        onChange={(e) => updateWordGroup(group.id, { color: e.target.value })}
                        className="w-10 h-10 p-1 border rounded cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">{group.color}</span>
                   </div>
                   <input
                      type="text"
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Label (e.g. S1)"
                      value={group.label || ''}
                      onChange={(e) => updateWordGroup(group.id, { label: e.target.value })}
                   />
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => removeWordGroup(group.id)}
                    className="w-full py-2 bg-red-50 text-red-600 rounded flex items-center justify-center gap-2 hover:bg-red-100"
                  >
                    <Trash2 size={16} /> Delete Group
                  </button>
                </div>
              </>
            );
          })()}

          {selectedElementType === 'arrow' && (() => {
             const arrow = arrows.find(a => a.id === selectedElementId);
             if (!arrow) return <div className="text-gray-400 text-xs">Selection not found</div>;
             
             return (
               <>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Curvature</label>
                      <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            className="flex-1 accent-blue-600"
                            value={arrow.curvature}
                            onChange={(e) => updateArrow(arrow.id, { curvature: parseFloat(e.target.value) })}
                          />
                          <span className="text-xs w-6">{arrow.curvature}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Style</label>
                      <div className="grid grid-cols-3 gap-2">
                         {ARROW_STYLES.map(s => (
                           <button
                             key={s.value}
                             onClick={() => updateArrow(arrow.id, { style: s.value })}
                             className={`p-2 text-xs border rounded ${arrow.style === s.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                           >
                             {s.label}
                           </button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terminals</label>
                      <div className="grid grid-cols-4 gap-2">
                         {ARROW_HEAD_STYLES.map(s => (
                           <button
                             key={s.value}
                             onClick={() => updateArrow(arrow.id, { headStyle: s.value })}
                             className={`p-1 text-[10px] border rounded ${arrow.headStyle === s.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                           >
                             {s.label}
                           </button>
                         ))}
                      </div>
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stroke Width</label>
                       <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                className="flex-1 accent-blue-600"
                                value={arrow.strokeWidth || 2}
                                onChange={(e) => updateArrow(arrow.id, { strokeWidth: parseFloat(e.target.value) })}
                            />
                            <span className="text-xs w-6">{arrow.strokeWidth}px</span>
                       </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color</label>
                       <div className="flex items-center gap-3">
                            <input 
                                type="color"
                                value={arrow.color}
                                onChange={(e) => updateArrow(arrow.id, { color: e.target.value })}
                                className="w-10 h-10 p-0 border-0 rounded overflow-hidden"
                            />
                            <span className="text-xs text-gray-400">{arrow.color}</span>
                       </div>
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
               </>
             );
          })()}
       </div>
    </div>
  );
};
