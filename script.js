//// filepath: /c:/Users/VolkanBayram/Dokumenter/GitHub/Steingruppa/script.js
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWIFCogJ15e4dPLtOMxhLOtxMrlyOskGc",
  authDomain: "steingruppa.firebaseapp.com",
  projectId: "steingruppa",
  storageBucket: "steingruppa.firebasestorage.app",
  messagingSenderId: "1067625469581",
  appId: "1:1067625469581:web:a3ccfc19a4b0035710f4c4"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global settings & data
let viewMode = "card"; // "table" or "card"
let allStones = [];      // will hold the raw stone data
let unsubscribe;         // holds the onSnapshot unsubscribe function

// Start real‑time listener using onSnapshot
function subscribeToStones() {
  const stonesQuery = query(collection(db, "steiner"), orderBy("kasse"));
  // Unsubscribe any previous listener
  if (unsubscribe) { unsubscribe(); }
  unsubscribe = onSnapshot(stonesQuery, snapshot => {
    allStones = snapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));
    renderView(applyFilters(allStones));
    console.log("Realtime update:", allStones);
  }, error => {
    console.error("Error listening to stones:", error);
  });
}

// Apply client‑side filtering based on input values
function applyFilters(stones) {
  const søkefelt = document.getElementById('søkefelt').value.trim().toLowerCase();
  const filterKasse = document.getElementById('filter-kasse').value.trim().toLowerCase();
  const filterSteingruppe = document.getElementById('filter-steingruppe').value.trim().toLowerCase();
  const filterId = document.getElementById('filter-id').value.trim().toLowerCase();
  const filterSted = document.getElementById('filter-sted').value.trim().toLowerCase();

  return stones.filter(s => {
    let match = true;
    if (søkefelt) {
      match = match && (
        (s.kasse && s.kasse.toLowerCase().includes(søkefelt)) ||
        (s.steingruppe && s.steingruppe.toLowerCase().includes(søkefelt)) ||
        (s.id && s.id.toLowerCase().includes(søkefelt)) ||
        (s.sted && s.sted.toLowerCase().includes(søkefelt))
      );
    }
    if (filterKasse) {
      match = match && (s.kasse && s.kasse.toLowerCase().includes(filterKasse));
    }
    if (filterSteingruppe) {
      match = match && (s.steingruppe && s.steingruppe.toLowerCase().includes(filterSteingruppe));
    }
    if (filterId) {
      match = match && (s.id && s.id.toLowerCase().includes(filterId));
    }
    if (filterSted) {
      match = match && (s.sted && s.sted.toLowerCase().includes(filterSted));
    }
    return match;
  });
}

// Pick which view to render based on viewMode
function renderView(filteredStones) {
  if (viewMode === "table") {
    renderTable(filteredStones);
  } else {
    renderCards(filteredStones);
  }
}

