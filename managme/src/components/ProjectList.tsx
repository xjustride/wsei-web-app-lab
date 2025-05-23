import React from 'react';
import { Box, Typography, Button, Paper, Grid, IconButton, Tooltip, useTheme, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import { Project } from '@/models/Project';
import ProjectItem from './ProjectItem';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  isGuest: boolean;
}

export default function ProjectList({ projects, onEdit, onDelete, onAddNew, isGuest }: ProjectListProps) {
  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            position: 'relative',
            display: 'inline-block',
            pb: 1,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '2em',
              height: '4px',
              borderRadius: '4px',
              backgroundColor: 'primary.main',
            }
          }}
        >
          Projekty
        </Typography>
        {!isGuest && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={onAddNew}
            sx={{ 
              borderRadius: 8, 
              px: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 8px rgba(128, 0, 32, 0.3)' 
                : '0 4px 12px rgba(128, 0, 32, 0.2)',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 12px rgba(128, 0, 32, 0.4)'
                  : '0 6px 16px rgba(128, 0, 32, 0.25)',
              }
            }}
          >
            Dodaj projekt
          </Button>
        )}
      </Box>
      
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.03)' 
                : 'rgba(0,0,0,0.01)',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Brak projektów
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {isGuest 
                ? "Obecnie nie ma żadnych projektów do wyświetlenia." 
                : "Utwórz swój pierwszy projekt, aby rozpocząć zarządzanie!"}
            </Typography>
            {!isGuest && (
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={onAddNew}
                sx={{ borderRadius: 6 }}
              >
                Utwórz nowy projekt
              </Button>
            )}
          </Paper>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectItem 
                project={project} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                isGuest={isGuest} 
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
