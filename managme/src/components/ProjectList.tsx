import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '@/models/Project';
import ProjectItem from '../components/ProjectItem';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export default function ProjectList({ projects, onEdit, onDelete, onAddNew }: ProjectListProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projekty
        </Typography>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={onAddNew}
          >
            Dodaj nowy projekt
          </Button>
        </motion.div>
      </Box>

      <AnimatePresence>
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Alert severity="info" sx={{ mb: 2 }}>
              Brak dostępnych projektów. Utwórz swój pierwszy projekt klikając przycisk "Dodaj nowy projekt".
            </Alert>
          </motion.div>
        ) : (
          projects.map(project => (
            <ProjectItem 
              key={project.id} 
              project={project} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))
        )}
      </AnimatePresence>
    </Box>
  );
}
