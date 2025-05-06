import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus } from '@/models/Task';
import { taskService } from '@/services/TaskService';
import TaskCard from './TaskCard';

interface TaskKanbanBoardProps {
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onViewTaskDetails: (task: Task) => void;
}

export default function TaskKanbanBoard({ onAddTask, onEditTask, onViewTaskDetails }: TaskKanbanBoardProps) {
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
    const success = taskService.deleteTask(taskId);
    if (success) {
      loadTasks();
      showNotification('Zadanie zostało usunięte', 'success');
    } else {
      showNotification('Nie udało się usunąć zadania', 'error');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
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
      <Paper 
        elevation={2} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          borderTop: '4px solid',
          borderColor: color,
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          <Typography variant="h6" fontWeight="500">
            {title} ({tasks.length})
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          {tasks.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
              Brak zadań
            </Typography>
          ) : (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => onEditTask(task)} 
                onDelete={() => handleDelete(task.id)} 
                onClick={() => onViewTaskDetails(task)}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </Box>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tablica zadań
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={onAddTask}
        >
          Dodaj zadanie
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ minHeight: '70vh' }}>
        {renderColumn('Do zrobienia', todoTasks, 'secondary.main')}
        {renderColumn('W trakcie', doingTasks, 'warning.main')}
        {renderColumn('Ukończone', doneTasks, 'success.main')}
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
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
