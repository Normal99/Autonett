import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    onSnapshot,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDzthphp2d-JxYbLqOL73L-ZWRRZV9GGIA",
    authDomain: "autonett-e35d7.firebaseapp.com",
    projectId: "autonett-e35d7",
    storageBucket: "autonett-e35d7.firebasestorage.app",
    messagingSenderId: "359038789930",
    appId: "1:359038789930:web:f8bfd4e37d75c607d51653"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const carsCollection = collection(db, "cars");

async function hentDokumenter() {
    try {
        const snapshot = await getDocs(carsCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Feil ved henting av biler:", error);
        return [];
    }
}

async function leggTilDokument(data) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Data må være et objekt');
        }
        await addDoc(carsCollection, data);
        console.log("Bil lagt til i databasen.");
    } catch (error) {
        console.error("Feil ved lagring av bil:", error);
    }
}

async function slettDokument(id) {
    try {
        await deleteDoc(doc(db, "cars", id));
        console.log("Bil slettet fra databasen.");
    } catch (error) {
        console.error("Feil ved sletting av bil:", error);
    }
}

function visDokumenterLive(visningsfunksjon) {
    if (typeof visningsfunksjon !== 'function') {
        console.error('visDokumenterLive krever en funksjon som parameter');
        return;
    }
    return onSnapshot(carsCollection, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        visningsfunksjon(data);
    });
}

// New helper to fetch a single document
async function hentDokument(collectionName, id) {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("No such document!");
        }
    } catch (error) {
        console.error("Feil ved henting av dokument:", error);
        throw error;
    }
}

export {
    hentDokumenter,
    leggTilDokument,
    slettDokument,
    visDokumenterLive,
    hentDokument  // export the new function
};