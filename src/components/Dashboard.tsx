import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { FolderOpen, FilePlus, Loader, Clock, Trash2, Edit2, Check, X, Copy, FileSpreadsheet } from 'lucide-react';
import { CSVCreator } from './CSVCreator';

interface DashboardProps {
  onOpenProject: (name: string) => void;
  onCreateProject: (name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateProject }) => {
  const { fetchProjects } = useStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [showCSVCreator, setShowCSVCreator] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName);
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening project
    
    if (deletingProject === name) {
      // Second click - confirm deletion
      try {
        const response = await fetch(`http://localhost:3001/projects/${encodeURIComponent(name)}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadProjects(); // Refresh list
        } else {
          console.error('Failed to delete project');
        }
      } catch (err) {
        console.error('Error deleting project:', err);
      }
      setDeletingProject(null);
    } else {
      // First click - show confirmation
      setDeletingProject(name);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeletingProject(null), 3000);
    }
  };

  // Project rename (N22)
  const [renamingProject, setRenamingProject] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const handleRename = async (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenamingProject(null);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/projects/${encodeURIComponent(oldName)}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameValue.trim() })
      });
      if (response.ok) {
        await loadProjects();
      } else {
        // Fallback: copy and delete approach
        const getRes = await fetch(`http://localhost:3001/projects/${encodeURIComponent(oldName)}`);
        if (getRes.ok) {
          const projectData = await getRes.json();
          await fetch(`http://localhost:3001/projects/${encodeURIComponent(renameValue.trim())}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
          });
          await fetch(`http://localhost:3001/projects/${encodeURIComponent(oldName)}`, { method: 'DELETE' });
          await loadProjects();
        }
      }
    } catch (err) {
      console.error('Error renaming project:', err);
    }
    setRenamingProject(null);
  };

  const handleDuplicate = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:3001/projects/${encodeURIComponent(name)}`);
      if (response.ok) {
        const projectData = await response.json();
        const newName = `${name} (Copy)`;

        await fetch(`http://localhost:3001/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, data: projectData })
        });
        await loadProjects();
      }
    } catch (err) {
      console.error('Error duplicating project:', err);
    }
  };

  // Show CSV Creator as a full-screen modal
  if (showCSVCreator) {
    return <CSVCreator onClose={() => setShowCSVCreator(false)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 flex-col items-center justify-center font-sans">
      <div className="w-full max-w-5xl p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">EasyFrenchBro</h1>
            <p className="text-gray-500">Select a project to continue, create a new one, or use our tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create New Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <FilePlus size={24} />
                    <h2 className="text-lg font-semibold">New Project</h2>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <input 
                        type="text" 
                        placeholder="Project Name"
                        className="w-full p-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <button 
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        Create Project
                    </button>
                </div>
            </div>

            {/* Recent Projects Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 h-96">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Clock size={24} />
                    <h2 className="text-lg font-semibold">Recent Projects</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-gray-400 italic">
                            No projects found.
                        </div>
                    ) : (
                        projects.map(p => (
                            <div
                                key={p.name}
                                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all text-left group relative"
                            >
                                {renamingProject === p.name ? (
                                  <div className="flex-1 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleRename(p.name)}
                                      className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleRename(p.name)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setRenamingProject(null)}
                                      className="p-2 text-gray-400 hover:bg-gray-100 rounded"
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                      onClick={() => onOpenProject(p.name)}
                                      className="flex-1 text-left"
                                  >
                                      <div className="font-medium text-gray-700 group-hover:text-blue-700">{p.name}</div>
                                      <div className="text-xs text-gray-400">
                                         Last edited: {new Intl.DateTimeFormat('fr-FR').format(new Date(p.updatedAt))}
                                      </div>
                                  </button>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRenamingProject(p.name);
                                          setRenameValue(p.name);
                                        }}
                                        className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                        title="Rename project"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDuplicate(p.name, e)}
                                        className="p-2 rounded-lg text-gray-300 hover:text-purple-500 hover:bg-purple-50 transition-all"
                                        title="Duplicate project"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(p.name, e)}
                                        className={`p-2 rounded-lg transition-all ${
                                            deletingProject === p.name 
                                                ? 'bg-red-500 text-white' 
                                                : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                        title={deletingProject === p.name ? 'Click again to confirm deletion' : 'Delete project'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetch('http://localhost:3001/open-folder', { 
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ path: `projects/${p.name}.json` })
                                          }).catch(console.error);
                                        }}
                                        className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                        title="Show in Finder"
                                    >
                                        <FolderOpen size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CSV Creator Card */}
            <button
              onClick={() => setShowCSVCreator(true)}
              className="group bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileSpreadsheet size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">CSV Creator</h3>
              </div>
              <p className="text-sm text-white/80">
                Create bilingual CSV files for easy import. Add French-English sentence pairs with a user-friendly interface.
              </p>
              <div className="mt-4 text-xs text-white/60 group-hover:text-white/80 transition-colors">
                Click to open →
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
