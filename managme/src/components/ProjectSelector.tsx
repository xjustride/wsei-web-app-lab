import React from 'react';
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, List, ListItem, ListItemButton, ListItemText, 
  ListItemIcon, Typography, Alert
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { motion } from 'framer-motion';
import type { Project } from '@/models/Project';
import { storageService } from '@/services/StorageService';
import { activeProjectService } from '@/services/ActiveProjectService';

interface ProjectSelectorProps {
  open: boolean;
  onClose: () => void;
  onProjectSelected: (project: Project) => void;
}

export default function ProjectSelector({ open, onClose, onProjectSelected }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(storageService.getProjects());
    
    // Ustaw aktualnie wybrany projekt
    const activeProject = activeProjectService.getActiveProject();
    if (activeProject) {
      setSelectedId(activeProject.id);
    }
  }, [open]);

  const handleSelect = () => {
    const selectedProject = projects.find(p => p.id === selectedId);
    if (selectedProject) {
      onProjectSelected(selectedProject);
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Wybierz projekt</DialogTitle>
      <DialogContent>
        {projects.length === 0 ? (
          <Alert severity="warning">
            Brak dostępnych projektów. Najpierw utwórz projekt.
          </Alert>
        ) : (
          <List>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedId === project.id}
                    onClick={() => setSelectedId(project.id)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <FolderIcon color={selectedId === project.id ? "primary" : "action"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={project.name}
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {project.description}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button 
          onClick={handleSelect} 
          variant="contained" 
          disabled={!selectedId || projects.length === 0}
        >
          Wybierz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
