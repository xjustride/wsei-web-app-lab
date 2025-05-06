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
import { userService } from '@/services/UserService';
import { storyService } from '@/services/StoryService';
import { taskService } from '@/services/TaskService';

interface TaskDetailsProps {
  task: Task;
  onBack: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskDetails({ task, onBack, onUpdate }: TaskDetailsProps) {
  const theme = useTheme();
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
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        bgcolor: 'background.paper', 
        borderLeft: '4px solid', 
        borderColor: 'primary.main',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="500">
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
            sx={{ borderRadius: 1.5 }}
          >
            {assignableUsers.map(user => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {error && <Alert severity="error" variant="outlined">{error}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button 
            variant="outlined" 
            onClick={() => setAssignMode(false)} 
            disabled={loading}
            sx={{ borderRadius: 6 }}
          >
            Anuluj
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAssignTask}
            disabled={loading || !selectedAssigneeId}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
            sx={{ borderRadius: 6 }}
          >
            {loading ? 'Przypisywanie...' : (task.status === TaskStatus.TODO ? 'Przypisz i rozpocznij' : 'Przypisz zadanie')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  const completePanel = (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        bgcolor: 'background.paper', 
        borderLeft: '4px solid', 
        borderColor: 'success.main',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="500">
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
        />
        
        {error && <Alert severity="error" variant="outlined">{error}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button 
            variant="outlined" 
            onClick={() => setCompleteMode(false)} 
            disabled={loading}
            sx={{ borderRadius: 6 }}
          >
            Anuluj
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleCompleteTask}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{ borderRadius: 6 }}
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
          sx={{ borderRadius: 6 }}
        >
          {task.assigneeId ? 'Rozpocznij zadanie' : 'Przypisz i rozpocznij zadanie'}
        </Button>
      );
    }
    
    if (task.status === TaskStatus.DOING) {
      return (
        <ButtonGroup variant="outlined" sx={{ '& .MuiButton-root': { borderRadius: 0 }, borderRadius: 6, overflow: 'hidden' }}>
          <Button 
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
          sx={{ borderRadius: 6 }}
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
      <Box 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box 
            sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              mr: 1
            }}
          >
            <AssignmentIcon />
          </Box>
          Szczegóły zadania
        </Typography>
        <Button 
          variant="outlined" 
          onClick={onBack} 
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 6 }}
        >
          Powrót
        </Button>
      </Box>

      {assignMode ? assignPanel : completeMode ? completePanel : (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight="600">
            {task.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              icon={<PriorityHighIcon />}
              label={task.priority} 
              color={priorityColors[task.priority] as any}
              sx={{ borderRadius: 6 }}
            />
            <Chip 
              label={task.status} 
              color={statusColors[task.status] as any}
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
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.03)' 
                : 'rgba(0,0,0,0.01)',
              borderRadius: 1.5
            }}
          >
            <Typography variant="body1" paragraph>
              {task.description}
            </Typography>
          </Paper>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500" gutterBottom>
                  Szacowany czas
                </Typography>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon color="primary" />
                  {task.estimatedHours} godz.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500" gutterBottom>
                  Zalogowany czas
                </Typography>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon color="success" />
                  {task.loggedHours || 0} godz.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                  Data utworzenia
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  {formatDate(task.createdAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                  Data rozpoczęcia
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    mt: 0.5,
                    color: task.startedAt ? 'text.primary' : 'text.disabled'
                  }}
                >
                  <CalendarTodayIcon fontSize="small" color={task.startedAt ? 'warning' : 'disabled'} />
                  {formatDate(task.startedAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                  Data zakończenia
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    mt: 0.5,
                    color: task.completedAt ? 'text.primary' : 'text.disabled'
                  }}
                >
                  <CalendarTodayIcon fontSize="small" color={task.completedAt ? 'success' : 'disabled'} />
                  {formatDate(task.completedAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.01)',
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" fontWeight="500" gutterBottom>
                  Przypisany użytkownik
                </Typography>
                {assignee ? (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 2, 
                      mt: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(128, 0, 32, 0.1)'
                        : 'rgba(128, 0, 32, 0.05)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(128, 0, 32, 0.2)'
                        : 'rgba(128, 0, 32, 0.1)',
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(128, 0, 32, 0.25)'
                      }}
                    >
                      {assignee.firstName.charAt(0)}{assignee.lastName.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">
                        {assignee.firstName} {assignee.lastName}
                      </Typography>
                      <Chip 
                        label={assignee.role} 
                        size="small" 
                        color="primary"
                        sx={{ mt: 0.5, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.01)',
                      border: '1px dashed',
                      borderColor: theme.palette.divider,
                      textAlign: 'center',
                      mt: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Nie przypisano użytkownika do tego zadania
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button 
              variant={task.assigneeId ? "outlined" : "contained"} 
              color="primary"
              onClick={() => setAssignMode(true)}
              disabled={task.status === TaskStatus.DONE}
              sx={{ borderRadius: 6 }}
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
