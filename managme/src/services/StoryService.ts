import { Story, StoryInput, Status } from '@/models/Story';
import { activeProjectService } from '@/services/ActiveProjectService';

export class StoryService {
  private storageKey = 'managme_stories';

  getAllStories(): Story[] {
    try {
      const stories = localStorage.getItem(this.storageKey);
      if (!stories) return [];
      
      const parsedStories = JSON.parse(stories, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value);
        }
        return value;
      });
      
      return parsedStories;
    } catch (error) {
      console.error('Błąd podczas pobierania historyjek:', error);
      return [];
    }
  }

  getStoriesForProject(projectId: string): Story[] {
    return this.getAllStories().filter(story => story.projectId === projectId);
  }

  getActiveProjectStories(): Story[] {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) return [];
    
    return this.getStoriesForProject(activeProject.id);
  }

  getStoryById(id: string): Story | undefined {
    return this.getAllStories().find(story => story.id === id);
  }

  createStory(storyInput: StoryInput): Story | null {
    try {
      const activeProject = activeProjectService.getActiveProject();
      if (!activeProject) {
        throw new Error('Brak aktywnego projektu');
      }
      
      const stories = this.getAllStories();
      const newStory: Story = {
        ...storyInput,
        id: crypto.randomUUID(),
        projectId: activeProject.id,
        createdAt: new Date()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify([...stories, newStory]));
      return newStory;
    } catch (error) {
      console.error('Błąd podczas tworzenia historyjki:', error);
      return null;
    }
  }

  updateStory(id: string, storyInput: StoryInput): Story | null {
    try {
      const stories = this.getAllStories();
      const index = stories.findIndex(story => story.id === id);
      
      if (index === -1) return null;
      
      const existingStory = stories[index];
      
      const updatedStory: Story = {
        ...storyInput,
        id,
        projectId: existingStory.projectId,
        createdAt: existingStory.createdAt
      };
      
      stories[index] = updatedStory;
      localStorage.setItem(this.storageKey, JSON.stringify(stories));
      
      return updatedStory;
    } catch (error) {
      console.error('Błąd podczas aktualizacji historyjki:', error);
      return null;
    }
  }

  deleteStory(id: string): boolean {
    try {
      const stories = this.getAllStories();
      const filteredStories = stories.filter(story => story.id !== id);
      
      if (filteredStories.length === stories.length) {
        return false;
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredStories));
      return true;
    } catch (error) {
      console.error('Błąd podczas usuwania historyjki:', error);
      return false;
    }
  }

  getStoriesByStatus(status: Status): Story[] {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) return [];
    
    return this.getStoriesForProject(activeProject.id)
      .filter(story => story.status === status);
  }
}

export const storyService = new StoryService();
