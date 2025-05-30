// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Konfiguracja tesów e2e
Cypress.on('uncaught:exception', (err, runnable) => {
  // Zapobieganie przerwaniu testów przez nieobsłużone błędy w aplikacji
  // Często przydatne podczas testów e2e, gdy aplikacja może wyrzucić błędy niezwiązane z testami
  console.log('Uncaught exception:', err);
  return false;
});