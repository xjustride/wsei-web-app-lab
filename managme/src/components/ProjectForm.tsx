import { useState, useEffect } from 'react';
import { TextField, Button, Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Project, ProjectInput } from '@/models/Project';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (project: ProjectInput) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{name?: string, description?: string}>({});

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setFormErrors({});
  }, [project]);

  const validateForm = (): boolean => {
    const errors: {name?: string, description?: string} = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Nazwa projektu jest wymagana';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Opis jest wymagany';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({ 
        nazwa: name.trim(),
        name: name.trim(), 
        description: description.trim() 
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {project ? 'Edytuj projekt' : 'Utwórz nowy projekt'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nazwa projektu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          <TextField
            label="Opis"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required
            error={!!formErrors.description}
            helperText={formErrors.description}
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={onCancel} type="button">
              Anuluj
            </Button>
            <Button variant="contained" type="submit" color="primary">
              {project ? 'Aktualizuj' : 'Utwórz'} projekt
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
