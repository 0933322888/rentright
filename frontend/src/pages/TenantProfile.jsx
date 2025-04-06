import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { useDropzone } from 'react-dropzone';
import { toast, Toaster } from 'react-hot-toast';

export default function TenantProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [answers, setAnswers] = useState({
    hasBeenEvicted: '',
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

  // Fetch existing tenant profile data
  useEffect(() => {
    const fetchTenantProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { data } = response;
        
        if (data) {
          setAnswers({
            hasBeenEvicted: data.hasBeenEvicted || '',
            canPayMoreThanOneMonth: data.canPayMoreThanOneMonth || '',
            monthsAheadCanPay: data.monthsAheadCanPay || ''
          });

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
        if (error.response?.status === 404) {
          // New tenant without a profile - initialize empty states
          setAnswers({
            hasBeenEvicted: '',
            canPayMoreThanOneMonth: '',
            monthsAheadCanPay: ''
          });
          setDocuments({
            proofOfIdentity: [],
            proofOfIncome: [],
            creditHistory: [],
            rentalHistory: [],
            additionalDocuments: []
          });
          setPreviews({
            proofOfIdentity: [],
            proofOfIncome: [],
            creditHistory: [],
            rentalHistory: [],
            additionalDocuments: []
          });
        } else {
          setError('Failed to load tenant profile data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTenantProfile();
  }, [navigate]);

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('Current answers state:', answers);
    console.log('Current documents state:', documents);
    console.log('Current previews state:', previews);
  }, [answers, documents, previews]);

  const handleAnswerChange = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field, acceptedFiles) => {
    // Filter out any files that are too large (10MB limit)
    const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validFiles.length < acceptedFiles.length) {
      toast.error('Some files were skipped because they exceed the 10MB size limit');
    }

    // Create previews for the new files
    const newPreviews = validFiles.map(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (isImage) {
        return {
          type: 'image',
          url: URL.createObjectURL(file),
          thumbnailUrl: URL.createObjectURL(file), // Use the same URL for initial preview
          mimeType: file.type
        };
      } else if (isPdf) {
        return {
          type: 'pdf',
          url: URL.createObjectURL(file),
          mimeType: file.type
        };
      } else {
        return {
          type: 'other',
          url: null,
          mimeType: file.type
        };
      }
    });

    // Update documents state
    setDocuments(prev => ({
      ...prev,
      [field]: [...prev[field], ...validFiles]
    }));

    // Update previews state
    setPreviews(prev => ({
      ...prev,
      [field]: [...prev[field], ...newPreviews]
    }));
  };

  const handleDeleteDocument = async (field, index) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(`${API_ENDPOINTS.BASE_URL}/api/users/tenant-profile/${field}/${index}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Update the documents and previews state
        setDocuments(prev => ({
          ...prev,
          [field]: prev[field].filter((_, i) => i !== index)
        }));
        setPreviews(prev => ({
          ...prev,
          [field]: prev[field].filter((_, i) => i !== index)
        }));
        setSuccess('Document deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps: getIdentityProps, getInputProps: getIdentityInputProps } = useDropzone({
    onDrop: files => handleFileChange('proofOfIdentity', files),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const { getRootProps: getIncomeProps, getInputProps: getIncomeInputProps } = useDropzone({
    onDrop: files => handleFileChange('proofOfIncome', files),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const { getRootProps: getCreditProps, getInputProps: getCreditInputProps } = useDropzone({
    onDrop: files => handleFileChange('creditHistory', files),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const { getRootProps: getRentalProps, getInputProps: getRentalInputProps } = useDropzone({
    onDrop: files => handleFileChange('rentalHistory', files),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const { getRootProps: getAdditionalProps, getInputProps: getAdditionalInputProps } = useDropzone({
    onDrop: files => handleFileChange('additionalDocuments', files),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Add files to formData
      Object.entries(documents).forEach(([field, files]) => {
        if (files && files.length > 0) {
          files.forEach(file => {
            if (file instanceof File) {
              formData.append(field, file);
            }
          });
        }
      });

      // Add other form data
      formData.append('hasBeenEvicted', answers.hasBeenEvicted);
      formData.append('canPayMoreThanOneMonth', answers.canPayMoreThanOneMonth);
      formData.append('monthsAheadCanPay', answers.monthsAheadCanPay);

      const response = await axios.post(API_ENDPOINTS.UPDATE_TENANT_PROFILE, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        // Update documents and previews state with the response data
        const updatedDocuments = {};
        const updatedPreviews = {};
        const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
        
        documentFields.forEach(field => {
          if (response.data[field]) {
            updatedDocuments[field] = response.data[field].map(doc => ({
              name: doc.filename,
              type: doc.mimeType || 'application/octet-stream'
            }));

            updatedPreviews[field] = response.data[field].map(doc => ({
              url: doc.url,
              thumbnailUrl: doc.thumbnailUrl || doc.url,
              type: doc.mimeType?.startsWith('image/') ? 'image' : 'pdf',
              mimeType: doc.mimeType
            }));
          } else {
            updatedDocuments[field] = [];
            updatedPreviews[field] = [];
          }
        });

        setDocuments(updatedDocuments);
        setPreviews(updatedPreviews);
        setSuccess('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentPreview = (field, index) => {
    const previewsList = previews[field];
    const filesList = documents[field];

    if (!previewsList || !filesList || !previewsList[index] || !filesList[index]) {
      return null;
    }

    const preview = previewsList[index];
    const file = filesList[index];

    if (file.type === 'pdf') {
      return (
        <div className="relative group">
          <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => handleDeleteDocument(field, index)}
              className="text-white hover:text-red-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative group">
        <img
          src={preview.thumbnailUrl ? `${API_ENDPOINTS.BASE_URL}${preview.thumbnailUrl}` : `${API_ENDPOINTS.BASE_URL}${preview.url}`}
          alt={`Document preview ${index + 1}`}
          className="w-full aspect-square object-cover rounded-lg"
          onError={(e) => {
            // If thumbnail fails, try the original image
            if (e.target.src.includes('thumbnails')) {
              e.target.src = `${API_ENDPOINTS.BASE_URL}${preview.url}`;
            } else {
              // If both fail, show fallback
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWVlZWUiLz48cGF0aCBkPSJNMTI1IDg1QzEyNSA5My4yODQzIDExOC4yODQgMTAwIDExMCAxMDBDMTAxLjcxNiAxMDAgOTUgOTMuMjg0MyA5NSA4NUM5NSA3Ni43MTU3IDEwMS43MTYgNzAgMTEwIDcwQzExOC4yODQgNzAgMTI1IDc2LjcxNTcgMTI1IDg1WiIgZmlsbD0iI2NjY2NjYyIvPjxwYXRoIGQ9Ik03MCAxNDBDNzAgMTMxLjcxNiA3Ni43MTU3IDEyNSA4NSAxMjVIMTM1QzE0My4yODQgMTI1IDE1MCAxMzEuNzE2IDE1MCAxNDBWMTUwQzE1MCAxNTguMjg0IDE0My4yODQgMTY1IDEzNSAxNjVIODVDNzYuNzE1NyAxNjUgNzAgMTU4LjI4NCA3MCAxNTBWMTQwWiIgZmlsbD0iI2NjY2NjYyIvPjwvc3ZnPg==';
            }
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handleDeleteDocument(field, index)}
            className="text-white hover:text-red-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
            <h1 className="text-3xl font-bold text-gray-900">Tenant Profile</h1>
            <p className="mt-2 text-gray-600">Please answer the following questions and upload your documents to complete your profile</p>
            <p className="mt-2 text-gray-600">We will use this information when you apply for a property.</p>
            <p className="mt-2 text-gray-600">The more information you provide, the better chance you have of finding the perfect property.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {/* Questions Section */}
              <div className="space-y-6">
                {/* Eviction Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Have you ever been evicted?
                  </label>
                  <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="hasBeenEvicted"
                        value="yes"
                        checked={answers.hasBeenEvicted === 'yes'}
                        onChange={(e) => handleAnswerChange('hasBeenEvicted', e.target.value)}
                        className="form-radio h-4 w-4 text-indigo-600"
                        required
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="hasBeenEvicted"
                        value="no"
                        checked={answers.hasBeenEvicted === 'no'}
                        onChange={(e) => handleAnswerChange('hasBeenEvicted', e.target.value)}
                        className="form-radio h-4 w-4 text-indigo-600"
                        required
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {/* Multiple Months Payment Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Some tenants are willing to pay a few months of rent to provide a better chance of finding a property. 
                    Would you consider paying for more than 1 month?
                  </label>
                  <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="canPayMoreThanOneMonth"
                        value="yes"
                        checked={answers.canPayMoreThanOneMonth === 'yes'}
                        onChange={(e) => handleAnswerChange('canPayMoreThanOneMonth', e.target.value)}
                        className="form-radio h-4 w-4 text-indigo-600"
                        required
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="canPayMoreThanOneMonth"
                        value="no"
                        checked={answers.canPayMoreThanOneMonth === 'no'}
                        onChange={(e) => handleAnswerChange('canPayMoreThanOneMonth', e.target.value)}
                        className="form-radio h-4 w-4 text-indigo-600"
                        required
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {/* Months Ahead Question - Conditional */}
                {answers.canPayMoreThanOneMonth === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      For how many months in total ahead can you pay?
                    </label>
                    <div className="mt-2">
                      <input
                        type="number"
                        min="2"
                        value={answers.monthsAheadCanPay}
                        onChange={(e) => handleAnswerChange('monthsAheadCanPay', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-medium text-gray-900">Document Upload</h2>
                <p className="mt-1 text-sm text-gray-500">Please upload the following documents to complete your profile</p>
              </div>

              {/* Proof of Identity */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Identity
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Government-issued ID (Passport, Driver's License, PR Card, or Work Permit)
                </p>
                <div
                  {...getIdentityProps()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <input {...getIdentityInputProps()} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews['proofOfIdentity']?.map((_, index) => (
                      <div key={index} className="relative">
                        {renderDocumentPreview('proofOfIdentity', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proof of Income & Employment */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Income & Employment
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Pay stubs (usually last 3 months), Employment letter, Tax documents, Bank statements
                </p>
                <div
                  {...getIncomeProps()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <input {...getIncomeInputProps()} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews['proofOfIncome']?.map((_, index) => (
                      <div key={index} className="relative">
                        {renderDocumentPreview('proofOfIncome', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Credit History */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Credit History
                </label>
                <div
                  {...getCreditProps()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <input {...getCreditInputProps()} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews['creditHistory']?.map((_, index) => (
                      <div key={index} className="relative">
                        {renderDocumentPreview('creditHistory', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rental History & References */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rental History & References (Optional)
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Previous landlord references (confirmation of good tenancy and payment history)
                </p>
                <div
                  {...getRentalProps()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <input {...getRentalInputProps()} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews['rentalHistory']?.map((_, index) => (
                      <div key={index} className="relative">
                        {renderDocumentPreview('rentalHistory', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Documents (Optional)
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Any other additional document
                </p>
                <div
                  {...getAdditionalProps()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <input {...getAdditionalInputProps()} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews['additionalDocuments']?.map((_, index) => (
                      <div key={index} className="relative">
                        {renderDocumentPreview('additionalDocuments', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {success && (
                <div className="text-green-600 text-sm">{success}</div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 