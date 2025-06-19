import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
} 