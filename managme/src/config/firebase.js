import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Konfiguracja Firebase - użyj swoich kluczy z Firebase Console
const firebaseConfig = {
    apiKey: "demo-api-key", // Zastąp właściwym kluczem
    authDomain: "managme-demo.firebaseapp.com", // Zastąp właściwą domeną
    projectId: "managme-demo", // Zastąp właściwym ID projektu
    storageBucket: "managme-demo.appspot.com", // Zastąp właściwym bucket
    messagingSenderId: "123456789", // Zastąp właściwym ID
    appId: "1:123456789:web:abcdef123456" // Zastąp właściwym ID aplikacji
};
// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
// Inicjalizacja Firestore
export const db = getFirestore(app);
// Inicjalizacja Auth
export const auth = getAuth(app);
// Konfiguracja dla środowiska deweloperskiego (opcjonalne)
// Odkomentuj poniższe linie jeśli chcesz używać emulatorów Firebase
// if (location.hostname === 'localhost') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }
export default app;
