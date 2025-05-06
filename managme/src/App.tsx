import { useState, useEffect } from 'react';
import { 
  Container, CssBaseline, Box, ThemeProvider, 
  createTheme, Snackbar, Alert, AppBar, Toolbar,
  Typography, Divider, Tab, Tabs, Paper
} from '@mui/material';
// Usuwamy import, który powoduje błąd
// import './App.css';
import type { Project, ProjectInput } from '@/models/Project';
import type { Story, StoryInput } from '@/models/Story';
import type { User } from '@/models/User';
import { storageService } from '@/services/StorageService';
import { storyService } from '@/services/StoryService';
import { userService } from '@/services/UserService';
import { activeProjectService } from '@/services/ActiveProjectService';
import ProjectList from './components/ProjectList';
import ProjectForm from '@/components/ProjectForm';
import StoryList from '@/components/StoryList';
import StoryForm from '@/components/StoryForm';
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
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

enum View {
  PROJECTS,
  PROJECT_FORM,
  STORIES,
  STORY_FORM
}

function App() {
  const [view, setView] = useState<View>(View.PROJECTS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  // Załaduj dane przy uruchomieniu
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
    }
  };

  // Obsługa projektów
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
      // Jeśli usunięty projekt był aktywny, wyczyść aktywny projekt
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
        // Odśwież listę projektów
        setProjects(storageService.getProjects());
        
        // Zaktualizuj aktywny projekt, jeśli był edytowany
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

  // Obsługa historyjek
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

  // Obsługa aktywnego projektu
  const handleProjectSelect = () => {
    setIsProjectSelectorOpen(true);
  };

  const handleProjectSelected = (project: Project) => {
    activeProjectService.setActiveProject(project);
    setActiveProject(project);
    setStories(storyService.getStoriesForProject(project.id));
    showNotification(`Aktywny projekt: ${project.name}`, 'success');
    // Automatycznie przełącz na widok historyjek po wybraniu projektu
    setView(View.STORIES);
  };

  // Powiadomienia
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Konwersja listy użytkowników na mapę dla StoryList
  const getUsersMap = () => {
    const usersMap: { [id: string]: string } = {};
    users.forEach(user => {
      usersMap[user.id] = `${user.firstName} ${user.lastName}`;
    });
    return usersMap;
  };

  // Obsługa przełączania między widokami projektów i historyjek
  const handleMainNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    setView(newValue === 0 ? View.PROJECTS : View.STORIES);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ManagMe
          </Typography>
          <UserInfo />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ActiveProjectBanner onSelectProject={handleProjectSelect} activeProject={activeProject} />
        
        {/* Główne menu nawigacyjne */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={view < 2 ? 0 : 1} 
            onChange={handleMainNavChange}
            variant="fullWidth"
          >
            <Tab label="Projekty" disabled={view === View.PROJECT_FORM} />
            <Tab 
              label="Historyjki" 
              disabled={!activeProject || view === View.STORY_FORM} 
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
