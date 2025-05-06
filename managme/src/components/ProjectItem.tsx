import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import type { Project } from '@/models/Project';

interface ProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function ProjectItem({ project, onEdit, onDelete }: ProjectItemProps) {
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
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid',
        borderColor: 'primary.main'
      }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 500 }}>
            {project.name}
          </Typography>
          <Chip 
            label={`ID: ${project.id.slice(0, 8)}...`} 
            size="small" 
            sx={{ mb: 2, bgcolor: 'secondary.light', color: 'white' }} 
          />
          <Typography variant="body1" color="text.secondary">
            {project.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              startIcon={<EditIcon />} 
              onClick={() => onEdit(project)}
              variant="outlined"
              color="secondary"
            >
              Edytuj
            </Button>
            <Button 
              size="small" 
              startIcon={<DeleteIcon />} 
              onClick={() => onDelete(project.id)}
              color="error"
              variant="outlined"
            >
              Usuń
            </Button>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
}
