import { useState, useEffect } from 'react';
import { 
  Container, CssBaseline, Box, Snackbar, Alert, AppBar, Toolbar,
  Typography, Tab, Tabs, Paper, Button, Badge, Divider, Fade, useTheme
} from '@mui/material';
import type { Project, ProjectInput } from '@/models/Project';
import type { Story, StoryInput } from '@/models/Story';
import type { User } from '@/models/User';
import { UserRole } from '@/models/User'; // Import UserRole
import type { Task, TaskInput } from '@/models/Task';
import { TaskStatus } from '@/models/Task';
import { storageService } from '@/services/StorageService';
import { storyService } from '@/services/StoryService';
import { userService } from '@/services/UserService';
import { activeProjectService } from '@/services/ActiveProjectService';
import { taskService } from '@/services/TaskService';
import { authService } from '@/services/AuthService';
import ProjectList from '@/components/ProjectList';
import ProjectForm from '@/components/ProjectForm';
import StoryList from '@/components/StoryList';
import StoryForm from '@/components/StoryForm';
import TaskKanbanBoard from '@/components/TaskKanbanBoard';
import TaskForm from '@/components/TaskForm';
import TaskDetails from '@/components/TaskDetails';
import UserInfo from '@/components/UserInfo';
import ActiveProjectBanner from '@/components/ActiveProjectBanner';
import LoginForm from '@/components/LoginForm';
import React from 'react';
import ProjectSelector from '@/components/ProjectSelector';
import ThemeToggle from '@/components/ThemeToggle';
import { debugApp } from '@/debug';
import { ThemeProvider } from '@/contexts/ThemeContext';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentIcon from '@mui/icons-material/Assignment';

try {
  debugApp();
} catch (e) {
  console.error("Błąd debugowania:", e);
}

enum View {
  LOGIN,
  PROJECTS,
  PROJECT_FORM,
  STORIES,
  STORY_FORM,
  TASKS,
  TASK_FORM,
  TASK_DETAILS
}

