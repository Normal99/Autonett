// --- FIREBASE IMPORTS & SETUP ---
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

// --- FIRESTORE HELPERS ---
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

// --- APP/UI LOGIC ---
const samlingNavn = "cars";
const listeContainer = document.getElementById("kort-container");
let allBiler = [];

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) {
        initializeMainPage();
    } else if (path.endsWith('bil.html')) {
        initializeCarDetailPage();
    }
});


// Car detail page initialization
function initializeCarDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');
    if (carId) {
        hentDokument("cars", carId)
            .then(bil => {
                displayCarDetails(bil);
                setupContactForm();
            })
            .catch(err => {
                document.getElementById('bil-container').innerHTML = `<p>Error: ${err.message}</p>`;
            });
    }
}

// Display functions
function visBiler(biler) {
    if (!listeContainer) return;
    listeContainer.innerHTML = "";
    biler.forEach(bil => {
        listeContainer.innerHTML += `
            <a href="bil.html?id=${bil.id}" class="kort">
                <img src="./Bilder/${bil.id}.jpg" alt="${bil.merke} ${bil.modell}" style="object-fit: cover;">
                <div>
                    <h3>${bil.merke} ${bil.modell}</h3>
                    <p>Årsmodell: ${bil.aarsmodell}</p>
                    <p>Drivstoff: ${bil.drivstoff}</p>
                    <p>Kilometer: ${bil.kmavstand}</p>
                    <p>Pris: ${bil.pris} kr</p>
                </div>
            </a>
        `;
    });
}

function displayCarDetails(bil) {
    const bilContainer = document.getElementById('bil-container');
    if (!bilContainer) return;
    bilContainer.innerHTML = `
        <a href="index.html" class="tilbake">Tilbake</a>
        <img src="./Bilder/${bil.id}.jpg" alt="Car image" style="max-width: 100%;">
        <h2>${bil.merke} ${bil.modell}</h2>
        <div class="car-info-icons">
            <p>
                <span class="material-icons" style="vertical-align: middle;">calendar_today</span>
                Årsmodell: ${bil.aarsmodell}
            </p>
            <p>
                <span class="material-icons" style="vertical-align: middle;">local_gas_station</span>
                Drivstoff: ${bil.drivstoff}
            </p>
            <p>
                <span class="material-icons" style="vertical-align: middle;">speed</span>
                Kilometerstand: ${bil.kmavstand} km
            </p>
            <p>
                <span class="material-icons" style="vertical-align: middle;">attach_money</span>
                Pris: ${bil.pris} kr
            </p>
        </div>
                <h3>Beskrivelse:</h3>
        <p>${bil.beskrivelse}</p>
        <h3>Detaljer:</h3>
        <div class="car-extra-details">
            <p><strong>Girkasse:</strong> ${bil.girkasse || '-'}</p>
            <p><strong>Hjuldrift:</strong> ${bil.hjuldrift || '-'}</p>
            <p><strong>Effekt:</strong> ${bil.effekt ? bil.effekt + ' hk' : '-'}</p>
            <p><strong>Sylindervolum:</strong> ${bil.sylindervolum ? bil.sylindervolum + ' L' : '-'}</p>
            <p><strong>Vekt:</strong> ${bil.vekt ? bil.vekt + ' kg' : '-'}</p>
            <p><strong>CO2-utslipp:</strong> ${bil.co2 ? bil.co2 + ' g/km' : '-'}</p>
            <p><strong>Antall seter:</strong> ${bil.seter || '-'}</p>
            <p><strong>Antall dører:</strong> ${bil.dorer || '-'}</p>
            <p><strong>Servicehistorikk:</strong> ${bil.servicehistorikk || '-'}</p>
            <p><strong>Neste EU-kontroll:</strong> ${bil.eu_kontroll || '-'}</p>
            <p><strong>Farge:</strong> ${bil.farge || '-'}</p>
            <p><strong>Registreringsnummer:</strong> ${bil.regnr || '-'}</p>
            <p><strong>Garanti:</strong> ${bil.garanti ? bil.garanti + ' mnd' : '-'}</p>
        </div>
        <h3>Utstyr:</h3>
        <div>
            ${bil.utstyr && Array.isArray(bil.utstyr) ? bil.utstyr.map(u => `<p>${u}</p>`).join('') : '<p>-</p>'}
        </div>
        <button class="kontakt">Kontakt selger</button>
        <p><strong>Telefon:</strong> ${bil.tlf || '-'}</p>
        <button class="rediger" onclick="window.location.href='leggtil.html?id=${bil.id}'" style="margin-top: 5px;">Rediger bil</button>
        <button class="slett" onclick="slettBil('${bil.id}')" style="margin-top: 5px;">Slett bil</button>
    `;
    document.getElementById('tittel').textContent = `${bil.merke} ${bil.modell} | Autonett`;
}

