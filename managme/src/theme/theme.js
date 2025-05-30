import { createTheme } from '@mui/material';
// Function to create a theme based on the mode (light/dark)
export const createAppTheme = (mode) => {
    return createTheme({
        palette: {
            mode,
            primary: {
                main: '#800020', // burgundy
                dark: mode === 'dark' ? '#5d0018' : '#640019',
                light: mode === 'dark' ? '#a04048' : '#9a2639',
                contrastText: '#ffffff',
            },
            secondary: {
                main: mode === 'dark' ? '#545454' : '#424242', // dark gray
                dark: mode === 'dark' ? '#2c2c2c' : '#212121',
                light: mode === 'dark' ? '#828282' : '#757575',
                contrastText: '#ffffff',
            },
            background: {
                default: mode === 'dark' ? '#121212' : '#f5f5f5',
                paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: mode === 'dark' ? '#ffffff' : '#212121',
                secondary: mode === 'dark' ? '#b0b0b0' : '#424242',
            },
            error: {
                main: mode === 'dark' ? '#f44336' : '#d32f2f',
            },
            warning: {
                main: mode === 'dark' ? '#ff9800' : '#f57c00',
                dark: mode === 'dark' ? '#e65100' : '#e65100',
            },
            success: {
                main: mode === 'dark' ? '#4caf50' : '#388e3c',
            },
            info: {
                main: mode === 'dark' ? '#29b6f6' : '#0288d1',
            },
            divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h4: {
                fontWeight: 600,
            },
            h6: {
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === 'dark'
                            ? '0 2px 10px rgba(0, 0, 0, 0.5)'
                            : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: mode === 'dark' ? '#1e1e1e' : '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: mode === 'dark' ? '#555' : '#bbb',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: mode === 'dark' ? '#777' : '#999',
                        },
                    },
                },
            },
        },
    });
};
