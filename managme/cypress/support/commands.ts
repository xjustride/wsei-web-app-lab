/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';

// Logowanie użytkownika
Cypress.Commands.add('login', (userType = 'Admin') => {
  cy.intercept('POST', '/api/auth/login').as('loginRequest');
  cy.visit('/', { timeout: 10000 });
  
  // Poczekaj na załadowanie elementów formularza logowania, ale bez sztywnego wyszukiwania konkretnych tekstów
  cy.get('button', { timeout: 15000 }).should('exist');
  
  // Sprawdź, czy są dostępne przyciski demo, dając stronie czas na załadowanie
  cy.get('body').then($body => {
    // Metoda 1: Próbuj znaleźć przyciski demo i kliknij odpowiedni
    if ($body.find(`button:contains("${userType}")`).length > 0) {
      cy.contains('button', userType, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });
    } 
    // Metoda 2: Jeśli nie ma przycisków demo, próbuj wypełnić formularz logowania
    else {
      // Mapowanie typów użytkowników na dane logowania
      const userCredentials = {
        'Admin': { email: 'admin@example.com', password: 'admin123' },
        'Developer': { email: 'developer@example.com', password: 'developer123' },
        'DevOps': { email: 'devops@example.com', password: 'devops123' }
      };
      
      // Wprowadź email
      cy.get('input[type="email"]').should('be.visible').type(userCredentials[userType].email);
      
      // Wprowadź hasło
      cy.get('input[type="password"]').should('be.visible').type(userCredentials[userType].password);
      
      // Kliknij przycisk logowania
      cy.contains('button', /Zaloguj|Login/).click({ force: true });
    }
  });
  
  // Poczekaj na odpowiedź z serwera
  cy.wait('@loginRequest', { timeout: 15000 });
  
  // Sprawdź czy jesteśmy zalogowani - powinny być widoczne projekty lub tablica zadań
  cy.get('header', { timeout: 15000 }).should('be.visible');
});

// Tworzenie projektu
Cypress.Commands.add('createProject', (name = 'Test Project', description = 'Test project description') => {
  cy.intercept('POST', '/api/projects').as('createProject');
  cy.get('button').contains('Dodaj projekt').click();
  cy.get('input[name="name"]').should('be.visible').clear().type(name);
  cy.get('textarea[name="description"]').should('be.visible').clear().type(description);
  cy.contains('button', 'Zapisz').click();
  cy.wait('@createProject', { timeout: 10000 });
  cy.contains(name).should('be.visible');
});

// Tworzenie historyjki
Cypress.Commands.add('createStory', (name = 'Test Story', description = 'Test story description') => {
  cy.intercept('POST', '/api/stories').as('createStory');
  
  // Upewniamy się, że jesteśmy w widoku historyjek
  cy.contains('button', 'Historyjki').click({ force: true });
  cy.contains('button', 'Dodaj historyjkę').click();
  cy.get('input[name="name"]').should('be.visible').clear().type(name);
  cy.get('textarea[name="description"]').should('be.visible').clear().type(description);
  
  // Wybierz Medium Priority jeśli pole wyboru jest widoczne
  cy.get('select[name="priority"]').then($select => {
    if ($select.length) {
      cy.wrap($select).select('MEDIUM');
    }
  });
  
  cy.contains('button', 'Zapisz').click();
  cy.wait('@createStory', { timeout: 10000 });
  cy.contains(name).should('be.visible');
});

// Tworzenie zadania
Cypress.Commands.add('createTask', (name = 'Test Task', description = 'Test task description') => {
  cy.intercept('POST', '/api/tasks').as('createTask');
  
  // Upewnij się, że jesteśmy w widoku tablicy zadań
  cy.contains('button', 'Tablica zadań').click({ force: true });
  cy.contains('button', 'Dodaj zadanie').click();
  
  // Wypełnij formularz
  cy.get('input[name="name"]').should('be.visible').clear().type(name);
  cy.get('textarea[name="description"]').should('be.visible').clear().type(description);
  
  // Wybierz priorytet jeśli pole jest dostępne
  cy.get('select[name="priority"]').then($select => {
    if ($select.length) {
      cy.wrap($select).select('MEDIUM');
    }
  });
  
  // Wybierz historyjkę jeśli pole jest dostępne
  cy.get('select[name="storyId"]').then($select => {
    if ($select.length) {
      cy.wrap($select).select(1);
    }
  });
  
  // Szacowany czas
  cy.get('input[name="estimatedTime"]').then($input => {
    if ($input.length) {
      cy.wrap($input).clear().type('2');
    }
  });
  
  cy.contains('button', 'Zapisz').click();
  cy.wait('@createTask', { timeout: 10000 });
  
  // Sprawdź czy zadanie jest widoczne w jednej z kolumn
  cy.contains(name).should('be.visible');
});

// Zmiana statusu zadania
Cypress.Commands.add('changeTaskStatus', (taskName, newStatus) => {
  cy.intercept('PUT', '/api/tasks/*').as('updateTaskStatus');
  
  // Znajdź kartę zadania po nazwie
  cy.contains('.MuiCard-root, .MuiPaper-root', taskName).within(() => {
    if (newStatus === 'doing') {
      // Szukaj przycisku z ikoną lub tekstem do zmiany na "W trakcie"
      cy.get('button').contains('Rozpocznij').click({ force: true });
    } else if (newStatus === 'done') {
      // Szukaj przycisku z ikoną lub tekstem do zmiany na "Ukończone"
      cy.get('button').contains('Zakończ').click({ force: true });
    } else if (newStatus === 'todo') {
      // Szukaj przycisku powrotu do "Do zrobienia"
      cy.get('button').contains(/Resetuj|Przywróć/).click({ force: true });
    }
  });
  
  // Poczekaj na aktualizację API
  cy.wait('@updateTaskStatus', { timeout: 10000 });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(userType?: 'Admin' | 'Developer' | 'DevOps'): Chainable<void>
      createProject(name?: string, description?: string): Chainable<void>
      createStory(name?: string, description?: string): Chainable<void>
      createTask(name?: string, description?: string): Chainable<void>
      changeTaskStatus(taskName: string, newStatus: 'todo' | 'doing' | 'done'): Chainable<void>
    }
  }
}