// Form handling
async function handleFormSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const formData = {
        merke: document.getElementById("merke").value.trim(),
        modell: document.getElementById("modell").value.trim(),
        regnr: document.getElementById("regnr").value.trim(),
        aarsmodell: document.getElementById("aar").value.trim(),
        kmavstand: document.getElementById("km").value.trim(),
        drivstoff: document.getElementById("drivstoff").value.trim(),
        farge: document.getElementById("farge").value.trim(),
        pris: document.getElementById("pris").value.trim(),
        beskrivelse: document.getElementById("beskrivelse").value.trim(),
        girkasse: document.getElementById("girkasse").value.trim(),
        hjuldrift: document.getElementById("hjuldrift").value.trim(),
        effekt: document.getElementById("effekt").value.trim(),
        sylindervolum: document.getElementById("sylindervolum").value.trim(),
        vekt: document.getElementById("vekt").value.trim(),
        co2: document.getElementById("co2").value.trim(),
        seter: document.getElementById("seter").value.trim(),
        dorer: document.getElementById("dorer").value.trim(),
        utstyr: document.getElementById("utstyr").value.trim().split(',').map(e => e.trim()),
        servicehistorikk: document.getElementById("servicehistorikk").value,
        eu_kontroll: document.getElementById("eu_kontroll").value,
        garanti: document.getElementById("garanti").value.trim(),           // <-- NYTT
        tlf: document.getElementById("tlf").value.trim()                    // <-- NYTT
    };
    try {
        if (id) {
            // Oppdater eksisterende bil
            await oppdaterDokument(id, formData);
            alert("Bilen ble oppdatert!");
        } else {
            // Legg til ny bil
            await leggTilDokument(formData);
            alert("Bilen ble lagt til!");
        }
        e.target.reset();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Feil ved lagring:", error);
        alert("Kunne ikke lagre bilen. Prøv igjen.");
    }
}

// Contact form handling
function setupContactForm() {
    const kontaktBtn = document.querySelector('.kontakt');
    const contactModal = document.getElementById('ContactModal');
    const closeBtn = document.getElementById('closeContactModal');
    if (kontaktBtn && contactModal) {
        kontaktBtn.onclick = () => contactModal.style.display = 'block';
    }
    if (closeBtn) {
        closeBtn.onclick = () => contactModal.style.display = 'none';
    }
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.onsubmit = (e) => {
            e.preventDefault();
            // Handle contact form submission here
            contactModal.style.display = 'none';
        };
    }
}

// Event listeners setup
function setupMainPageListeners() {
    const skjema = document.getElementById("skjema");
    if (skjema) {
        skjema.addEventListener("submit", handleFormSubmit);
    }
    const leggTilBtn = document.getElementById("LeggTilModalKnapp");
    if (leggTilBtn) {
        leggTilBtn.addEventListener("click", () => showCarModal('add'));
    }
    const lukkBtn = document.getElementById("lukk");
    if (lukkBtn) {
        lukkBtn.addEventListener("click", () => showCarModal('close'));
    }
}

function setupSearch() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filteredBiler = allBiler.filter(bil =>
        bil.merke.toLowerCase().includes(query) ||
        bil.modell.toLowerCase().includes(query) ||
        (bil.beskrivelse && bil.beskrivelse.toLowerCase().includes(query))
    );
    visBiler(filteredBiler);
}

// Filter functionality
function setupFilterForm() {
    const filterForm = document.getElementById("filter-form");
    if (filterForm) {
        filterForm.addEventListener("submit", handleFilter);
    }
}

