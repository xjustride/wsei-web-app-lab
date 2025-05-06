import { useState, useEffect } from 'react';
import { 
  Container, CssBaseline, Box, ThemeProvider, 
  createTheme, Snackbar, Alert, AppBar, Toolbar,
  Typography, Tab, Tabs, Paper
} from '@mui/material';
import type { Project, ProjectInput } from '@/models/Project';
import type { Story, StoryInput } from '@/models/Story';
import type { User } from '@/models/User';
import type { Task, TaskInput } from '@/models/Task';
import { storageService } from '@/services/StorageService';
import { storyService } from '@/services/StoryService';
import { userService } from '@/services/UserService';
import { activeProjectService } from '@/services/ActiveProjectService';
import { taskService } from '@/services/TaskService';
import ProjectList from '@/components/ProjectList';
import ProjectForm from '@/components/ProjectForm';
import StoryList from '@/components/StoryList';
import StoryForm from '@/components/StoryForm';
import TaskKanbanBoard from '@/components/TaskKanbanBoard';
import TaskForm from '@/components/TaskForm';
import TaskDetails from '@/components/TaskDetails';
import UserInfo from '@/components/UserInfo';
import ActiveProjectBanner from '@/components/ActiveProjectBanner';
import React from 'react';
import ProjectSelector from '@/components/ProjectSelector';
import { debugApp } from '@/debug';

try {
  debugApp();
} catch (e) {
  console.error("Błąd debugowania:", e);
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#800020', // burgundy
      dark: '#5d0018',
      light: '#a04048'
    },
    secondary: {
      main: '#424242', // dark gray
      dark: '#212121',
      light: '#757575'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#212121',
      secondary: '#424242'
    },
    error: {
      main: '#d32f2f'
    },
    warning: {
      main: '#f57c00',
      dark: '#e65100'
    },
    success: {
      main: '#388e3c'
    },
    info: {
      main: '#0288d1'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
});

enum View {
  PROJECTS,
  PROJECT_FORM,
  STORIES,
  STORY_FORM,
  TASKS,
  TASK_FORM,
  TASK_DETAILS
}

