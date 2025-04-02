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

          const documentFields = [
            'proofOfIdentity',
            'proofOfIncome',
            'creditHistory',
            'rentalHistory',
            'additionalDocuments'
          ];

          documentFields.forEach(field => {
            if (data[field]?.url) {
              initialDocuments[field] = [{
                name: data[field].filename,
                type: data[field].filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
                isExisting: true
              }];
              initialPreviews[field] = [data[field].url];
            } else {
              initialDocuments[field] = [];
              initialPreviews[field] = [];
            }
          });

          setDocuments(initialDocuments);
          setPreviews(initialPreviews);
        }
      } catch (error) {
        toast.error('Failed to load tenant profile data');
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

  const handleFileChange = async (e, field) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    try {
      // Update documents state
      setDocuments(prev => ({
        ...prev,
        [field]: selectedFiles.map(file => ({
          name: file.name,
          type: file.type,
          file: file,
          isExisting: false
        }))
      }));

      // Generate previews
      const newPreviews = await Promise.all(
        selectedFiles.map(file => {
          if (file.type === 'application/pdf') {
            return 'pdf';
          }
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      setPreviews(prev => ({
        ...prev,
        [field]: newPreviews
      }));
    } catch (error) {
      console.error('Error handling file change:', error);
      toast.error('Error processing selected files. Please try again.');
    }
  };

  const handleDeleteDocument = async (field, index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // If the document is from the server (has a URL), delete it from the server
      const preview = previews[field][index];
      if (typeof preview === 'string' && !preview.startsWith('data:')) {
        await axios.delete(`${API_ENDPOINTS.UPDATE_TENANT_PROFILE}/${field}/${index}`, {
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
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.response?.data?.message || 'Error deleting document');
    }
  };

  const { getRootProps: getIdentityProps, getInputProps: getIdentityInputProps } = useDropzone({
    onDrop: (files) => handleFileChange(files, 'proofOfIdentity'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const { getRootProps: getIncomeProps, getInputProps: getIncomeInputProps } = useDropzone({
    onDrop: (files) => handleFileChange(files, 'proofOfIncome'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const { getRootProps: getCreditProps, getInputProps: getCreditInputProps } = useDropzone({
    onDrop: (files) => handleFileChange(files, 'creditHistory'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const { getRootProps: getRentalProps, getInputProps: getRentalInputProps } = useDropzone({
    onDrop: (files) => handleFileChange(files, 'rentalHistory'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const { getRootProps: getAdditionalProps, getInputProps: getAdditionalInputProps } = useDropzone({
    onDrop: (files) => handleFileChange(files, 'additionalDocuments'),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Create FormData instance
      const formData = new FormData();

      // Add answers to FormData
      Object.entries(answers).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add files to FormData
      Object.entries(documents).forEach(([field, files]) => {
        if (files.length > 0) {
          const file = files[0]; // We're only handling one file per field for now
          if (!file.isExisting && file.file) {
            formData.append(field, file.file);
          } else if (file.isExisting) {
            // If it's an existing file, send the URL/path
            formData.append(`${field}Existing`, 'true');
          }
        }
      });

      // Send the request
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
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentPreview = (field, label) => {
    const preview = previews[field];
    const files = documents[field];

    if (!preview || !files || files.length === 0) return null;

    return (
      <div className="mt-2">
        <div className="relative inline-block">
          {preview.map((p, index) => (
            <div key={index} className="relative">
              {files[index].type === 'application/pdf' || p === 'pdf' ? (
                <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md">
                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">{files[index].name}</span>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={p}
                    alt={`${label} preview`}
                    className="max-h-32 rounded-md"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Error+Loading+Image';
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDeleteDocument(field, index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
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
                {renderDocumentPreview('proofOfIdentity', 'Proof of Identity')}
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
                {renderDocumentPreview('proofOfIncome', 'Proof of Income')}
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
                {renderDocumentPreview('creditHistory', 'Credit History')}
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
                {renderDocumentPreview('rentalHistory', 'Rental History')}
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
                {renderDocumentPreview('additionalDocuments', 'Additional Documents')}
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