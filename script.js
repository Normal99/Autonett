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
    getDoc,
    updateDoc
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
        alert("Feil ved lagring av bil: " + error.message);
        throw error;
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

async function oppdaterDokument(id, data) {
    try {
        const docRef = doc(db, "cars", id);
        await updateDoc(docRef, data);
        console.log("Bil oppdatert i databasen.");
    } catch (error) {
        console.error("Feil ved oppdatering av bil:", error);
        throw error;
    }
}

// --- APP/UI LOGIC ---
const samlingNavn = "cars";
const listeContainer = document.getElementById("kort-container");
let allBiler = [];

// Main initialization
document.addEventListener("DOMContentLoaded", runPageInit);

// --- PAGE INITIALIZATION ---
function runPageInit() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) {
        initializeMainPage();
    } else if (path.endsWith('bil.html')) {
        initializeCarDetailPage();
    } else if (path.endsWith('leggtil.html')) {
        setupMainPageListeners();
        setupVegvesenAutoFill();
        fyllUtSkjemaForRedigering();
        setupLeggTilImageEditing(); // <-- ADD THIS LINE
    }
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
                document.getElementById('bil-container').innerHTML = `<p>Error: ${err.message}</p>`;
            });
    }
}

// Display functions
function visBiler(biler) {
    if (!listeContainer) return;
    listeContainer.innerHTML = "";
    biler.forEach(bil => {
        // Use the first image if available, otherwise fallback to default
        let imageSrc = "./Bilder/default.jpg";
        if (bil.images && Array.isArray(bil.images) && bil.images.length > 0) {
            imageSrc = "./Bilder/" + bil.images[0];
        }
        listeContainer.innerHTML += `
            <a href="bil.html?id=${bil.id}" class="kort">
                <img src="${imageSrc}" alt="${bil.merke} ${bil.modell}" style="object-fit: cover;">
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
    // Prepare images
    let images = (bil.images && Array.isArray(bil.images) && bil.images.length > 0)
        ? bil.images
        : ['default.jpg'];
    // Main image and thumbnails
    let galleryHtml = `
        <div id="image-gallery">
            <img id="main-bil-image" src="./Bilder/${images[0]}" alt="Car image" style="max-width: 100%; margin-bottom: 10px;">
            <div id="thumbnail-row" style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${images.map((img, idx) => `
                    <img src="./Bilder/${img}" alt="Bilde ${idx+1}" class="thumbnail-img" data-idx="${idx}" style="width: 80px; height: 60px; object-fit: cover; cursor: pointer; border: 2px solid #ccc;">
                `).join('')}
            </div>
        </div>
    `;
    // Edit mode button
    let editImagesBtn = `<button id="edit-images-btn" style="margin: 10px 0;">Rediger bilder</button>`;
    bilContainer.innerHTML = `
        <a href="index.html" class="tilbake">Tilbake</a>
        ${galleryHtml}
        ${editImagesBtn}
        <h2>${bil.merke} ${bil.modell}</h2>
        <div class="car-info-icons">
            <p><span class="material-icons" style="vertical-align: middle;">calendar_today</span> Årsmodell: ${bil.aarsmodell}</p>
            <p><span class="material-icons" style="vertical-align: middle;">local_gas_station</span> Drivstoff: ${bil.drivstoff}</p>
            <p><span class="material-icons" style="vertical-align: middle;">speed</span> Kilometerstand: ${bil.kmavstand} km</p>
            <p><span class="material-icons" style="vertical-align: middle;">attach_money</span> Pris: ${bil.pris} kr</p>
        </div>
        <h3>Beskrivelse:</h3>
        <p>${bil.beskrivelse}</p>
        <h3>Grunnleggende info:</h3>
        <div class="car-extra-details">
            <p><strong>Farge:</strong> ${bil.farge || '-'}</p>
            <p><strong>Registreringsnummer:</strong> ${bil.regnr || '-'}</p>
            <p><strong>Girkasse:</strong> ${bil.girkasse || '-'}</p>
            <p><strong>Hjuldrift:</strong> ${bil.hjuldrift || '-'}</p>
            <p><strong>Effekt:</strong> ${bil.effekt ? bil.effekt + ' hk' : '-'}</p>
            <p><strong>Sylindervolum:</strong> ${bil.sylindervolum ? bil.sylindervolum + ' L' : '-'}</p>
            <p><strong>Vekt:</strong> ${bil.vekt ? bil.vekt + ' kg' : '-'}</p>
            <p><strong>CO2-utslipp:</strong> ${bil.co2 ? bil.co2 + ' g/km' : '-'}</p>
            <p><strong>Antall seter:</strong> ${bil.seter || '-'}</p>
            <p><strong>Antall dører:</strong> ${bil.dorer || '-'}</p>
            <p><strong>Førstegangsregistrert:</strong> ${bil.forstegangsregistrert || '-'}</p>
            <p><strong>Omregistreringsavgift:</strong> ${bil.omregistreringsavgift || '-'}</p>
        </div>
        <h3>Annet:</h3>
        <div class="car-extra-details">
            <p><strong>Servicehistorikk:</strong> ${bil.servicehistorikk || '-'}</p>
            <p><strong>Neste EU-kontroll:</strong> ${bil.eu_kontroll || '-'}</p>
            <p><strong>Garanti:</strong> ${bil.garanti ? bil.garanti + ' mnd' : '-'}</p>
            <p><strong>Interiørfarge:</strong> ${bil.interiorfarge || '-'}</p>
            <p><strong>Interiørmateriale:</strong> ${bil.interiormateriale || '-'}</p>
            <p><strong>Antall eiere:</strong> ${bil.antall_eiere || '-'}</p>
        </div>
        <h3>Utstyr:</h3>
        <div>
            ${bil.utstyr && Array.isArray(bil.utstyr) && bil.utstyr.length > 0 && bil.utstyr[0] !== '' ? bil.utstyr.map(u => `<p>${u}</p>`).join('') : '<p>-</p>'}
        </div>
        <h3>Kontaktinfo:</h3>
        <div class="car-extra-details">
            <p><strong>Telefon:</strong> ${bil.tlf || '-'}</p>
            <p><strong>E-post:</strong> ${bil.epost || '-'}</p>
            <p><strong>Adresse:</strong> ${bil.adresse || '-'}</p>
            <p><strong>Salgsform:</strong> ${bil.salgsform || '-'}</p>
            <p><strong>Tilstand:</strong> ${bil.tilstand || '-'}</p>
        </div>
        <button class="kontakt">Kontakt selger</button>
        <button class="rediger" onclick="window.location.href='leggtil.html?id=${bil.id}'" style="margin-top: 5px;">Rediger bil</button>
        <button class="slett" onclick="slettBil('${bil.id}')" style="margin-top: 5px;">Slett bil</button>
    `;
    document.getElementById('tittel').textContent = `${bil.merke} ${bil.modell} | Autonett`;
    // Add JS for thumbnail click
    const mainImg = document.getElementById('main-bil-image');
    document.querySelectorAll('.thumbnail-img').forEach(thumb => {
        thumb.addEventListener('click', function() {
            mainImg.src = this.src;
            document.querySelectorAll('.thumbnail-img').forEach(t => t.style.border = '2px solid #ccc');
            this.style.border = '2px solid #4CAF50';
        });
    });
    if (document.querySelector('.thumbnail-img')) {
        document.querySelector('.thumbnail-img').style.border = '2px solid #4CAF50';
    }
    // Edit mode logic
    document.getElementById('edit-images-btn').onclick = function() {
        showEditImagesModal(bil);
    };
}

// Modal for editing images (delete/add)
// MODIFIED showEditImagesModal function
function showEditImagesModal(bil) {
    const isNewCar = !bil.id || bil.id === 'new';
    const existingImages = bil.images || [];
    
    // Create modal HTML
    let modal = document.createElement('div');
    modal.id = 'edit-images-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    modal.innerHTML = `
        <div style="background: #fff; padding: 24px; border-radius: 8px; max-width: 600px; width: 100%;">
            <h2>Rediger bilder</h2>
            <div id="edit-images-list" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
                ${existingImages.map((img, idx) => `
                    <div style="position: relative; display: inline-block;">
                        <img src="./Bilder/${img}" style="width: 120px; height: 90px; object-fit: cover; border: 1px solid #ccc;">
                        <button class="delete-image-btn" data-idx="${idx}" 
                                style="position: absolute; top: 2px; right: 2px; background: #f44336; color: #fff; 
                                       border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
                            &times;
                        </button>
                    </div>
                `).join('')}
            </div>
            <label for="add-images-input">Legg til nye bilder:</label>
            <input type="file" id="add-images-input" accept="image/*" multiple style="margin-bottom: 12px;">
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button id="save-images-btn" 
                        style="background: #4CAF50; color: #fff; border: none; padding: 8px 16px; border-radius: 4px;">
                    Lagre
                </button>
                <button id="cancel-edit-images-btn" 
                        style="background: #ccc; color: #333; border: none; padding: 8px 16px; border-radius: 4px;">
                    Avbryt
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Delete image logic
    modal.querySelectorAll('.delete-image-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            if (isNewCar) {
                // Remove from preview
                this.parentElement.remove();
            } else {
                // Existing Firestore delete logic
                existingImages.splice(idx, 1);
                modal.remove();
                showEditImagesModal({...bil, images: existingImages});
            }
        };
    });

    // Cancel button
    modal.querySelector('#cancel-edit-images-btn').onclick = function() {
        modal.remove();
    };

    // Save button logic
    modal.querySelector('#save-images-btn').onclick = async function() {
        const input = modal.querySelector('#add-images-input');
        const newFiles = input.files ? Array.from(input.files) : [];

        if (isNewCar) {
            // Handle new car images
            const dataTransfer = new DataTransfer();
            
            // Preserve existing files
            const existingFileInput = document.getElementById('bilder');
            if (existingFileInput?.files) {
                Array.from(existingFileInput.files).forEach(file => 
                    dataTransfer.items.add(file)
                );
            }
            
            // Add new files
            newFiles.forEach(file => dataTransfer.items.add(file));
            
            // Update the hidden file input
            document.getElementById('bilder').files = dataTransfer.files;
            
            // Update preview
            document.getElementById('bilder').dispatchEvent(new Event('change'));
            modal.remove();
        } else {
            // Existing Firestore update logic
            try {
                const newImageFilenames = await uploadImagesToServer(newFiles);
                const updatedImages = existingImages.concat(newImageFilenames);
                
                await oppdaterDokument(bil.id, { images: updatedImages });
                alert('Bilder oppdatert!');
                modal.remove();
                hentDokument('cars', bil.id).then(displayCarDetails);
            } catch (err) {
                alert('Kunne ikke lagre bilder: ' + err.message);
            }
        }
    };
}

