import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { motion } from 'framer-motion';
import { Story, Priority, Status } from '@/models/Story';
import React from 'react';

interface StoryItemProps {
  story: Story;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  ownerName: string;
}

export default function StoryItem({ story, onEdit, onDelete, ownerName }: StoryItemProps) {
  const priorityColors = {
    [Priority.LOW]: 'success',
    [Priority.MEDIUM]: 'primary',
    [Priority.HIGH]: 'error'
  };

  const statusColors = {
    [Status.TODO]: 'secondary',
    [Status.DOING]: 'warning',
    [Status.DONE]: 'success'
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
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid',
        borderColor: story.status === Status.DONE ? 'success.main' : 
                    story.status === Status.DOING ? 'warning.main' : 'secondary.main'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AssignmentIcon color="primary" />
            <Typography variant="h6" component="div" sx={{ color: 'secondary.dark', fontWeight: 500 }}>
              {story.name}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip 
              icon={<PriorityHighIcon />}
              label={`Priorytet: ${story.priority}`} 
              size="small" 
              color={priorityColors[story.priority] as any}
              variant="outlined"
              sx={{ borderWidth: 1.5 }}
            />
            <Chip 
              label={`Status: ${story.status}`} 
              size="small" 
              color={statusColors[story.status] as any}
              sx={{ fontWeight: 500 }}
            />
            <Chip 
              icon={<PersonIcon />}
              label={`Właściciel: ${ownerName}`} 
              size="small" 
              variant="outlined"
              color="secondary"
            />
          </Stack>

          <Typography variant="body1" color="text.secondary">
            {story.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              startIcon={<EditIcon />} 
              onClick={() => onEdit(story)}
              variant="outlined"
              color="secondary"
            >
              Edytuj
            </Button>
            <Button 
              size="small" 
              startIcon={<DeleteIcon />} 
              onClick={() => onDelete(story.id)}
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
