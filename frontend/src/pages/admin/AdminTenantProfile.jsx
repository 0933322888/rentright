import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { adminButtonStyles } from '../../utils/uiUtils';
import { getProfilePictureUrl } from '../../utils/imageUtils';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '../../components/XIcon';
import LanguageIcon from '@mui/icons-material/Language';

export default function AdminTenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (id) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN_TENANTS}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Tenant data:', response.data);
      setTenant(response.data);
    } catch (err) {
      setError('Failed to fetch tenant details');
      console.error('Error fetching tenant:', err);
      toast.error('Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const renderDocumentList = (documents) => {
    if (!documents || documents.length === 0) {
      return 'No documents uploaded';
    }

    return (
      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
        {documents.map((doc, index) => (
          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
            <div className="w-0 flex-1 flex items-center">
              <span className="ml-2 flex-1 w-0 truncate">{doc.filename}</span>
              <span className="ml-2 text-gray-500 text-xs">
                Uploaded: {formatDate(doc.uploadedAt)}
              </span>
            </div>
            <div className="ml-4 flex-shrink-0">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View
              </a>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Tenant Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed information about the tenant.</p>
          </div>
          <button
            onClick={() => navigate('/admin/tenants')}
            className={adminButtonStyles.primaryLg}
          >
            Back to Tenants
          </button>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Basic Information */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{tenant.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{tenant.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{tenant.phone || 'Not specified'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(tenant.createdAt)}</dd>
            </div>

            {/* Profile Picture */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Profile Picture</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {tenant.profilePicture ? (
                  <div className="flex items-center space-x-4">
                    <img
                      src={getProfilePictureUrl(tenant.profilePicture)}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Profile picture uploaded</p>
                      <a
                        href={getProfilePictureUrl(tenant.profilePicture)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        View full size
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-xl">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-500">No profile picture uploaded</span>
                  </div>
                )}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Applications</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{tenant.applicationCount || 0}</dd>
            </div>
            {tenant.tenantScoring !== undefined && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tenant Score</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className={`${
                      tenant.tenantScoring >= 80 ? 'text-green-600' :
                      tenant.tenantScoring >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {tenant.tenantScoring || 0}%
                    </span>
                    <div className="ml-2 w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          tenant.tenantScoring >= 80 ? 'bg-green-500' :
                          tenant.tenantScoring >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${tenant.tenantScoring || 0}%` }}
                      />
                    </div>
                  </div>
                </dd>
              </div>
            )}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Profile Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tenant.hasProfile 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.hasProfile ? 'Complete' : 'Incomplete'}
                </span>
              </dd>
            </div>

            {/* Social Media Links */}
            {tenant.socialMedia && Object.keys(tenant.socialMedia).some(key => tenant.socialMedia[key]) && (
              <>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Social Media Links</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-col gap-3">
                      {tenant.socialMedia.facebook && (
                        <a
                          href={tenant.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                          <FacebookIcon fontSize="medium" />
                          <span>Facebook</span>
                        </a>
                      )}
                      {tenant.socialMedia.linkedin && (
                        <a
                          href={tenant.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                          <LinkedInIcon fontSize="medium" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {tenant.socialMedia.instagram && (
                        <a
                          href={tenant.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors px-2 py-1 rounded hover:bg-pink-50"
                        >
                          <InstagramIcon fontSize="medium" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {tenant.socialMedia.x && (
                        <a
                          href={tenant.socialMedia.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-500 hover:text-blue-700"
                        >
                          <XIcon />
                          <span>X</span>
                        </a>
                      )}
                      {tenant.socialMedia.website && (
                        <a
                          href={tenant.socialMedia.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                        >
                          <LanguageIcon fontSize="medium" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </dd>
                </div>
              </>
            )}

            {/* Tenant Document Information */}
            {tenant.tenantDocument ? (
              <>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Has Been Evicted</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {tenant.tenantDocument.hasBeenEvicted ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Can Pay More Than One Month</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {tenant.tenantDocument.canPayMoreThanOneMonth ? 'Yes' : 'No'}
                  </dd>
                </div>
                {tenant.tenantDocument.canPayMoreThanOneMonth && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Months Ahead Can Pay</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {tenant.tenantDocument.monthsAheadCanPay || 'Not specified'}
                    </dd>
                  </div>
                )}

                {/* Documents */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Proof of Identity Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderDocumentList(tenant.tenantDocument.proofOfIdentity)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Proof of Income Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderDocumentList(tenant.tenantDocument.proofOfIncome)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Credit History Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderDocumentList(tenant.tenantDocument.creditHistory)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Rental History Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderDocumentList(tenant.tenantDocument.rentalHistory)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Additional Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderDocumentList(tenant.tenantDocument.additionalDocuments)}
                  </dd>
                </div>

                {/* Document Creation/Update Dates */}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Profile Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(tenant.tenantDocument.createdAt)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(tenant.tenantDocument.updatedAt)}
                  </dd>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tenant Profile</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="text-yellow-700">This tenant has not completed their profile yet.</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
} 