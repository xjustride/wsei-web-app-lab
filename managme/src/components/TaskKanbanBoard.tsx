import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, Snackbar, Alert, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { taskService } from '@/services/TaskService';
import TaskCard from './TaskCard';

interface TaskKanbanBoardProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onViewTaskDetails: (task: Task) => void;
  isGuest: boolean; // Add isGuest prop
}

export default function TaskKanbanBoard({ onAddTask, onEditTask, onViewTaskDetails, isGuest }: TaskKanbanBoardProps) {
  const theme = useTheme();
  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [doingTasks, setDoingTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadTasks = () => {
    setTodoTasks(taskService.getTasksByStatus(TaskStatus.TODO));
    setDoingTasks(taskService.getTasksByStatus(TaskStatus.DOING));
    setDoneTasks(taskService.getTasksByStatus(TaskStatus.DONE));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleDelete = (taskId: string) => {
    if (isGuest) {
      showNotification('Konta gości nie mogą usuwać zadań.', 'warning');
      return;
    }
    const success = taskService.deleteTask(taskId);
    if (success) {
      loadTasks();
      showNotification('Zadanie zostało usunięte', 'success');
    } else {
      showNotification('Nie udało się usunąć zadania', 'error');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (isGuest) {
      showNotification('Konta gości nie mogą zmieniać statusu zadań.', 'warning');
      return;
    }
    try {
      const task = taskService.getTaskById(taskId);
      if (!task) {
        showNotification('Nie znaleziono zadania', 'error');
        return;
      }

      // Require assignee for DOING status
      if (newStatus === TaskStatus.DOING && !task.assigneeId) {
        showNotification('Zadanie musi mieć przypisanego użytkownika do rozpoczęcia', 'warning');
        onViewTaskDetails(task); // Open details to assign user
        return;
      }

      // For DONE status, we need to provide logged hours in the details view
      if (newStatus === TaskStatus.DONE) {
        onViewTaskDetails(task); // Open details for completion with logged hours
        return;
      }

      const updatedTask = taskService.updateTask(taskId, { status: newStatus });
      if (updatedTask) {
        loadTasks();
        
        const statusMessages = {
          [TaskStatus.DOING]: 'Zadanie zostało rozpoczęte',
          [TaskStatus.DONE]: 'Zadanie zostało ukończone',
          [TaskStatus.TODO]: 'Zadanie zostało przywrócone na listę "Do zrobienia"'
        };
        
        showNotification(statusMessages[newStatus], 'success');
      } else {
        showNotification('Nie udało się zaktualizować statusu zadania', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      showNotification(`Wystąpił błąd: ${errorMessage}`, 'error');
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const renderColumn = (title: string, tasks: Task[], color: string) => (
    <Grid item xs={12} md={4}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
              : '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.7)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.2)' 
                : 'rgba(0,0,0,0.02)',
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
              }}
            >
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: color,
                  boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.05)'}`,
                }}
              />
              <Typography variant="subtitle1" fontWeight="600">
                {title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.6)' 
                    : 'rgba(0,0,0,0.5)',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.05)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 8,
                  fontWeight: 'medium',
                }}
              >
                {tasks.length}
              </Typography>
            </Box>
          </Box>

          <Box 
            sx={{ 
              p: 2, 
              overflowY: 'auto', 
              flexGrow: 1,
              '::-webkit-scrollbar': {
                width: '8px',
              },
              '::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
              '::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'rgba(0,0,0,0.2)',
              },
            }}
          >
            <AnimatePresence>
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Box 
                    sx={{ 
                      p: 4,
                      textAlign: 'center',
                      border: `2px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.03)' 
                        : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <Typography color="text.secondary" fontStyle="italic">
                      Brak zadań
                    </Typography>
                  </Box>
                </motion.div>
              ) : (
                tasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard 
                      task={task} 
                      onEdit={() => onEditTask(task)} // Edit is handled in App.tsx to redirect guest
                      onDelete={() => handleDelete(task.id)} 
                      onClick={() => onViewTaskDetails(task)}
                      onStatusChange={handleStatusChange}
                      isGuest={isGuest} // Pass isGuest to TaskCard
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          px: 1,
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            position: 'relative',
            display: 'inline-block',
            pb: 1,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '2em',
              height: '4px',
              borderRadius: '4px',
              backgroundColor: 'primary.main',
            }
          }}
        >
          Tablica zadań
        </Typography>
        {!isGuest && ( // Conditionally render Add button
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onAddTask}
            sx={{ 
              borderRadius: 8,
              px: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 8px rgba(128, 0, 32, 0.3)' 
                : '0 4px 12px rgba(128, 0, 32, 0.2)',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 12px rgba(128, 0, 32, 0.4)'
                  : '0 6px 16px rgba(128, 0, 32, 0.25)',
              }
            }}
          >
            Dodaj zadanie
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ minHeight: '70vh' }}>
        {renderColumn('Do zrobienia', todoTasks, theme.palette.secondary.main)}
        {renderColumn('W trakcie', doingTasks, theme.palette.warning.main)}
        {renderColumn('Ukończone', doneTasks, theme.palette.success.main)}
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
          variant="filled"
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
