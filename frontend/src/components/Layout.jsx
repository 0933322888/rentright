import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isPropertiesPage = location.pathname.startsWith('/properties');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="w-full px-4 mt-5">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
} 