import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import { useAuth } from './context/AuthContext';

// Protected route component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Role-based redirect for home page
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (user?.role === 'landlord') {
    return <Navigate to="/my-properties" replace />;
  }

  return <Home />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="w-full min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow w-full">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/properties/:id" element={<PropertyDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/landlord-benefits" element={<LandlordBenefits />} />
              <Route path="/tenant-benefits" element={<TenantBenefits />} />

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
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
