import { useState, useEffect } from 'react';
import { Container, CssBaseline, Box, ThemeProvider, createTheme, Snackbar, Alert } from '@mui/material';
import './App.css';
import type { Project, ProjectInput } from './models/Project';
import { storageService } from './services/StorageService';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import { debugApp } from './debug';

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

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    setProjects(storageService.getProjects());
  }, []);

  const handleAddClick = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    const success = storageService.deleteProject(id);
    
    if (success) {
      setProjects(storageService.getProjects());
      showNotification('Projekt został usunięty', 'success');
    } else {
      showNotification('Nie udało się usunąć projektu', 'error');
    }
  };

  const handleFormSubmit = (projectInput: ProjectInput) => {
    if (editingProject) {
      const updated = storageService.updateProject(editingProject.id, projectInput);
      if (updated) {
        setProjects(storageService.getProjects());
        showNotification('Projekt został zaktualizowany', 'success');
      } else {
        showNotification('Nie udało się zaktualizować projektu', 'error');
      }
    } else {
      storageService.createProject(projectInput);
      setProjects(storageService.getProjects());
      showNotification('Projekt został utworzony', 'success');
    }
    
    setShowForm(false);
    setEditingProject(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ my: 4 }}>
          {showForm ? (
            <ProjectForm 
              project={editingProject || undefined} 
              onSubmit={handleFormSubmit} 
              onCancel={handleFormCancel} 
            />
          ) : (
            <ProjectList 
              projects={projects} 
              onEdit={handleEditClick} 
              onDelete={handleDeleteClick} 
              onAddNew={handleAddClick} 
            />
          )}
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
      </Container>
    </ThemeProvider>
  );
}

export default App;
