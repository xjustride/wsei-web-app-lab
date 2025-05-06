import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip, Menu, MenuItem, Divider, Button } from '@mui/material';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const authUser = authService.getCurrentUser();
    if (authUser) {
      setCurrentUser(authUser);
    } else {
      setCurrentUser(userService.getCurrentUser());
    }
    
    setUsers(userService.getAllUsers());
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectUser = (user: User) => {
    userService.setCurrentUser(user);
    setCurrentUser(user);
    handleClose();
  };
  
  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ bgcolor: 'primary.main' }}>
        <PersonIcon />
      </Avatar>
      <Chip
        label={`${currentUser.firstName} ${currentUser.lastName}`}
        onClick={handleClick}
        variant="outlined"
        sx={{ 
          cursor: 'pointer', 
          color: 'white', 
          borderColor: 'rgba(255,255,255,0.5)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'user-button' }}
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'primary.main' }}>
          Zmień użytkownika
        </Typography>
        {users.map((user) => (
          <MenuItem 
            key={user.id} 
            onClick={() => handleSelectUser(user)}
            selected={user.id === currentUser.id}
            sx={{ 
              '&.Mui-selected': { 
                backgroundColor: 'primary.light', 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.main'
                }
              }
            }}
          >
            {user.firstName} {user.lastName}
          </MenuItem>
        ))}
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Wyloguj się
        </MenuItem>
      </Menu>
    </Box>
  );
}
