import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { useDropzone } from 'react-dropzone';
import { toast, Toaster } from 'react-hot-toast';

// Separate component for document upload
function DocumentUpload({ field, documents, previews, onDrop, onDelete }) {
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const BASE_URL = import.meta.env.VITE_API_URL;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 capitalize">
        {field.replace(/([A-Z])/g, ' $1').trim()}
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents[field].map((_, index) => {
          const preview = previews[field][index];
          const isImage = preview?.type === 'image' || 
                         (preview?.url && (preview.url.endsWith('.jpg') || 
                                         preview.url.endsWith('.jpeg') || 
                                         preview.url.endsWith('.png') || 
                                         preview.url.endsWith('.gif')));

          return (
            <div key={index} className="relative">
              {isImage ? (
                <img
                  src={preview?.url.startsWith('data:') ? 
                    preview.url : 
                    `${BASE_URL}${preview.url}`}
                  alt={`${field} ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <button
                type="button"
                onClick={() => onDelete(field, index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      <div {...getRootProps()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer">
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-600 justify-center">
            <span className="text-primary-600 hover:text-primary-500 font-medium">Upload files</span>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          <input {...getInputProps()} />
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState({
    // Employment & Income
    isCurrentlyEmployed: '',
    employmentType: '',
    monthlyNetIncome: '',
    hasAdditionalIncome: '',
    additionalIncomeDescription: '',
    
    // Expenses & Debts
    monthlyDebtRepayment: '',
    paysChildSupport: '',
    childSupportAmount: '',
    
    // Rental History
    hasBeenEvicted: '',
    currentlyPaysRent: '',
    currentRentAmount: '',
    
    // Financial Preparedness
    hasTwoMonthsRentSavings: '',
    canShareFinancialDocuments: '',
    
    // Existing fields
    canPayMoreThanOneMonth: '',
    monthsAheadCanPay: ''
  });
  const [documents, setDocuments] = useState({
    proofOfIdentity: [],
    proofOfIncome: [],
    creditHistory: [],
    rentalHistory: [],
    additionalDocuments: []
  });
  const [previews, setPreviews] = useState({
    proofOfIdentity: [],
    proofOfIncome: [],
    creditHistory: [],
    rentalHistory: [],
    additionalDocuments: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          });

          // Fetch tenant data if user is a tenant
          if (user.role === 'tenant') {
            const token = localStorage.getItem('token');
            try {
              const response = await axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const { data } = response;
              console.log('Fetched tenant data:', data);

              if (data) {
                const newAnswers = {
                  // Employment & Income
                  isCurrentlyEmployed: data.isCurrentlyEmployed === 'yes' ? 'true' : 'false',
                  employmentType: data.employmentType || '',
                  monthlyNetIncome: data.monthlyNetIncome || '',
                  hasAdditionalIncome: data.hasAdditionalIncome === 'yes' ? 'true' : 'false',
                  additionalIncomeDescription: data.additionalIncomeDescription || '',
                  
                  // Expenses & Debts
                  monthlyDebtRepayment: data.monthlyDebtRepayment || '',
                  paysChildSupport: data.paysChildSupport === 'yes' ? 'true' : 'false',
                  childSupportAmount: data.childSupportAmount || '',
                  
                  // Rental History
                  hasBeenEvicted: data.hasBeenEvicted === 'yes' ? 'true' : 'false',
                  currentlyPaysRent: data.currentlyPaysRent === 'yes' ? 'true' : 'false',
                  currentRentAmount: data.currentRentAmount || '',
                  
                  // Financial Preparedness
                  hasTwoMonthsRentSavings: data.hasTwoMonthsRentSavings === 'yes' ? 'true' : 'false',
                  canShareFinancialDocuments: data.canShareFinancialDocuments === 'yes' ? 'true' : 'false',
                  
                  // Existing fields
                  canPayMoreThanOneMonth: data.canPayMoreThanOneMonth === 'yes' ? 'true' : 'false',
                  monthsAheadCanPay: data.monthsAheadCanPay || ''
                };
                console.log('Setting initial answers:', newAnswers);
                setAnswers(newAnswers);

                // Initialize documents and previews states
                const initialDocuments = {};
                const initialPreviews = {};

                // Process each document field
                ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
                  if (data[field] && Array.isArray(data[field])) {
                    initialDocuments[field] = data[field].map(doc => ({
                      name: doc.originalName || 'Document',
                      type: doc.mimeType || 'application/octet-stream'
                    }));

                    initialPreviews[field] = data[field].map(doc => ({
                      url: doc.url,
                      thumbnailUrl: doc.thumbnailUrl,
                      type: doc.mimeType?.startsWith('image/') ? 'image' : 'pdf'
                    }));
                  } else {
                    initialDocuments[field] = [];
                    initialPreviews[field] = [];
                  }
                });

                setDocuments(initialDocuments);
                setPreviews(initialPreviews);
              }
            } catch (error) {
              console.error('Error fetching tenant profile:', error);
              setError('Failed to load tenant profile');
            }
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          setError('Failed to load profile data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswers(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      
      if (formData.profilePicture) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(formData.profilePicture.type)) {
          setUploadError('Invalid file type. Only JPEG, PNG and GIF are allowed.');
          setLoading(false);
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (formData.profilePicture.size > maxSize) {
          setUploadError('File size too large. Maximum size is 5MB.');
          setLoading(false);
          return;
        }

        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      const response = await axios.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        updateProfile(response.data);
        setSuccess('Profile updated successfully');
        // Clear the preview after successful upload
        setProfilePreview(null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add all answers to form data with proper type conversion
      Object.entries(answers).forEach(([key, value]) => {
        // Convert boolean radio values to 'yes'/'no' strings
        if (typeof value === 'string' && (value === 'true' || value === 'false')) {
          formData.append(key, value === 'true' ? 'yes' : 'no');
        } else {
          formData.append(key, value);
        }
      });

      // Add documents to form data
      Object.entries(documents).forEach(([field, files]) => {
        files.forEach((file, index) => {
          formData.append(`${field}`, file);
        });
      });

      const response = await axios.post(
        API_ENDPOINTS.UPDATE_TENANT_PROFILE,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        const { data } = response;
        console.log('Server response data:', data);
        
        // Update the answers state with the new values from the server
        const updatedAnswers = {
          // Employment & Income
          isCurrentlyEmployed: data.isCurrentlyEmployed === 'yes' ? 'true' : 'false',
          employmentType: data.employmentType || '',
          monthlyNetIncome: data.monthlyNetIncome || '',
          hasAdditionalIncome: data.hasAdditionalIncome === 'yes' ? 'true' : 'false',
          additionalIncomeDescription: data.additionalIncomeDescription || '',
          
          // Expenses & Debts
          monthlyDebtRepayment: data.monthlyDebtRepayment || '',
          paysChildSupport: data.paysChildSupport === 'yes' ? 'true' : 'false',
          childSupportAmount: data.childSupportAmount || '',
          
          // Rental History
          hasBeenEvicted: data.hasBeenEvicted === 'yes' ? 'true' : 'false',
          currentlyPaysRent: data.currentlyPaysRent === 'yes' ? 'true' : 'false',
          currentRentAmount: data.currentRentAmount || '',
          
          // Financial Preparedness
          hasTwoMonthsRentSavings: data.hasTwoMonthsRentSavings === 'yes' ? 'true' : 'false',
          canShareFinancialDocuments: data.canShareFinancialDocuments === 'yes' ? 'true' : 'false',
          
          // Existing fields
          canPayMoreThanOneMonth: data.canPayMoreThanOneMonth === 'yes' ? 'true' : 'false',
          monthsAheadCanPay: data.monthsAheadCanPay || ''
        };
        console.log('Updated answers:', updatedAnswers);
        setAnswers(updatedAnswers);

        // Update documents and previews
        const updatedDocuments = {};
        const updatedPreviews = {};

        ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].forEach(field => {
          if (data[field] && Array.isArray(data[field])) {
            updatedDocuments[field] = data[field].map(doc => ({
              name: doc.originalName || 'Document',
              type: doc.mimeType || 'application/octet-stream'
            }));

            updatedPreviews[field] = data[field].map(doc => ({
              url: doc.url,
              thumbnailUrl: doc.thumbnailUrl,
              type: doc.mimeType?.startsWith('image/') ? 'image' : 'pdf'
            }));
          } else {
            updatedDocuments[field] = [];
            updatedPreviews[field] = [];
          }
        });

        console.log('Updated documents:', updatedDocuments);
        console.log('Updated previews:', updatedPreviews);

        setDocuments(updatedDocuments);
        setPreviews(updatedPreviews);
        setSuccess('Tenant profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      setError(error.response?.data?.message || 'Failed to update tenant profile');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (field) => (acceptedFiles) => {
    setDocuments(prev => ({
      ...prev,
      [field]: [...prev[field], ...acceptedFiles]
    }));

    // Create previews for images
    acceptedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews(prev => ({
            ...prev,
            [field]: [...prev[field], {
              url: reader.result,
              thumbnailUrl: reader.result,
              type: 'image'
            }]
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => ({
          ...prev,
          [field]: [...prev[field], {
            url: URL.createObjectURL(file),
            thumbnailUrl: URL.createObjectURL(file),
            type: 'pdf'
          }]
        }));
      }
    });
  };

  const handleDeleteDocument = async (field, index) => {
    try {
      const token = localStorage.getItem('token');
      
      // If the document exists on the server (has a URL), make an API call to delete it
      if (previews[field][index]?.url && !previews[field][index]?.url.startsWith('data:')) {
        await axios.delete(`${API_ENDPOINTS.GET_TENANT_PROFILE}/${field}/${index}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
      setPreviews(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your personal information.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {user.role !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-100">
                    {(profilePreview || user.profilePicture) ? (
                      <img 
                        src={profilePreview || `${import.meta.env.VITE_API_URL}${user.profilePicture}`} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, profilePicture: file }));
                          setProfilePreview(URL.createObjectURL(file));
                          setUploadError('');
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {uploadError && (
                      <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {user?.role === 'tenant' && (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Tenant Application</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              We will use this information for each application to help you find the perfect property.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleTenantSubmit} className="space-y-8">
              {/* Section 1: Employment & Income */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Employment & Income</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Are you currently employed?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="isCurrentlyEmployed"
                            value="true"
                            checked={answers.isCurrentlyEmployed === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="isCurrentlyEmployed"
                            value="false"
                            checked={answers.isCurrentlyEmployed === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">What is your employment type?</label>
                      <select
                        id="employmentType"
                        name="employmentType"
                        value={answers.employmentType}
                        onChange={handleAnswerChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Select employment type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="self-employed">Self-employed</option>
                        <option value="contractor">Contractor</option>
                        <option value="student">Student</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="monthlyNetIncome" className="block text-sm font-medium text-gray-700">What is your current monthly net income (after taxes)?</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="monthlyNetIncome"
                          id="monthlyNetIncome"
                          value={answers.monthlyNetIncome}
                          onChange={handleAnswerChange}
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Do you have any additional sources of income?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasAdditionalIncome"
                            value="true"
                            checked={answers.hasAdditionalIncome === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasAdditionalIncome"
                            value="false"
                            checked={answers.hasAdditionalIncome === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {answers.hasAdditionalIncome === 'true' && (
                      <div>
                        <label htmlFor="additionalIncomeDescription" className="block text-sm font-medium text-gray-700">Please describe your additional income sources:</label>
                        <textarea
                          id="additionalIncomeDescription"
                          name="additionalIncomeDescription"
                          rows={3}
                          value={answers.additionalIncomeDescription}
                          onChange={handleAnswerChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Describe your additional income sources..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Expenses & Debts */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Expenses & Debts</h3>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="monthlyDebtRepayment" className="block text-sm font-medium text-gray-700">What is your approximate monthly debt repayment amount (credit cards, loans, etc.)?</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="monthlyDebtRepayment"
                          id="monthlyDebtRepayment"
                          value={answers.monthlyDebtRepayment}
                          onChange={handleAnswerChange}
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Do you pay any regular child or spousal support?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="paysChildSupport"
                            value="true"
                            checked={answers.paysChildSupport === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="paysChildSupport"
                            value="false"
                            checked={answers.paysChildSupport === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {answers.paysChildSupport === 'true' && (
                      <div>
                        <label htmlFor="childSupportAmount" className="block text-sm font-medium text-gray-700">How much do you pay per month?</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="childSupportAmount"
                            id="childSupportAmount"
                            value={answers.childSupportAmount}
                            onChange={handleAnswerChange}
                            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Rental History */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Rental History</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Have you ever been evicted?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasBeenEvicted"
                            value="true"
                            checked={answers.hasBeenEvicted === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasBeenEvicted"
                            value="false"
                            checked={answers.hasBeenEvicted === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Do you currently pay rent?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="currentlyPaysRent"
                            value="true"
                            checked={answers.currentlyPaysRent === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="currentlyPaysRent"
                            value="false"
                            checked={answers.currentlyPaysRent === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {answers.currentlyPaysRent === 'true' && (
                      <div>
                        <label htmlFor="currentRentAmount" className="block text-sm font-medium text-gray-700">How much is your current rent?</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="currentRentAmount"
                            id="currentRentAmount"
                            value={answers.currentRentAmount}
                            onChange={handleAnswerChange}
                            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Financial Preparedness */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Financial Preparedness</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Do you have savings equivalent to at least 2 months of rent?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasTwoMonthsRentSavings"
                            value="true"
                            checked={answers.hasTwoMonthsRentSavings === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="hasTwoMonthsRentSavings"
                            value="false"
                            checked={answers.hasTwoMonthsRentSavings === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Would you be comfortable sharing proof of income or financial statements to support your application?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canShareFinancialDocuments"
                            value="true"
                            checked={answers.canShareFinancialDocuments === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canShareFinancialDocuments"
                            value="false"
                            checked={answers.canShareFinancialDocuments === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing fields */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Can you pay more than one month's rent at a time?</label>
                      <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canPayMoreThanOneMonth"
                            value="true"
                            checked={answers.canPayMoreThanOneMonth === 'true'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canPayMoreThanOneMonth"
                            value="false"
                            checked={answers.canPayMoreThanOneMonth === 'false'}
                            onChange={handleAnswerChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {answers.canPayMoreThanOneMonth === 'true' && (
                      <div>
                        <label htmlFor="monthsAheadCanPay" className="block text-sm font-medium text-gray-700">How many months ahead can you pay?</label>
                        <input
                          type="number"
                          name="monthsAheadCanPay"
                          id="monthsAheadCanPay"
                          value={answers.monthsAheadCanPay}
                          onChange={handleAnswerChange}
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Upload Sections */}
              {['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'].map((field) => (
                <DocumentUpload
                  key={field}
                  field={field}
                  documents={documents}
                  previews={previews}
                  onDrop={onDrop(field)}
                  onDelete={handleDeleteDocument}
                />
              ))}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {loading ? 'Updating...' : 'Update Tenant Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}
    </div>
  );
} 