function handleFilter(e) {
    e.preventDefault();
    const filters = {
        merke: document.getElementById("filter-merke")?.value.toLowerCase(),
        modell: document.getElementById("filter-modell")?.value.toLowerCase(),
        aar: document.getElementById("filter-aar")?.value,
        drivstoff: document.getElementById("filter-drivstoff")?.value.toLowerCase(),
        prismax: document.getElementById("filter-pris-max")?.value,
        prismin: document.getElementById("filter-pris-min")?.value
    };
    const filteredBiler = allBiler.filter(bil => {
        return (!filters.merke || bil.merke.toLowerCase().includes(filters.merke)) &&
               (!filters.modell || bil.modell.toLowerCase().includes(filters.modell)) &&
               (!filters.aar || bil.aarsmodell == filters.aar) &&
               (!filters.drivstoff || bil.drivstoff.toLowerCase() === filters.drivstoff) &&
               (!filters.prismax || parseInt(bil.pris) <= parseInt(filters.prismax)) &&
               (!filters.prismin || parseInt(bil.pris) > parseInt(filters.prismin));
    });
    visBiler(filteredBiler);
}

function showCarModal(action) {
    const modal = document.getElementById("Modal");
    if (!modal) return;
    if (action === 'add') {
        modal.style.display = "block";
    } else if (action === 'close') {
        modal.style.display = "none";
    }
}
function setupVegvesenAutoFill() {
    const hentBtn = document.getElementById("hent-vegvesen");
    if (!hentBtn) return;

    hentBtn.addEventListener("click", async function() {
        const regnrInput = document.getElementById("regnr");
        if (!regnrInput) return;
        const regnr = regnrInput.value.trim().toUpperCase();
        if (!regnr) {
            alert("Skriv inn registreringsnummer");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/vegvesen?regnr=' + regnr);
            if (!response.ok) throw new Error("Fant ikke kjøretøydata");
            const data = await response.json();

            // Fyll ut feltene
            for (const key in data) {
                const input = document.getElementById(key);
                if (input) input.value = data[key];
            }
        } catch (err) {
            alert("Kunne ikke hente data fra Statens Vegvesen.");
            console.error(err);
        }
    });
}

// ...eksisterende kode...

async function fyllUtSkjemaForRedigering() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    try {
        const bil = await hentDokument("cars", id);
        // Sett verdier i skjemaet
        for (const key in bil) {
            const input = document.getElementById(key);
            if (input) {
                if (input.type === "checkbox") {
                    input.checked = !!bil[key];
                } else if (input.tagName === "SELECT") {
                    input.value = bil[key];
                } else if (input.tagName === "TEXTAREA") {
                    input.value = bil[key];
                } else {
                    input.value = bil[key];
                }
            }
        }
    } catch (err) {
        alert("Kunne ikke hente bil for redigering.");
        console.error(err);
    }
}

// Kjør denne på leggtil.html
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    if (path.endsWith('leggtil.html')) {
        setupMainPageListeners();
        setupVegvesenAutoFill();
        fyllUtSkjemaForRedigering(); // <-- Legg til denne linjen!
    }
});

function initializeMainPage() {
    visDokumenterLive((biler) => {
        allBiler = biler;
        visBiler(biler);
    });
    setupMainPageListeners();
    setupFilterForm();
    setupSearch();
    setupVegvesenAutoFill(); // <-- Add this line
}

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) {
        initializeMainPage();
    } else if (path.endsWith('bil.html')) {
        initializeCarDetailPage();
    } else if (path.endsWith('leggtil.html')) {
        setupMainPageListeners();
        setupVegvesenAutoFill(); // <-- Legg til denne linjen!
    }
});

window.slettBil = async function slettBil(id) {
    if (!confirm("Er du sikker på at du vil slette denne bilen?")) return;
    try {
        await slettDokument(id);
        alert("Bilen ble slettet!");
        window.location.href = "index.html";
    } catch (error) {
        alert("Kunne ikke slette bilen.");
        console.error(error);
    }
};

import { updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

async function oppdaterDokument(id, data) {
    try {
        const docRef = doc(db, "cars", id);
        await updateDoc(docRef, data);
        console.log("Bil oppdatert i databasen.");
    } catch (error) {
        console.error("Feil ved oppdatering av bil:", error);
    }
}

// Optional: Add any additional helpers or exports here if you want to split later