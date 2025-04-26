import { hentDokumenter, leggTilDokument, slettDokument, visDokumenterLive, hentDokument } from "./firebase_rammeverk.js";

// Global variables
const samlingNavn = "cars";
const listeContainer = document.getElementById("kort-container");
let allBiler = [];

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
    // Determine which page we're on and initialize accordingly
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path.endsWith('/')) {
        initializeMainPage();
    } else if (path.endsWith('bil.html')) {
        initializeCarDetailPage();
    }
});

// Main page initialization
function initializeMainPage() {
    visDokumenterLive(visBiler);
    setupMainPageListeners();
    setupFilterForm();
}

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
                document.getElementById('bil-container').innerHTML = `
                    <p>Error: ${err.message}</p>
                `;
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
        <h2>${bil.merke} ${bil.modell}</h2>
        <img src="./Bilder/${bil.id}.jpg" alt="Car image" style="max-width: 100%;">
        <p>Årsmodell: ${bil.aarsmodell}</p>
        <p>Drivstoff: ${bil.drivstoff}</p>
        <p>Farge: ${bil.farge}</p>
        <p>Reg.nr: ${bil.regnr}</p>
        <p>Kilometer: ${bil.kmavstand}</p>
        <p>Pris: ${bil.pris} kr</p>
        <h3>Beskrivelse:</h3>
        <p>${bil.beskrivelse}</p>
        <button class="kontakt">Kontakt selger</button>
        <button class="slett" onclick="slettBil('${bil.id}')">Slett bil</button>
        <button class="lukk" id="lukk">Lukk</button>
        
    `;

    document.getElementById('tittel').textContent = `${bil.merke} ${bil.modell} | Autonett`;
}

// Form handling
function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        merke: document.getElementById("merke").value.trim(),
        modell: document.getElementById("modell").value.trim(),
        regnr: document.getElementById("regnr").value.trim(),
        aarsmodell: document.getElementById("aar").value.trim(),
        kmavstand: document.getElementById("km").value.trim(),
        drivstoff: document.getElementById("drivstoff").value.trim(),
        farge: document.getElementById("farge").value.trim(),
        pris: document.getElementById("pris").value.trim(),
        beskrivelse: document.getElementById("beskrivelse").value.trim()
    };

    try {
        leggTilDokument(formData);
        e.target.reset();
        alert("Bilen ble lagt til!");
    } catch (error) {
        console.error("Feil ved lagring:", error);
        alert("Kunne ikke legge til bilen. Prøv igjen.");
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
        pris: document.getElementById("filter-pris")?.value
    };

    const filteredBiler = allBiler.filter(bil => {
        return (!filters.merke || bil.merke.toLowerCase().includes(filters.merke)) &&
               (!filters.modell || bil.modell.toLowerCase().includes(filters.modell)) &&
               (!filters.aar || bil.aarsmodell == filters.aar) &&
               (!filters.drivstoff || bil.drivstoff.toLowerCase() === filters.drivstoff) &&
               (!filters.pris || parseInt(bil.pris) <= parseInt(filters.pris));
    });

    visBiler(filteredBiler);
}