// Render table view
function renderTable(stones) {
  document.getElementById("data-table").style.display = "table";
  document.getElementById("cards-container").style.display = "none";
  
  const tableBody = document.querySelector('#data-table tbody');
  tableBody.innerHTML = "";
  stones.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.kasse || ""}</td>
      <td>${item.steingruppe || ""}</td>
      <td>${item.id || ""}</td>
      <td>${item.sted || ""}</td>
      <td>
        <button onclick="deleteStone('${item.docId}')">🗑️</button>
        <button onclick='handleEditStoneClick(${JSON.stringify(item).replace(/'/g, "&#39;")})'>✏️</button>
      </td>
    `;
    row.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") {
        showStoneData(item.docId);
      }
    });
    tableBody.appendChild(row);
  });
  console.log("Table view updated");
}

// Render card view
function renderCards(stones) {
  document.getElementById("data-table").style.display = "none";
  const cardsContainer = document.getElementById("cards-container");
  cardsContainer.style.display = "flex";
  cardsContainer.style.flexWrap = "wrap";
  cardsContainer.innerHTML = "";
  

  stones.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="/Bilder/BMW.jpg" alt="Stein" style="width:100%; border-radius: 4px;">
      <h3>${item.steingruppe || "Ukjent"}</h3>
      <p><strong>Kasse:</strong> ${item.kasse || ""}</p>
      <p><strong>ID:</strong> ${item.id || ""}</p>
      <p><strong>Sted:</strong> ${item.sted || ""}</p>
      <div>
        <button onclick="deleteStone('${item.docId}')">🗑️</button>
        <button onclick='showEditForm(${JSON.stringify(item).replace(/'/g, "&#39;")})'>✏️</button>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") {
        showStoneData(item.docId);
      }
    });
    cardsContainer.appendChild(card);
  });
  console.log("Card view updated");
}

// ---------- CRUD OPERATIONS ----------

// Add a new stone
async function addStone() {
  try {
    const kasse = document.getElementById('new-kasse').value.trim();
    const steingruppe = document.getElementById('new-steingruppe').value.trim();
    const id = document.getElementById('new-id').value.trim();
    const sted = document.getElementById('new-sted').value.trim();

    const newStone = { kasse, steingruppe, id, sted };
    const docRef = await addDoc(collection(db, "steiner"), newStone);
    alert("Stein lagt til med id: " + docRef.id);
    // No need to manually re-fetch data—onSnapshot does real‑time updates.
  } catch (error) {
    console.error("Error adding stone:", error);
  }
}

// Show stone details in a modal
async function showStoneData(docId) {
  try {
    const docRef = doc(db, "steiner", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const modalBody = document.getElementById("modal-body");
      modalBody.innerHTML = `
        <h2>${data.steingruppe || ""}</h2>
        <hr>
        <div id="steininfo">
          <div id="info1">
            <p><strong>Kasse:</strong> ${data.kasse || ""}</p>
            <p><strong>Sted:</strong> ${data.sted || ""}</p>
            <p><strong>ID:</strong> ${data.id || ""}</p>
          </div>
          <div id="beskrivelse">
            <h3>Beskrivelse:</h3>
            <p>Lorem ipsum bla bla bla</p>
          </div>
        </div>
      `;
      document.getElementById("modal").style.display = "block";
    } else {
      console.error("No such document!");
    }
  }  catch (error) {
  console.error("Error fetching stone details:", error);
  }
}
// Close the modal
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Edit a stone
async function editStone(docId) {
  try {
    const kasse = document.getElementById('edit-kasse').value.trim();
    const steingruppe = document.getElementById('edit-steingruppe').value.trim();
    const id = document.getElementById('edit-id').value.trim();
    const sted = document.getElementById('edit-sted').value.trim();
    const updatedStone = { kasse, steingruppe, id, sted };

    await updateDoc(doc(db, "steiner", docId), updatedStone);
    alert("Stein oppdatert!");
    closeEditForm();
  } catch (error) {
    console.error("Error updating stone:", error);
  }
}
function showStoneModal(mode, stone = null) {
  const modal = document.getElementById('stone-modal');
  const title = document.getElementById('stone-form-title');
  const submitButton = document.getElementById('stone-submit-button');
  
  // Clear form
  document.getElementById('stone-form').reset();
  
  if (mode === 'add') {
    title.textContent = 'Legg til ny stein';
    submitButton.textContent = 'Legg til';
    document.getElementById('stone-docid').value = '';
  } else if (mode === 'edit' && stone) {
    title.textContent = 'Rediger stein';
    submitButton.textContent = 'Oppdater';
    
    // Populate form with stone data
    document.getElementById('stone-kasse').value = stone.kasse || '';
    document.getElementById('stone-steingruppe').value = stone.steingruppe || '';
    document.getElementById('stone-id').value = stone.id || '';
    document.getElementById('stone-sted').value = stone.sted || '';
    document.getElementById('stone-docid').value = stone.docId;
  }
  
  modal.style.display = 'block';
}

function closeStoneModal() {
  document.getElementById('stone-modal').style.display = 'none';
}

async function submitStoneForm() {
  const docId = document.getElementById('stone-docid').value;
  const stoneData = {
    kasse: document.getElementById('stone-kasse').value.trim(),
    steingruppe: document.getElementById('stone-steingruppe').value.trim(),
    id: document.getElementById('stone-id').value.trim(),
    sted: document.getElementById('stone-sted').value.trim()
  };

  try {
    if (docId) {
      // Update existing stone
      await updateDoc(doc(db, "steiner", docId), stoneData);
      alert("Stein oppdatert!");
    } else {
      // Add new stone
      await addDoc(collection(db, "steiner"), stoneData);
      alert("Ny stein lagt til!");
    }
    closeStoneModal();
  } catch (error) {
    console.error("Error saving stone:", error);
    alert("Det oppstod en feil!");
  }
}

// Update the click handlers
function handleAddStoneClick() {
  showStoneModal('add');
}

function handleEditStoneClick(stone) {
  showStoneModal('edit', stone);
}

// Delete a stone (also clears modal info if showing)
async function deleteStone(docId) {
  if (confirm("Er du sikker på at du vil slette denne steinen?")) {
    try {
      await deleteDoc(doc(db, "steiner", docId));
      alert("Stein slettet!");

      // If the deleted stone is currently shown, clear its display:
      const modal = document.getElementById("modal");
      if (modal.style.display === "block") {
        closeModal();
      }
    } catch (error) {
      console.error("Error deleting stone:", error);
      alert("Feil ved sletting!");
    }
  }
}



// Listen for incoming requests and show empty message
function subscribeToRequests() {
  const requestsQuery = query(collection(db, "requests"), orderBy("timestamp"));
  const requestsTableBody = document.querySelector('#requests-table tbody');
  
  onSnapshot(requestsQuery, snapshot => {
      // Clear existing rows
      requestsTableBody.innerHTML = '';
      
      if (snapshot.empty) {
          // Show empty state message
          requestsTableBody.innerHTML = `
              <tr>
                  <td colspan="3">
                      Ingen innkommende forespørsler
                  </td>
              </tr>
          `;
      } else {
          // Display requests as normal
          snapshot.docChanges().forEach(change => {
              if (change.type === "added") {
                  const request = { docId: change.doc.id, ...change.doc.data() };
                  displayRequest(request);
              } else if (change.type === "modified") {
                  const request = { docId: change.doc.id, ...change.doc.data() };
                  updateRequestInTable(request);
              } else if (change.type === "removed") {
                  removeRequestFromTable(change.doc.id);
              }
          });
      }
  }, error => {
      console.error("Feil ved lytting til forespørsler:", error);
  });
}

function displayRequest(request) {
  const requestsTableBody = document.querySelector('#requests-table tbody');
  const row = document.createElement('tr');
  row.setAttribute('data-docid', request.docId);
  row.innerHTML = `
    <td>${request.type}</td>
    <td>${parseRequestDetails(request.details, request.message)}</td>
    <td>
      <button onclick="acceptRequest('${request.docId}')">Godta</button>
      <button onclick="rejectRequest('${request.docId}')">Avslå</button>
      ${request.type === 'update' ? `<button onclick="editRequest('${request.docId}')">Rediger</button>` : ''}
    </td>
  `;
  requestsTableBody.appendChild(row);
}

function parseRequestDetails(details, message) {
  // Early return if details is undefined
  if (!details) {
    return "<div class='request-details'>Ingen detaljer tilgjengelig</div>";
  }

  const formatStoneDetails = (stone) => {
    if (!stone) return "Ingen data";
    
    const fields = [
      { label: "Kasse", value: stone.kasse || "-" },
      { label: "Steingruppe", value: stone.steingruppe || "-" },
      { label: "ID", value: stone.id || "-" },
      { label: "Sted", value: stone.sted || "-" }
    ];

    return `
      <div class="stone-details">
        ${fields.map(field => `<div class="field"><span class="label">${field.label}:</span> ${field.value}</div>`).join("")}
      </div>
    `;
  };

  // Handle update requests with side-by-side comparison
  if (details.current && details.requested) {
    return `
      <div class="request-details update-request">
        <div class="comparison-container">
          <div class="current">
            <strong>Gjeldende verdier:</strong>
            ${formatStoneDetails(details.current)}
          </div>
          <div class="arrow">➔</div>
          <div class="requested">
            <strong>Ønskede endringer:</strong>
            ${formatStoneDetails(details.requested)}
          </div>
        </div>
        ${message ? `<div class="message"><strong>Melding:</strong> ${message}</div>` : ''}
      </div>
    `;
  }

  // Handle simple requests (add/delete)
  return `
    <div class="request-details">
      <strong>Detaljer</strong>
      ${formatStoneDetails(details)}
      ${message ? `<div class="message"><strong>Melding:</strong> ${message}</div>` : ''}
    </div>
  `;
}
async function acceptRequest(docId) {
  try {
    const requestRef = doc(db, "requests", docId);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
      const request = requestSnap.data();
      await processRequest(request);
      await deleteDoc(requestRef);
      alert("Forespørsel godkjent og behandlet.");
      removeRequestFromTable(docId);
    } else {
      console.error("Ingen slik forespørsel!");
    }
  } catch (error) {
    console.error("Feil ved godkjenning av forespørsel:", error);
  }
}

async function rejectRequest(docId) {
  try {
    await deleteDoc(doc(db, "requests", docId));
    alert("Forespørsel avslått.");
    removeRequestFromTable(docId);
  } catch (error) {
    console.error("Feil ved avslag av forespørsel:", error);
  }
}
function removeRequestFromTable(docId) {
  const row = document.querySelector(`tr[data-docid="${docId}"]`);
  if (row) {
    row.remove();
  }
}

function editRequest(docId) {
  // Fetch the request details and populate the form for editing
  const requestRef = doc(db, "requests", docId);
  getDoc(requestRef).then(requestSnap => {
    if (requestSnap.exists()) {
      const request = requestSnap.data();
      populateRequestForm(request.details.current, 'update');
      // Populate the new values in the form
      document.getElementById('req-new-kasse').value = request.details.requested.kasse || "";
      document.getElementById('req-new-steingruppe').value = request.details.requested.steingruppe || "";
      document.getElementById('req-new-id').value = request.details.requested.id || "";
      document.getElementById('req-new-sted').value = request.details.requested.sted || "";
      // Show the request modal
      showRequestModal();
      // Add a hidden input to store the request docId
      document.getElementById('request-docid').value = docId;
    } else {
      console.error("Ingen slik forespørsel!");
    }
  }).catch(error => {
    console.error("Feil ved henting av forespørselsdetaljer:", error);
  });
}

async function processRequest(request) {
  const { type, details, stoneDocId } = request;

  try {
    if (type === "add") {
      await addDoc(collection(db, "steiner"), details);
      console.log("Stein lagt til:", details);
    } else if (type === "update") {
      const stoneRef = doc(db, "steiner", stoneDocId);
      await updateDoc(stoneRef, details.requested);
      console.log("Stein oppdatert:", details);
    } else if (type === "delete") {
      const stoneRef = doc(db, "steiner", stoneDocId);
      await deleteDoc(stoneRef);
      console.log("Stein slettet:", details);
    }
  } catch (error) {
    console.error("Feil ved behandling av forespørsel:", error);
  }
}

function showRequestModal() {
  document.getElementById('request-modal').style.display = 'block';
}

function closeRequestModal() {
  document.getElementById('request-modal').style.display = 'none';
}

function toggleRequests() {
  const content = document.getElementById('requests-content');
  const icon = document.getElementById('toggle-icon');
  const container = document.getElementById('requests-container');
  
  if (content.classList.contains('show')) {
      content.classList.remove('show');
      icon.textContent = '▶ Innkommende forespørsler';
      container.style.maxHeight = '50px'; // Collapsed height
      container.style.height = '15%'; // Collapsed height
  } else {
      content.classList.add('show');
      icon.textContent = '▼ Innkommende forespørsler';
      container.style.maxHeight = '300px'; // Expanded height
      container.style.height = '100%'; // Collapsed height
  }
}

function populateRequestForm(stone, requestType) {
  console.log("Fyller ut forespørsel for stein:", stone);
  
  // Update the form title based on the request type
  const formTitle = document.getElementById('request-form-title');
  formTitle.textContent = "Rediger forespørsel";

  // Toggle request form fields based on type
  toggleRequestFields();

  // Populate the current (readonly) fields with this stone's details
  document.getElementById('current-kasse').value = stone.kasse || "";
  document.getElementById('current-steingruppe').value = stone.steingruppe || "";
  document.getElementById('current-id').value = stone.id || "";
  document.getElementById('current-sted').value = stone.sted || "";
  // Store the Firestore docId in a hidden field so the request is tied to this stone
  document.getElementById('request-stone-docid').value = stone.docId;
  
  // For update requests, pre-fill the new field values (side-by-side comparison)
  if (requestType === "update") {
    document.getElementById('req-new-kasse').value = stone.kasse || "";
    document.getElementById('req-new-steingruppe').value = stone.steingruppe || "";
    document.getElementById('req-new-id').value = stone.id || "";
    document.getElementById('req-new-sted').value = stone.sted || "";
  }
  // Show the request modal
  showRequestModal();
}

function toggleRequestFields() {
  // Hide all sections first
  document.getElementById('current-request-fields').style.display = "none";
  document.getElementById('update-request-fields').style.display = "none";
  document.getElementById('side-by-side-container').style.display = "none";
  
  document.getElementById('current-request-fields').style.display = "block";
  document.getElementById('update-request-fields').style.display = "block";
  document.getElementById('side-by-side-container').style.display = "flex";
}

async function submitRequest() {
  const docId = document.getElementById('request-docid').value;
  const stoneDocId = document.getElementById('request-stone-docid').value;
  const kasse = document.getElementById('req-new-kasse').value.trim();
  const steingruppe = document.getElementById('req-new-steingruppe').value.trim();
  const id = document.getElementById('req-new-id').value.trim();
  const sted = document.getElementById('req-new-sted').value.trim();
  const updatedDetails = { kasse, steingruppe, id, sted };

  try {
    const requestRef = doc(db, "requests", docId);
    await updateDoc(requestRef, {
      "details.requested": updatedDetails,
      "details.current": { kasse, steingruppe, id, sted },
      stoneDocId
    });
    alert("Forespørsel oppdatert!");
    closeRequestModal();
  } catch (error) {
    console.error("Feil ved oppdatering av forespørsel:", error);
  }
}

// ---------- UI HELPERS ----------

function toggleFilter() {
  const form = document.getElementById('filters');
  form.style.display = (form.style.display === "block") ? "none" : "block";
}

// Toggle between table and card view
function toggleView() {
  viewMode = (viewMode === "table") ? "card" : "table";
  const toggleButton = document.querySelector('.søkeboksknapp[onclick="toggleView()"]');
  
  // Update button with appropriate icon
  toggleButton.innerHTML = `<img src="bilder/${viewMode === 'table' ? 'card' : 'list'}.png" 
                           alt="${viewMode === 'table' ? 'List View' : 'Card View'}">`;
  
  renderView(applyFilters(allStones));
}

// ---------- EVENT LISTENERS ----------

// Re-render view on filter input changes
document.getElementById('søkefelt').addEventListener('input', () => renderView(applyFilters(allStones)));
document.getElementById('filter-kasse').addEventListener('input', () => renderView(applyFilters(allStones)));
document.getElementById('filter-steingruppe').addEventListener('input', () => renderView(applyFilters(allStones)));
document.getElementById('filter-id').addEventListener('input', () => renderView(applyFilters(allStones)));
document.getElementById('filter-sted').addEventListener('input', () => renderView(applyFilters(allStones)));

// Expose functions globally if needed by inline HTML
window.toggleFilter = toggleFilter;
window.showStoneData = showStoneData;
window.toggleView = toggleView;
window.closeModal = closeModal;
window.populateRequestForm = populateRequestForm;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.editRequest = editRequest;
window.showRequestModal = showRequestModal;
window.closeRequestModal = closeRequestModal;
window.submitRequest = submitRequest;
window.toggleRequests = toggleRequests;
window.editStone = editStone;
window.deleteStone = deleteStone;
window.showStoneModal = showStoneModal;
window.closeStoneModal = closeStoneModal;
window.submitStoneForm = submitStoneForm;
window.handleAddStoneClick = handleAddStoneClick;
window.handleEditStoneClick = handleEditStoneClick;

// Start listening in real time on page load
window.addEventListener("load", () => {
  subscribeToStones();
  subscribeToRequests();
});