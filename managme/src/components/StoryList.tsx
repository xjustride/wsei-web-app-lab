import React from 'react';
import { 
  Box, Typography, Button, Paper, Grid, Chip, IconButton, Tooltip, useTheme, Avatar 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';
import { Story, Priority } from '@/models/Story';

interface StoryListProps {
  stories: Story[];
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  users: { [id: string]: string };
  isGuest: boolean; // Add isGuest prop
}

export default function StoryList({ stories, onEdit, onDelete, onAddNew, users, isGuest }: StoryListProps) {
  const theme = useTheme();

  if (!stories || stories.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Brak historyjek do wyświetlenia
        </Typography>
        {!isGuest && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={onAddNew}
            sx={{ borderRadius: 8, px: 3 }}
          >
            Dodaj pierwszą historyjkę
          </Button>
        )}
      </Box>
    );
  }

  const priorityColors: { [key in Priority]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' } = {
    low: 'success',
    medium: 'info',
    high: 'primary',
    critical: 'error',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ fontWeight: 600 }}
        >
          Historyjki użytkownika
        </Typography>
        {!isGuest && ( // Conditionally render Add button
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={onAddNew}
            sx={{ borderRadius: 8, px: 3 }}
          >
            Dodaj historyjkę
          </Button>
        )}
      </Box>

      {stories.length === 0 ? (
        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Brak historyjek w tej kategorii. Dodaj nową historyjkę lub zmień filtry.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {stories.map(story => (
            <Grid item xs={12} sm={6} md={4} key={story.id}>
              <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
                  {story.title}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 24, height: 24 }}>
                    <AssignmentIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {story.description}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={story.priority} 
                    color={priorityColors[story.priority] as any}
                    size="small"
                    sx={{ borderRadius: 4 }}
                  />
                  {!isGuest && ( // Conditionally render action buttons
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edytuj">
                        <IconButton onClick={() => onEdit(story)} size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Usuń">
                        <IconButton onClick={() => onDelete(story.id)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
                {story.assigneeId && users[story.assigneeId] && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Przypisana do: {users[story.assigneeId]}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
