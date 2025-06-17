import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

export function useApplications(propertyId) {
  const [applications, setApplications] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [selectedTenantIndex, setSelectedTenantIndex] = useState('0');

  useEffect(() => {
    if (propertyId) {
      fetchApplications();
    }
  }, [propertyId]);

  const fetchApplications = async () => {
    if (!propertyId) return;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.APPLICATIONS}/property/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Populate property data for each application
      const populatedApplications = await Promise.all(
        response.data.map(async (app) => {
          if (app.property) {
            const propertyResponse = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${app.property}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            return {
              ...app,
              property: propertyResponse.data
            };
          }
          return app;
        })
      );
      
      setApplications(populatedApplications);
      if (populatedApplications.length === 0) {
        setSelectedTenantIndex('0');
      } else if (parseInt(selectedTenantIndex) >= populatedApplications.length) {
        setSelectedTenantIndex((populatedApplications.length - 1).toString());
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to fetch applications');
    }
  };

  const fetchApplicationCounts = async (properties) => {
    try {
      const counts = {};
      for (const property of properties) {
        const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            propertyId: property._id
          }
        });
        counts[property._id] = response.data.length;
      }
      setApplicationCounts(counts);
    } catch (error) {
      console.error('Error fetching application counts:', error);
      toast.error('Failed to fetch application counts');
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      await axios.put(
        `${API_ENDPOINTS.PROPERTIES}/${propertyId}/applications/${applicationId}/status`,
        { status: action === 'approve' ? 'approved' : 'declined' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      await fetchApplications();
      toast.success(`Application ${action === 'approve' ? 'approved' : 'declined'} successfully`);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleTenantTabChange = (event, newValue) => {
    setSelectedTenantIndex(newValue);
  };

  return {
    applications,
    applicationCounts,
    selectedTenantIndex,
    fetchApplications,
    fetchApplicationCounts,
    handleApplicationAction,
    handleTenantTabChange
  };
} 