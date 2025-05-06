import { useEffect, useState } from 'react';
import React from 'react';
import { Paper, Typography, Box, Button, Chip } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { motion } from 'framer-motion';
import type { Project } from '@/models/Project';
import { activeProjectService } from '@/services/ActiveProjectService';

interface ActiveProjectBannerProps {
  onSelectProject: () => void;
  activeProject: Project | null;
}

export default function ActiveProjectBanner({ onSelectProject, activeProject }: ActiveProjectBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: activeProject ? 'primary.dark' : 'warning.dark' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FolderOpenIcon fontSize="large" sx={{ color: 'white' }} />
            <Box>
              {activeProject ? (
                <>
                  <Typography variant="subtitle2" sx={{ color: 'white', opacity: 0.9 }}>
                    Aktywny projekt:
                  </Typography>
                  <Typography variant="h6" component="h2" sx={{ color: 'white' }} fontWeight="bold">
                    {activeProject.name}
                  </Typography>
                </>
              ) : (
                <Typography variant="subtitle1" sx={{ color: 'white' }}>
                  Brak aktywnego projektu
                </Typography>
              )}
            </Box>
          </Box>
          <Button 
            variant="contained" 
            color={activeProject ? "secondary" : "warning"}
            onClick={onSelectProject}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {activeProject ? "Zmień projekt" : "Wybierz projekt"}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
