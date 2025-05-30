// cypress/e2e/e2e.cy.ts
describe('E2E workflow', () => {
  it('Powinien przeprowadzić pełny cykl zarządzania projektem, historyjką i zadaniem', () => {
    // Przygotowanie interceptów dla zapytań API
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
    
    // Logowanie do aplikacji używając przycisku Admin
    cy.login('Admin');
    cy.wait('@loginRequest', { timeout: 15000 });
    
    // Sprawdź czy załadowano projekty
    cy.wait('@getProjects', { timeout: 15000 });
    
    // 1. Utworzenie nowego projektu
    const timestamp = new Date().getTime();
    const projectName = `E2E Project ${timestamp}`;
    cy.createProject(projectName, 'E2E test project description');
    cy.contains(projectName).should('be.visible');
    
    // 2. Wybierz stworzony projekt
    cy.contains(projectName).click();
    cy.wait('@getStories');
    
    // 3. Utworzenie historyjki
    const storyName = `E2E Story ${timestamp}`;
    cy.createStory(storyName, 'E2E test story description');
    cy.contains(storyName).should('be.visible');
    
    // 4. Przejście do widoku Kanban
    cy.contains('Tablica zadań').click();
    cy.wait('@getTasks');
    
    // 5. Utworzenie zadania
    const taskName = `E2E Task ${timestamp}`;
    cy.createTask(taskName, 'E2E test task description');
    cy.contains(taskName).should('be.visible');
    
    // 6. Zmiana statusu zadania na "W trakcie"
    cy.changeTaskStatus(taskName, 'doing');
    cy.wait('@updateTask');
    
    // 7. Zmiana statusu zadania na "Ukończone"
    cy.changeTaskStatus(taskName, 'done');
    cy.wait('@updateTask');
    
    // 8. Usunięcie zadania
    cy.contains(taskName).parents('.MuiCard-root').find('[aria-label="Usuń zadanie"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteTask');
    cy.contains(taskName).should('not.exist');
    
    // 9. Powrót do listy historyjek
    cy.contains('Historyjki').click();
    cy.wait('@getStories');
    
    // 10. Usunięcie historyjki
    cy.contains(storyName).parents('.MuiCard-root').find('[aria-label="Usuń historyjkę"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteStory');
    cy.contains(storyName).should('not.exist');
    
    // 11. Przejście do listy projektów
    cy.contains('Projekty').click();
    cy.wait('@getProjects');
    
    // 12. Usunięcie projektu
    cy.contains(projectName).parents('.MuiCard-root').find('[aria-label="Usuń projekt"]').click();
    cy.contains('button', 'Tak, usuń').click();
    cy.wait('@deleteProject');
    cy.contains(projectName).should('not.exist');
  });
});
