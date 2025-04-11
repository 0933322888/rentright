import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={isHomePage ? "w-full" : "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
} 