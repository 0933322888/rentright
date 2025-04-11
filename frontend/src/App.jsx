import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PropertyList from './pages/PropertyList';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import MyProperties from './pages/MyProperties';
import Applications from './pages/Applications';
import MyTickets from './pages/MyTickets';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProperties from './pages/admin/Properties';
import AdminPropertyDetails from './pages/admin/PropertyDetails';
import AdminApplications from './pages/admin/Applications';
import AdminTickets from './pages/admin/Tickets';
import AdminLandlords from './pages/admin/Landlords';
import AdminTenants from './pages/admin/Tenants';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import CreateTicket from './pages/CreateTicket';
import TenantProfile from './pages/TenantProfile';
import LandlordBenefits from './pages/LandlordBenefits';
import TenantBenefits from './pages/TenantBenefits';
import Contact from './pages/Contact';
import About from './pages/About';
import PropertyDetails from './pages/PropertyDetails';

// Role-based home redirect component
function HomeRedirect() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'landlord') {
    return <Navigate to="/my-properties" replace />;
  }

  if (user?.role === 'tenant') {
    return <Navigate to="/properties" replace />;
  }

  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="properties" element={<PropertyList />} />
            <Route path="properties/:id" element={<PropertyDetails />} />
            <Route path="landlord-benefits" element={<LandlordBenefits />} />
            <Route path="tenant-benefits" element={<TenantBenefits />} />
            <Route path="contact" element={<Contact />} />
            <Route path="about" element={<About />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="properties/create" element={<AddProperty />} />
              <Route path="properties/edit/:id" element={<EditProperty />} />
              <Route path="my-properties" element={<MyProperties />} />
              <Route path="applications" element={<Applications />} />
              <Route path="my-tickets" element={<MyTickets />} />
              <Route path="create-ticket" element={<CreateTicket />} />
              <Route path="tenant-profile" element={<TenantProfile />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/properties" element={<AdminProperties />} />
              <Route path="admin/properties/:id" element={<AdminPropertyDetails />} />
              <Route path="admin/applications" element={<AdminApplications />} />
              <Route path="admin/tickets" element={<AdminTickets />} />
              <Route path="admin/landlords" element={<AdminLandlords />} />
              <Route path="admin/tenants" element={<AdminTenants />} />
            </Route>
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
