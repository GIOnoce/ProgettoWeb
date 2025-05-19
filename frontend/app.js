// app.js - Fixed to properly handle customer data in contracts
let ombrelloni = [];
let tipologie = [];
let tariffe = [];
let contratti = [];
let guida = [];
let clienti = [];
const venduti = [];
const disponibilita = [];

// API URL - Update this to match your server URL
const API_URL = 'http://localhost:3000/api';

// Generate a random ID for new items
const generateId = () => Math.floor(Math.random() * 1000000);

// Ensure stipulatoDa is always an array
function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  // Handle comma-separated strings (which might come from the Excel import)
  if (typeof value === 'string') {
    // Check if the string contains commas, which would indicate multiple values
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [value];
  }

  return [String(value)]; // Convert any other type to string and wrap in array
}

// Load data when the window opens
window.addEventListener('load', () => {
  // Load all data from the server
  caricaDatiDalServer();

  // Check URL parameters for view
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  // Display the appropriate view based on URL parameters
  if (view === 'contratti') {
    setTimeout(() => mostraLista('contratti'), 300);
  }
  if (view === 'ombrelloni') {
    setTimeout(() => mostraLista('ombrelloni'), 300);
  }
  if (view === 'tipologie') {
    setTimeout(() => mostraLista('tipologie'), 300);
  }
});

