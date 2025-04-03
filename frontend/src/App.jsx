import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyList from './pages/PropertyList';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Profile from './pages/Profile';
import Applications from './pages/Applications';
import About from './pages/About';
import Contact from './pages/Contact';
import LandlordBenefits from './pages/LandlordBenefits';
import TenantBenefits from './pages/TenantBenefits';
import MyProperties from './pages/MyProperties';
import TenantProfile from './pages/TenantProfile';
import AdminLayout from './components/AdminLayout';
import AdminProperties from './pages/admin/Properties';
import AdminLandlords from './pages/admin/Landlords';
import AdminTenants from './pages/admin/Tenants';
import AdminApplications from './pages/admin/Applications';
import EditTenant from './pages/admin/EditTenant';
import AdminDashboard from './pages/admin/Dashboard';

// Loading wrapper component
function LoadingWrapper({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </LoadingWrapper>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/properties" replace />;
    }
    if (user.role === 'landlord') {
      return <Navigate to="/my-properties" replace />;
    }
    if (user.role === 'tenant') {
      return <Navigate to="/properties" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <LoadingWrapper>
      <Navbar />
      {children}
      <Footer />
    </LoadingWrapper>
  );
}

// Role-based redirect for home page
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </LoadingWrapper>
    );
  }

  // Don't redirect if we're on the tenant profile page
  const currentPath = window.location.pathname;
  if (currentPath === '/tenant-profile') {
    return (
      <LoadingWrapper>
        <Navbar />
        <TenantProfile />
        <Footer />
      </LoadingWrapper>
    );
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/properties" replace />;
  }

  if (user?.role === 'landlord') {
    return <Navigate to="/my-properties" replace />;
  }

  if (user?.role === 'tenant') {
    return <Navigate to="/properties" replace />;
  }

  return (
    <LoadingWrapper>
      <Navbar />
      <Home />
      <Footer />
    </LoadingWrapper>
  );
}

// Public layout wrapper
function PublicLayout({ children }) {
  return (
    <LoadingWrapper>
      <Navbar />
      {children}
      <Footer />
    </LoadingWrapper>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<PublicLayout><PropertyList /></PublicLayout>} />
          <Route path="/properties/:id" element={<PublicLayout><PropertyDetails /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/landlord-benefits" element={<PublicLayout><LandlordBenefits /></PublicLayout>} />
          <Route path="/tenant-benefits" element={<PublicLayout><TenantBenefits /></PublicLayout>} />
          
          {/* Protected routes */}
          <Route
            path="/my-properties"
            element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <MyProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant-profile"
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <TenantProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-property"
            element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <EditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:propertyId/apply"
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <PropertyDetails />
              </ProtectedRoute>
            }
          />
          
          {/* Conditional routes based on role */}
          <Route
            path="/about"
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <About />
              </ProtectedRoute>
            }
          />

          {/* Home page with role-based redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="landlords" element={<AdminLandlords />} />
            <Route path="tenants" element={<AdminTenants />} />
            <Route path="tenants/:id/edit" element={<EditTenant />} />
            <Route path="applications" element={<AdminApplications />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
