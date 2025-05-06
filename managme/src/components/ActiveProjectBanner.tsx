import React from 'react';
import { Paper, Typography, Box, Button, useTheme } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { motion } from 'framer-motion';
import type { Project } from '@/models/Project';

interface ActiveProjectBannerProps {
  onSelectProject: () => void;
  activeProject: Project | null;
}

export default function ActiveProjectBanner({ onSelectProject, activeProject }: ActiveProjectBannerProps) {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          mb: 3, 
          borderRadius: 2,
          background: activeProject 
            ? `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
            : `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          boxShadow: activeProject
            ? '0 6px 16px rgba(128, 0, 32, 0.2)'
            : '0 6px 16px rgba(245, 124, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundPosition: 'center',
            zIndex: 0,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <FolderOpenIcon fontSize="large" sx={{ color: 'white' }} />
            </Box>
            <Box>
              {activeProject ? (
                <>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem' }}>
                    Aktywny projekt:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0px 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    {activeProject.name}
                  </Typography>
                </>
              ) : (
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0px 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Brak aktywnego projektu
                </Typography>
              )}
            </Box>
          </Box>
          <Button 
            variant="contained" 
            onClick={onSelectProject}
            endIcon={<ArrowDropDownIcon />}
            sx={{ 
              whiteSpace: 'nowrap',
              bgcolor: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.35)',
              },
              px: 2,
              py: 1,
              backdropFilter: 'blur(4px)',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              borderRadius: 5,
            }}
          >
            {activeProject ? "Zmień projekt" : "Wybierz projekt"}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