// Edit images button handler for leggtil.html
function setupLeggTilImageEditing() {
    const editBtn = document.getElementById('leggtil-edit-images-btn');
    if (!editBtn) return;

    editBtn.onclick = () => {
        const dummyBil = { 
            id: new URLSearchParams(window.location.search).get('id') || 'new',
            images: [] 
        };
        showEditImagesModal(dummyBil);
    };
}
// Form handling
async function handleFormSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    // --- Collect utstyr from checkboxes and text ---
    const checkedUtstyr = Array.from(document.querySelectorAll('.utstyr-checkbox:checked')).map(cb => cb.value);
    const customUtstyr = document.getElementById("utstyr").value.trim().split(',').map(e => e.trim()).filter(Boolean);
    const utstyr = [...checkedUtstyr, ...customUtstyr];
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
        utstyr: utstyr,
        servicehistorikk: document.getElementById("servicehistorikk").value,
        eu_kontroll: document.getElementById("eu_kontroll").value,
        garanti: document.getElementById("garanti").value.trim(),
        tlf: document.getElementById("tlf").value.trim(),
        epost: document.getElementById("epost").value.trim(),
        adresse: document.getElementById("adresse").value.trim(),
        salgsform: document.getElementById("salgsform").value,
        tilstand: document.getElementById("tilstand").value,
        omregistreringsavgift: document.getElementById("omregistreringsavgift").value.trim(),
        forstegangsregistrert: document.getElementById("forstegangsregistrert").value,
        interiorfarge: document.getElementById("interiorfarge").value.trim(),
        interiormateriale: document.getElementById("interiormateriale").value.trim(),
        antall_eiere: document.getElementById("antall_eiere").value.trim(),
    };
    // --- Handle images ---
    const imageInput = document.getElementById('bilder');
    const files = imageInput ? Array.from(imageInput.files) : [];
    let imageFilenames = [];
    if (files.length > 0) {
        try {
            imageFilenames = await uploadImagesToServer(files);
        } catch (err) {
            alert('Kunne ikke laste opp bilder: ' + err.message);
            return;
        }
    }
    formData.images = imageFilenames;
    try {
        if (id) {
            // EXISTING CAR - original logic
            await oppdaterDokument(id, formData);
            alert("Bilen ble oppdatert!");
        } else {
            // NEW CAR - create document first to get ID
            const docRef = await addDoc(carsCollection, formData);
            const newId = docRef.id;

            // UPLOAD IMAGES WITH NEW ID
            const imageInput = document.getElementById('bilder');
            const files = imageInput ? Array.from(imageInput.files) : [];
            let imageFilenames = [];
            
            if (files.length > 0) {
                imageFilenames = await uploadImagesToServer(files, newId); // Pass ID
            }

            // UPDATE DOCUMENT WITH IMAGE NAMES
            await updateDoc(docRef, { images: imageFilenames });
            
            alert("Bilen ble lagt til!");
            window.location.href = "index.html";
        }
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

// --- IMAGE HANDLING HELPERS ---
// Resize image to 1:1 (square) using Canvas
// Resize image to 4:3 aspect ratio using Canvas
async function resizeImageToAspect(file, width = 800, height = 600) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            // Calculate cropping for center 4:3
            const targetAspect = width / height;
            const imgAspect = img.width / img.height;
            let sx, sy, sw, sh;
            if (imgAspect > targetAspect) {
                // Image is wider than target aspect
                sh = img.height;
                sw = sh * targetAspect;
                sx = (img.width - sw) / 2;
                sy = 0;
            } else {
                // Image is taller than target aspect
                sw = img.width;
                sh = sw / targetAspect;
                sx = 0;
                sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Upload images to local /upload endpoint and return filenames
async function uploadImagesToServer(files, docId = null) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blob = await resizeImageToAspect(file, 800, 600);
        formData.append('images', blob, file.name);
    }

    // Add ID to upload URL if available
    const url = docId 
        ? `http://localhost:4000/upload?id=${docId}`
        : 'http://localhost:4000/upload';

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('Bildeopplasting feilet');
    const data = await response.json();
    return data.files;
}

