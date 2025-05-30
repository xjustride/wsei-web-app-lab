import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Grid, Divider, Button, Snackbar, Alert, useTheme,
  InputAdornment, TextField, IconButton, MenuItem, Select, FormControl, InputLabel,
  Chip, Collapse, Tooltip, Menu
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '@/models/Task';
import { taskService } from '@/services/TaskService';
import { Priority } from '@/models/Story';
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
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [taskCount, setTaskCount] = useState({
    todo: 0,
    doing: 0,
    done: 0,
    filtered: 0
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Task navigation state
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<'todo' | 'doing' | 'done'>('todo');

  const loadTasks = async () => {
    try {
      const { todoTasks, doingTasks, doneTasks } = await taskService.refreshTasks();
      
      // Apply filters before setting state
      const filteredTodoTasks = applyFilters(todoTasks);
      const filteredDoingTasks = applyFilters(doingTasks);
      const filteredDoneTasks = applyFilters(doneTasks);
      
      setTodoTasks(filteredTodoTasks);
      setDoingTasks(filteredDoingTasks);
      setDoneTasks(filteredDoneTasks);
      
      // Update counts
      setTaskCount({
        todo: todoTasks.length,
        doing: doingTasks.length,
        done: doneTasks.length,
        filtered: filteredTodoTasks.length + filteredDoingTasks.length + filteredDoneTasks.length
      });
      
      console.log('Zadania załadowane:', {
        todo: todoTasks.length,
        doing: doingTasks.length,
        done: doneTasks.length,
        filtered: filteredTodoTasks.length + filteredDoingTasks.length + filteredDoneTasks.length
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Nie udało się załadować zadań', 'error');
    }
  };
  
  // Memoized filter function
  const applyFilters = useCallback((tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Priority filter
      const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
      
      // Assignee filter
      const matchesAssignee = assigneeFilter === '' || task.assignedTo === assigneeFilter;
      
      return matchesSearch && matchesPriority && matchesAssignee;
    }).sort((a, b) => {
      // Sort based on selected criteria
      if (sortBy === 'priority') {
        const priorityOrder = { [Priority.CRITICAL]: 3, [Priority.HIGH]: 2, [Priority.MEDIUM]: 1, [Priority.LOW]: 0 };
        return sortDirection === 'desc' 
          ? (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          : (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      }
      
      if (sortBy === 'name') {
        return sortDirection === 'desc'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      
      // Default: sort by date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [searchTerm, priorityFilter, assigneeFilter, sortBy, sortDirection]);
  
  // Effect to reapply filters when filter criteria change
  useEffect(() => {
    const refresh = async () => {
      const { todoTasks, doingTasks, doneTasks } = await taskService.refreshTasks();
      
      setTodoTasks(applyFilters(todoTasks));
      setDoingTasks(applyFilters(doingTasks));
      setDoneTasks(applyFilters(doneTasks));
      
      setTaskCount({
        todo: todoTasks.length,
        doing: doingTasks.length,
        done: doneTasks.length,
        filtered: applyFilters(todoTasks).length + applyFilters(doingTasks).length + applyFilters(doneTasks).length
      });
    };
    
    refresh();
  }, [searchTerm, priorityFilter, assigneeFilter, sortBy, sortDirection, applyFilters]);

  const handleDelete = async (taskId: string) => {
    if (isGuest) {
      showNotification('Konta gości nie mogą usuwać zadań.', 'warning');
      return;
    }
    
    try {
      const success = await taskService.deleteTask(taskId);
      if (success) {
        loadTasks();
        showNotification('Zadanie zostało usunięte', 'success');
      } else {
        showNotification('Nie udało się usunąć zadania', 'error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Wystąpił błąd podczas usuwania zadania', 'error');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (isGuest) {
      showNotification('Konta gości nie mogą zmieniać statusu zadań.', 'warning');
      return;
    }
    
    try {
      const task = await taskService.getTaskById(taskId);
      if (!task) {
        showNotification('Nie znaleziono zadania', 'error');
        return;
      }

      // Require assignee for DOING status
      if (newStatus === TaskStatus.DOING && !task.assignedTo) {
        showNotification('Zadanie musi mieć przypisanego użytkownika do rozpoczęcia', 'warning');
        onViewTaskDetails(task); // Open details to assign user
        return;
      }

      // Update task status
      console.log(`Zmiana statusu zadania ${task.name} z ${task.state} na ${newStatus}`);
      
      const updatedTask = await taskService.changeTaskStatus(taskId, newStatus);
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || isGuest) {
      return;
    }
    
    const { source, destination, draggableId } = result;
    
    // If task was dropped in a different column
    if (source.droppableId !== destination.droppableId) {
      // Map droppable IDs to task statuses
      const statusMap: Record<string, TaskStatus> = {
        'todo': TaskStatus.TODO,
        'doing': TaskStatus.DOING,
        'done': TaskStatus.DONE
      };
      
      const newStatus = statusMap[destination.droppableId];
      if (newStatus) {
        handleStatusChange(draggableId, newStatus);
      }
    }
  };
  
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleSortSelect = (sortType: 'priority' | 'date' | 'name') => {
    if (sortBy === sortType) {
      // Toggle direction if the same sort type is selected
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortType);
      setSortDirection('desc'); // Default to descending for new sort type
    }
    handleSortClose();
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setSortBy('date');
    setSortDirection('desc');
  };
  
  const renderFilterBar = () => (
    <Paper 
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          id="task-search-field"
          size="small"
          placeholder="Szukaj zadań..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={() => setSearchTerm('')} 
                  aria-label="clear search"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ 
            minWidth: { xs: '100%', sm: 200 },
            flex: { sm: 1 } 
          }}
        />
        
        <Button
          variant="outlined"
          size="small"
          color="inherit"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Filtry {(priorityFilter || assigneeFilter) && <Chip size="small" label="!" color="primary" sx={{ ml: 1, height: 16, width: 16 }} />}
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<SortIcon />}
            onClick={handleSortClick}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Sortuj
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
          >
            <MenuItem 
              selected={sortBy === 'date'} 
              onClick={() => handleSortSelect('date')}
            >
              Data {sortBy === 'date' && (sortDirection === 'desc' ? '(najnowsze)' : '(najstarsze)')}
            </MenuItem>
            <MenuItem 
              selected={sortBy === 'priority'} 
              onClick={() => handleSortSelect('priority')}
            >
              Priorytet {sortBy === 'priority' && (sortDirection === 'desc' ? '(wysoki → niski)' : '(niski → wysoki)')}
            </MenuItem>
            <MenuItem 
              selected={sortBy === 'name'} 
              onClick={() => handleSortSelect('name')}
            >
              Nazwa {sortBy === 'name' && (sortDirection === 'desc' ? '(Z-A)' : '(A-Z)')}
            </MenuItem>
          </Menu>
        </Box>
        
        <Tooltip title="Odśwież zadania">
          <IconButton 
            size="small"
            onClick={loadTasks}
            sx={{ ml: { xs: 0, sm: 'auto' } }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Collapse in={showFilters}>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="priority-filter-label">Priorytet</InputLabel>
            <Select
              labelId="priority-filter-label"
              value={priorityFilter}
              label="Priorytet"
              onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
            >
              <MenuItem value="">Wszystkie</MenuItem>
              <MenuItem value={Priority.LOW}>Niski</MenuItem>
              <MenuItem value={Priority.MEDIUM}>Średni</MenuItem>
              <MenuItem value={Priority.HIGH}>Wysoki</MenuItem>
              <MenuItem value={Priority.CRITICAL}>Krytyczny</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="assignee-filter-label">Przypisane do</InputLabel>
            <Select
              labelId="assignee-filter-label"
              value={assigneeFilter}
              label="Przypisane do"
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <MenuItem value="">Wszyscy</MenuItem>
              <MenuItem value="">Nieprzypisane</MenuItem>
              {/* TODO: Add user list here */}
            </Select>
          </FormControl>
          
          <Button 
            size="small" 
            onClick={clearFilters}
            startIcon={<CloseIcon />}
            variant="text"
            sx={{ ml: 'auto', textTransform: 'none' }}
          >
            Wyczyść filtry
          </Button>
        </Box>
      </Collapse>
      
      {/* Filter statistics */}
      {(searchTerm || priorityFilter || assigneeFilter) && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Wyświetlanie {taskCount.filtered} z {taskCount.todo + taskCount.doing + taskCount.done} zadań
          </Typography>
        </Box>
      )}
    </Paper>
  );

  // Handle keyboard shortcuts for the Kanban board
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if the event occurred in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      
      // Priority filtering shortcuts
      if (!isGuest) {
        if (e.key === '1') {
          e.preventDefault();
          setPriorityFilter(Priority.LOW);
        } else if (e.key === '2') {
          e.preventDefault();
          setPriorityFilter(Priority.MEDIUM);
        } else if (e.key === '3') {
          e.preventDefault();
          setPriorityFilter(Priority.HIGH);
        } else if (e.key === '4') {
          e.preventDefault();
          setPriorityFilter(Priority.CRITICAL);
        } else if (e.key === '0') {
          e.preventDefault();
          clearFilters();
        } else if (e.key === 'f') {
          e.preventDefault();
          setShowFilters(!showFilters);
        } else if (e.key === '/' || (e.key === 'f' && e.ctrlKey)) {
          e.preventDefault();
          // Focus the search field
          const searchField = document.getElementById('task-search-field');
          if (searchField) {
            searchField.focus();
          }
        }
      }
      
      // Navigation between tasks
      if (focusedTaskId) {
        let currentTasks: Task[];
        let nextTasks: Task[];
        let prevTasks: Task[];

        switch (focusedColumn) {
          case 'todo':
            currentTasks = todoTasks;
            nextTasks = doingTasks;
            prevTasks = doneTasks;
            break;
          case 'doing':
            currentTasks = doingTasks;
            nextTasks = doneTasks;
            prevTasks = todoTasks;
            break;
          case 'done':
            currentTasks = doneTasks;
            nextTasks = todoTasks;
            prevTasks = doingTasks;
            break;
        }

        const currentTaskIndex = currentTasks.findIndex(t => t.id === focusedTaskId);
        
        if (currentTaskIndex !== -1) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentTaskIndex < currentTasks.length - 1) {
              setFocusedTaskId(currentTasks[currentTaskIndex + 1].id);
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentTaskIndex > 0) {
              setFocusedTaskId(currentTasks[currentTaskIndex - 1].id);
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (nextTasks.length > 0) {
              setFocusedTaskId(nextTasks[0].id);
              setFocusedColumn(
                focusedColumn === 'todo' ? 'doing' :
                focusedColumn === 'doing' ? 'done' : 'todo'
              );
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (prevTasks.length > 0) {
              setFocusedTaskId(prevTasks[0].id);
              setFocusedColumn(
                focusedColumn === 'todo' ? 'done' :
                focusedColumn === 'doing' ? 'todo' : 'doing'
              );
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const task = currentTasks[currentTaskIndex];
            onViewTaskDetails(task);
          } else if (!isGuest) {
            // Status change shortcuts
            if (e.key.toLowerCase() === 'd' && focusedColumn === 'todo') {
              e.preventDefault();
              const task = currentTasks[currentTaskIndex];
              if (task.assignedTo) {
                handleStatusChange(task.id, TaskStatus.DOING);
              } else {
                // Open details to assign user first
                onViewTaskDetails(task);
              }
            } else if (e.key.toLowerCase() === 'c' && focusedColumn === 'doing') {
              e.preventDefault();
              handleStatusChange(currentTasks[currentTaskIndex].id, TaskStatus.DONE);
            } else if (e.key.toLowerCase() === 'b') {
              e.preventDefault();
              if (focusedColumn === 'doing') {
                handleStatusChange(currentTasks[currentTaskIndex].id, TaskStatus.TODO);
              } else if (focusedColumn === 'done') {
                handleStatusChange(currentTasks[currentTaskIndex].id, TaskStatus.DOING);
              }
            }
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // No task is focused, so focus the first task in the first non-empty column
        e.preventDefault();
        if (todoTasks.length > 0) {
          setFocusedTaskId(todoTasks[0].id);
          setFocusedColumn('todo');
        } else if (doingTasks.length > 0) {
          setFocusedTaskId(doingTasks[0].id);
          setFocusedColumn('doing');
        } else if (doneTasks.length > 0) {
          setFocusedTaskId(doneTasks[0].id);
          setFocusedColumn('done');
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    focusedTaskId, focusedColumn, isGuest,
    todoTasks, doingTasks, doneTasks,
    handleStatusChange, onViewTaskDetails,
    showFilters
  ]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
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
      
      {/* Filter Bar */}
      {renderFilterBar()}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3} sx={{ minHeight: '70vh' }}>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {isGuest ? 
                  'Tryb gościa - podgląd zadań (bez możliwości zmiany statusu)' : 
                  'Porada: Przeciągnij i upuść zadanie, aby zmienić jego status lub użyj strzałek na karcie zadania'}
              </Typography>
            </Paper>
          </Grid>
          
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
                        bgcolor: theme.palette.secondary.main,
                        boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(0,0,0,0.05)'}`,
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight="600">
                      Do zrobienia
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
                      {todoTasks.length}
                    </Typography>
                  </Box>
                </Box>

                <Droppable droppableId="todo">
                  {(provided, snapshot) => (
                    <Box 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        p: 2, 
                        overflowY: 'auto', 
                        flexGrow: 1,
                        minHeight: '50vh',
                        backgroundColor: snapshot.isDraggingOver ? 
                          (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 
                          'transparent',
                        transition: 'background-color 0.2s ease',
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
                        {todoTasks.length === 0 ? (
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
                          todoTasks.map((task, index) => (
                            <Draggable 
                              key={task.id} 
                              draggableId={task.id} 
                              index={index}
                              isDragDisabled={isGuest}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <TaskCard 
                                    task={task} 
                                    onEdit={() => onEditTask(task)} 
                                    onDelete={() => handleDelete(task.id)} 
                                    onClick={() => onViewTaskDetails(task)}
                                    onStatusChange={handleStatusChange}
                                    isGuest={isGuest}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </AnimatePresence>
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </motion.div>
          </Grid>

          {/* W TRAKCIE */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
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
                        bgcolor: theme.palette.warning.main,
                        boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(0,0,0,0.05)'}`,
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight="600">
                      W trakcie
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
                      {doingTasks.length}
                    </Typography>
                  </Box>
                </Box>

                <Droppable droppableId="doing">
                  {(provided, snapshot) => (
                    <Box 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        p: 2, 
                        overflowY: 'auto', 
                        flexGrow: 1,
                        minHeight: '50vh',
                        backgroundColor: snapshot.isDraggingOver ? 
                          (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 
                          'transparent',
                        transition: 'background-color 0.2s ease',
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
                        {doingTasks.length === 0 ? (
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
                          doingTasks.map((task, index) => (
                            <Draggable 
                              key={task.id} 
                              draggableId={task.id} 
                              index={index}
                              isDragDisabled={isGuest}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <TaskCard 
                                    task={task} 
                                    onEdit={() => onEditTask(task)} 
                                    onDelete={() => handleDelete(task.id)} 
                                    onClick={() => onViewTaskDetails(task)}
                                    onStatusChange={handleStatusChange}
                                    isGuest={isGuest}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </AnimatePresence>
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </motion.div>
          </Grid>

          {/* UKOŃCZONE */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
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
                        bgcolor: theme.palette.success.main,
                        boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(0,0,0,0.05)'}`,
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight="600">
                      Ukończone
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
                      {doneTasks.length}
                    </Typography>
                  </Box>
                </Box>

                <Droppable droppableId="done">
                  {(provided, snapshot) => (
                    <Box 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        p: 2, 
                        overflowY: 'auto', 
                        flexGrow: 1,
                        minHeight: '50vh',
                        backgroundColor: snapshot.isDraggingOver ? 
                          (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 
                          'transparent',
                        transition: 'background-color 0.2s ease',
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
                        {doneTasks.length === 0 ? (
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
                          doneTasks.map((task, index) => (
                            <Draggable 
                              key={task.id} 
                              draggableId={task.id} 
                              index={index}
                              isDragDisabled={isGuest}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <TaskCard 
                                    task={task} 
                                    onEdit={() => onEditTask(task)} 
                                    onDelete={() => handleDelete(task.id)} 
                                    onClick={() => onViewTaskDetails(task)}
                                    onStatusChange={handleStatusChange}
                                    isGuest={isGuest}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </AnimatePresence>
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </DragDropContext>
      
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
