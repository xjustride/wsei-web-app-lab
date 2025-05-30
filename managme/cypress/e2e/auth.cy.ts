// cypress/e2e/auth.cy.ts
describe('Autentykacja', () => {
  it('Powinien zalogować się jako Administrator', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/projects').as('getProjects');
    
    // Logowanie jako Admin
    cy.login('Admin');
    cy.wait('@loginRequest', { timeout: 15000 });
    cy.wait('@getProjects', { timeout: 15000 });
    
    // Sprawdź, czy jesteśmy zalogowani jako Admin (sprawdzając elementy interfejsu dostępne tylko dla admina)
    cy.get('header').should('be.visible');
    
    // Kliknij w panel użytkownika, aby otworzyć menu
    cy.get('.MuiChip-root').click();
    
    // Sprawdź, czy w menu jest wyświetlana rola Admin
    cy.contains('Rola: Admin').should('be.visible');
    
    // Zamknij menu (kliknij poza menu)
    cy.get('body').click(0, 0);
  });

  it('Powinien mieć dostęp do funkcji administracyjnych', () => {
    cy.intercept('GET', '/api/projects').as('getProjects');
    
    // Logowanie jako Admin
    cy.login('Admin');
    cy.wait('@getProjects', { timeout: 10000 });
    
    // Sprawdź, czy mamy dostęp do funkcji administracyjnych (np. dodawania projektów)
    cy.contains('button', 'Dodaj projekt').should('be.visible').should('not.be.disabled');
    
    // Utwórz projekt testowy
    const projectName = 'Admin Test Project ' + new Date().getTime();
    cy.createProject(projectName, 'Test project description for admin');
    
    // Sprawdź, czy projekt został utworzony
    cy.contains(projectName).should('be.visible');
    
    // Sprawdź, czy mamy dostęp do usuwania projektu (tylko admin powinien mieć taką opcję)
    cy.contains(projectName).parents('.MuiCard-root').find('[aria-label="Usuń projekt"]').should('be.visible');
  });
});
