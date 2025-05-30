import { useState, useEffect } from 'react';
import { 
  TextField, Button, Box, Paper, Typography, 
  FormControl, InputLabel, Select, MenuItem, 
  SelectChangeEvent 
} from '@mui/material';
import { motion } from 'framer-motion';
import { Story, StoryInput, Priority, Status } from '@/models/Story';
import { User } from '@/models/User';
import { userService } from '@/services/UserService';
import React from 'react';

interface StoryFormProps {
  story?: Story;
  onSubmit: (story: StoryInput) => void;
  onCancel: () => void;
}

export default function StoryForm({ story, onSubmit, onCancel }: StoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [status, setStatus] = useState<Status>(Status.TODO);
  const [ownerId, setOwnerId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadUsers = async () => {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    };
    loadUsers();
    
    if (!ownerId) {
      const currentUser = userService.getCurrentUser();
      if (currentUser?.id) {
        setOwnerId(currentUser.id);
      }
    }
    
    if (story) {
      setName(story.name || '');
      setDescription(story.description || '');
      setPriority(story.priority);
      setStatus(story.state || Status.TODO);
      setOwnerId(story.assignedTo || '');
    } else {
      setName('');
      setDescription('');
      setPriority(Priority.MEDIUM);
      setStatus(Status.TODO);
    }
    setFormErrors({});
  }, [story]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Nazwa historyjki jest wymagana';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Opis jest wymagany';
      isValid = false;
    }

    if (!ownerId) {
      errors.ownerId = 'Właściciel jest wymagany';
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
        opis: description.trim(),
        description: description.trim(),
        priority,
        status: status,
        state: status,
        projectId: '', // Will be set by the service
        assignedUserId: ownerId || undefined,
        assignedTo: ownerId || undefined
      });
    }
  };

  const handlePriorityChange = (event: SelectChangeEvent) => {
    setPriority(event.target.value as Priority);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as Status);
  };

  const handleOwnerChange = (event: SelectChangeEvent) => {
    setOwnerId(event.target.value);
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
          {story ? 'Edytuj historyjkę' : 'Utwórz nową historyjkę'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nazwa historyjki"
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
                <MenuItem value={Priority.CRITICAL}>{Priority.CRITICAL}</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value={Status.TODO}>{Status.TODO}</MenuItem>
                <MenuItem value={Status.DOING}>{Status.DOING}</MenuItem>
                <MenuItem value={Status.DONE}>{Status.DONE}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <FormControl fullWidth error={!!formErrors.ownerId}>
            <InputLabel id="owner-label">Właściciel</InputLabel>
            <Select
              labelId="owner-label"
              value={ownerId}
              label="Właściciel"
              onChange={handleOwnerChange}
              required
            >
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </MenuItem>
              ))}
            </Select>
            {formErrors.ownerId && (
              <Typography variant="caption" color="error">
                {formErrors.ownerId}
              </Typography>
            )}
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={onCancel} type="button">
              Anuluj
            </Button>
            <Button variant="contained" type="submit" color="primary">
              {story ? 'Aktualizuj' : 'Utwórz'} historyjkę
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
