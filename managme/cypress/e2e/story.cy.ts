// cypress/e2e/story.cy.ts
describe('Zarządzanie historyjkami', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/projects').as('getProjects');
    cy.intercept('GET', '/api/stories*').as('getStories');
    cy.intercept('POST', '/api/stories').as('createStory');
    cy.intercept('PUT', '/api/stories/*').as('updateStory');
    cy.intercept('DELETE', '/api/stories/*').as('deleteStory');
    
    // Logowanie przed każdym testem - używamy przycisku Admin
    cy.login('Admin');
    cy.wait('@getProjects', { timeout: 15000 });
    
    // Upewnijmy się, że mamy wybrany projekt - jeśli jest dropdown wyboru projektu
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Wybierz aktywny projekt"]').length > 0) {
        cy.get('[aria-label="Wybierz aktywny projekt"]').click();
        cy.get('[role="listbox"]').find('li').first().click();
      } else if ($body.find('.MuiCard-root').length > 0) {
        // Jeśli nie ma selektora, ale są karty projektów, kliknij w pierwszą
        cy.get('.MuiCard-root').first().click();
      }
      cy.wait('@getStories', { timeout: 10000 });
    });
  });

  it('Powinien utworzyć nową historyjkę', () => {
    const storyName = 'Test Story ' + new Date().getTime();
    
    cy.createStory(storyName, 'Test story description');
    
    cy.contains(storyName).should('be.visible');
  });

  it('Powinien edytować istniejącą historyjkę', () => {
    // Najpierw tworzymy historyjkę do edycji
    const storyName = 'Story to Edit ' + new Date().getTime();
    cy.createStory(storyName, 'Story description before edit');
    cy.contains(storyName).should('be.visible');
    
    // Edytujemy historyjkę - szukamy przycisku edycji w karcie historyjki
    cy.contains('.MuiCard-root, .MuiPaper-root', storyName).within(() => {
      // Kliknij w przycisk menu lub bezpośrednio w przycisk edycji jeśli jest widoczny
      cy.get('button[aria-label="Edytuj historyjkę"], button[aria-label="Więcej opcji"]').first().click({ force: true });
    });
    
    // Jeśli otworzyło się menu, znajdź i kliknij opcję edycji
    cy.get('body').then($body => {
      if ($body.find('.MuiMenu-paper, .MuiPopover-paper').length > 0) {
        cy.contains('li, button', /Edytuj|Edit/).click({ force: true });
      }
    });
    
    // Formularz edycji
    const updatedName = 'Updated Story ' + new Date().getTime();
    cy.get('input[name="name"]').should('be.visible').clear().type(updatedName);
    cy.get('textarea[name="description"]').should('be.visible').clear().type('Updated story description');
    cy.contains('button', 'Zapisz').click();
    
    cy.wait('@updateStory', { timeout: 10000 });
    cy.contains(updatedName).should('be.visible');
  });

  it('Powinien usunąć historyjkę', () => {
    // Najpierw tworzymy historyjkę do usunięcia
    const storyName = 'Story to Delete ' + new Date().getTime();
    cy.createStory(storyName, 'This story will be deleted');
    cy.contains(storyName).should('be.visible');
    
    // Usuwamy historyjkę - szukamy przycisku usuwania w karcie historyjki
    cy.contains('.MuiCard-root, .MuiPaper-root', storyName).within(() => {
      // Kliknij w przycisk menu lub bezpośrednio w przycisk usuwania jeśli jest widoczny
      cy.get('button[aria-label="Usuń historyjkę"], button[aria-label="Więcej opcji"]').first().click({ force: true });
    });
    
    // Jeśli otworzyło się menu, znajdź i kliknij opcję usunięcia
    cy.get('body').then($body => {
      if ($body.find('.MuiMenu-paper, .MuiPopover-paper').length > 0) {
        cy.contains('li, button', /Usuń|Delete/).click({ force: true });
      }
    });
    
    // Potwierdzenie usunięcia w dialogu
    cy.contains('button', /Tak, usuń|Usuń|Potwierdź|Yes/).click({ force: true });
    
    cy.wait('@deleteStory', { timeout: 10000 });
    cy.contains(storyName).should('not.exist');
  });
});
