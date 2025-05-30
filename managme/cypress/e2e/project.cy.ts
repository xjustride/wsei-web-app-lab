// cypress/e2e/project.cy.ts
describe('Zarządzanie projektami', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/projects').as('getProjects');
    cy.intercept('POST', '/api/projects').as('createProject');
    cy.intercept('PUT', '/api/projects/*').as('updateProject');
    cy.intercept('DELETE', '/api/projects/*').as('deleteProject');
    
    // Logowanie przed każdym testem - używamy przycisku Admin
    cy.login('Admin');
    cy.wait('@getProjects', { timeout: 15000 });
    
    // Upewnij się, że jesteśmy w widoku projektów
    cy.contains('button', 'Projekty').click({ force: true });
    cy.wait('@getProjects', { timeout: 10000 });
  });

  it('Powinien utworzyć nowy projekt', () => {
    const projectName = 'Test Project ' + new Date().getTime();
    
    cy.createProject(projectName, 'Test project description');
    
    cy.contains(projectName).should('be.visible');
  });

  it('Powinien edytować istniejący projekt', () => {
    // Najpierw tworzymy projekt do edycji
    const projectName = 'Project to Edit ' + new Date().getTime();
    cy.createProject(projectName, 'Project description before edit');
    cy.contains(projectName).should('be.visible');
    
    // Edytujemy projekt - szukamy przycisku edycji w karcie projektu
    cy.contains('.MuiCard-root, .MuiPaper-root', projectName).within(() => {
      // Kliknij w przycisk menu lub bezpośrednio w przycisk edycji jeśli jest widoczny
      cy.get('button[aria-label="Edytuj projekt"], button[aria-label="Więcej opcji"]').first().click({ force: true });
    });
    
    // Jeśli otworzyło się menu, znajdź i kliknij opcję edycji
    cy.get('body').then($body => {
      if ($body.find('.MuiMenu-paper, .MuiPopover-paper').length > 0) {
        cy.contains('li, button', /Edytuj|Edit/).click({ force: true });
      }
    });
    
    // Formularz edycji
    const updatedName = 'Updated Project ' + new Date().getTime();
    cy.get('input[name="name"]').should('be.visible').clear().type(updatedName);
    cy.get('textarea[name="description"]').should('be.visible').clear().type('Updated project description');
    cy.contains('button', 'Zapisz').click();
    
    cy.wait('@updateProject', { timeout: 10000 });
    cy.contains(updatedName).should('be.visible');
    // Opis może nie być widoczny od razu
    cy.contains(updatedName).parents('.MuiCard-root, .MuiPaper-root').within(() => {
      cy.contains('Updated project description').should('exist');
    });
  });

  it('Powinien usunąć projekt', () => {
    // Najpierw tworzymy projekt do usunięcia
    const projectName = 'Project to Delete ' + new Date().getTime();
    cy.createProject(projectName, 'This project will be deleted');
    
    // Usuwamy projekt
    cy.contains(projectName).parents('.MuiCard-root').find('[aria-label="Usuń projekt"]').click();
    
    // Potwierdzenie usunięcia
    cy.contains('button', 'Tak, usuń').click();
    
    cy.wait('@deleteProject');
    cy.contains(projectName).should('not.exist');
  });
});
