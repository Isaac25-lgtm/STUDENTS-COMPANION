import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import Background from './Background';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <Background />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
