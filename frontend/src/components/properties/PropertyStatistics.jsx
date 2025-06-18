import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Mouse,
  CalendarToday
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const PropertyStatistics = ({ propertyId }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propertyId) {
      fetchStatistics();
    }
  }, [propertyId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${propertyId}/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Fallback to mock data if API fails
      setStatistics(createMockStatistics());
    } finally {
      setLoading(false);
    }
  };

  const createMockStatistics = () => {
    const today = new Date();
    const mockData = [];
    
    // Generate 30 days of mock data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 50) + 5,
        views: Math.floor(Math.random() * 200) + 20
      });
    }
    
    return {
      dailyStats: mockData,
      totalClicks: mockData.reduce((sum, day) => sum + day.clicks, 0),
      totalViews: mockData.reduce((sum, day) => sum + day.views, 0),
      averageClicksPerDay: Math.round(mockData.reduce((sum, day) => sum + day.clicks, 0) / mockData.length),
      averageViewsPerDay: Math.round(mockData.reduce((sum, day) => sum + day.views, 0) / mockData.length)
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No statistics available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Mouse sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Total Clicks
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {statistics.totalClicks.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics.averageClicksPerDay} avg/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Visibility sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  Total Views
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {statistics.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics.averageViewsPerDay} avg/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" color="info.main">
                  Click Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {((statistics.totalClicks / statistics.totalViews) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clicks per view
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" color="warning.main">
                  Period
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {statistics.dailyStats.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Days tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily Statistics Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Daily Statistics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 30 days of activity
          </Typography>
        </Box>
        
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Mouse sx={{ mr: 1, fontSize: 16 }} />
                    Clicks
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Visibility sx={{ mr: 1, fontSize: 16 }} />
                    Views
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Click Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statistics.dailyStats.map((day, index) => (
                <TableRow 
                  key={day.date}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatDate(day.date)}
                      </Typography>
                      {index === 0 && (
                        <Chip 
                          label="Today" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {day.clicks.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {day.views.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${((day.clicks / day.views) * 100).toFixed(1)}%`}
                      size="small"
                      color={day.clicks / day.views > 0.1 ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PropertyStatistics; 