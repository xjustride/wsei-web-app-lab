import { useState } from 'react';
import { 
  Box, Typography, Button, Alert, Tabs, Tab, 
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { motion, AnimatePresence } from 'framer-motion';
import { Story, Status } from '@/models/Story';
import StoryItem from './StoryItem';
import React from 'react';

interface StoryListProps {
  stories: Story[];
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  users: { [id: string]: string };
}

export default function StoryList({ stories, onEdit, onDelete, onAddNew, users }: StoryListProps) {
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
  };

  // Filtrowanie historyjek
  const filteredStories = stories.filter(story => {
    // Filtrowanie po zakładkach (status)
    if (tabValue === 0 && story.status !== Status.TODO) return false;
    if (tabValue === 1 && story.status !== Status.DOING) return false;
    if (tabValue === 2 && story.status !== Status.DONE) return false;
    if (tabValue === 3) { /* wszystkie - brak filtrowania */ }
    
    // Filtrowanie po właścicielu
    if (filter !== 'all' && story.ownerId !== filter) return false;
    
    return true;
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Historyjki
        </Typography>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={onAddNew}
          >
            Dodaj nową historyjkę
          </Button>
        </motion.div>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          aria-label="story status tabs"
        >
          <Tab label={`Do zrobienia`} />
          <Tab label={`W realizacji`} />
          <Tab label={`Ukończone`} />
          <Tab label="Wszystkie" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-label">Filtruj po właścicielu</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            label="Filtruj po właścicielu"
            onChange={handleFilterChange}
            size="small"
          >
            <MenuItem value="all">Wszyscy</MenuItem>
            {Object.entries(users).map(([id, name]) => (
              <MenuItem key={id} value={id}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <AnimatePresence>
        {filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Alert severity="info" sx={{ mb: 2 }}>
              Brak historyjek w tej kategorii. Dodaj nową historyjkę lub zmień filtry.
            </Alert>
          </motion.div>
        ) : (
          filteredStories.map(story => (
            <StoryItem 
              key={story.id} 
              story={story} 
              onEdit={onEdit} 
              onDelete={onDelete}
              ownerName={users[story.ownerId] || 'Nieznany'}
            />
          ))
        )}
      </AnimatePresence>
    </Box>
  );
}
