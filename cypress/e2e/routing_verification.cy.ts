describe('ZooL ACCUCARE Routing Verification', () => {
  beforeEach(() => {
    // Visit the live Vercel deployment URL
    cy.visit(Cypress.env('PRODUCTION_URL')); 
  });

  it('should render the premium login view by default', () => {
    cy.get('h1').contains('ZooL Platform').should('be.visible');
    cy.get('button').contains('Continue with Google').should('be.visible');
  });

  it('should block unauthorized access to protected routes', () => {
    // Attempting to force-navigate to the clinician dashboard without auth
    cy.visit(`${Cypress.env('PRODUCTION_URL')}/clinician-dashboard`, { failOnStatusCode: false });
    // The router guard should immediately bounce the user back to the login screen
    cy.get('h1').contains('ZooL Platform').should('be.visible');
  });
});
