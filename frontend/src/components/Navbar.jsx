import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import themeContext from '../context/ThemeProvider';
import {
  FaHome,
  FaSignInAlt,
  FaGithub,
  FaUserPlus,
  FaUser,
  FaSignOutAlt,
  FaTachometerAlt,
  FaSpinner,
} from 'react-icons/fa';
import authContext from '../context/AuthProvider';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { theme, settheme } = useContext(themeContext);
  const { user, setuser } = useContext(authContext);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const themeHandler = (e) => {
    settheme(e.target.checked ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await authAPI.logout();

      localStorage.removeItem('zetta_user');
      setuser(null);
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('zetta_user');
      setuser(null);
      toast.error('Logout failed, but you have been signed out locally');
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    document.getElementById('mobile-drawer')?.click();
  };

  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Home', to: '/', icon: <FaHome className="text-xl mr-1" /> },
      {
        name: 'GitHub',
        to: 'https://github.com/braydenidzenga/ZettaNote',
        icon: <FaGithub className="mr-1 text-xl" />,
      },
    ];

    if (user) {
      return [
        ...commonItems,
        { name: 'Dashboard', to: '/dashboard', icon: <FaTachometerAlt className="text-xl mr-1" /> },
        { name: 'Logout', action: 'logout', icon: <FaSignOutAlt className="text-xl mr-1" /> },
      ];
    } else {
      return [
        ...commonItems,
        { name: 'Sign Up', to: '/signup', icon: <FaUserPlus className="text-lg mr-1" /> },
        { name: 'Login', to: '/login', icon: <FaSignInAlt className="text-lg mr-1" /> },
      ];
    }
  };

  const navigationItems = getNavigationItems();
  const mainNavItems = navigationItems.filter(
    (item) => item.name !== 'Login' && item.name !== 'Sign Up' && item.name !== 'Logout'
  );
  const authNavItems = navigationItems.filter(
    (item) => item.name === 'Login' || item.name === 'Sign Up' || item.name === 'Logout'
  );

  return (
    <div className="drawer">
      <input id="mobile-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">
        <nav className="navbar fixed top-0 left-0 right-0 bg-base-100 shadow-md px-6 lg:px-10 border-b border-base-300 z-50 mx-auto max-w-7xl">
          {/* Mobile menu button */}
          <div className="navbar-start">
            <label htmlFor="mobile-drawer" className="btn btn-ghost btn-circle lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>

            {/* Brand Logo */}
            <Link
              to="/"
              className="py-6 px-2 btn btn-ghost normal-case text-xl font-bold flex items-center gap-3 rounded-2xl"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-base-content tracking-tight">ZettaNote</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-center hidden lg:flex justify-center">
            <ul className="menu menu-horizontal gap-2">
              {mainNavItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    target={item.name === 'GitHub' ? '_blank' : '_self'}
                    rel={item.name === 'GitHub' ? 'noopener noreferrer' : ''}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center ${
                        isActive && item.name !== 'GitHub'
                          ? 'text-primary underline underline-offset-4'
                          : 'text-base-content hover:bg-base-200'
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* User Actions & Theme Toggle */}
          <div className="navbar-end">
            <div className="hidden lg:flex items-center gap-3">
              {/* User Info - Desktop */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg">
                  <FaUser className="text-base text-base-content/70" />
                  <span className="text-sm font-medium text-base-content max-w-[120px] truncate">
                    {user?.name || user?.email}
                  </span>
                </div>
              )}

              <ul className="menu menu-horizontal gap-2">
                {authNavItems.map((item) => (
                  <li key={item.name}>
                    {item.action === 'logout' ? (
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center text-error hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? (
                          <FaSpinner className="text-xl mr-1 animate-spin" />
                        ) : (
                          item.icon
                        )}
                        {item.name}
                      </button>
                    ) : (
                      <NavLink
                        to={item.to}
                        target={item.name === 'GitHub' ? '_blank' : '_self'}
                        rel={item.name === 'GitHub' ? 'noopener noreferrer' : ''}
                        className={({ isActive }) =>
                          `px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center ${
                            isActive
                              ? 'text-primary underline underline-offset-4'
                              : 'text-base-content hover:bg-base-200'
                          }`
                        }
                      >
                        {item.icon}
                        {item.name}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <label className="swap swap-rotate btn btn-ghost btn-circle">
                <input
                  onChange={themeHandler}
                  type="checkbox"
                  className="theme-controller"
                  checked={theme === 'dark'}
                />
                {/* Sun icon */}
                <svg
                  className="swap-off h-6 w-6 fill-current text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
                </svg>
                {/* Moon icon */}
                <svg
                  className="swap-on h-6 w-6 fill-current text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13ZM12.14,19.73A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                </svg>
              </label>
            </div>
          </div>
        </nav>
      </div>

      {/* Drawer Sidebar */}
      <div className="drawer-side z-50">
        <label
          htmlFor="mobile-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="menu bg-base-100 min-h-full w-80 p-4">
          {/* Sidebar Header */}
          <div className="mb-6 px-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-base-content tracking-tight">ZettaNote</span>
            </div>
          </div>

          {/* User Info Section */}
          {user && (
            <>
              <div className="px-3 py-3 mb-2 bg-base-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaUser className="text-lg text-base-content/70" />
                  <span className="text-sm font-medium text-base-content truncate">
                    {user?.name || user?.email}
                  </span>
                </div>
              </div>
              <div className="divider my-2"></div>
            </>
          )}

          {/* Navigation Items */}
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                {item.action === 'logout' ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center text-base font-medium rounded-lg px-3 py-3 transition hover:bg-base-200 text-error w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? <FaSpinner className="text-xl mr-2 animate-spin" /> : item.icon}
                    <span className="ml-1">{item.name}</span>
                  </button>
                ) : (
                  <NavLink
                    to={item.to}
                    onClick={closeMobileMenu}
                    target={item.name === 'GitHub' ? '_blank' : '_self'}
                    rel={item.name === 'GitHub' ? 'noopener noreferrer' : ''}
                    className={({ isActive }) =>
                      `flex items-center text-base font-medium rounded-lg px-3 py-3 transition ${
                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="ml-1">{item.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
