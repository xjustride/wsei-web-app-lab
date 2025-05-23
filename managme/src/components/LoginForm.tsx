import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  InputAdornment, 
  IconButton,
  useTheme,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authService } from '../services/AuthService';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'; // To decode the Google credential
import { GoogleUserProfile } from '@/services/UserService'; // Ensure this path is correct

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<{ username: string, password: string, label: string }[]>([ // username here is for demo button functionality
    { username: 'admin@example.com', password: 'admin123', label: 'Admin' }, // Assuming demo users also use email
    { username: 'developer@example.com', password: 'dev123', label: 'Developer' },
    { username: 'viewer@example.com', password: 'view123', label: 'Viewer' } // Changed devops to viewer for consistency
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { // Changed from username
      setError('Email i hasło są wymagane');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Assuming authService.login is an alias or wrapper for authService.loginUser which expects email
      const result = await authService.loginUser(email, password); // Changed from authService.login(username, password)
      if (result) {
        onLoginSuccess();
      } else {
        setError('Nieprawidłowe dane logowania');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async (demoUser: { username: string, password: string }) => {
    setEmail(demoUser.username); // This is the email for the demo user
    setPassword(demoUser.password);
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.loginUser(demoUser.username, demoUser.password); // Using email (demoUser.username)
      if (result) {
        onLoginSuccess();
      } else {
        setError('Nieprawidłowe dane logowania dla konta demo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas logowania demo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError(null);
    console.log('Google login success:', credentialResponse);
    if (credentialResponse.credential) {
      try {
        // Decode the JWT token from Google to get user profile information
        const decodedToken: any = jwtDecode(credentialResponse.credential);
        
        const userProfile: GoogleUserProfile = {
          email: decodedToken.email,
          name: decodedToken.name,
          given_name: decodedToken.given_name,
          family_name: decodedToken.family_name,
          picture: decodedToken.picture,
          sub: decodedToken.sub,
        };

        const result = await authService.loginWithGoogle(userProfile);
        if (result) {
          onLoginSuccess();
        } else {
          setError('Logowanie przez Google nie powiodło się. Spróbuj ponownie.');
        }
      } catch (e) {
        console.error('Error decoding Google token or logging in:', e);
        setError('Błąd podczas przetwarzania danych logowania Google.');
      }
    } else {
      setError('Nie otrzymano danych uwierzytelniających od Google.');
    }
    setIsLoading(false);
  };

  const handleGoogleLoginError = () => {
    console.error('Google login failed');
    setError('Logowanie przez Google nie powiodło się. Upewnij się, że wyskakujące okienka są dozwolone i spróbuj ponownie.');
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          maxWidth: 400, 
          mx: 'auto', 
          p: { xs: 3, sm: 4 }, 
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.3)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, #272727, #1e1e1e)'
            : 'linear-gradient(to bottom, #ffffff, #f8f8f8)',
        }}
      >
        <Typography 
          variant="h5" 
          component="h1" 
          align="center" 
          gutterBottom 
          sx={{ 
            mb: 3, 
            color: 'primary.main', 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Logowanie do ManagMe
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
            variant="outlined"
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Email" // Changed from Login
            type="email" // Changed from text
            value={email} // Changed from username
            onChange={(e) => setEmail(e.target.value)} // Changed from setUsername
            variant="outlined"
            fullWidth
            required
            disabled={isLoading}
            InputProps={{
              sx: { borderRadius: 1.5 }
            }}
          />

          <TextField
            label="Hasło"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            fullWidth
            required
            disabled={isLoading}
            InputProps={{
              sx: { borderRadius: 1.5 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{ 
              mt: 2, 
              py: 1.5,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: isLoading ? 'none' : 'shimmer 2s infinite',
              },
              '@keyframes shimmer': {
                '0%': {
                  transform: 'translateX(-100%)',
                },
                '100%': {
                  transform: 'translateX(100%)',
                },
              },
            }}
            startIcon={!isLoading && <LoginIcon />}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Zaloguj się'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">LUB</Typography>
        </Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            useOneTap
            shape="pill"
            theme={theme.palette.mode === 'dark' ? "filled_black" : "outline"}
            size="large"
            width="300px" // Adjust width as needed
          />
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Konta demonstracyjne:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {demoUsers.map((demo) => (
              <Button
                key={demo.username}
                size="small"
                variant="outlined"
                onClick={() => loginWithDemo(demo)}
                disabled={isLoading}
                sx={{ 
                  borderRadius: 4,
                  px: 2,
                  color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                  borderColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                }}
              >
                {demo.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