function App() {
  const [view, setView] = useState<View>(View.PROJECTS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(storageService.getProjects());
    setUsers(userService.getAllUsers());
    
    const active = activeProjectService.getActiveProject();
    setActiveProject(active);
    
    if (active) {
      setStories(storyService.getStoriesForProject(active.id));
      setTasks(taskService.getTasksForProject(active.id));
    }
  };

  const handleProjectAddClick = () => {
    setEditingProject(null);
    setView(View.PROJECT_FORM);
  };

  const handleProjectEditClick = (project: Project) => {
    setEditingProject(project);
    setView(View.PROJECT_FORM);
  };

  const handleProjectDeleteClick = (id: string) => {
    const success = storageService.deleteProject(id);
    
    if (success) {
      if (activeProject && activeProject.id === id) {
        activeProjectService.clearActiveProject();
        setActiveProject(null);
      }
      
      setProjects(storageService.getProjects());
      showNotification('Projekt został usunięty', 'success');
    } else {
      showNotification('Nie udało się usunąć projektu', 'error');
    }
  };

  const handleProjectFormSubmit = (projectInput: ProjectInput) => {
    if (editingProject) {
      const updated = storageService.updateProject(editingProject.id, projectInput);
      if (updated) {
        setProjects(storageService.getProjects());
        
        if (activeProject && activeProject.id === editingProject.id) {
          activeProjectService.setActiveProject(updated);
          setActiveProject(updated);
        }
        
        showNotification('Projekt został zaktualizowany', 'success');
      } else {
        showNotification('Nie udało się zaktualizować projektu', 'error');
      }
    } else {
      const newProject = storageService.createProject(projectInput);
      setProjects(storageService.getProjects());
      showNotification('Projekt został utworzony', 'success');
    }
    
    setView(View.PROJECTS);
    setEditingProject(null);
  };

  const handleProjectFormCancel = () => {
    setView(View.PROJECTS);
    setEditingProject(null);
  };

  const handleStoryAddClick = () => {
    setEditingStory(null);
    setView(View.STORY_FORM);
  };

  const handleStoryEditClick = (story: Story) => {
    setEditingStory(story);
    setView(View.STORY_FORM);
  };

  const handleStoryDeleteClick = (id: string) => {
    const success = storyService.deleteStory(id);
    
    if (success) {
      if (activeProject) {
        setStories(storyService.getStoriesForProject(activeProject.id));
      }
      showNotification('Historyjka została usunięta', 'success');
    } else {
      showNotification('Nie udało się usunąć historyjki', 'error');
    }
  };

  const handleStoryFormSubmit = (storyInput: StoryInput) => {
    if (editingStory) {
      const updated = storyService.updateStory(editingStory.id, storyInput);
      if (updated) {
        if (activeProject) {
          setStories(storyService.getStoriesForProject(activeProject.id));
        }
        showNotification('Historyjka została zaktualizowana', 'success');
      } else {
        showNotification('Nie udało się zaktualizować historyjki', 'error');
      }
    } else {
      const newStory = storyService.createStory(storyInput);
      if (newStory && activeProject) {
        setStories(storyService.getStoriesForProject(activeProject.id));
        showNotification('Historyjka została utworzona', 'success');
      } else {
        showNotification('Nie udało się utworzyć historyjki. Sprawdź czy wybrany jest aktywny projekt.', 'error');
      }
    }
    
    setView(View.STORIES);
    setEditingStory(null);
  };

  const handleStoryFormCancel = () => {
    setView(View.STORIES);
    setEditingStory(null);
  };

  const handleTaskAddClick = () => {
    setEditingTask(null);
    setView(View.TASK_FORM);
  };

  const handleTaskEditClick = (task: Task) => {
    setEditingTask(task);
    setView(View.TASK_FORM);
  };

  const handleTaskViewClick = (task: Task) => {
    setViewingTask(task);
    setView(View.TASK_DETAILS);
  };

  const handleTaskFormSubmit = (taskInput: TaskInput) => {
    if (editingTask) {
      const updated = taskService.updateTask(editingTask.id, taskInput);
      if (updated) {
        if (activeProject) {
          setTasks(taskService.getTasksForProject(activeProject.id));
        }
        showNotification('Zadanie zostało zaktualizowane', 'success');
      } else {
        showNotification('Nie udało się zaktualizować zadania', 'error');
      }
    } else {
      const newTask = taskService.createTask(taskInput);
      if (newTask && activeProject) {
        setTasks(taskService.getTasksForProject(activeProject.id));
        showNotification('Zadanie zostało utworzone', 'success');
      } else {
        showNotification('Nie udało się utworzyć zadania', 'error');
      }
    }
    
    setView(View.TASKS);
    setEditingTask(null);
  };

  const handleTaskFormCancel = () => {
    setView(View.TASKS);
    setEditingTask(null);
  };

  const handleTaskDetailsBack = () => {
    setView(View.TASKS);
    setViewingTask(null);
  };

  const handleTaskDetailsUpdate = (updatedTask: Task) => {
    setViewingTask(updatedTask);
    if (activeProject) {
      setTasks(taskService.getTasksForProject(activeProject.id));
    }
    showNotification('Zadanie zostało zaktualizowane', 'success');
  };

  const handleProjectSelect = () => {
    setIsProjectSelectorOpen(true);
  };

  const handleProjectSelected = (project: Project) => {
    activeProjectService.setActiveProject(project);
    setActiveProject(project);
    setStories(storyService.getStoriesForProject(project.id));
    setTasks(taskService.getTasksForProject(project.id));
    showNotification(`Aktywny projekt: ${project.name}`, 'success');
    setView(View.STORIES);
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const getUsersMap = () => {
    const usersMap: { [id: string]: string } = {};
    users.forEach(user => {
      usersMap[user.id] = `${user.firstName} ${user.lastName}`;
    });
    return usersMap;
  };

  const handleMainNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      setView(View.PROJECTS);
    } else if (newValue === 1) {
      setView(View.STORIES);
    } else if (newValue === 2) {
      setView(View.TASKS);
    }
  };

  const getTabValue = () => {
    if (view === View.PROJECTS || view === View.PROJECT_FORM) return 0;
    if (view === View.STORIES || view === View.STORY_FORM) return 1;
    if (view === View.TASKS || view === View.TASK_FORM || view === View.TASK_DETAILS) return 2;
    return 0;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{ bgcolor: 'secondary.dark' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
            ManagMe
          </Typography>
          <UserInfo />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ActiveProjectBanner onSelectProject={handleProjectSelect} activeProject={activeProject} />
        
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
          <Tabs 
            value={getTabValue()} 
            onChange={handleMainNavChange}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3
              }
            }}
          >
            <Tab label="Projekty" disabled={view === View.PROJECT_FORM} />
            <Tab 
              label="Historyjki" 
              disabled={!activeProject || view === View.PROJECT_FORM || view === View.STORY_FORM} 
            />
            <Tab 
              label="Zadania" 
              disabled={!activeProject || view === View.PROJECT_FORM || view === View.STORY_FORM || view === View.TASK_FORM} 
            />
          </Tabs>
        </Paper>
        
        <Box sx={{ my: 2 }}>
          {view === View.PROJECTS && (
            <ProjectList 
              projects={projects} 
              onEdit={handleProjectEditClick} 
              onDelete={handleProjectDeleteClick} 
              onAddNew={handleProjectAddClick} 
            />
          )}
          
          {view === View.PROJECT_FORM && (
            <ProjectForm 
              project={editingProject || undefined} 
              onSubmit={handleProjectFormSubmit} 
              onCancel={handleProjectFormCancel} 
            />
          )}
          
          {view === View.STORIES && (
            <StoryList 
              stories={stories} 
              onEdit={handleStoryEditClick} 
              onDelete={handleStoryDeleteClick} 
              onAddNew={handleStoryAddClick}
              users={getUsersMap()} 
            />
          )}
          
          {view === View.STORY_FORM && (
            <StoryForm 
              story={editingStory || undefined} 
              onSubmit={handleStoryFormSubmit} 
              onCancel={handleStoryFormCancel} 
            />
          )}
          
          {view === View.TASKS && (
            <TaskKanbanBoard 
              onAddTask={handleTaskAddClick}
              onEditTask={handleTaskEditClick}
              onViewTaskDetails={handleTaskViewClick}
            />
          )}
          
          {view === View.TASK_FORM && (
            <TaskForm 
              task={editingTask || undefined} 
              onSubmit={handleTaskFormSubmit} 
              onCancel={handleTaskFormCancel} 
            />
          )}
          
          {view === View.TASK_DETAILS && viewingTask && (
            <TaskDetails 
              task={viewingTask} 
              onBack={handleTaskDetailsBack}
              onUpdate={handleTaskDetailsUpdate}
            />
          )}
        </Box>
        
        <ProjectSelector 
          open={isProjectSelectorOpen} 
          onClose={() => setIsProjectSelectorOpen(false)}
          onProjectSelected={handleProjectSelected}
        />
        
        <Snackbar 
          open={notification.open} 
          autoHideDuration={4000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
