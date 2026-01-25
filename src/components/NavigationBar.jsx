import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusSquare, List, User } from 'lucide-react';

const NavigationBar = () => {
  const navItems = [
    { path: '/', label: 'Início', icon: <Home size={24} /> },
    { path: '/search', label: 'Explorar', icon: <Search size={24} /> },
    { path: '/add', label: 'Adicionar', icon: <PlusSquare size={24} /> },
    { path: '/lists', label: 'Listas', icon: <List size={24} /> },
    { path: '/profile', label: 'Perfil', icon: <User size={24} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl text-white flex-col p-6 z-50">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white px-2">Sonora App</h1>
        </div>
        <ul className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 safe-area-inset-bottom">
        <ul className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px]
                  ${isActive
                    ? 'text-indigo-400'
                    : 'text-gray-500 hover:text-white'
                  }
                `}
              >
                {React.cloneElement(item.icon, { size: 22 })}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default NavigationBar;