// Function to load all data from the server
async function caricaDatiDalServer() {
  try {
    const response = await fetch(`${API_URL}/data`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Update all data arrays
    ombrelloni = data.ombrelloni || [];
    tipologie = data.tipologie || [];
    tariffe = data.tariffe || [];

    // Ensure stipulatoDa is always an array in contratti
    contratti = (data.contratti || []).map(c => ({
      ...c,
      stipulatoDa: ensureArray(c.stipulatoDa)
    }));

    clienti = data.clienti || [];

    // Process venduti and disponibilita arrays
    Array.from(data.ombrelloneVenduto || []).forEach(item => {
      venduti.push({
        idOmbrellone: item.idOmbrellone,
        data: item.data,
        contratto: item.contratto
      });
    });

    Array.from(data.giornoDisponibilita || []).forEach(item => {
      disponibilita.push({
        idOmbrellone: item.idOmbrellone,
        data: item.data
      });
    });

    console.log("Data loaded successfully from server");
    console.log("Clients:", clienti);
    console.log("Contracts:", contratti);
  } catch (error) {
    console.error("Error loading data from server:", error);
    alert("Errore durante il caricamento dei dati dal server.");
  }
}

// Function to display guide
function caricaGuida() {
  const container = document.getElementById("risultati");
  container.innerHTML = "";
  const guidaHtml = `
    <h3>Guida alla Gestione Ombrelloni</h3>
    <p>Benvenuto nella sezione di gestione ombrelloni! Ecco cosa puoi fare:</p>
    <ul>
      <li><strong>Aggiungi Contratto</strong>: Crea un nuovo contratto di affitto ombrellone.</li>
      <li><strong>Ricerca Contratti</strong>: Ricerca, modifica o elimina contratti esistenti.</li>
      <li><strong>Ricerca Ombrelloni</strong>: Controlla le prenotazioni degli ombrelloni.</li>
      <li><strong>Tipologie Ombrelloni</strong>: Visualizza le diverse tipologie di ombrelloni disponibili.</li>
    </ul>
    <p>Se hai bisogno di assistenza, contatta l'amministratore del sistema.</p>
  `;
  container.innerHTML = guidaHtml;
}

// Function to display lists based on type
function mostraLista(tipo) {
  let container = document.getElementById("risultati");
  container.innerHTML = "";

  switch (tipo) {
    case "ombrelloni":
      if (ombrelloni.length === 0) {
        container.innerHTML = "<p>Nessun ombrellone disponibile.</p>";
        break;
      }

      ombrelloni.forEach(o => {
        const div = document.createElement("div");
        div.classList.add("ombrellone-box");

        // Basic details
        const dettagli = `
          <strong>Ombrellone #${o.id}</strong><br>
          Settore: ${o.settore} <br>
          Fila: ${o.fila}, numFila: ${o.ordine}<br>
          Tipologia: ${o.tipologia}
        `;

        // Status section
        let stato = "";
        const disp = disponibilita.filter(d => d.idOmbrellone === o.id);
        const venduto = venduti.find(v => v.idOmbrellone === o.id);

        if (disp.length > 0) {
          stato += `<div class="libero"><strong>Libero</strong><br>`;
          disp.forEach(d => {
            stato += `${new Date(d.data).toLocaleDateString('it-IT')}<br>`;
          });
          stato += `</div>`;
        }

        if (venduto) {
          const contratto = contratti.find(c => c.numProgr == venduto.contratto);
          const stipulatoDa = contratto ? ensureArray(contratto.stipulatoDa) : [];
          const clientiContratto = stipulatoDa.map(cod => {
            const cliente = clienti.find(cl => cl.codice === cod);
            return cliente ? `${cliente.nome} ${cliente.cognome}` : cod;
          }).join(", ") || "Cliente sconosciuto";

          stato += `<div class="occupato"><strong>Occupato</strong><br>
            ${new Date(venduto.data).toLocaleDateString('it-IT')}<br>
            Cliente: ${clientiContratto}
          </div>`;
        }

        if (!stato) {
          stato = `<div class="nessuno"><em>Nessuna informazione sulla disponibilità.</em></div>`;
        }

        div.innerHTML = `
          <div class="info-ombrellone">${dettagli}</div>
          <div class="stato-ombrellone">${stato}</div>
        `;

        container.appendChild(div);
      });
      break;

    case "tipologie":
      if (tipologie.length === 0) {
        container.innerHTML = "<p>Nessuna tipologia disponibile.</p>";
        break;
      }

      tipologie.forEach(t => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>${t.nome}</strong> (${t.codice})<br>
          Accessori: ${t.descrizione}<br>
          <hr>
        `;
        container.appendChild(div);
      });
      break;

    case "tipologiatariffa":
      if (tariffe.length === 0) {
        container.innerHTML = "<p>Nessuna tariffa disponibile.</p>";
        break;
      }

      tariffe.forEach(t => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Codice Tipologia: ${t.codTipologia}</strong><br>
          Codice Tariffa: ${t.codTariffa}
        `;
        container.appendChild(div);
      });
      break;

    case "clienti":
      if (clienti.length === 0) {
        container.innerHTML = "<p>Nessun cliente disponibile.</p>";
        break;
      }

      clienti.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Cliente: ${c.nome} ${c.cognome}</strong> (Codice: ${c.codice})<br>
          Email: ${c.email || 'N/A'}<br>
          <hr>
        `;
        container.appendChild(div);
      });
      break;

    case "contratti":
        if (contratti.length === 0) {
          container.innerHTML = "<p>Nessun contratto disponibile.</p>";
          break;
        }

        console.log("Displaying contracts:", contratti);

        contratti.forEach(c => {
          const div = document.createElement("div");
          // Format the date
          const formattedDate = new Date(c.data).toLocaleDateString('it-IT');

          // Ensure stipulatoDa is an array
          const stipulatoDa = ensureArray(c.stipulatoDa);
          console.log(`Contract #${c.numProgr} stipulatoDa:`, stipulatoDa);

          // Map client codes to names
          const clientNames = stipulatoDa.map(cod => {
            const cliente = clienti.find(cl => cl.codice === cod);
            console.log(`Looking up client with code ${cod}:`, cliente);
            return cliente ? `${cliente.nome} ${cliente.cognome}` : cod;
          }).join(", ");

          div.innerHTML = `
            <strong>Contratto #${c.numProgr}</strong><br>
            Data: ${formattedDate}, Importo: €${parseFloat(c.importo).toFixed(2)}<br>
            Stipulato da: ${clientNames || "Cliente sconosciuto"}<br>
            <button onclick="modificaContratto('${c.numProgr}')">Modifica</button>
            <button onclick="eliminaContratto('${c.numProgr}')">Elimina</button>
            <hr>
          `;
          container.appendChild(div);
        });
        break;

    case "guida":
      caricaGuida();
      break;
  }
}