async function fyllUtSkjemaForRedigering() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    try {
        const bil = await hentDokument("cars", id);
        // Map Firestore keys to form field IDs
        const keyToId = {
            aarsmodell: "aar",
            kmavstand: "km",
            // Add more mappings if needed
        };
        for (const key in bil) {
            const formKey = keyToId[key] || key;
            const input = document.getElementById(formKey);
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
        // --- UTSTYR CHECKBOXES ---
        if (Array.isArray(bil.utstyr)) {
            document.querySelectorAll('.utstyr-checkbox').forEach(cb => {
                cb.checked = bil.utstyr.includes(cb.value);
            });
            const checkboxValues = Array.from(document.querySelectorAll('.utstyr-checkbox')).map(cb => cb.value);
            const customUtstyr = bil.utstyr.filter(u => !checkboxValues.includes(u));
            document.getElementById('utstyr').value = customUtstyr.join(', ');
        }
        // --- SHOW EDIT MODE ---
        const title = document.getElementById('leggtil-title');
        if (title) title.textContent = "Rediger annonse";
        const submitBtn = document.getElementById('submit');
        if (submitBtn) submitBtn.textContent = "Lagre endringer";
        // Remove required from image input when editing
        const imageInput = document.getElementById('bilder');
        if (imageInput) imageInput.required = false;
    } catch (err) {
        alert("Kunne ikke hente bil for redigering. Sjekk at du har riktig ID i URLen.");
        console.error(err);
    }
}

// Kjør denne på leggtil.html
// Only call fyllUtSkjemaForRedigering if on leggtil.html and not on bil.html
if (window.location.pathname.endsWith('leggtil.html')) {
    document.addEventListener("DOMContentLoaded", () => {
        setupMainPageListeners();
        setupVegvesenAutoFill();
        fyllUtSkjemaForRedigering();
    });
}

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
        initializeMainPage();
    }
    setupVegvesenAutoFill(); // <-- Add this line
});

window.leggTilDokument = leggTilDokument;
window.hentDokumenter = hentDokumenter;
window.slettDokument = slettDokument;
window.oppdaterDokument = oppdaterDokument;
// Add more as needed