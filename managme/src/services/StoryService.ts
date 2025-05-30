import { Story, StoryInput, Status } from '@/models/Story';
import { activeProjectService } from '@/services/ActiveProjectService';
import { apiService } from './ApiService';
import { logger } from '@/utils/logger';

export class StoryService {
  async getAllStories(): Promise<Story[]> {
    try {
      logger.info('Fetching all stories', 'StoryService', 'getAllStories');
      const stories = await apiService.getStories();
      logger.info(`Fetched ${stories.length} stories`, 'StoryService', 'getAllStories', { count: stories.length });
      return stories;
    } catch (error) {
      logger.error('Failed to fetch stories', error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'getAllStories');
      return [];
    }
  }

  async getStoriesForProject(projectId: string): Promise<Story[]> {
    try {
      logger.info(`Fetching stories for project: ${projectId}`, 'StoryService', 'getStoriesForProject', { projectId });
      const stories = await apiService.getStories(projectId);
      logger.info(`Fetched ${stories.length} stories for project ${projectId}`, 'StoryService', 'getStoriesForProject', { projectId, count: stories.length });
      return stories;
    } catch (error) {
      logger.error(`Failed to fetch stories for project ${projectId}`, error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'getStoriesForProject', { projectId });
      return [];
    }
  }

  async getActiveProjectStories(): Promise<Story[]> {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) {
      logger.warn('No active project found', 'StoryService', 'getActiveProjectStories');
      return [];
    }
    
    logger.info(`Fetching stories for active project: ${activeProject.name}`, 'StoryService', 'getActiveProjectStories', { projectId: activeProject.id });
    return await this.getStoriesForProject(activeProject.id);
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    try {
      logger.info(`Fetching story: ${id}`, 'StoryService', 'getStoryById', { storyId: id });
      const story = await apiService.getStory(id);
      logger.info(`Successfully fetched story: ${id}`, 'StoryService', 'getStoryById', { storyId: id, name: story?.name });
      return story;
    } catch (error) {
      logger.error(`Failed to fetch story ${id}`, error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'getStoryById', { storyId: id });
      return undefined;
    }
  }

  async createStory(storyInput: StoryInput): Promise<Story | null> {
    try {
      const activeProject = activeProjectService.getActiveProject();
      if (!activeProject) {
        logger.warn('Cannot create story - no active project', 'StoryService', 'createStory');
        throw new Error('Brak aktywnego projektu');
      }
      
      logger.info(`Creating new story: ${storyInput.name}`, 'StoryService', 'createStory', { 
        name: storyInput.name, 
        projectId: activeProject.id 
      });
      
      const story = await apiService.createStory({
        ...storyInput,
        projectId: activeProject.id
      });
      
      logger.info(`Successfully created story: ${story?.name}`, 'StoryService', 'createStory', { 
        storyId: story?.id, 
        name: story?.name 
      });
      
      return story;
    } catch (error) {
      logger.error(`Failed to create story: ${storyInput.name}`, error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'createStory', { name: storyInput.name });
      return null;
    }
  }

  async updateStory(id: string, storyInput: Partial<StoryInput>): Promise<Story | null> {
    try {
      logger.info(`Updating story: ${id}`, 'StoryService', 'updateStory', { storyId: id, changes: storyInput });
      const story = await apiService.updateStory(id, storyInput);
      logger.info(`Successfully updated story: ${id}`, 'StoryService', 'updateStory', { storyId: id, name: story?.name });
      return story;
    } catch (error) {
      logger.error(`Failed to update story ${id}`, error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'updateStory', { storyId: id });
      return null;
    }
  }

  async deleteStory(id: string): Promise<boolean> {
    try {
      logger.info(`Deleting story: ${id}`, 'StoryService', 'deleteStory', { storyId: id });
      await apiService.deleteStory(id);
      logger.info(`Successfully deleted story: ${id}`, 'StoryService', 'deleteStory', { storyId: id });
      return true;
    } catch (error) {
      logger.error(`Failed to delete story ${id}`, error instanceof Error ? error : new Error('Unknown error'), 'StoryService', 'deleteStory', { storyId: id });
      return false;
    }
  }

  async getStoriesByStatus(status: Status): Promise<Story[]> {
    const activeProject = activeProjectService.getActiveProject();
    if (!activeProject) {
      logger.warn('No active project found for stories by status', 'StoryService', 'getStoriesByStatus', { status });
      return [];
    }
    
    logger.info(`Fetching stories with status: ${status}`, 'StoryService', 'getStoriesByStatus', { status, projectId: activeProject.id });
    const stories = await this.getStoriesForProject(activeProject.id);
    const filteredStories = stories.filter(story => story.state === status);
    logger.info(`Found ${filteredStories.length} stories with status ${status}`, 'StoryService', 'getStoriesByStatus', { status, count: filteredStories.length });
    
    return filteredStories;
  }
}

export const storyService = new StoryService();