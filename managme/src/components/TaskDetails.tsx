import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Chip, Divider, Button, 
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent, CircularProgress, Alert, ButtonGroup
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { User, UserRole } from '@/models/User';
import { Priority } from '@/models/Story';
import { userService } from '@/services/UserService';
import { storyService } from '@/services/StoryService';
import { taskService } from '@/services/TaskService';

interface TaskDetailsProps {
  task: Task;
  onBack: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskDetails({ task, onBack, onUpdate }: TaskDetailsProps) {
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(task.assigneeId || '');
  const [loggedHours, setLoggedHours] = useState<number>(task.loggedHours || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);
  const [completeMode, setCompleteMode] = useState(false);

  useEffect(() => {
    setAssignableUsers(userService.getAssignableUsers());
    setSelectedAssigneeId(task.assigneeId || '');
    setLoggedHours(task.loggedHours || 0);
  }, [task]);

  const story = storyService.getStoryById(task.storyId);
  const assignee = task.assigneeId 
    ? userService.getAllUsers().find(user => user.id === task.assigneeId)
    : null;

  const priorityColors = {
    [Priority.LOW]: 'success',
    [Priority.MEDIUM]: 'primary',
    [Priority.HIGH]: 'error'
  };

  const statusColors = {
    [TaskStatus.TODO]: 'secondary',
    [TaskStatus.DOING]: 'warning',
    [TaskStatus.DONE]: 'success'
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Nie określono';
    return new Date(date).toLocaleString('pl-PL');
  };

  const handleAssigneeChange = (event: SelectChangeEvent) => {
    setSelectedAssigneeId(event.target.value);
  };

  const handleLoggedHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoggedHours(Number(event.target.value));
  };

  const handleAssignTask = async () => {
    if (!selectedAssigneeId) {
      setError('Wybierz użytkownika, aby przypisać zadanie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedTask = taskService.assignTask(task.id, selectedAssigneeId);
      if (updatedTask) {
        onUpdate(updatedTask);
        setAssignMode(false);
      } else {
        setError('Wystąpił błąd podczas przypisywania zadania');
      }
    } catch (error) {
      setError('Wystąpił błąd: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedTask = taskService.completeTask(task.id, loggedHours);
      if (updatedTask) {
        onUpdate(updatedTask);
        setCompleteMode(false);
      } else {
        setError('Wystąpił błąd podczas zamykania zadania');
      }
    } catch (error) {
      setError('Wystąpił błąd: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setLoading(true);
    setError(null);

    try {
      // For DOING, ensure there's an assignee
      if (newStatus === TaskStatus.DOING && !task.assigneeId) {
        setAssignMode(true);
        setLoading(false);
        return;
      }

      // For DONE, use the dedicated complete flow with logged hours
      if (newStatus === TaskStatus.DONE) {
        setCompleteMode(true);
        setLoading(false);
        return;
      }

      const updatedTask = taskService.updateTask(task.id, { status: newStatus });
      if (updatedTask) {
        onUpdate(updatedTask);
      } else {
        setError('Wystąpił błąd podczas zmiany statusu zadania');
      }
    } catch (error) {
      setError('Wystąpił błąd: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    } finally {
      setLoading(false);
    }
  };

  const assignPanel = (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', borderLeft: '4px solid', borderColor: 'primary.main' }}>
      <Typography variant="h6" gutterBottom>
        Przypisz zadanie
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="assignee-label">Użytkownik</InputLabel>
          <Select
            labelId="assignee-label"
            value={selectedAssigneeId}
            label="Użytkownik"
            onChange={handleAssigneeChange}
          >
            {assignableUsers.map(user => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {error && <Alert severity="error">{error}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button variant="outlined" onClick={() => setAssignMode(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAssignTask}
            disabled={loading || !selectedAssigneeId}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Przypisywanie...' : (task.status === TaskStatus.TODO ? 'Przypisz i rozpocznij' : 'Przypisz zadanie')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  const completePanel = (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', borderLeft: '4px solid', borderColor: 'success.main' }}>
      <Typography variant="h6" gutterBottom>
        Zakończ zadanie
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Zalogowane godziny"
          type="number"
          value={loggedHours}
          onChange={handleLoggedHoursChange}
          fullWidth
          InputProps={{ inputProps: { min: 0 } }}
        />
        
        {error && <Alert severity="error">{error}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button variant="outlined" onClick={() => setCompleteMode(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleCompleteTask}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? 'Zamykanie...' : 'Zakończ zadanie'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  const renderStatusButtons = () => {
    if (task.status === TaskStatus.TODO) {
      return (
        <Button 
          variant="contained" 
          color="warning"
          onClick={() => handleStatusChange(TaskStatus.DOING)}
          startIcon={<PlayArrowIcon />}
        >
          {task.assigneeId ? 'Rozpocznij zadanie' : 'Przypisz i rozpocznij zadanie'}
        </Button>
      );
    }
    
    if (task.status === TaskStatus.DOING) {
      return (
        <ButtonGroup>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => handleStatusChange(TaskStatus.TODO)}
            startIcon={<ReplayIcon />}
          >
            Przywróć do "Do zrobienia"
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => handleStatusChange(TaskStatus.DONE)}
            startIcon={<CheckCircleIcon />}
          >
            Zakończ zadanie
          </Button>
        </ButtonGroup>
      );
    }
    
    if (task.status === TaskStatus.DONE) {
      return (
        <Button 
          variant="outlined" 
          color="warning"
          onClick={() => handleStatusChange(TaskStatus.DOING)}
          startIcon={<ReplayIcon />}
        >
          Przywróć do "W trakcie"
        </Button>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          Szczegóły zadania
        </Typography>
        <Button variant="outlined" onClick={onBack}>
          Powrót
        </Button>
      </Box>

      {assignMode ? assignPanel : completeMode ? completePanel : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {task.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              icon={<PriorityHighIcon />}
              label={task.priority} 
              color={priorityColors[task.priority] as any}
            />
            <Chip 
              label={task.status} 
              color={statusColors[task.status] as any}
            />
            {story && (
              <Chip 
                icon={<AssignmentIcon />}
                label={`Historyjka: ${story.name}`} 
                variant="outlined"
              />
            )}
          </Box>
          
          <Typography variant="body1" paragraph>
            {task.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Szacowany czas
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize="small" />
                  {task.estimatedHours} godz.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Zalogowany czas
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize="small" />
                  {task.loggedHours || 0} godz.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data utworzenia
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  {formatDate(task.createdAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data rozpoczęcia
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  {formatDate(task.startedAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data zakończenia
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  {formatDate(task.completedAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Przypisany użytkownik
                </Typography>
                <Typography variant="body1">
                  {assignee ? (
                    <Chip 
                      label={`${assignee.firstName} ${assignee.lastName} (${assignee.role})`} 
                      color="primary"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nie przypisano
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button 
              variant={task.assigneeId ? "outlined" : "contained"} 
              color="primary"
              onClick={() => setAssignMode(true)}
              disabled={task.status === TaskStatus.DONE}
            >
              {task.assigneeId ? 'Zmień przypisanie' : 'Przypisz użytkownika'}
            </Button>
            
            <Box>
              {renderStatusButtons()}
            </Box>
          </Box>
        </Paper>
      )}
    </motion.div>
  );
}
