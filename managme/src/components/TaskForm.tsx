import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Box, Paper, Typography, 
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent 
} from '@mui/material';
import { motion } from 'framer-motion';
import { Story } from '@/models/Story';
import { Priority } from '@/models/Story';
import { Task, TaskInput } from '@/models/Task';
import { storyService } from '@/services/StoryService';

interface TaskFormProps {
  task?: Task;
  onSubmit: (taskInput: TaskInput) => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [storyId, setStoryId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [loggedHours, setLoggedHours] = useState<number | undefined>(undefined);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const activeProjectStories = storyService.getActiveProjectStories();
    setStories(activeProjectStories);
    
    if (task) {
      setName(task.name);
      setDescription(task.description);
      setPriority(task.priority);
      setStoryId(task.storyId);
      setEstimatedHours(task.estimatedHours);
      setLoggedHours(task.loggedHours);
    } else {
      setName('');
      setDescription('');
      setPriority(Priority.MEDIUM);
      setStoryId(activeProjectStories.length > 0 ? activeProjectStories[0].id : '');
      setEstimatedHours(1);
      setLoggedHours(undefined);
    }
    
    setFormErrors({});
  }, [task]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Nazwa zadania jest wymagana';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Opis jest wymagany';
      isValid = false;
    }

    if (!storyId) {
      errors.storyId = 'Historyjka jest wymagana';
      isValid = false;
    }

    if (estimatedHours <= 0) {
      errors.estimatedHours = 'Szacowany czas musi być większy od 0';
      isValid = false;
    }

    if (loggedHours !== undefined && loggedHours < 0) {
      errors.loggedHours = 'Zalogowany czas nie może być ujemny';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({ 
        name: name.trim(), 
        description: description.trim(),
        priority,
        storyId,
        estimatedHours,
        loggedHours
      });
    }
  };

  const handlePriorityChange = (event: SelectChangeEvent) => {
    setPriority(event.target.value as Priority);
  };

  const handleStoryChange = (event: SelectChangeEvent) => {
    setStoryId(event.target.value);
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
          {task ? 'Edytuj zadanie' : 'Utwórz nowe zadanie'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nazwa zadania"
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
            rows={3}
            required
            error={!!formErrors.description}
            helperText={formErrors.description}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priorytet</InputLabel>
              <Select
                labelId="priority-label"
                value={priority}
                label="Priorytet"
                onChange={handlePriorityChange}
              >
                <MenuItem value={Priority.LOW}>{Priority.LOW}</MenuItem>
                <MenuItem value={Priority.MEDIUM}>{Priority.MEDIUM}</MenuItem>
                <MenuItem value={Priority.HIGH}>{Priority.HIGH}</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth error={!!formErrors.storyId}>
              <InputLabel id="story-label">Historyjka</InputLabel>
              <Select
                labelId="story-label"
                value={storyId}
                label="Historyjka"
                onChange={handleStoryChange}
                required
              >
                {stories.map(story => (
                  <MenuItem key={story.id} value={story.id}>
                    {story.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.storyId && (
                <Typography variant="caption" color="error">
                  {formErrors.storyId}
                </Typography>
              )}
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Szacowany czas (h)"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              fullWidth
              required
              InputProps={{ inputProps: { min: 1 } }}
              error={!!formErrors.estimatedHours}
              helperText={formErrors.estimatedHours}
            />
            
            {task && (
              <TextField
                label="Zalogowany czas (h)"
                type="number"
                value={loggedHours === undefined ? '' : loggedHours}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  setLoggedHours(value);
                }}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                error={!!formErrors.loggedHours}
                helperText={formErrors.loggedHours}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={onCancel} type="button">
              Anuluj
            </Button>
            <Button variant="contained" type="submit" color="primary">
              {task ? 'Aktualizuj' : 'Utwórz'} zadanie
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
