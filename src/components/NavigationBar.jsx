import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, PlusSquare, List, User, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Início', icon: <Home size={24} /> },
    { path: '/search', label: 'Explorar', icon: <Search size={24} /> },
    { path: '/add', label: 'Adicionar', icon: <PlusSquare size={24} /> },
    { path: '/lists', label: 'Listas', icon: <List size={24} /> },
  ];

  if (user) {
    navItems.push({ path: '/profile', label: 'Perfil', icon: <User size={24} /> });
    navItems.push({ path: '/settings', label: 'Configurações', icon: <Settings size={24} /> });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-64 border-r border-border bg-sidebar text-sidebar-foreground flex-col p-6 z-50 justify-between">
        <div>
          <div className="mb-8 flex items-center gap-3 px-2">
            <h1 className="text-2xl font-bold">Needle</h1>
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
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-border">
          {user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 text-sm text-muted-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[120px]">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
              >
                <LogOut size={24} />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            >
              <LogIn size={24} />
              <span className="text-sm font-medium">Entrar</span>
            </NavLink>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-xl border-t border-border z-50 safe-area-inset-bottom">
        <ul className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 5).map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px]
                  ${isActive
                    ? 'text-indigo-400'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {React.cloneElement(item.icon, { size: 22 })}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
          {!user && (
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) => `
                 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px]
                 ${isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'}
               `}
              >
                <LogIn size={22} />
                <span className="text-[10px] mt-1 font-medium">Entrar</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
};

export default NavigationBar;
