import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Role } from '../../types';
import { useWorkshop } from '../../lib/WorkshopContext';

interface SidebarProps {
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout }) => {
  const { currentWorkshop } = useWorkshop();

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: 'dashboard',
      category: 'Overview'
    },
    { 
      path: '/front-office', 
      label: 'Front Office', 
      icon: 'person_add',
      category: 'Operations' 
    },
    { 
      path: '/bookings', 
      label: 'Online Bookings', 
      icon: 'calendar_month',
      category: 'Operations' 
    },
    { 
      path: '/queue', 
      label: 'Service Queue', 
      icon: 'pending_actions',
      category: 'Operations' 
    },
    { 
      path: '/mechanic-workbench', 
      label: 'Mechanic Workbench', 
      icon: 'build',
      category: 'Operations',
      roleRequired: [Role.MEKANIK, Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/history', 
      label: 'Service History', 
      icon: 'history',
      category: 'Management' 
    },
    { 
      path: '/crm', 
      label: 'CRM & Reminders', 
      icon: 'campaign',
      category: 'Management',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/staff', 
      label: 'Staff Management', 
      icon: 'group',
      category: 'Administration',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/qris-settings', 
      label: 'QRIS Settings', 
      icon: 'qr_code',
      category: 'Administration',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/time-slot-settings', 
      label: 'Time Slots', 
      icon: 'schedule',
      category: 'Administration',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/moota-settings', 
      label: 'Moota Payment', 
      icon: 'account_balance',
      category: 'Administration',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
    { 
      path: '/workshop-settings', 
      label: 'Workshop Settings', 
      icon: 'storefront',
      category: 'Administration',
      roleRequired: [Role.OWNER]
    },
    { 
      path: '/url-settings', 
      label: 'URL Settings', 
      icon: 'link',
      category: 'Administration',
      roleRequired: [Role.ADMIN, Role.OWNER]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roleRequired) return true;
    return currentUser && item.roleRequired.includes(currentUser.role);
  });

  const categories = [...new Set(filteredMenuItems.map(item => item.category))];

  return (
    <aside className="w-72 bg-white dark:bg-[#1A2230] border-r border-border-light dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 hidden xl:flex">
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border-light dark:border-slate-800">
        <div className="size-8 text-primary flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <span className="material-symbols-outlined text-2xl">local_car_wash</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
          ABE<span className="text-primary">System</span>
        </h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {categories.map(category => (
          <div key={category}>
            <h3 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {category}
            </h3>
            <nav className="flex flex-col gap-1">
              {filteredMenuItems
                .filter(item => item.category === category)
                .map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border-light dark:border-slate-800">
        {currentUser ? (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-slate-500 w-full h-full flex items-center justify-center text-lg">person</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.role}</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;