function AppContent() {
  const theme = useTheme();
  
  const [view, setView] = useState<View>(View.LOGIN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Add currentUser state
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
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const isLoggedIn = authService.isAuthenticated();
    setIsAuthenticated(isLoggedIn);
    
    if (isLoggedIn) {
      const user = await authService.loadCurrentUser();
      setCurrentUser(user); // Set current user
      if (user) {
        setView(View.PROJECTS);
        loadData();
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setView(View.LOGIN);
      }
    }
  };

  const handleLoginSuccess = async () => { // Make async to load user
    setIsAuthenticated(true);
    const user = await authService.loadCurrentUser(); // Reload user after login
    setCurrentUser(user);
    setView(View.PROJECTS);
    loadData();
    showNotification('Zalogowano pomyślnie', 'success');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null); // Clear current user
    setView(View.LOGIN);
    showNotification('Wylogowano pomyślnie', 'success');
  };

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
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą dodawać projektów.', 'warning');
      return;
    }
    setEditingProject(null);
    setView(View.PROJECT_FORM);
  };

  const handleProjectEditClick = (project: Project) => {
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą edytować projektów.', 'warning');
      // Optionally, allow viewing details if there was a project details view
      return;
    }
    setEditingProject(project);
    setView(View.PROJECT_FORM);
  };

  const handleProjectDeleteClick = (id: string) => {
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą usuwać projektów.', 'warning');
      return;
    }
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
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą dodawać historyjek.', 'warning');
      return;
    }
    setEditingStory(null);
    setView(View.STORY_FORM);
  };

  const handleStoryEditClick = (story: Story) => {
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą edytować historyjek.', 'warning');
      return;
    }
    setEditingStory(story);
    setView(View.STORY_FORM);
  };

  const handleStoryDeleteClick = (id: string) => {
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą usuwać historyjek.', 'warning');
      return;
    }
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
    if (currentUser?.role === UserRole.GUEST) {
      showNotification('Konta gości nie mogą dodawać zadań.', 'warning');
      return;
    }
    setEditingTask(null);
    setView(View.TASK_FORM);
  };

  const handleTaskEditClick = (task: Task) => {
    if (currentUser?.role === UserRole.GUEST) {
      // Guests might still view details, but not edit form
      // For now, let's prevent going to edit form directly
      showNotification('Konta gości nie mogą edytować zadań. Możesz wyświetlić szczegóły.', 'info');
      handleTaskViewClick(task); // Redirect to view details instead
      return;
    }
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
    // This might be called from TaskDetails after a status change attempt
    // Guest check should happen within TaskDetails for actions like status change
    setViewingTask(updatedTask);
    if (activeProject) {
      setTasks(taskService.getTasksForProject(activeProject.id));
    }
    showNotification('Zadanie zostało zaktualizowane', 'success'); // This message might need context if guest tried
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

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
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

  const getTodoTasksCount = () => {
    if (!activeProject) return 0;
    return taskService.getTasksByStatus(TaskStatus.TODO).length;
  };

  if (!isAuthenticated) {
    return (
      <>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            minHeight: '100vh',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #262626 100%)' 
              : 'linear-gradient(135deg, #f0f0f0 0%, #fff 50%, #f8f8f8 100%)',
          }}
        >
          <Container maxWidth="sm" sx={{ py: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Fade in={true} timeout={1000}>
              <Box>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom 
                    color="primary.main" 
                    fontWeight={700}
                    sx={{ 
                      letterSpacing: '-0.05em',
                      textShadow: theme.palette.mode === 'dark' 
                        ? '2px 2px 4px rgba(0,0,0,0.5)'
                        : 'none'
                    }}
                  >
                    ManagMe
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    System zarządzania projektami
                  </Typography>
                </Box>
                <LoginForm onLoginSuccess={handleLoginSuccess} />
              </Box>
            </Fade>
          </Container>
        </Box>
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
      </>
    );
  }

  const isGuest = currentUser?.role === UserRole.GUEST;

  return (
    <>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        transition: 'background-color 0.3s ease-in-out',
      }}>
        <AppBar 
          position="static" 
          sx={{ 
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(90deg, #500013 0%, #800020 100%)' 
              : 'linear-gradient(90deg, #800020 0%, #9a2639 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
          elevation={0}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <HomeIcon /> ManagMe
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ThemeToggle />
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
              <UserInfo onLogout={handleLogout} />
            </Box>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ py: 4, flexGrow: 1 }}>
          <ActiveProjectBanner onSelectProject={handleProjectSelect} activeProject={activeProject} />
          
          <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
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
              <Tab 
                icon={<DashboardIcon />} 
                label="Projekty" 
                iconPosition="start"
                disabled={view === View.PROJECT_FORM && !isGuest} // Allow navigation if guest (forms blocked elsewhere)
              />
              <Tab 
                icon={<AssignmentIcon />}
                label="Historyjki" 
                iconPosition="start"
                disabled={!activeProject || (view === View.STORY_FORM && !isGuest)} 
              />
              <Tab 
                icon={<TaskIcon />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Zadania
                    {activeProject && getTodoTasksCount() > 0 && (
                      <Badge 
                        badgeContent={getTodoTasksCount()} 
                        color="error"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                iconPosition="start"
                disabled={!activeProject || (view === View.TASK_FORM && !isGuest)} 
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
                isGuest={isGuest} // Pass isGuest
              />
            )}
            
            {view === View.PROJECT_FORM && !isGuest && ( // Prevent rendering form for guests
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
                isGuest={isGuest} // Pass isGuest
              />
            )}
            
            {view === View.STORY_FORM && !isGuest && ( // Prevent rendering form for guests
              <StoryForm 
                story={editingStory || undefined} 
                onSubmit={handleStoryFormSubmit} 
                onCancel={handleStoryFormCancel} 
              />
            )}
            
            {view === View.TASKS && (
              <TaskKanbanBoard 
                onAddTask={handleTaskAddClick}
                onEditTask={handleTaskEditClick} // Edit click is handled above to redirect guest
                onViewTaskDetails={handleTaskViewClick}
                isGuest={isGuest} // Pass isGuest
              />
            )}
            
            {view === View.TASK_FORM && !isGuest && ( // Prevent rendering form for guests
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
                onUpdate={handleTaskDetailsUpdate} // onUpdate will be called, but internal actions should be disabled
                isGuest={isGuest} // Pass isGuest
              />
            )}
          </Box>
          
          <ProjectSelector 
            open={isProjectSelectorOpen} 
            onClose={() => setIsProjectSelectorOpen(false)}
            onProjectSelected={handleProjectSelected}
          />
        </Container>
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ 
            width: '100%', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            }
          }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
