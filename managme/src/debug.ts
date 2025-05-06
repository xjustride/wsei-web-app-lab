export function debugApp() {
  console.log("Aplikacja uruchamia się");
  
  try {
    localStorage.setItem('test', 'test');
    console.log('localStorage działa:', localStorage.getItem('test'));
    localStorage.removeItem('test');
  } catch (error) {
    console.error('Błąd localStorage:', error);
  }
  
  // Sprawdzenie wersji React
  try {
    console.log('React jest załadowany');
  } catch (e) {
    console.error('Błąd podczas sprawdzania React:', e);
  }
}