// Add a new contract with proper client handling
async function aggiungiContratto(data, importo, clientiSelezionati) {
  // Validate input
  if (!data || isNaN(importo) || clientiSelezionati.length === 0) {
    return alert("Tutti i campi del contratto sono richiesti.");
  }

  // Process client inputs - could be codes or names
  const clientCodes = [];

  // For each client input, find matching client code or create new client
  for (const clientInput of clientiSelezionati) {
    // First, check if this is already a valid client code
    const existingClientByCode = clienti.find(c => c.codice === clientInput);
    if (existingClientByCode) {
      clientCodes.push(clientInput);
      continue;
    }

    // Check if this is a client name (format: "Nome Cognome")
    const nameParts = clientInput.split(' ');
    if (nameParts.length >= 2) {
      const nome = nameParts[0];
      const cognome = nameParts.slice(1).join(' ');

      // Look for existing client with this name
      const existingClient = clienti.find(c =>
        c.nome.toLowerCase() === nome.toLowerCase() &&
        c.cognome.toLowerCase() === cognome.toLowerCase()
      );

      if (existingClient) {
        // Use existing client code
        clientCodes.push(existingClient.codice);
      } else {
        // Create a new client
        try {
          const newClientCode = `CLI${generateId()}`;
          const newClient = {
            codice: newClientCode,
            nome: nome,
            cognome: cognome,
            email: ''
          };

          const response = await fetch(`${API_URL}/Clienti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
          });

          if (!response.ok) {
            throw new Error(`Failed to create client: ${response.statusText}`);
          }

          // Add to local array and use this code
          clienti.push(newClient);
          clientCodes.push(newClientCode);

        } catch (error) {
          console.error("Error creating new client:", error);
          alert(`Errore durante la creazione del cliente: ${error.message}`);
          return;
        }
      }
    } else {
      // Just a single word - treat as unknown client code
      clientCodes.push(clientInput);
    }
  }

  // Now create the contract with valid client codes
  const numProgr = generateId();
  const newContract = {
    numProgr,
    data,
    importo: parseFloat(importo),
    stipulatoDa: clientCodes
  };

  try {
    console.log("Sending contract with client codes:", newContract);

    const response = await fetch(`${API_URL}/Contratti`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newContract)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const savedContract = await response.json();

    // Add to local array and ensure stipulatoDa is an array
    savedContract.stipulatoDa = ensureArray(savedContract.stipulatoDa);
    contratti.push(savedContract);

    alert(`Contratto #${numProgr} aggiunto.`);
    mostraLista('contratti');
  } catch (error) {
    console.error("Error adding contract:", error);
    alert("Errore durante l'aggiunta del contratto.");
  }
}

// Modify an existing contract
// Function to modify an existing contract - Fixed version
// Modify an existing contract - Fixed version with improved client handling
async function modificaContratto(numProgr) {
  // Find the contract
  const c = contratti.find(c => c.numProgr == numProgr);
  if (!c) return alert("Contratto non trovato.");

  // Ensure stipulatoDa is an array
  const stipulatoDa = ensureArray(c.stipulatoDa);

  console.log(`Editing contract #${numProgr} with stipulatoDa:`, stipulatoDa);

  // Map client codes to display names for the prompt
  const clientDisplay = stipulatoDa.map(cod => {
    const cliente = clienti.find(cl => cl.codice === cod);
    return cliente ? `${cliente.nome} ${cliente.cognome}` : cod;
  }).join(", ");

  // Get updated values
  const nuovaData = prompt("Modifica data (YYYY-MM-DD):", c.data);
  if (!nuovaData) return alert("Modifica annullata.");

  const nuovoImporto = prompt("Modifica importo (€):", c.importo);
  if (nuovoImporto === null || isNaN(parseFloat(nuovoImporto)))
    return alert("Importo non valido. Modifica annullata.");

  const nuovoCliente = prompt("Modifica clienti (separati da virgola):", clientDisplay);
  if (nuovoCliente === null) return alert("Modifica annullata.");

  if (nuovoCliente.length === 0) {
    alert("Inserisci almeno un cliente valido!");
    return;
  }

  try {
    // Process client inputs in the same way as aggiungiContratto
    const clientInputs = nuovoCliente.split(",").map(g => g.trim()).filter(Boolean);
    const clientCodes = [];

    // Create an array to track any new clients we need to create
    const newClientsToCreate = [];

    console.log("Processing client inputs:", clientInputs);

    // For each client input, find matching client code
    for (const clientInput of clientInputs) {
      // First, check if this is already a valid client code
      const existingClientByCode = clienti.find(c => c.codice === clientInput);
      if (existingClientByCode) {
        clientCodes.push(clientInput);
        console.log(`Found existing client by code: ${clientInput}`);
        continue;
      }

      // Check if this is a client name (format: "Nome Cognome")
      const nameParts = clientInput.split(' ');
      if (nameParts.length >= 2) {
        const nome = nameParts[0];
        const cognome = nameParts.slice(1).join(' ');

        // Look for existing client with this name
        const existingClient = clienti.find(c =>
          c.nome && c.nome.toLowerCase() === nome.toLowerCase() &&
          c.cognome && c.cognome.toLowerCase() === cognome.toLowerCase()
        );

        if (existingClient) {
          // Use existing client code
          clientCodes.push(existingClient.codice);
          console.log(`Found existing client by name: ${existingClient.codice} - ${existingClient.nome} ${existingClient.cognome}`);
        } else {
          // Create a new client
          const newClientCode = `CLI${generateId()}`;
          const newClient = {
            codice: newClientCode,
            nome: nome,
            cognome: cognome,
            email: ''
          };

          // Add to the list of clients to create
          newClientsToCreate.push(newClient);

          // Add to local array and use this code
          clientCodes.push(newClientCode);
          console.log(`Will create new client: ${newClientCode} - ${nome} ${cognome}`);
        }
      } else {
        // Just a single word - treat as unknown client code
        clientCodes.push(clientInput);
        console.log(`Using unknown client input as code: ${clientInput}`);
      }
    }

    // First create any new clients if needed
    for (const newClient of newClientsToCreate) {
      console.log(`Creating new client: ${newClient.codice} - ${newClient.nome} ${newClient.cognome}`);

      const clientResponse = await fetch(`${API_URL}/Clienti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      if (!clientResponse.ok) {
        console.warn(`Warning: Failed to create client: ${clientResponse.statusText}`);
        continue;
      }

      const savedClient = await clientResponse.json();
      clienti.push(savedClient); // Update local clients array
      console.log(`Client created successfully: ${savedClient.codice}`);
    }

    // Now update the contract with the updated client codes
    const updatedContract = {
      numProgr: numProgr,
      data: nuovaData,
      importo: parseFloat(nuovoImporto),
      stipulatoDa: clientCodes // This is the key part - we're sending an array of client codes
    };

    console.log("Sending updated contract to server:", updatedContract);

    const response = await fetch(`${API_URL}/Contratti/${numProgr}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedContract)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Get the updated contract from the response
    const updatedData = await response.json();
    console.log("Received updated contract from server:", updatedData);

    // Update local contract object - ensure we keep the numProgr and stipulatoDa is an array
    const contractIndex = contratti.findIndex(contract => contract.numProgr == numProgr);
    if (contractIndex !== -1) {
      contratti[contractIndex] = {
        ...updatedData,
        stipulatoDa: ensureArray(updatedData.stipulatoDa)
      };
    }

    alert("Contratto aggiornato con successo.");
    mostraLista("contratti");
  } catch (error) {
    console.error("Error updating contract:", error);
    alert(`Errore durante l'aggiornamento del contratto: ${error.message}`);
  }
}

// Delete a contract
async function eliminaContratto(numProgr) {
  if (confirm("Vuoi eliminare questo contratto?")) {
    try {
      const response = await fetch(`${API_URL}/Contratti/${numProgr}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Remove from local array
      contratti = contratti.filter(c => c.numProgr != numProgr);

      alert("Contratto eliminato.");
      mostraLista("contratti");
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Errore durante l'eliminazione del contratto.");
    }
  }
}

// Show form to add a contract
function mostraForm(tipo) {
  const container = document.getElementById("risultati");
  container.innerHTML = "";

  let formHtml = "";
  if (tipo === "aggiungiContratto") {
    // Create client dropdown for existing clients
    let clientiOptions = "";
    if (clienti.length > 0) {
      clienti.forEach(c => {
        clientiOptions += `<option value="${c.codice}">${c.nome} ${c.cognome}</option>`;
      });
    }

    formHtml = `
      <h3>Aggiungi Contratto</h3>
      <form id="formContratto">
        <div class="form-group">
          <label for="data">Data:</label>
          <input type="date" id="data" name="data" required>
        </div>
        <div class="form-group">
          <label for="importo">Importo (€):</label>
          <input type="number" step="0.01" id="importo" name="importo" required>
        </div>
        <div class="form-group">
          <label for="clienti">Clienti:</label>
          <div id="clientiInputContainer">
            <div class="cliente-input-row">
              <input type="text" name="clienti[]" class="cliente-input" placeholder="Nome Cognome o Codice Cliente" required>
              <button type="button" class="add-cliente-btn">+</button>
            </div>
          </div>
          <small>Inserisci nome e cognome del cliente o seleziona un cliente esistente</small>
        </div>
        ${clienti.length > 0 ? `
          <div class="form-group">
            <label>Seleziona cliente esistente:</label>
            <select id="clientiEsistenti">
              <option value="">-- Seleziona un cliente --</option>
              ${clientiOptions}
            </select>
            <button type="button" id="aggiungiClienteEsistente">Aggiungi alla lista</button>
          </div>
        ` : ''}
        <button type="submit">Aggiungi Contratto</button>
      </form>
    `;
  }

  container.innerHTML = formHtml;

  if (tipo === "aggiungiContratto") {
    // Add client button functionality
    document.querySelector('.add-cliente-btn').addEventListener('click', function() {
      const container = document.getElementById('clientiInputContainer');
      const newRow = document.createElement('div');
      newRow.className = 'cliente-input-row';
      newRow.innerHTML = `
        <input type="text" name="clienti[]" class="cliente-input" placeholder="Nome Cognome o Codice Cliente" required>
        <button type="button" class="remove-cliente-btn">-</button>
      `;
      container.appendChild(newRow);

      // Add remove button functionality
      newRow.querySelector('.remove-cliente-btn').addEventListener('click', function() {
        container.removeChild(newRow);
      });
    });

    // Add existing client to the list
    if (clienti.length > 0) {
      document.getElementById('aggiungiClienteEsistente').addEventListener('click', function() {
        const select = document.getElementById('clientiEsistenti');
        const selectedClientCode = select.value;

        if (!selectedClientCode) {
          alert('Seleziona un cliente dalla lista');
          return;
        }

        const selectedClient = clienti.find(c => c.codice === selectedClientCode);
        if (selectedClient) {
          // Add to the first empty input or create a new one
          const emptyInput = Array.from(document.querySelectorAll('.cliente-input')).find(input => !input.value);

          if (emptyInput) {
            emptyInput.value = `${selectedClient.nome} ${selectedClient.cognome}`;
          } else {
            // Create a new row
            document.querySelector('.add-cliente-btn').click();
            // Set the value to the last added input
            const inputs = document.querySelectorAll('.cliente-input');
            inputs[inputs.length - 1].value = `${selectedClient.nome} ${selectedClient.cognome}`;
          }
        }
      });
    }

    // Form submission
    document.getElementById("formContratto").addEventListener("submit", function (e) {
      e.preventDefault();
      const data = document.getElementById('data').value;
      const importo = parseFloat(document.getElementById('importo').value);

      // Collect all client inputs
      const clientiInputs = Array.from(document.querySelectorAll('.cliente-input'))
        .map(input => input.value.trim())
        .filter(Boolean);

      if (clientiInputs.length === 0) {
        alert("Inserisci almeno un cliente.");
        return;
      }

      aggiungiContratto(data, importo, clientiInputs);
      this.reset();
      container.innerHTML = "";
    });
  }
}

// Filter form handling - fixed version
document.getElementById("filtroForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  const dataInizio = formData.get("dataInizio");
  const settore = formData.get("settore");
  const fila = formData.get("fila");
  const tipologia = formData.get("tipologia");
  const tipoTariffa = formData.get("tipoTariffa");
  const numMinGiorni = parseInt(formData.get("numMinGiorni")) || 0;
  const prezzoMin = parseFloat(formData.get("prezzoMin")) || 0;
  const prezzoMax = parseFloat(formData.get("prezzoMax")) || Infinity;

  const container = document.getElementById("risultati");
  container.innerHTML = "<h3>Risultati Filtrati</h3>";

  // Determine which view we're in by checking URL or current displayed content
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view') || 'contratti'; // Default to contratti if no view specified

  console.log(`Current view: ${view}, Applying filters...`);

  if (view === 'ombrelloni') {
    // Filter ombrelloni
    console.log("Filtering ombrelloni with criteria:", { settore, fila, tipologia });

    let risultati = ombrelloni.filter(o => {
      let matches = true;
      if (settore && o.settore !== settore) matches = false;
      if (fila && o.fila != fila) matches = false;
      if (tipologia && o.tipologia !== tipologia) matches = false;
      return matches;
    });

    console.log(`Found ${risultati.length} ombrelloni matching criteria`);

    if (risultati.length === 0) {
      container.innerHTML += "<p>Nessun ombrellone trovato con i filtri selezionati.</p>";
      return;
    }

    risultati.forEach(o => {
      const div = document.createElement("div");
      div.classList.add("ombrellone-box");

      const dettagli = `
        <strong>Ombrellone #${o.id}</strong><br>
        Settore: ${o.settore} <br>
        Fila: ${o.fila}, numFila: ${o.ordine}<br>
        Tipologia: ${o.tipologia}
      `;

      let stato = "";
      const disp = disponibilita.filter(d => d.idOmbrellone === o.id);
      const venduto = venduti.find(v => v.idOmbrellone === o.id);

      if (disp.length > 0) {
        stato += `<div class="libero"><strong>Libero</strong><br>`;
        disp.forEach(d => {
          stato += `${new Date(d.data).toLocaleDateString('it-IT')}<br>`;
        });
        stato += `</div>`;
      }

      if (venduto) {
        const contratto = contratti.find(c => c.numProgr == venduto.contratto);
        const stipulatoDa = contratto ? ensureArray(contratto.stipulatoDa) : [];
        const clientiContratto = stipulatoDa.map(cod => {
          const cliente = clienti.find(cl => cl.codice === cod);
          return cliente ? `${cliente.nome} ${cliente.cognome}` : cod;
        }).join(", ") || "Cliente sconosciuto";

        stato += `<div class="occupato"><strong>Occupato</strong><br>
          ${new Date(venduto.data).toLocaleDateString('it-IT')}<br>
          Cliente: ${clientiContratto}
        </div>`;
      }

      if (!stato) {
        stato = `<div class="nessuno"><em>Nessuna informazione sulla disponibilità.</em></div>`;
      }

      div.innerHTML = `
        <div class="info-ombrellone">${dettagli}</div>
        <div class="stato-ombrellone">${stato}</div>
      `;

      container.appendChild(div);
    });
  } else {
    // Filter contracts
    console.log("Filtering contratti with criteria:", {
      dataInizio,
      prezzoMin,
      prezzoMax,
      tipoTariffa,
      numMinGiorni,
      settore,
      fila,
      tipologia
    });

    let risultati = contratti.filter(c => {
      let matches = true;

      // Date filter
      if (dataInizio) {
        const dataContratto = new Date(c.data);
        const dataFiltro = new Date(dataInizio);
        if (dataContratto < dataFiltro) matches = false;
      }

      // Price filter
      if (c.importo < prezzoMin || c.importo > prezzoMax) matches = false;

      // Minimum days filter for subscriptions
      if (tipoTariffa === "Abbonamento") {
        const stipulatoDa = ensureArray(c.stipulatoDa);
        if (stipulatoDa.length < numMinGiorni) matches = false;
      }

      return matches;
    });

    // Additional filter for umbrella-specific criteria
    if (settore || fila || tipologia) {
      const venduti_ids = venduti.map(v => v.contratto);
      risultati = risultati.filter(c => {
        // Find if this contract has any umbrellas sold to it
        const vendutoPerContratto = venduti.filter(v => v.contratto == c.numProgr);

        if (vendutoPerContratto.length === 0) return false;

        // Check if any of the umbrellas match the filter criteria
        return vendutoPerContratto.some(v => {
          const ombrellone = ombrelloni.find(o => o.id === v.idOmbrellone);
          if (!ombrellone) return false;

          let matches = true;
          if (settore && ombrellone.settore !== settore) matches = false;
          if (fila && ombrellone.fila != fila) matches = false;
          if (tipologia && ombrellone.tipologia !== tipologia) matches = false;

          return matches;
        });
      });
    }

    console.log(`Found ${risultati.length} contratti matching criteria`);

    if (risultati.length === 0) {
      container.innerHTML += "<p>Nessun risultato trovato con i filtri selezionati.</p>";
      return;
    }

    risultati.forEach(c => {
      const formattedDate = new Date(c.data).toLocaleDateString("it-IT");
      const div = document.createElement("div");

      // Ensure stipulatoDa is an array before joining
      const stipulatoDa = ensureArray(c.stipulatoDa);

      // Find client names for this contract
      const clientNames = stipulatoDa.map(cod => {
        const cliente = clienti.find(cl => cl.codice === cod);
        return cliente ? `${cliente.nome} ${cliente.cognome}` : cod;
      }).join(", ");

      div.innerHTML = `
        <strong>Contratto #${c.numProgr}</strong><br>
        Data: ${formattedDate}, Importo: €${parseFloat(c.importo).toFixed(2)}<br>
        Stipulato da: ${clientNames || "Cliente sconosciuto"}<br>
        <button onclick="modificaContratto('${c.numProgr}')">Modifica</button>
        <button onclick="eliminaContratto('${c.numProgr}')">Elimina</button>
        <hr>`;
      container.appendChild(div);
    });
  }
});

// Function to handle field display for minimum days
function toggleMinGiorniField() {
  const tipoTariffa = document.getElementById("tipoTariffa");
  const labelMinGiorni = document.getElementById("labelMinGiorni");

  if (tipoTariffa && labelMinGiorni) {
    if (tipoTariffa.value === "Abbonamento") {
      labelMinGiorni.style.display = "block";
    } else {      labelMinGiorni.style.display = "none";
    }
  }
}

// Add event listener for tipoTariffa change
const tipoTariffaSelect = document.getElementById("tipoTariffa");
if (tipoTariffaSelect) {
  tipoTariffaSelect.addEventListener("change", toggleMinGiorniField);
  // Call once to set initial state
  toggleMinGiorniField();
}