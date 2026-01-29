import { 
  LayoutDashboard, 
  Inbox, 
  AlertCircle, 
  ShieldAlert, 
  GraduationCap, 
  Folder 
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  inbox: <Inbox className="w-5 h-5" />,
  'alert-circle': <AlertCircle className="w-5 h-5" />,
  'shield-alert': <ShieldAlert className="w-5 h-5" />,
  'graduation-cap': <GraduationCap className="w-5 h-5" />,
  folder: <Folder className="w-5 h-5" />
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'all', label: 'All Emails', icon: 'inbox' },
    { id: 'suspension', label: 'Suspension / Disciplinary', icon: 'alert-circle' },
    { id: 'fir', label: 'FIR / Arrest', icon: 'shield-alert' },
    { id: 'semester', label: 'Semester / Examination', icon: 'graduation-cap' },
    { id: 'miscellaneous', label: 'Miscellaneous', icon: 'folder' }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === item.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {iconMap[item.icon]}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}