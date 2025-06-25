import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Card,
  CardContent,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

const Insurance = ({ leaseDetails, onInsuranceUpdate }) => {
  const { user } = useAuth();
  const [insuranceDocuments, setInsuranceDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState({});
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [aiSummaries, setAiSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [openSections, setOpenSections] = useState({});

  const isTenant = user?.role === 'tenant';
  const isLandlord = user?.role === 'landlord';

  // Generate years array from lease start date and 1 year ahead
  const getLeaseYears = () => {
    if (!leaseDetails?.leaseAgreement?.leaseStartDate?.date) {
      // Fallback to current year if lease start date is not set
      const currentYear = new Date().getFullYear();
      return [currentYear.toString(), (currentYear + 1).toString()];
    }
    
    const leaseStartDate = new Date(leaseDetails.leaseAgreement.leaseStartDate.date);
    const leaseStartYear = leaseStartDate.getFullYear();
    const nextYear = leaseStartYear + 1;
    
    return [leaseStartYear.toString(), nextYear.toString()];
  };

  const years = getLeaseYears();

  // Sort years oldest to newest
  const sortedYears = [...years].sort();

  useEffect(() => {
    fetchInsuranceDocuments();
  }, [leaseDetails._id]);

  const fetchInsuranceDocuments = async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.INSURANCE_DOCUMENTS(leaseDetails._id),
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Organize documents by year
      const documentsByYear = {};
      (response.data.documents || []).forEach(doc => {
        const year = doc.year || new Date(doc.uploadedAt).getFullYear().toString();
        if (!documentsByYear[year]) {
          documentsByYear[year] = [];
        }
        documentsByYear[year].push(doc);
      });

      // Use aiSummaries from backend (already mapped by year)
      const summariesByYear = response.data.aiSummaries || {};

      setInsuranceDocuments(documentsByYear);
      setAiSummaries(summariesByYear);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insurance documents:', error);
      toast.error('Failed to load insurance documents');
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed');
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setUploadError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedYear) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('year', selectedYear);

      const response = await axios.post(
        API_ENDPOINTS.UPLOAD_INSURANCE_DOCUMENT(leaseDetails._id),
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update insurance documents for the specific year
      const updatedDocuments = {
        ...insuranceDocuments,
        [selectedYear]: [response.data] // Replace existing document for this year
      };
      setInsuranceDocuments(updatedDocuments);

      // Update lease details
      const updatedLeaseDetails = {
        ...leaseDetails,
        insuranceDocuments: updatedDocuments
      };
      onInsuranceUpdate(updatedLeaseDetails);

      toast.success(`Insurance document for ${selectedYear} uploaded successfully`);
      setShowUploadDialog(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading insurance document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload insurance document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (year) => {
    if (!window.confirm(`Are you sure you want to delete the insurance document for ${year}?`)) {
      return;
    }

    const documents = insuranceDocuments[year];
    if (!documents || documents.length === 0) return;

    try {
      const response = await axios.delete(
        API_ENDPOINTS.DELETE_INSURANCE_DOCUMENT(leaseDetails._id, documents[0]._id),
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Remove document from the specific year
      const updatedDocuments = { ...insuranceDocuments };
      delete updatedDocuments[year];
      setInsuranceDocuments(updatedDocuments);

      // Remove summary for this year if it exists
      const updatedSummaries = { ...aiSummaries };
      delete updatedSummaries[year];
      setAiSummaries(updatedSummaries);

      // Update lease details
      const updatedLeaseDetails = {
        ...leaseDetails,
        insuranceDocuments: updatedDocuments
      };
      onInsuranceUpdate(updatedLeaseDetails);

      toast.success(`Insurance document for ${year} deleted successfully`);
    } catch (error) {
      console.error('Error deleting insurance document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete insurance document');
    }
  };

  const handleGenerateSummary = async (year) => {
    const documents = insuranceDocuments[year];
    if (!documents || documents.length === 0) {
      toast.error(`No insurance documents available for ${year}`);
      return;
    }

    try {
      setSummaryLoading(prev => ({ ...prev, [year]: true }));
      const response = await axios.post(
        API_ENDPOINTS.GENERATE_INSURANCE_SUMMARY(leaseDetails._id),
        { year },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setAiSummaries(prev => ({
        ...prev,
        [year]: response.data.summary
      }));
      toast.success(`Insurance summary for ${year} generated successfully`);
    } catch (error) {
      console.error('Error generating insurance summary:', error);
      toast.error(error.response?.data?.message || 'Failed to generate insurance summary');
    } finally {
      setSummaryLoading(prev => ({ ...prev, [year]: false }));
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(document.url, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName || document.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Render year-based documents
  if (isLandlord) {
    return (
      <Stack spacing={3}>
        {sortedYears.map(year => {
          const documents = insuranceDocuments[year] || [];
          const hasDocument = documents.length > 0;
          const summaryObj = aiSummaries[year];
          const summaryText = typeof summaryObj === 'string' ? summaryObj : summaryObj?.content;
          const isLoadingSummary = summaryLoading[year];
          return (
            <Box key={year}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {year}
                    </Typography>
                    <Chip 
                      label={hasDocument ? 'Document Uploaded' : 'No Document'} 
                      color={hasDocument ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  {hasDocument ? (
                    <Box>
                      {documents.map((doc, index) => (
                        <ListItem key={doc._id} sx={{ px: 0, alignItems: 'flex-start' }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            gap: 1,
                          }}>
                            <Box
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                maxWidth: { xs: '60%', sm: '70%', md: '75%' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '100%',
                                }}
                                title={doc.originalName || doc.filename}
                              >
                                {doc.originalName || doc.filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded on {format(new Date(doc.uploadedAt), 'PPP')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              <Tooltip title="Preview">
                                <IconButton
                                  onClick={() => window.open(doc.url, '_blank')}
                                  color="primary"
                                  sx={{ mr: 1 }}
                                >
                                  <PreviewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton
                                  onClick={() => handleDownload(doc)}
                                  color="primary"
                                  sx={{ mr: 1 }}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              {isTenant && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    onClick={() => handleDeleteDocument(year)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </ListItem>
                      ))}

                      {/* AI Summary Section for Landlords */}
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SmartToyIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              AI Summary
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SmartToyIcon />}
                            onClick={() => handleGenerateSummary(year)}
                            disabled={isLoadingSummary || !!summaryText}
                            sx={{
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                            }}
                          >
                            {isLoadingSummary ? 'Generating...' : 'Generate Summary'}
                          </Button>
                        </Box>

                        {isLoadingSummary && (
                          <Box sx={{ mb: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              AI is analyzing your insurance document for {year}...
                            </Typography>
                          </Box>
                        )}

                        {/* Collapsible summary section */}
                        {summaryText && (
                          <Accordion sx={{ mt: 1, bgcolor: 'grey.50', borderRadius: 2, boxShadow: 1 }} defaultExpanded={false}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                Insurance Policy Summary for {year}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {/* Metadata */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                {summaryObj?.generatedAt && (
                                  <Typography variant="caption" color="text.secondary">
                                    Generated: {new Date(summaryObj.generatedAt).toLocaleString()}
                                  </Typography>
                                )}

                                <CopyToClipboardButton text={summaryText} />
                              </Box>
                              {/* Table of Contents */}
                              <SummaryTOC markdown={summaryText} onSectionOpen={id => setOpenSections(s => ({ ...s, [id]: true }))} />
                              {/* Render Markdown with collapsible sections */}
                              <EnhancedMarkdown markdown={summaryText} openSections={openSections} setOpenSections={setOpenSections} />
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <EmptyState
                      title="No Insurance Document"
                      message={`No insurance document uploaded for ${year}.`}
                      icon={SecurityIcon}
                    />
                  )}
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Stack>
    );
  }
  // For tenants, keep the existing Grid layout
  return (
    <Grid container spacing={3}>
      {sortedYears.map(year => {
        const documents = insuranceDocuments[year] || [];
        const hasDocument = documents.length > 0;
        const summaryObj = aiSummaries[year];
        const summaryText = typeof summaryObj === 'string' ? summaryObj : summaryObj?.content;
        const isLoadingSummary = summaryLoading[year];

        return (
          <Grid item xs={12} key={year}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {year}
                  </Typography>
                  <Chip 
                    label={hasDocument ? 'Document Uploaded' : 'No Document'} 
                    color={hasDocument ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                {hasDocument ? (
                  <Box>
                    {documents.map((doc, index) => (
                      <ListItem key={doc._id} sx={{ px: 0, alignItems: 'flex-start' }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          gap: 1,
                        }}>
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              maxWidth: { xs: '60%', sm: '70%', md: '75%' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                              }}
                              title={doc.originalName || doc.filename}
                            >
                              {doc.originalName || doc.filename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Uploaded on {format(new Date(doc.uploadedAt), 'PPP')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <Tooltip title="Preview">
                              <IconButton
                                onClick={() => window.open(doc.url, '_blank')}
                                color="primary"
                                sx={{ mr: 1 }}
                              >
                                <PreviewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                onClick={() => handleDownload(doc)}
                                color="primary"
                                sx={{ mr: 1 }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            {isTenant && (
                              <Tooltip title="Delete">
                                <IconButton
                                  onClick={() => handleDeleteDocument(year)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                    ))}

                    {/* AI Summary Section for Landlords */}
                    {isLandlord && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SmartToyIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              AI Summary
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SmartToyIcon />}
                            onClick={() => handleGenerateSummary(year)}
                            disabled={isLoadingSummary || !!summaryText}
                            sx={{
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                            }}
                          >
                            {isLoadingSummary ? 'Generating...' : 'Generate Summary'}
                          </Button>
                        </Box>

                        {isLoadingSummary && (
                          <Box sx={{ mb: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              AI is analyzing your insurance document for {year}...
                            </Typography>
                          </Box>
                        )}

                        {/* Collapsible summary section */}
                        {summaryText && (
                          <Accordion sx={{ mt: 1, bgcolor: 'grey.50', borderRadius: 2, boxShadow: 1 }} defaultExpanded={false}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                Insurance Policy Summary for {year}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {/* Metadata */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                {summaryObj?.generatedAt && (
                                  <Typography variant="caption" color="text.secondary">
                                    Generated: {new Date(summaryObj.generatedAt).toLocaleString()}
                                  </Typography>
                                )}
                                {summaryObj?.generatedBy && (
                                  <Typography variant="caption" color="text.secondary">
                                    By: {summaryObj.generatedBy}
                                  </Typography>
                                )}
                                <CopyToClipboardButton text={summaryText} />
                              </Box>
                              {/* Table of Contents */}
                              <SummaryTOC markdown={summaryText} onSectionOpen={id => setOpenSections(s => ({ ...s, [id]: true }))} />
                              {/* Render Markdown with collapsible sections */}
                              <EnhancedMarkdown markdown={summaryText} openSections={openSections} setOpenSections={setOpenSections} />
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <EmptyState
                    title="No Insurance Document"
                    message={`No insurance document uploaded for ${year}.`}
                    icon={SecurityIcon}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// EmptyState component
const EmptyState = ({ title, message, icon: Icon }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 3,
      textAlign: 'center'
    }}
  >
    <Icon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Helper: Extract headings for TOC
function extractHeadings(markdown) {
  const lines = markdown.split('\n');
  const headings = [];
  let headingCount = 0;
  lines.forEach((line) => {
    const match = line.match(/^(#{2,4})\s+(.*)/); // h2, h3, h4
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        id: `summary-heading-${headingCount}`
      });
      headingCount++;
    }
  });
  return headings;
}

// Helper: Get heading IDs for each heading in order
function getHeadingIds(markdown) {
  const lines = markdown.split('\n');
  let headingCount = 0;
  const ids = [];
  lines.forEach((line) => {
    const match = line.match(/^(#{2,4})\s+(.*)/);
    if (match) {
      ids.push(`summary-heading-${headingCount}`);
      headingCount++;
    }
  });
  return ids;
}

// Map keywords to icons for robust matching
const headingKeywordIcons = [
  { keyword: 'policy holder', icon: <PersonIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" /> },
  { keyword: 'coverage detail', icon: <ShieldIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" /> },
  { keyword: 'property coverage', icon: <HomeIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" /> },
  { keyword: 'important term', icon: <WarningAmberOutlinedIcon sx={{ mr: 1, color: 'warning.main' }} fontSize="small" /> },
  { keyword: 'contact information', icon: <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" /> },
  { keyword: 'risk assessment', icon: <InfoOutlinedIcon sx={{ mr: 1, color: 'info.main' }} fontSize="small" /> },
];

function normalizeHeading(text) {
  return text
    .replace(/^\d+\.?\s*/, '') // Remove leading numbers/periods
    .replace(/[^a-zA-Z0-9 ]/g, '') // Remove punctuation
    .toLowerCase()
    .trim();
}

// --- Helper Components ---

function CopyToClipboardButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={copied ? <CheckCircleOutlineIcon color="success" /> : <ContentCopyIcon />}
      onClick={handleCopy}
      sx={{ minWidth: 0, px: 1 }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

function SummaryTOC({ markdown, onSectionOpen }) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  if (headings.length === 0) return null;
  return (
    <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Table of Contents
      </Typography>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {headings.map((h, idx) => (
          <li key={h.id} style={{ marginBottom: 2, marginLeft: (h.level - 2) * 12 }}>
            <a
              href={`#summary-section-${idx}`}
              style={{ color: '#1976d2', textDecoration: 'none', cursor: 'pointer' }}
              onClick={e => {
                e.preventDefault();
                const el = document.getElementById(`summary-section-${idx}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (onSectionOpen) onSectionOpen(`summary-section-${idx}`);
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </Box>
  );
}

function splitMarkdownSectionsRaw(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let current = [];
  let currentLevel = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{2,4})\s+(.*)/);
    if (match) {
      if (current.length > 0) sections.push({ level: currentLevel, content: current.join('\n') });
      current = [line];
      currentLevel = match[1].length;
    } else if (current.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push({ level: currentLevel, content: current.join('\n') });
  return sections;
}

function EnhancedMarkdown({ markdown, openSections, setOpenSections }) {
  const sections = useMemo(() => splitMarkdownSectionsRaw(markdown), [markdown]);
  // Helper to render a section
  const renderSection = (section, idx) => {
    // Extract heading text for icon and title
    const firstLine = section.content.split('\n')[0] || '';
    const headingMatch = firstLine.match(/^(#{2,4})\s+(.*)/);
    const headingText = headingMatch ? headingMatch[2] : '';
    const id = `summary-section-${idx}`;
    const isOpen = openSections[id] ?? true;
    // Icon logic
    let icon = null;
    const norm = normalizeHeading(headingText);
    for (const { keyword, icon: ic } of headingKeywordIcons) {
      if (norm.includes(keyword)) {
        icon = ic;
        break;
      }
    }
    // Remove heading from content for collapsible area
    const contentWithoutHeading = section.content.split('\n').slice(1).join('\n');
    return (
      <Box key={id} sx={{ mt: 3, mb: 2 }} id={id}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpenSections(s => ({ ...s, [id]: !isOpen }))}>
          {icon}
          <Typography variant={section.level === 2 ? 'h6' : section.level === 3 ? 'subtitle1' : 'subtitle2'} fontWeight="bold" sx={{ flex: 1 }}>
            {headingText}
          </Typography>
          <IconButton size="small" sx={{ ml: 1 }}>
            <ExpandMoreIcon sx={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
          </IconButton>
        </Box>
        {isOpen && contentWithoutHeading.trim() && (
          <Box sx={{ pl: 2, pt: 1 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <Typography variant="body2" paragraph {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ fontWeight: 600 }} {...props} />,
                a: ({node, ...props}) => <a style={{ color: '#1976d2' }} target="_blank" rel="noopener noreferrer" {...props} />,
                blockquote: ({node, ...props}) => (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', borderLeft: '4px solid #1976d2', pl: 2, color: 'grey.700', fontStyle: 'italic', my: 2 }}>
                    <InfoOutlinedIcon sx={{ mr: 1, mt: 0.5, color: 'info.main' }} fontSize="small" />
                    <Box>{props.children}</Box>
                  </Box>
                ),
              }}
            >
              {contentWithoutHeading}
            </ReactMarkdown>
          </Box>
        )}
      </Box>
    );
  };
  return (
    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 0, border: '1px solid #eee' }}>
      {sections.map(renderSection)}
    </Box>
  );
}

export default Insurance; 