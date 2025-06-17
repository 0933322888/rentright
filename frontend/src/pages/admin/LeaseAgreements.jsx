import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const LeaseAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [validLocations, setValidLocations] = useState({
    CA: [],
    US: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchLeaseAgreements();
  }, []);

  const fetchLeaseAgreements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.ADMIN}/lease-agreements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.agreements && response.data.validLocations) {
        setAgreements(response.data.agreements);
        setValidLocations(response.data.validLocations);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching lease agreements:', error);
      setError('Failed to load lease agreements');
      toast.error('Failed to load lease agreements');
      // Set default valid locations if the API call fails
      setValidLocations({
        CA: ['ON', 'BC', 'AB', 'QC', 'NS', 'NB', 'MB', 'SK', 'PE', 'NL', 'NT', 'NU', 'YT'],
        US: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCountry || !selectedRegion) {
      toast.error('Please select a file, country, and region');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await axios.post(
        `${API_ENDPOINTS.ADMIN}/lease-agreements/${selectedCountry}/${selectedRegion}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Lease agreement uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedCountry('');
      setSelectedRegion('');
      fetchLeaseAgreements();
    } catch (error) {
      console.error('Error uploading lease agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to upload lease agreement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (countryCode, region) => {
    if (!window.confirm(`Are you sure you want to delete the lease agreement for ${countryCode}/${region}?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Lease agreement deleted successfully');
      fetchLeaseAgreements();
    } catch (error) {
      console.error('Error deleting lease agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to delete lease agreement');
    }
  };

  const handlePreview = async (countryCode, region) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Your session has expired. Please log in again.');
        return;
      }

      // Fetch the PDF directly
      const response = await axios.get(
        `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}/file`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          },
          responseType: 'blob'
        }
      );

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error accessing lease agreement:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this file.');
      } else {
        toast.error('Failed to preview lease agreement. Please try again.');
      }
    }
  };

  // Clean up blob URL when dialog closes
  const handleClosePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPreviewDialogOpen(false);
  };

  const handleDownload = async (countryCode, region) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}/file`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lease-agreement-${countryCode}-${region}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading lease agreement:', error);
      toast.error('Failed to download lease agreement');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Manage Lease Agreements
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload New Agreement
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Size</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={`${agreement.countryCode}-${agreement.region}`}>
                <TableCell>{agreement.countryCode}</TableCell>
                <TableCell>{agreement.region}</TableCell>
                <TableCell>
                  {agreement.exists ? (
                    <Typography color="success.main">Available</Typography>
                  ) : (
                    <Typography color="error.main">Not Available</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {agreement.lastModified
                    ? new Date(agreement.lastModified).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {agreement.size
                    ? `${(agreement.size / 1024 / 1024).toFixed(2)} MB`
                    : '-'}
                </TableCell>
                <TableCell align="right">
                  {agreement.exists ? (
                    <>
                      <Tooltip title="Preview">
                        <IconButton
                          onClick={() => handlePreview(agreement.countryCode, agreement.region)}
                          size="small"
                        >
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() => handleDownload(agreement.countryCode, agreement.region)}
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(agreement.countryCode, agreement.region)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Upload">
                      <IconButton
                        onClick={() => {
                          setSelectedCountry(agreement.countryCode);
                          setSelectedRegion(agreement.region);
                          setUploadDialogOpen(true);
                        }}
                        size="small"
                        color="primary"
                      >
                        <UploadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Lease Agreement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedRegion('');
                  }}
                  label="Country"
                >
                  {Object.keys(validLocations || {}).map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  label="Region"
                  disabled={!selectedCountry}
                >
                  {selectedCountry &&
                    (validLocations[selectedCountry] || []).map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
              >
                Select PDF File
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            color="primary"
            disabled={!selectedFile || !selectedCountry || !selectedRegion || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Lease Agreement Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ height: '80vh', width: '100%' }}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Lease Agreement Preview"
                onError={() => {
                  toast.error('Failed to load PDF preview');
                  handleClosePreview();
                }}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaseAgreements; 