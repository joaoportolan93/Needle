import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, PlusSquare, List, User } from 'lucide-react';

const NavigationBar = () => {
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/search', label: 'Busca', icon: <Search size={20} /> },
    { path: '/add', label: 'Adicionar', icon: <PlusSquare size={20} /> },
    { path: '/lists', label: 'Listas', icon: <List size={20} /> },
    { path: '/profile', label: 'Perfil', icon: <User size={20} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white shadow-lg flex flex-col p-4">
      <div className="mb-10">
        {/* Pode adicionar um logo ou título aqui */}
        <h1 className="text-2xl font-bold text-center text-gray-100">Sonora App</h1>
      </div>
      <ul className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-md transition-colors duration-200 text-gray-300 hover:text-white"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavigationBar;

