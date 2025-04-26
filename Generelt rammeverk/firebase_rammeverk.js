// === Firebase-tilkobling ===
// Importer nødvendige Firebase-moduler
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔐 Fyll inn din egen Firebase-konfigurasjon her
const firebaseConfig = {
    apiKey: "DIN_API_KEY",
    authDomain: "DITT_DOMENE.firebaseapp.com",
    projectId: "DITT_PROSJEKT_ID",
    storageBucket: "DITT_STORAGE_BUCKET",
    messagingSenderId: "DIN_SENDER_ID",
    appId: "DIN_APP_ID"
};

// 🔄 Initialiser Firebase og Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Funksjoner ===

// 📥 Hent alle dokumenter fra valgt samling
async function hentDokumenter(samling) {
    try {
        const snapshot = await getDocs(collection(db, samling));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Feil ved henting:", error);
        return [];
    }
}

// ➕ Legg til nytt dokument i valgt samling
async function leggTilDokument(samling, data) {
    try {
        await addDoc(collection(db, samling), data);
        console.log("Dokument lagt til.");
    } catch (error) {
        console.error("Feil ved lagring:", error);
    }
}

// ❌ Slett dokument fra samling
async function slettDokument(samling, id) {
    try {
        await deleteDoc(doc(db, samling, id));
        console.log("Dokument slettet.");
    } catch (error) {
        console.error("Feil ved sletting:", error);
    }
}

// 🔁 Vis alle dokumenter og oppdater automatisk ved endringer
function visDokumenterLive(samling, visningsfunksjon) {
    onSnapshot(collection(db, samling), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        visningsfunksjon(data);
    });
}

export {
    hentDokumenter,
    leggTilDokument,
    slettDokument,
    visDokumenterLive
};
