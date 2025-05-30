import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { User } from '@/models/User';
import { userService } from '@/services/UserService';
import { authService } from '@/services/AuthService';
import React from 'react';

interface UserInfoProps {
  onLogout: () => void;
}

export default function UserInfo({ onLogout }: UserInfoProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const authUser = authService.getCurrentUser();
      if (authUser) {
        setCurrentUser(authUser);
      } else {
        setCurrentUser(userService.getCurrentUser());
      }
    };
    
    loadData();
  }, []);

  if (!currentUser) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: 'primary.main' }}>
        <PersonIcon />
      </Avatar>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
          {currentUser.firstName} {currentUser.lastName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Rola: {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
        </Typography>
      </Box>
      <Button
        onClick={onLogout}
        startIcon={<LogoutIcon />}
        variant="outlined"
        size="small"
        sx={{ 
          color: 'white', 
          borderColor: 'rgba(255,255,255,0.5)',
          '&:hover': { 
            borderColor: 'white',
            bgcolor: 'rgba(255,255,255,0.1)' 
          }
        }}
      >
        Wyloguj
      </Button>
    </Box>
  );
}
