// cypress/e2e/task.cy.ts
describe('Zarządzanie zadaniami', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/projects').as('getProjects');
    cy.intercept('GET', '/api/tasks*').as('getTasks');
    cy.intercept('POST', '/api/tasks').as('createTask');
    cy.intercept('PUT', '/api/tasks/*').as('updateTask');
    cy.intercept('DELETE', '/api/tasks/*').as('deleteTask');
    
    // Logowanie przed każdym testem - używamy przycisku Admin
    cy.login('Admin');
    cy.wait('@getProjects', { timeout: 15000 });
    
    // Jeśli projekt jeszcze nie jest wybrany, wybierz pierwszy dostępny
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Wybierz aktywny projekt"]').length > 0) {
        cy.get('[aria-label="Wybierz aktywny projekt"]').click();
        cy.get('[role="listbox"]').find('li').first().click();
      } else if ($body.find('.MuiCard-root').length > 0 && !$body.text().includes('Tablica zadań')) {
        // Jeśli nie ma selektora, ale są karty projektów, kliknij w pierwszą
        cy.get('.MuiCard-root').first().click();
      }
    });
    
    // Przejdź do widoku Kanban z zadaniami
    cy.contains('button', 'Tablica zadań').click({ force: true });
    cy.wait('@getTasks', { timeout: 10000 });
  });

  it('Powinien utworzyć nowe zadanie', () => {
    const taskName = 'Test Task ' + new Date().getTime();
    
    cy.createTask(taskName, 'Test task description');
    
    cy.contains(taskName).should('be.visible');
  });

  it('Powinien edytować istniejące zadanie', () => {
    // Najpierw tworzymy zadanie do edycji
    const taskName = 'Task to Edit ' + new Date().getTime();
    cy.createTask(taskName, 'Task description before edit');
    
    // Otwieramy szczegóły zadania, klikając w kartę
    cy.contains(taskName).click();
    
    // Klikamy przycisk edycji
    cy.get('[aria-label="Edytuj zadanie"]').click();
    
    // Edytujemy zadanie
    const updatedName = 'Updated Task ' + new Date().getTime();
    cy.get('input[name="name"]').clear().type(updatedName);
    cy.get('textarea[name="description"]').clear().type('Updated task description');
    cy.contains('button', 'Zapisz').click();
    
    cy.wait('@updateTask');
    cy.contains(updatedName).should('be.visible');
  });

  it('Powinien zmienić status zadania', () => {
    // Najpierw tworzymy zadanie do zmiany statusu
    const taskName = 'Task to Change Status ' + new Date().getTime();
    cy.createTask(taskName, 'This task will change status');
    
    // Zmieniamy status na "W trakcie"
    cy.changeTaskStatus(taskName, 'doing');
    cy.wait('@updateTask');
    
    // Sprawdzamy czy zadanie jest w kolumnie "W trakcie"
    cy.get('.MuiGrid-item').eq(1).within(() => {
      cy.contains(taskName).should('be.visible');
    });
    
    // Zmieniamy status na "Ukończone"
    cy.changeTaskStatus(taskName, 'done');
    cy.wait('@updateTask');
    
    // Sprawdzamy czy zadanie jest w kolumnie "Ukończone"
    cy.get('.MuiGrid-item').eq(2).within(() => {
      cy.contains(taskName).should('be.visible');
    });
  });

  it('Powinien usunąć zadanie', () => {
    // Najpierw tworzymy zadanie do usunięcia
    const taskName = 'Task to Delete ' + new Date().getTime();
    cy.createTask(taskName, 'This task will be deleted');
    
    // Usuwamy zadanie
    cy.contains(taskName).parents('.MuiCard-root').find('[aria-label="Usuń zadanie"]').click();
    
    // Potwierdzenie usunięcia
    cy.contains('button', 'Tak, usuń').click();
    
    cy.wait('@deleteTask');
    cy.contains(taskName).should('not.exist');
  });

  it('Powinien przeciągnąć i upuścić zadanie do innej kolumny', () => {
    // Najpierw tworzymy zadanie do przeciągnięcia
    const taskName = 'Task to Drag ' + new Date().getTime();
    cy.createTask(taskName, 'This task will be dragged');
    
    // Tutaj musielibyśmy użyć mocniejszego rozwiązania dla drag & drop
    // Cypress ma problemy z rzeczywistym drag & drop, więc możemy oszukać i zasymulować zmianę statusu
    cy.contains(taskName)
      .parents('.MuiCard-root')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 600, clientY: 0 }) // Przesunięcie do kolumny "W trakcie"
      .trigger('mouseup');
      
    // Weryfikacja czy zdarzenie zostało wywołane
    cy.wait('@updateTask');
    
    // Weryfikacja czy po przeciągnięciu zadanie znajduje się w kolumnie "W trakcie"
    cy.get('.MuiGrid-item').eq(1).within(() => {
      cy.contains(taskName).should('be.visible');
    });
  });
});
