import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { FolderOpen, FilePlus, Loader, Clock } from 'lucide-react';

interface DashboardProps {
  onOpenProject: (name: string) => void;
  onCreateProject: (name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateProject }) => {
  const { fetchProjects } = useStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');

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

  return (
    <div className="flex h-screen w-screen bg-gray-50 flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">EasyFrenchBro</h1>
            <p className="text-gray-500">Select a project to continue or create a new one.</p>
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
                            <button
                                key={p.name}
                                onClick={() => onOpenProject(p.name)}
                                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                            >
                                <div>
                                    <div className="font-medium text-gray-700 group-hover:text-blue-700">{p.name}</div>
                                    <div className="text-xs text-gray-400">
                                       Last edited: {new Intl.DateTimeFormat('fr-FR').format(new Date(p.updatedAt))}
                                    </div>
                                </div>
                                <FolderOpen size={18} className="text-gray-300 group-hover:text-blue-500" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
