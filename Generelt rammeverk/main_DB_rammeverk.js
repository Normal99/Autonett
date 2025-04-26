import { hentDokumenter, leggTilDokument, slettDokument, visDokumenterLive } from "./firebase-rammeverk.js";

const samlingNavn = "produkter"; // <-- Tilpass dette til eget prosjekt
const listeContainer = document.getElementById("liste");
const skjema = document.getElementById("skjema");

// Bruk denne funksjonen til å vise dokumentene i HTML
function visProdukter(produkter) {
    listeContainer.innerHTML = "";
    produkter.forEach(produkt => {
        listeContainer.innerHTML += `
            <div class="kort">
                <h3>${produkt.navn}</h3>
                <p>${produkt.beskrivelse}</p>
                <button data-id="${produkt.id}" class="slett">Slett</button>
            </div>
        `;
    });

    // Aktiver slett-knapper
    document.querySelectorAll(".slett").forEach(knapp => {
        knapp.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            slettDokument(samlingNavn, id);
        });
    });
}

// Legg til nytt dokument ved innsending av skjema
skjema.addEventListener("submit", (e) => {
    e.preventDefault();
    const navn = document.getElementById("navn").value;
    const beskrivelse = document.getElementById("beskrivelse").value;

    leggTilDokument(samlingNavn, { navn, beskrivelse });
    skjema.reset();
});

// Start live-visning
document.addEventListener("DOMContentLoaded", () => {
    visDokumenterLive(samlingNavn, visProdukter);
});
