import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
          alignItems: 'flex-start',
          padding: '12px 16px',
          transition: 'all 0.3s',
          color: 'text.secondary',
          position: 'relative',
          minHeight: '48px',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            color: 'primary.main',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        vertical: {
          minWidth: 120,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '1rem',
            alignItems: 'flex-start',
            padding: '12px 16px',
            transition: 'all 0.3s',
            color: 'text.secondary',
            position: 'relative',
            minHeight: '48px',
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              color: 'primary.main',
            },
          },
          '& .MuiTab-root.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            color: 'primary.main',
            fontWeight: 'bold',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: 'primary.main',
              borderRadius: '0 4px 4px 0',
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.16)',
            },
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
        },
      },
    },
  },
});

export default theme; 