describe('E2E workflow', () => {
  it('Powinien przeprowadzić pełny cykl zarządzania projektem, historyjką i zadaniem', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/projects').as('getProjects');
    cy.intercept('POST', '/api/projects').as('createProject');
    cy.intercept('GET', '/api/stories*').as('getStories');
    cy.intercept('POST', '/api/stories').as('createStory');
    cy.intercept('GET', '/api/tasks*').as('getTasks');
    cy.intercept('POST', '/api/tasks').as('createTask');
    cy.intercept('PUT', '/api/tasks/*').as('updateTask');
    cy.intercept('DELETE', '/api/tasks/*').as('deleteTask');
    cy.intercept('DELETE', '/api/stories/*').as('deleteStory');
    cy.intercept('DELETE', '/api/projects/*').as('deleteProject');
    
    cy.login('Admin');
    cy.wait('@loginRequest', { timeout: 15000 });
    
    cy.wait('@getProjects', { timeout: 15000 });
    
    const timestamp = new Date().getTime();
    const projectName = `E2E Project ${timestamp}`;
    cy.createProject(projectName, 'E2E test project description');
    cy.contains(projectName).should('be.visible');
    
    cy.contains(projectName).click();
    cy.wait('@getStories');
    
    const storyName = `E2E Story ${timestamp}`;
    cy.createStory(storyName, 'E2E test story description');
    cy.contains(storyName).should('be.visible');
    
    cy.contains('Tablica zadań').click();
    cy.wait('@getTasks');
    
    const taskName = `E2E Task ${timestamp}`;
    cy.createTask(taskName, 'E2E test task description');
    cy.contains(taskName).should('be.visible');
    
    cy.changeTaskStatus(taskName, 'doing');
    cy.wait('@updateTask');
    
    cy.changeTaskStatus(taskName, 'done');
    cy.wait('@updateTask');
    
    cy.contains(taskName).parents('.MuiCard-root').find('[aria-label="Usuń zadanie"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteTask');
    cy.contains(taskName).should('not.exist');
    
    cy.contains('Historyjki').click();
    cy.wait('@getStories');
    
    cy.contains(storyName).parents('.MuiCard-root').find('[aria-label="Usuń historyjkę"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteStory');
    cy.contains(storyName).should('not.exist');
    
    cy.contains('Projekty').click();
    cy.wait('@getProjects');
    
    cy.contains(projectName).parents('.MuiCard-root').find('[aria-label="Usuń projekt"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteProject');
    cy.contains(projectName).should('not.exist');
  });
});
