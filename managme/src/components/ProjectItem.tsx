import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, CardActionArea, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion } from 'framer-motion';
import type { Project } from '@/models/Project';

interface ProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  isGuest?: boolean;
}

export default function ProjectItem({ project, onEdit, onDelete, isGuest = false }: ProjectItemProps) {
  const theme = useTheme();
  
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pl-PL');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      layout
      whileHover={{ scale: 1.01 }}
    >
      <Card sx={{ 
        mb: 2, 
        borderRadius: 2, 
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 3px 10px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
            : '0 8px 25px rgba(0, 0, 0, 0.12)',
        },
      }}>
        <Box 
          sx={{ 
            position: 'absolute',
            top: 16,
            left: -8,
            width: 16,
            height: 36,
            bgcolor: 'primary.main',
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 8,
              height: 8,
              bgcolor: theme.palette.mode === 'dark' ? '#450013' : '#5d0018',
              borderTopLeftRadius: 4,
            }
          }}
        />
        <CardContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                mr: 2,
                boxShadow: '0 2px 8px rgba(128, 0, 32, 0.25)'
              }}
            >
              <FolderIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                {project.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                {project.id && (
                  <Chip 
                    label={`ID: ${project.id.slice(0, 6)}...`} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }} 
                  />
                )}
                {project.createdAt && (
                  <Chip 
                    icon={<CalendarTodayIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label={formatDate(project.createdAt)} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }} 
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            pl: 7,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {project.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ 
          justifyContent: 'flex-end', 
          p: 2, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          {!isGuest && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                startIcon={<EditIcon />} 
                onClick={() => onEdit(project)}
                variant="outlined"
                color="primary"
                sx={{ borderRadius: 6 }}
              >
                Edytuj
              </Button>
              <Button 
                size="small" 
                startIcon={<DeleteIcon />} 
                onClick={() => onDelete(project.id)}
                color="error"
                variant="outlined"
                sx={{ borderRadius: 6 }}
              >
                Usuń
              </Button>
            </Box>
          )}
        </CardActions>
      </Card>
    </motion.div>
  );
}
