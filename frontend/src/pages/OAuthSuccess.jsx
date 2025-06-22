import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleSelectionModal from '../components/RoleSelectionModal';
import { API_ENDPOINTS } from '../config/api.js';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { oauthLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleOAuthSuccess = useCallback(async () => {
    if (hasProcessed) return; // Prevent multiple executions
    
    try {
      const token = searchParams.get('token');
      const userData = searchParams.get('user');
      const newUser = searchParams.get('newUser') === 'true';

      if (!token || !userData) {
        setError('Invalid authentication response');
        setLoading(false);
        return;
      }

      // Parse user data
      const user = JSON.parse(decodeURIComponent(userData));
      setUser(user);
      setIsNewUser(newUser);

      if (newUser) {
        // Show role selection for new users
        setShowRoleSelection(true);
        setLoading(false);
      } else {
        // Existing user - proceed with normal login
        const result = await oauthLogin(user, token);

        if (result.success) {
          setHasProcessed(true);
          // Show success message briefly
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setError(result.message);
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('OAuth success handling error:', error);
      setError('Failed to complete authentication. Please try again.');
      setLoading(false);
    }
  }, [searchParams, navigate, oauthLogin, hasProcessed]);

  const handleRoleSelect = async (role, userData) => {
    try {
      const token = searchParams.get('token');
      
      // Call backend to update user role
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/auth/oauth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          userData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete registration');
      }

      const result = await response.json();
      
      // Use OAuth login function with updated user data
      const loginResult = await oauthLogin(result.user, result.token);

      if (loginResult.success) {
        setHasProcessed(true);
        setShowRoleSelection(false);
        // Show success message briefly
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(loginResult.message);
      }

    } catch (error) {
      console.error('Role selection error:', error);
      setError('Failed to complete registration. Please try again.');
      setShowRoleSelection(false);
    }
  };

  useEffect(() => {
    if (!hasProcessed && !showRoleSelection) {
      handleOAuthSuccess();
    }
  }, [handleOAuthSuccess, hasProcessed, showRoleSelection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Completing your registration...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we set up your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <RoleSelectionModal
        show={showRoleSelection}
        onHide={() => setShowRoleSelection(false)}
        onRoleSelect={handleRoleSelect}
        userData={user}
      />

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Welcome to RentRight!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your account has been created successfully.
              </p>
              
              {/* Show social media links that were automatically added */}
              {user?.socialMedia && Object.keys(user.socialMedia).length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Social media links automatically added to your profile:
                  </p>
                  <div className="space-y-1">
                    {user.socialMedia.facebook && (
                      <p className="text-xs text-blue-700">✓ Facebook profile linked</p>
                    )}
                    {user.socialMedia.linkedin && (
                      <p className="text-xs text-blue-700">✓ LinkedIn profile linked</p>
                    )}
                    {user.socialMedia.google && (
                      <p className="text-xs text-blue-700">✓ Google account linked</p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-600">
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 