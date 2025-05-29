import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Chip, Divider, Button, 
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent, CircularProgress, Alert, ButtonGroup, useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { User, UserRole } from '@/models/User';
import { Priority } from '@/models/Story';
import { Story } from '@/models/Story';
import { userService } from '@/services/UserService';
import { storyService } from '@/services/StoryService';
import { taskService } from '@/services/TaskService';

interface TaskDetailsProps {
  task: Task;
  onBack: () => void;
  onUpdate: (updatedTask: Task) => void;
  isGuest?: boolean;
}

export default function TaskDetails({ task, onBack, onUpdate, isGuest = false }: TaskDetailsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(task.assignedTo || '');
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUsers();
    loadStory();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const regularUsers = allUsers.filter(user => user.role !== UserRole.GUEST);
      setUsers(regularUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Nie udało się załadować użytkowników');
    }
  };

  const loadStory = async () => {
    try {
      const storyData = await storyService.getStoryById(task.story);
      setStory(storyData || null);
    } catch (error) {
      console.error('Error loading story:', error);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Nie ustawiono';
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAssigneeChange = (event: SelectChangeEvent) => {
    setSelectedAssigneeId(event.target.value);
  };

  const handleAssignTask = async () => {
    if (!selectedAssigneeId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const updatedTask = await taskService.updateTask(task.id, { 
        assignedTo: selectedAssigneeId 
      });
      
      if (updatedTask) {
        onUpdate(updatedTask);
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Nie udało się przypisać zadania');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setLoading(true);
    setError('');
    
    try {
      const updatedTask = await taskService.changeTaskStatus(task.id, newStatus);
      
      if (updatedTask) {
        onUpdate(updatedTask);
      }
    } catch (error) {
      console.error('Error changing task status:', error);
      setError('Nie udało się zmienić statusu zadania');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors: Record<Priority, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    [Priority.LOW]: 'info',
    [Priority.MEDIUM]: 'default',
    [Priority.HIGH]: 'warning',
    [Priority.CRITICAL]: 'error'
  };

  const statusColors: Record<TaskStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    [TaskStatus.TODO]: 'default',
    [TaskStatus.DOING]: 'warning',
    [TaskStatus.DONE]: 'success'
  };

  const canStartTask = () => {
    return task.state === TaskStatus.TODO && (task.assignedTo || selectedAssigneeId);
  };

  const canCompleteTask = () => {
    return task.state === TaskStatus.DOING;
  };

  const canResetTask = () => {
    return task.state === TaskStatus.DONE;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Powrót do listy zadań
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight="600">
            {task.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              icon={<PriorityHighIcon />}
              label={task.priority}
              color={priorityColors[task.priority]}
              sx={{ borderRadius: 6 }}
            />
            <Chip
              label={task.state}
              color={statusColors[task.state]}
              sx={{ borderRadius: 6 }}
            />
            {story && (
              <Chip
                icon={<AssignmentIcon />}
                label={`Historyjka: ${story.name}`}
                variant="outlined"
                sx={{ borderRadius: 6 }}
              />
            )}
          </Box>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body1" color="text.secondary">
              {task.description}
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informacje o zadaniu
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Szacowany czas: {task.estimatedTime} godz.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon 
                  fontSize="small" 
                  color={task.startDate ? 'warning' : 'disabled'} 
                  sx={{ mr: 1 }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ color: task.startDate ? 'text.primary' : 'text.disabled' }}
                >
                  Data rozpoczęcia: {formatDate(task.startDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon 
                  fontSize="small" 
                  color={task.endDate ? 'success' : 'disabled'} 
                  sx={{ mr: 1 }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ color: task.endDate ? 'text.primary' : 'text.disabled' }}
                >
                  Data zakończenia: {formatDate(task.endDate)}
                </Typography>
              </Box>
            </Grid>

            {!isGuest && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Zarządzanie zadaniem
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Przypisany użytkownik</InputLabel>
                  <Select
                    value={selectedAssigneeId}
                    onChange={handleAssigneeChange}
                    label="Przypisany użytkownik"
                    disabled={task.state === TaskStatus.DONE}
                  >
                    <MenuItem value="">
                      <em>Nie przypisane</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedAssigneeId !== task.assignedTo && (
                  <Button
                    variant="contained"
                    onClick={handleAssignTask}
                    disabled={loading || task.state === TaskStatus.DONE}
                    sx={{ mb: 2, mr: 1 }}
                  >
                    {loading ? 'Przypisywanie...' : 'Przypisz użytkownika'}
                  </Button>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Akcje
                </Typography>

                <ButtonGroup orientation="vertical" fullWidth>
                  {canStartTask() && (
                    <Button
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleStatusChange(TaskStatus.DOING)}
                      variant={task.assignedTo ? "outlined" : "contained"}
                      disabled={loading}
                    >
                      Rozpocznij zadanie
                    </Button>
                  )}

                  {canCompleteTask() && (
                    <Button
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleStatusChange(TaskStatus.DONE)}
                      color="success"
                      variant="contained"
                      disabled={loading}
                    >
                      Zakończ zadanie
                    </Button>
                  )}

                  {canResetTask() && (
                    <Button
                      startIcon={<ReplayIcon />}
                      onClick={() => handleStatusChange(TaskStatus.TODO)}
                      color="warning"
                      variant="outlined"
                      disabled={loading}
                    >
                      Wznów zadanie
                    </Button>
                  )}
                </ButtonGroup>
              </Grid>
            )}
          </Grid>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Paper>
      </Box>
    </motion.div>
  );
}
