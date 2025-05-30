// Sistema Gestione Ombrelloni - Ultra Ottimizzato (Compatto)
class OmbrelloniManager {
  constructor() {
    this.data = { ombrelloni: [], tipologie: [], tariffe: [], contratti: [], clienti: [], venduti: [], disponibilita: [] };
    this.config = { apiUrl: 'http://localhost:3000/api', dateFormat: 'it-IT' };
    this.init();
  }

  async init() {
  
    try {
      await this.loadData();
      this.setupEvents();
      this.handleURL();
      this.updateStats();
    } catch (error) {
      this.notify('Errore inizializzazione: ' + error.message, 'error');
    }
  }

  // Utilities
  id() { return `${Date.now()}_${Math.floor(Math.random() * 1000)}`; }
  arr(v) { return !v ? [] : Array.isArray(v) ? v : (typeof v === 'string' && v.includes(',') ? v.split(',').map(s => s.trim()).filter(Boolean) : [String(v)]); }
  
  notify(msg, type = 'info') {
    const colors = { error: '#f44336', success: '#4caf50', info: '#2196f3' };
    let container = document.getElementById('notifications') || Object.assign(document.createElement('div'), { id: 'notifications', style: 'position:fixed;top:20px;right:20px;z-index:1000' });
    if (!container.parentNode) document.body.appendChild(container);
    
    const notification = Object.assign(document.createElement('div'), {
      textContent: msg,
      style: `background:${colors[type]};color:white;padding:12px 16px;margin-bottom:8px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2)`
    });
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

  // Data Loading
  async loadData() {
    const response = await fetch(`${this.config.apiUrl}/data`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    Object.assign(this.data, {
      ombrelloni: data.ombrelloni || [],
      tipologie: data.tipologie || [],
      tariffe: data.tariffe || [],
      clienti: data.clienti || [],
      contratti: (data.contratti || []).map(c => ({ ...c, stipulatoDa: this.arr(c.stipulatoDa), importo: +c.importo || 0 })),
      venduti: (data.ombrelloneVenduto || []).map(v => ({ idOmbrellone: v.idOmbrellone, data: new Date(v.data), contratto: v.contratto })),
      disponibilita: (data.giornoDisponibilita || []).map(d => ({ idOmbrellone: d.idOmbrellone, data: new Date(d.data) }))
    });
    this.notify('Dati caricati con successo', 'success');
  }

setupEvents() {
  const form = document.getElementById("filtroForm");
  const select = document.getElementById("tipoTariffa");
  if (form) form.addEventListener("submit", e => this.handleFilter(e));
  if (select) select.addEventListener("change", () => this.toggleMinDays());
  
  // Aggiungi gestione autocomplete per cliente
  const clienteInput = document.getElementById("cliente");
  if (clienteInput) {
    this.setupClienteAutocomplete(clienteInput);
  }
}

// 2. AGGIUNGERE nuovo metodo per autocomplete cliente:
setupClienteAutocomplete(input) {
  const datalist = document.createElement('datalist');
  datalist.id = 'clientiList';
  this.data.clienti.forEach(c => {
    const option = document.createElement('option');
    option.value = `${c.nome} ${c.cognome}`;
    option.setAttribute('data-codice', c.codice);
    datalist.appendChild(option);
  });
  input.setAttribute('list', 'clientiList');
  input.parentNode.appendChild(datalist);
}

  handleURL() {
    const view = new URLSearchParams(window.location.search).get('view');
    if (view) setTimeout(() => this.showList(view), 100);
  }

  // Display Methods
// MODIFICA SOLO IL METODO showList per le tipologie
showList(type) {
  const container = document.getElementById("risultati");
  if (!container) return;
  container.innerHTML = "";
  
  const displays = {
    ombrelloni: () => this.displayOmbrelloni(container),
    
    // MODIFICATO: Genera l'HTML esatto come nel file HTML
    tipologie: () => {
      container.innerHTML = `
        <div class="tipologie-container">
          <div class="tipologia-card">
            <img src="standard.jpg" alt="Ombrellone Standard" class="tipologia-image">
            <div class="tipologia-content">
              <h3 class="tipologia-title">
                <i class="fas fa-umbrella-beach"></i>
                Standard<br>(T1)
              </h3>
              <div class="tipologia-price">+€0,00/giorno</div>
              <div class="tipologia-features">
                <span class="feature-tag">2 Lettini</span>
                <span class="feature-tag">Servizi Base</span>
                <span class="feature-tag">Pulizia</span>
              </div>
            </div>
          </div>

          <div class="tipologia-card">
            <img src="family.jpg" alt="Ombrellone Premium" class="tipologia-image">
            <div class="tipologia-content">
              <h3 class="tipologia-title">
                <i class="fas fa-crown"></i>
                Family<br>(T2)
              </h3>
              <div class="tipologia-price">+€5,00/giorno</div>
              <div class="tipologia-features">
                <span class="feature-tag">2 Lettini Premium</span>
                <span class="feature-tag">Ombrellone</span>
                <span class="feature-tag">Tavolino</span>
                <span class="feature-tag">Servizi aggiuntivi</span>
              </div>
            </div>
          </div>

          <div class="tipologia-card">
            <img src="luxury.jpg" alt="Ombrellone VIP" class="tipologia-image">
            <div class="tipologia-content">
              <h3 class="tipologia-title">
                <i class="fas fa-gem"></i>
                Luxury<br>(T3)
              </h3>
              <div class="tipologia-price">+€10,00/giorno</div>
              <div class="tipologia-features">
                <span class="feature-tag">Ombrellone doppio</span>
                <span class="feature-tag">Lettini</span>
                <span class="feature-tag">Tavolino</span>
                <span class="feature-tag">Cassetta sicurezza</span>
                <span class="feature-tag">Servizi aggiuntivi</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    
    tipologiatariffa: () => this.data.tariffe.forEach(t => container.innerHTML += `<strong>Codice: ${t.codTipologia || t.codice}</strong><br>Tariffa: ${t.codTariffa || 'N/A'}<br>Prezzo: €${(+t.prezzo || 0).toFixed(2)}<br>Tipo: ${t.tipo || 'N/A'}<br><hr>`),
    clienti: () => this.data.clienti.forEach(c => { const birth = c.dataNascita ? new Date(c.dataNascita).toLocaleDateString(this.config.dateFormat) : ''; container.innerHTML += `<strong>${c.nome} ${c.cognome}</strong> (${c.codice})<br>Email: ${c.email || 'N/A'}<br>${birth ? `Nascita: ${birth}<br>` : ''}${c.indirizzo ? `Indirizzo: ${c.indirizzo}<br>` : ''}<hr>`; }),
    contratti: () => {
      if (!this.data.contratti || this.data.contratti.length === 0) {
        container.innerHTML = `
          <div class="no-contracts">
            <h3>📋 Contratti</h3>
            <p><strong>Non disponibili</strong></p>
            <p>Nessun contratto presente nel sistema.</p>
          </div>`;
      } else {
        this.displayContratti(container);
      }
    },
    guida: () => container.innerHTML = `<h3>Guida Gestione Ombrelloni</h3><ul><li><strong>Contratti</strong>: Crea, modifica, elimina contratti</li><li><strong>Ombrelloni</strong>: Visualizza stato e disponibilità</li><li><strong>Clienti</strong>: Gestisci anagrafica clienti</li><li><strong>Tipologie</strong>: Visualizza tipologie ombrelloni</li></ul><p>Sistema basato su MongoDB Atlas per gestione dati ottimale.</p>`
  };
  (displays[type] || (() => container.innerHTML = "<p>Tipo non riconosciuto</p>"))();
}

  displayOmbrelloni(container) {
    if (!this.data.ombrelloni.length) return container.innerHTML = "<p>Nessun ombrellone disponibile.</p>";
    this.data.ombrelloni.forEach(o => {
      const id = o.id || o._id;
      container.appendChild(Object.assign(document.createElement("div"), {
        className: "ombrellone-box",
        innerHTML: `<div class="info-ombrellone"><strong>Ombrellone #${id}</strong><br>Settore: ${o.settore || 'N/A'}<br>Fila: ${o.fila || 'N/A'}, Posto: ${o.postoFila || o.numFila || o.ordine || 'N/A'}<br>Tipologia: ${o.tipologia || 'N/A'}</div><div class="stato-ombrellone">${this.getStatus(id)}</div>`
      }));
    });
  }

  getStatus(id) {
    const available = this.data.disponibilita.filter(d => d.idOmbrellone === id);
    const sold = this.data.venduti.find(v => v.idOmbrellone === id);
    let status = "";
    
    if (available.length) status += `<div class="libero"><strong>Libero</strong><br>${available.map(a => a.data.toLocaleDateString(this.config.dateFormat)).join('<br>')}</div>`;
    if (sold) {
      const contract = this.data.contratti.find(c => c.numProgr == sold.contratto);
      status += `<div class="occupato"><strong>Occupato</strong><br>${sold.data.toLocaleDateString(this.config.dateFormat)}<br>Cliente: ${this.getClientNames(contract?.stipulatoDa || [])}</div>`;
    }
    return status || `<div class="nessuno"><em>Nessuna informazione</em></div>`;
  }

  getClientNames(codes) {
    return this.arr(codes).map(code => {
      const client = this.data.clienti.find(c => c.codice === code);
      return client ? `${client.nome} ${client.cognome}` : code;
    }).join(", ") || "Cliente sconosciuto";
  }

displayContratti(container) {
  this.displayContrattiList(container, this.data.contratti);
}

// Metodo per mostrare/nascondere form di modifica
toggleEditContract(id) {
  const display = document.getElementById(`display-${id}`);
  const edit = document.getElementById(`edit-${id}`);
  
  if (display && edit) {
    const isEditing = edit.style.display !== 'none';
    display.style.display = isEditing ? 'block' : 'none';
    edit.style.display = isEditing ? 'none' : 'block';
  }
}

// Metodo per salvare le modifiche inline
async saveContractEdit(event, id) {
  event.preventDefault();
  const form = new FormData(event.target);
  
  const updated = {
    data: form.get('data'),
    importo: +form.get('importo'),
    stipulatoDa: [form.get('cliente')]
  };
  
  if (!updated.data || !updated.importo || updated.importo <= 0 || !updated.stipulatoDa[0]) {
    return this.notify('Compila tutti i campi correttamente', 'error');
  }

  try {
    const response = await fetch(`${this.config.apiUrl}/Contratti/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const index = this.data.contratti.findIndex(c => this.extractId(c._id) === id);
    if (index !== -1) {
      this.data.contratti[index] = { 
        ...await response.json(), 
        stipulatoDa: this.arr(updated.stipulatoDa), 
        importo: +updated.importo 
      };
    }
    
    this.notify("Contratto aggiornato con successo", 'success');
    this.showList("contratti");
    this.updateStats();
  } catch (error) {
    this.notify('Errore aggiornamento: ' + error.message, 'error');
  }
}
  // Contract Management
  showForm(type) {
    const container = document.getElementById("risultati");
    if (!container || type !== "aggiungiContratto") return;
    
    const available = this.getAvailableClients();
    if (!available.length) return container.innerHTML = `<div class="alert alert-warning"><h3>Nessun Cliente Disponibile</h3><p>Tutti i clienti hanno già contratti attivi.</p><button onclick="ombrelloniManager.showList('clienti')">Vedi Clienti</button></div>`;

    container.innerHTML = `<h3>Nuovo Contratto</h3><form id="formContratto"><div class="form-group"><label>Data: <input type="date" name="data" required></label></div><div class="form-group"><label>Importo (€): <input type="number" step="0.01" name="importo" required min="0"></label></div><div class="form-group"><label>Cliente: <select name="cliente" required><option value="">-- Seleziona --</option>${available.map(c => `<option value="${c.codice}">${c.nome} ${c.cognome}</option>`).join('')}</select></label></div><button type="submit">Crea Contratto</button> <button type="button" onclick="ombrelloniManager.showList('contratti')">Annulla</button></form>`;
    document.getElementById('formContratto').addEventListener('submit', e => this.handleContractSubmit(e));
  }

 getAvailableClients(excludeContractId = null) {
  const usedCodes = new Set();
  
  // Raccoglie tutti i codici clienti già utilizzati in contratti attivi
  this.data.contratti.forEach(c => {
    // Se stiamo modificando un contratto, escludiamo quel contratto dal controllo
    const contractId = this.extractId(c._id);
    if (contractId !== excludeContractId) {
      this.arr(c.stipulatoDa).forEach(code => usedCodes.add(code));
    }
  });
  
  return this.data.clienti.filter(c => !usedCodes.has(c.codice));
}

  async handleContractSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = { data: form.get('data'), importo: +form.get('importo'), stipulatoDa: [form.get('cliente')] };
    
    if (!data.data || !data.importo || data.importo <= 0 || !data.stipulatoDa[0]) return this.notify('Compila tutti i campi correttamente', 'error');

    try {
      await this.saveContract(data);
      e.target.reset();
      this.showList('contratti');
    } catch (error) {
      this.notify('Errore salvataggio: ' + error.message, 'error');
    }
  }

  async saveContract(data) {
    const response = await fetch(`${this.config.apiUrl}/Contratti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    saved.stipulatoDa = this.arr(saved.stipulatoDa);
    saved.importo = +saved.importo;
    this.data.contratti.push(saved);
    this.notify('Contratto creato con successo', 'success');
    this.updateStats();
  }

  extractId(id) {
    if (typeof id === 'string' && id.includes('ObjectId')) {
      const match = id.match(/ObjectId\('([^']+)'\)/);
      return match ? match[1] : id;
    }
    return id?.$oid || id;
  }

  async editContract(id) {
    const contract = this.data.contratti.find(c => this.extractId(c._id) === id);
    if (!contract) return this.notify("Contratto non trovato", 'error');

    const newDate = prompt("Data (YYYY-MM-DD):", contract.data);
    const newAmount = prompt("Importo (€):", contract.importo);
    const newClient = prompt("Cliente:", this.getClientNames(contract.stipulatoDa));
    if (!newDate || !newAmount || !newClient) return;

    try {
      const clientCodes = await this.processClients([newClient]);
      const updated = { data: newDate, importo: +newAmount, stipulatoDa: clientCodes };
      
      const response = await fetch(`${this.config.apiUrl}/Contratti/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const index = this.data.contratti.findIndex(c => this.extractId(c._id) === id);
      if (index !== -1) this.data.contratti[index] = { ...await response.json(), stipulatoDa: this.arr(updated.stipulatoDa), importo: +updated.importo };
      
      this.notify("Contratto aggiornato", 'success');
      this.showList("contratti");
      this.updateStats();
    } catch (error) {
      this.notify('Errore aggiornamento: ' + error.message, 'error');
    }
  }

async deleteContract(id) {
  // Mostra il pannello di conferma inline
  this.showDeleteConfirmation(id);
}

// 2. AGGIUNGERE questo nuovo metodo per mostrare la conferma inline:

showDeleteConfirmation(id) {
  const displayDiv = document.getElementById(`display-${id}`);
  if (!displayDiv) return;
  
  // Nascondi il display normale
  displayDiv.style.display = 'none';
  
  // Crea o aggiorna il pannello di conferma
  let confirmDiv = document.getElementById(`confirm-delete-${id}`);
  if (!confirmDiv) {
    confirmDiv = document.createElement('div');
    confirmDiv.id = `confirm-delete-${id}`;
    confirmDiv.className = 'contratto-delete-confirmation';
    displayDiv.parentNode.insertBefore(confirmDiv, displayDiv.nextSibling);
  }
  
  const contract = this.data.contratti.find(c => this.extractId(c._id) === id);
  const clientName = contract ? this.getClientNames(contract.stipulatoDa) : 'Cliente sconosciuto';
  const amount = contract ? contract.importo.toFixed(2) : '0.00';
  const date = contract ? new Date(contract.data).toLocaleDateString(this.config.dateFormat) : '';
  
  confirmDiv.innerHTML = `
    <div class="delete-warning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <h4>Conferma Eliminazione Contratto</h4>
        <p><strong>Stai per eliminare definitivamente:</strong></p>
        <ul>
          <li><strong>Cliente:</strong> ${clientName}</li>
          <li><strong>Data:</strong> ${date}</li>
          <li><strong>Importo:</strong> €${amount}</li>
        </ul>
        <p class="warning-text">⚠️ <strong>Attenzione:</strong> Questa azione non può essere annullata!</p>
      </div>
    </div>
    <div class="confirmation-actions">
      <button class="btn-confirm-delete" onclick="ombrelloniManager.confirmDeleteContract('${id}')">
        <i class="fas fa-trash"></i> Elimina Definitivamente
      </button>
      <button class="btn-cancel-delete" onclick="ombrelloniManager.cancelDeleteContract('${id}')">
        <i class="fas fa-times"></i> Annulla
      </button>
    </div>
  `;
  
  confirmDiv.style.display = 'block';
}

// 3. AGGIUNGERE questo metodo per confermare l'eliminazione:

async confirmDeleteContract(id) {
  try {
    const response = await fetch(`${this.config.apiUrl}/Contratti/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // Rimuovi il contratto dai dati locali
    this.data.contratti = this.data.contratti.filter(c => this.extractId(c._id) !== id);
    
    // Rimuovi l'intero elemento contratto dal DOM
    const contractItem = document.getElementById(`display-${id}`).closest('.contratto-item');
    if (contractItem) {
      contractItem.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      contractItem.style.opacity = '0';
      contractItem.style.transform = 'translateX(-20px)';
      
      setTimeout(() => {
        contractItem.remove();
        this.notify("Contratto eliminato con successo", 'success');
        this.updateStats();
        
        // Se non ci sono più contratti, mostra messaggio
        if (this.data.contratti.length === 0) {
          const container = document.getElementById("risultati");
          if (container && container.children.length === 0) {
            container.innerHTML = `
              <div class="no-contracts">
                <h3>📋 Contratti</h3>
                <p><strong>Non disponibili</strong></p>
                <p>Nessun contratto presente nel sistema.</p>
              </div>`;
          }
        }
      }, 300);
    }
  } catch (error) {
    this.notify('Errore eliminazione: ' + error.message, 'error');
    this.cancelDeleteContract(id); // Ripristina la vista normale in caso di errore
  }
}

// 4. AGGIUNGERE questo metodo per annullare l'eliminazione:

cancelDeleteContract(id) {
  const displayDiv = document.getElementById(`display-${id}`);
  const confirmDiv = document.getElementById(`confirm-delete-${id}`);
  
  if (displayDiv) displayDiv.style.display = 'block';
  if (confirmDiv) confirmDiv.remove();
}

  async processClients(inputs) {
    const codes = [];
    for (const input of inputs) {
      const existing = this.data.clienti.find(c => c.codice === input);
      if (existing) {
        codes.push(input);
        continue;
      }

      const parts = input.split(' ');
      if (parts.length >= 2) {
        const [nome, ...cognomeParts] = parts;
        const cognome = cognomeParts.join(' ');
        const byName = this.data.clienti.find(c => c.nome?.toLowerCase() === nome.toLowerCase() && c.cognome?.toLowerCase() === cognome.toLowerCase());
        
        codes.push(byName ? byName.codice : await this.createClient(nome, cognome));
      } else {
        codes.push(input);
      }
    }
    return codes;
  }

  async createClient(nome, cognome) {
    const code = `CLI${this.id()}`;
    const client = { codice: code, nome, cognome, email: '', dataNascita: null, indirizzo: '' };
    
    try {
      const response = await fetch(`${this.config.apiUrl}/Clienti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (response.ok) this.data.clienti.push(await response.json());
    } catch (error) {
      console.error('Errore creazione cliente:', error);
    }
    return code;
  }

// Sostituisci la parte del metodo handleFilter che gestisce i contratti:

handleFilter(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  
  // Controlla se siamo nella pagina contratti
  const isContrattiPage = window.location.pathname.includes('contratti.html') || 
                         new URLSearchParams(window.location.search).get('view') === 'contratti';
  
  if (isContrattiPage) {
    // CORREZIONE: Filtro specifico per contratti con nomi corretti
    const filters = {
      dataInizio: form.get("dataInizio"),  // Cambiato da dataContratto a dataInizio
      cliente: form.get("cliente")
    };
    this.applyContractFilters(filters);
  } else {
    // Filtro generale - AGGIUNTA gestione dataFine
    const filters = {
      dataInizio: form.get("dataInizio"),
      dataFine: form.get("dataFine"),
      settore: form.get("settore"),
      fila: form.get("fila"),
      tipologia: form.get("tipologia"),
      tipoTariffa: form.get("tipoTariffa"),
      numMinGiorni: +form.get("numMinGiorni") || 0,
      prezzoMin: +form.get("prezzoMin") || 0,
      prezzoMax: +form.get("prezzoMax") || Infinity
    };
    this.applyFilters(filters);
  }
}

// Sostituisci il metodo applyContractFilters con questa versione corretta:

// Sostituisci completamente il metodo applyContractFilters con questo:

applyContractFilters(filters) {
  const container = document.getElementById("risultati");
  if (!container) return;
  
  container.innerHTML = "<h3>🔍 Contratti Filtrati</h3>";
  
  let filteredContratti = this.data.contratti;
  
  // Filtro per data contratto
  if (filters.dataInizio) {
    const targetDate = filters.dataInizio;
    filteredContratti = filteredContratti.filter(c => {
      const contractDateStr = c.data.split('T')[0];
      return contractDateStr === targetDate;
    });
  }
  
  // Filtro per cliente
  if (filters.cliente && filters.cliente.trim()) {
    const searchTerm = filters.cliente.trim().toLowerCase();
    filteredContratti = filteredContratti.filter(c => {
      const clientNames = this.getClientNames(c.stipulatoDa).toLowerCase();
      return clientNames.includes(searchTerm);
    });
  }
  
  if (filteredContratti.length === 0) {
    container.innerHTML += `<div class="no-results">🚫 Nessun contratto trovato per i criteri selezionati</div>`;
    return;
  }
  
  // Ordina i contratti filtrati per data
  const contrattiOrdinati = [...filteredContratti].sort((a, b) => new Date(a.data) - new Date(b.data));
  
  // MODIFICA: Stessa logica di displayContrattiList per i contratti filtrati
  contrattiOrdinati.forEach((c, index) => {
    const date = new Date(c.data).toLocaleDateString(this.config.dateFormat);
    const id = this.extractId(c._id);
    const numeroSequenziale = index + 1;
    
    // NUOVO: Ottieni clienti disponibili per questo contratto specifico
    const availableClients = this.getAvailableClients(id);
    const currentClient = this.data.clienti.find(client => 
      this.arr(c.stipulatoDa).includes(client.codice)
    );
    
    // Combina cliente attuale con quelli disponibili (evitando duplicati)
    const allAvailableOptions = [...availableClients];
    if (currentClient && !availableClients.some(ac => ac.codice === currentClient.codice)) {
      allAvailableOptions.unshift(currentClient);
    }
    
    const contractDiv = document.createElement('div');
    contractDiv.className = 'contratto-item';
    contractDiv.innerHTML = `
      <div class="contratto-display" id="display-${id}">
        <div class="contratto-header">
          <strong>Contratto #${numeroSequenziale}</strong>
          <div class="contratto-actions">
            <button class="btn-edit" onclick="ombrelloniManager.toggleEditContract('${id}')">
              <i class="fas fa-edit"></i> Modifica
            </button>
           <button class="btn-delete" onclick="ombrelloniManager.deleteContract('${id}')">
              <i class="fas fa-trash"></i> Elimina
            </button>
          </div>
        </div>
        <div class="contratto-info">
          <span><strong>Data:</strong> ${date}</span>
          <span><strong>Importo:</strong> €${c.importo.toFixed(2)}</span>
          <span><strong>Cliente:</strong> ${this.getClientNames(c.stipulatoDa)}</span>
        </div>
      </div>
      
      <div class="contratto-edit-form" id="edit-${id}" style="display: none;">
        <form onsubmit="ombrelloniManager.saveContractEdit(event, '${id}')">
          <div class="form-row">
            <div class="form-group">
              <label>Data:</label>
              <input type="date" name="data" value="${c.data.split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label>Importo (€):</label>
              <input type="number" step="0.01" name="importo" value="${c.importo}" required min="0">
            </div>
            <div class="form-group">
              <label>Cliente:</label>
              <select name="cliente" required>
                ${allAvailableOptions.map(client => 
                  `<option value="${client.codice}" ${this.arr(c.stipulatoDa).includes(client.codice) ? 'selected' : ''}>
                    ${client.nome} ${client.cognome}
                  </option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-save">
              <i class="fas fa-save"></i> Salva
            </button>
            <button type="button" class="btn-cancel" onclick="ombrelloniManager.toggleEditContract('${id}')">
              <i class="fas fa-times"></i> Annulla
            </button>
          </div>
        </form>
      </div>
    `;
    
    container.appendChild(contractDiv);
  });
  
  // Aggiungi statistiche
  this.displayStats(container, filteredContratti);
}

// BONUS: Aggiungi anche questo metodo per evitare duplicazione del codice
displayContrattiList(container, contratti) {
  const contrattiOrdinati = [...contratti].sort((a, b) => new Date(a.data) - new Date(b.data));
  
  contrattiOrdinati.forEach((c, index) => {
    const date = new Date(c.data).toLocaleDateString(this.config.dateFormat);
    const id = this.extractId(c._id);
    const numeroSequenziale = index + 1;
    
    // NUOVO: Ottieni clienti disponibili per questo contratto specifico
    const availableClients = this.getAvailableClients(id);
    const currentClient = this.data.clienti.find(client => 
      this.arr(c.stipulatoDa).includes(client.codice)
    );
    
    // Combina cliente attuale con quelli disponibili (evitando duplicati)
    const allAvailableOptions = [...availableClients];
    if (currentClient && !availableClients.some(ac => ac.codice === currentClient.codice)) {
      allAvailableOptions.unshift(currentClient);
    }
    
    const contractDiv = document.createElement('div');
    contractDiv.className = 'contratto-item';
    contractDiv.innerHTML = `
      <div class="contratto-display" id="display-${id}">
        <div class="contratto-header">
          <strong>Contratto #${numeroSequenziale}</strong>
          <div class="contratto-actions">
            <button class="btn-edit" onclick="ombrelloniManager.toggleEditContract('${id}')">
              <i class="fas fa-edit"></i> Modifica
            </button>
            <button class="btn-delete" onclick="ombrelloniManager.deleteContract('${id}')">
              <i class="fas fa-trash"></i> Elimina
            </button>
          </div>
        </div>
        <div class="contratto-info">
          <span><strong>Data:</strong> ${date}</span>
          <span><strong>Importo:</strong> €${c.importo.toFixed(2)}</span>
          <span><strong>Cliente:</strong> ${this.getClientNames(c.stipulatoDa)}</span>
        </div>
      </div>
      
      <div class="contratto-edit-form" id="edit-${id}" style="display: none;">
        <form onsubmit="ombrelloniManager.saveContractEdit(event, '${id}')">
          <div class="form-row">
            <div class="form-group">
              <label>Data:</label>
              <input type="date" name="data" value="${c.data.split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label>Importo (€):</label>
              <input type="number" step="0.01" name="importo" value="${c.importo}" required min="0">
            </div>
            <div class="form-group">
              <label>Cliente:</label>
              <select name="cliente" required>
                ${allAvailableOptions.map(client => 
                  `<option value="${client.codice}" ${this.arr(c.stipulatoDa).includes(client.codice) ? 'selected' : ''}>
                    ${client.nome} ${client.cognome}
                  </option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-save">
              <i class="fas fa-save"></i> Salva
            </button>
            <button type="button" class="btn-cancel" onclick="ombrelloniManager.toggleEditContract('${id}')">
              <i class="fas fa-times"></i> Annulla
            </button>
          </div>
        </form>
      </div>
    `;
    
    container.appendChild(contractDiv);
  });
}

// AGGIUNGI questo nuovo metodo dopo getAvailableClients():

getAvailableClientsForEdit(currentContract) {
  const usedCodes = new Set();
  
  // Raccogli tutti i codici dei clienti che hanno contratti attivi
  this.data.contratti.forEach(c => {
    // ESCLUDE il contratto corrente che stiamo modificando
    if (c._id !== currentContract._id && c.numProgr !== currentContract.numProgr) {
      this.arr(c.stipulatoDa).forEach(code => usedCodes.add(code));
    }
  });
  
  // Restituisci tutti i clienti tranne quelli con contratti attivi
  // (ma include il cliente del contratto corrente)
  return this.data.clienti.filter(c => !usedCodes.has(c.codice));
}


  applyFilters(filters) {
    const container = document.getElementById("risultati");
    const isOmbrelloni = new URLSearchParams(window.location.search).get('view') === 'ombrelloni';
    
    if (isOmbrelloni) {
      container.innerHTML = `<h3>🏖️ Ombrelloni ${filters.dataInizio ? `per ${new Date(filters.dataInizio).toLocaleDateString(this.config.dateFormat)}` : 'Disponibili'}</h3>`;
      this.displayFilteredOmbrelloni(container, this.filterOmbrelloni(filters), filters);
    } else {
      container.innerHTML = "<h3>Contratti Filtrati</h3>";
      const results = this.filterContratti(filters);
      this.displayFilteredContratti(container, results);
    }
  }

// 2. MODIFICA del metodo filterOmbrelloni per considerare il range di date
filterOmbrelloni(filters) {
  return this.data.ombrelloni.filter(o => {
    const id = o.id || o._id;
    return (!filters.settore || o.settore === filters.settore) &&
           (!filters.fila || o.fila == filters.fila) &&
           (!filters.tipologia || o.tipologia === filters.tipologia) &&
           // MODIFICA: controllo range di date invece di singola data
           (!filters.dataInizio || this.isAvailableInPeriod(id, filters.dataInizio, filters.dataFine));
  });
}

  isAvailableOn(id, date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    
    const sold = this.data.venduti.some(v => {
      if (v.idOmbrellone !== id) return false;
      const soldDate = new Date(v.data);
      soldDate.setHours(0, 0, 0, 0);
      return soldDate.getTime() === target.getTime();
    });
    
    if (sold) return false;
    
    return this.data.disponibilita.some(d => {
      if (d.idOmbrellone !== id) return false;
      const availDate = new Date(d.data);
      availDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === target.getTime();
    });
  }

  // 3. NUOVO METODO per verificare disponibilità in un periodo
isAvailableInPeriod(ombrelloneId, dataInizio, dataFine) {
  if (!dataInizio) return true;
  
  const startDate = new Date(dataInizio);
  const endDate = dataFine ? new Date(dataFine) : new Date(dataInizio);
  
  // Normalizza le date (solo giorno, mese, anno)
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  // Se dataFine è precedente a dataInizio, scambia le date
  if (endDate < startDate) {
    [startDate, endDate] = [endDate, startDate];
  }
  
  // Verifica se l'ombrellone è venduto in qualsiasi giorno del periodo
  const isUnavailable = this.data.venduti.some(v => {
    if (v.idOmbrellone !== ombrelloneId) return false;
    
    const soldDate = new Date(v.data);
    soldDate.setHours(0, 0, 0, 0);
    
    // Controlla se la data di vendita è nel periodo richiesto
    return soldDate >= startDate && soldDate <= endDate;
  });
  
  // Se è venduto in qualsiasi giorno del periodo, non è disponibile
  if (isUnavailable) return false;
  
  // Se non ci sono date di disponibilità specifiche, considera disponibile
  if (!this.data.disponibilita.length) return true;
  
  // Verifica se c'è almeno una data di disponibilità nel periodo
  return this.data.disponibilita.some(d => {
    if (d.idOmbrellone !== ombrelloneId) return false;
    
    const availDate = new Date(d.data);
    availDate.setHours(0, 0, 0, 0);
    
    return availDate >= startDate && availDate <= endDate;
  });
}

  filterContratti(filters) {
    return this.data.contratti.filter(c => {
      const date = new Date(c.data);
      const amount = +c.importo || 0;
      return (!filters.dataInizio || date >= new Date(filters.dataInizio)) &&
             (amount >= filters.prezzoMin && amount <= filters.prezzoMax) &&
             (filters.tipoTariffa !== "Abbonamento" || filters.numMinGiorni <= 0 || this.arr(c.stipulatoDa).length >= filters.numMinGiorni);
    });
  }

  getOmbrellonePrice(ombrellone) {
    const tariffa = this.data.tariffe.find(t => t.codTipologia === ombrellone.tipologia || t.codice === ombrellone.tipologia);
    return tariffa ? (+tariffa.prezzo || 0) : 0;
  }

displayFilteredOmbrelloni(container, results, filters) {
  if (!results.length) {
    const periodoText = this.getPeriodoText(filters.dataInizio, filters.dataFine);
    return container.innerHTML += `<div class="no-results">🚫 Nessun ombrellone disponibile per i criteri selezionati${periodoText}</div>`;
  }
  
  results.forEach(o => {
    const id = o.id || o._id;
    const prezzo = this.getOmbrellonePrice(o);
    const periodoText = this.getPeriodoText(filters.dataInizio, filters.dataFine);
    
    container.appendChild(Object.assign(document.createElement("div"), {
      className: "ombrellone-box ombrellone-disponibile",
      innerHTML: `
        <div class="info-ombrellone">
          <strong>Ombrellone #${id}</strong><br>
          Settore: ${o.settore || 'N/A'} | Fila: ${o.fila || 'N/A'} | Posto: ${o.postoFila || o.numFila || 'N/A'}<br>
          Tipologia: ${o.tipologia || 'N/A'}${prezzo > 0 ? ` | Prezzo: €${prezzo.toFixed(2)}` : ''}
        </div>
        <div class="stato-ombrellone">
          <div class="disponibile">✅ <strong>DISPONIBILE${periodoText}</strong></div>
          <button class="btn-acquista" onclick="ombrelloniManager.handleAcquistaPeriod('${id}', ${prezzo}, '${filters.dataInizio || ''}', '${filters.dataFine || ''}')">
            💰 Acquista${prezzo > 0 ? ` €${prezzo.toFixed(2)}` : ''}
          </button>
        </div>`
    }));
  });
}

// 5. NUOVO METODO per formattare il testo del periodo
getPeriodoText(dataInizio, dataFine) {
  if (!dataInizio) return '';
  
  if (!dataFine || dataInizio === dataFine) {
    return ` per il ${new Date(dataInizio).toLocaleDateString(this.config.dateFormat)}`;
  }
  
  return ` dal ${new Date(dataInizio).toLocaleDateString(this.config.dateFormat)} al ${new Date(dataFine).toLocaleDateString(this.config.dateFormat)}`;
}

// 6. NUOVO METODO per gestire acquisto con periodo
async handleAcquistaPeriod(ombrelloneId, prezzo, dataInizio, dataFine) {
  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  if (!ombrellone) return this.notify('Ombrellone non trovato', 'error');

  const prezzoText = prezzo > 0 ? `€${prezzo.toFixed(2)}` : 'prezzo da definire';
  const periodoText = this.getPeriodoText(dataInizio, dataFine);
  
  if (confirm(`Vuoi acquistare l'Ombrellone #${ombrelloneId}?\nSettore: ${ombrellone.settore || 'N/A'} - Fila: ${ombrellone.fila || 'N/A'}\nTipologia: ${ombrellone.tipologia || 'N/A'}\nPrezzo: ${prezzoText}${periodoText}\n\nProcedi con la creazione del contratto?`)) {
    this.showContractFormForOmbrellone(ombrelloneId, prezzo, dataInizio, dataFine);
  }
}

  async handleAcquista(ombrelloneId, prezzo, dataSelezionata) {
    const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
    if (!ombrellone) return this.notify('Ombrellone non trovato', 'error');

    const prezzoText = prezzo > 0 ? `€${prezzo.toFixed(2)}` : 'prezzo da definire';
    const dataText = dataSelezionata ? ` per il ${new Date(dataSelezionata).toLocaleDateString(this.config.dateFormat)}` : '';
    
    if (confirm(`Vuoi acquistare l'Ombrellone #${ombrelloneId}?\nSettore: ${ombrellone.settore || 'N/A'} - Fila: ${ombrellone.fila || 'N/A'}\nTipologia: ${ombrellone.tipologia || 'N/A'}\nPrezzo: ${prezzoText}${dataText}\n\nProcedi con la creazione del contratto?`)) {
      this.showContractFormForOmbrellone(ombrelloneId, prezzo, dataSelezionata);
    }
  }

showContractFormForOmbrellone(ombrelloneId, prezzo, dataInizio, dataFine = null) {
  const container = document.getElementById("risultati");
  if (!container) return;
  
  const available = this.getAvailableClients(); // Nessun contratto da escludere per nuovo contratto
  if (!available.length) return container.innerHTML = `<div class="alert alert-warning"><h3>Nessun Cliente Disponibile</h3><p>Tutti i clienti hanno già contratti attivi.</p><button onclick="ombrelloniManager.showList('clienti')">Vedi Clienti</button><button onclick="ombrelloniManager.applyFilters(${JSON.stringify({})})">Torna agli Ombrelloni</button></div>`;

  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  const today = new Date().toISOString().split('T')[0];
  const defaultDateStart = dataInizio || today;
  const defaultDateEnd = dataFine || dataInizio || today;
  const defaultPrice = prezzo > 0 ? prezzo.toFixed(2) : '';

  container.innerHTML = `
    <h3>🏖️ Nuovo Contratto - Ombrellone #${ombrelloneId}</h3>
    <div class="ombrellone-info">
      <p><strong>Ombrellone Selezionato:</strong></p>
      <p>Settore: ${ombrellone?.settore || 'N/A'} | Fila: ${ombrellone?.fila || 'N/A'} | Posto: ${ombrellone?.postoFila || ombrellone?.numFila || 'N/A'}</p>
      <p>Tipologia: ${ombrellone?.tipologia || 'N/A'}</p>
    </div>
    <form id="formContratto">
      <input type="hidden" name="ombrelloneId" value="${ombrelloneId}">
      <div class="form-group">
        <label>Data Inizio: <input type="date" name="dataInizio" value="${defaultDateStart}" required></label>
      </div>
      <div class="form-group">
        <label>Data Fine: <input type="date" name="dataFine" value="${defaultDateEnd}" required></label>
      </div>
      <div class="form-group">
        <label>Importo (€): <input type="number" step="0.01" name="importo" value="${defaultPrice}" required min="0"></label>
      </div>
      <div class="form-group">
        <label>Cliente: 
          <select name="cliente" required>
            <option value="">-- Seleziona Cliente --</option>
            ${available.map(c => `<option value="${c.codice}">${c.nome} ${c.cognome}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button type="submit">✅ Crea Contratto</button> 
        <button type="button" onclick="history.back()">❌ Annulla</button>
      </div>
    </form>`;

  document.getElementById('formContratto').addEventListener('submit', e => this.handleContractSubmitWithPeriod(e));
}

// 8. NUOVO METODO per gestire il submit del contratto con periodo
async handleContractSubmitWithPeriod(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const data = { 
    dataInizio: form.get('dataInizio'),
    dataFine: form.get('dataFine'),
    importo: +form.get('importo'), 
    stipulatoDa: [form.get('cliente')], 
    ombrelloneId: form.get('ombrelloneId') 
  };
  
  if (!data.dataInizio || !data.dataFine || !data.importo || data.importo <= 0 || !data.stipulatoDa[0]) {
    return this.notify('Compila tutti i campi correttamente', 'error');
  }

  // Verifica che dataFine sia >= dataInizio
  if (new Date(data.dataFine) < new Date(data.dataInizio)) {
    return this.notify('La data fine deve essere successiva o uguale alla data inizio', 'error');
  }

  try {
    // Crea il contratto con la data di inizio
    const contractData = { 
      data: data.dataInizio, 
      importo: data.importo, 
      stipulatoDa: data.stipulatoDa 
    };
    await this.saveContract(contractData);
    
    // Crea le vendite per ogni giorno del periodo
    await this.createOmbrelloneSalesPeriod(data.ombrelloneId, data.dataInizio, data.dataFine);
    
    e.target.reset();
    this.notify(`Contratto creato e ombrellone #${data.ombrelloneId} venduto per il periodo selezionato!`, 'success');
    setTimeout(() => this.showList('ombrelloni'), 1000);
  } catch (error) {
    this.notify('Errore salvataggio: ' + error.message, 'error');
  }
}

// 9. NUOVO METODO per creare vendite per un periodo
async createOmbrelloneSalesPeriod(ombrelloneId, dataInizio, dataFine) {
  const startDate = new Date(dataInizio);
  const endDate = new Date(dataFine);
  const lastContract = this.data.contratti[this.data.contratti.length - 1];
  
  // Itera su ogni giorno del periodo
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    try {
      const saleData = { 
        idOmbrellone: ombrelloneId, 
        data: d.toISOString().split('T')[0], 
        contratto: lastContract?.numProgr || 'AUTO' 
      };
      
      const response = await fetch(`${this.config.apiUrl}/ombrelloneVenduto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const saved = await response.json();
        this.data.venduti.push({ 
          idOmbrellone: saved.idOmbrellone, 
          data: new Date(saved.data), 
          contratto: saved.contratto 
        });
      }
    } catch (error) {
      console.error(`Errore creazione vendita per ${d.toISOString().split('T')[0]}:`, error);
    }
  }
}

  async handleContractSubmitWithOmbrellone(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = { data: form.get('data'), importo: +form.get('importo'), stipulatoDa: [form.get('cliente')], ombrelloneId: form.get('ombrelloneId') };
    
    if (!data.data || !data.importo || data.importo <= 0 || !data.stipulatoDa[0]) return this.notify('Compila tutti i campi correttamente', 'error');

    try {
      await this.saveContract(data);
      await this.createOmbrelloneSale(data.ombrelloneId, data.data);
      e.target.reset();
      this.notify(`Contratto creato e ombrellone #${data.ombrelloneId} venduto con successo!`, 'success');
      setTimeout(() => this.showList('ombrelloni'), 1000);
    } catch (error) {
      this.notify('Errore salvataggio: ' + error.message, 'error');
    }
  }

  async createOmbrelloneSale(ombrelloneId, data) {
    try {
      const saleData = { idOmbrellone: ombrelloneId, data: data, contratto: this.data.contratti[this.data.contratti.length - 1]?.numProgr || 'AUTO' };
      const response = await fetch(`${this.config.apiUrl}/ombrelloneVenduto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const saved = await response.json();
        this.data.venduti.push({ idOmbrellone: saved.idOmbrellone, data: new Date(saved.data), contratto: saved.contratto });
      }
    } catch (error) {
      console.error('Errore creazione vendita ombrellone:', error);
    }
  }

displayFilteredContratti(container, results) {
  // Ordina anche i risultati filtrati
  const contrattiOrdinati = [...results].sort((a, b) => new Date(a.data) - new Date(b.data));
  
  contrattiOrdinati.forEach((c, index) => {
    const date = new Date(c.data).toLocaleDateString(this.config.dateFormat);
    const id = this.extractId(c._id);
    const numeroSequenziale = index + 1; // Numerazione sequenziale da 1
    
    container.innerHTML += `
      <div class="contratto-item">
        <strong>Contratto #${numeroSequenziale}</strong><br>
        Data: ${date} | Importo: €${c.importo.toFixed(2)} | Cliente: ${this.getClientNames(c.stipulatoDa)}<br>
        <button onclick="ombrelloniManager.editContract('${id}')">Modifica</button> 
        <button onclick="ombrelloniManager.deleteContract('${id}')">Elimina</button>
        <hr>
      </div>`;
  });
  this.displayStats(container, results);
}

  displayStats(container, results) {
    const total = results.reduce((sum, r) => sum + (+r.importo || 0), 0);
    container.insertAdjacentHTML('afterbegin', `<div class="stats-summary"><h4>📊 Statistiche</h4><p>Risultati: <strong>${results.length}</strong> | Totale: <strong>€${total.toFixed(2)}</strong></p></div>`);
  }

  toggleMinDays() {
    const select = document.getElementById("tipoTariffa");
    const label = document.getElementById("labelMinGiorni");
    if (select && label) label.style.display = select.value === "Abbonamento" ? "block" : "none";
  }

updateStats() {
    const active = this.data.contratti.length;
    const total = this.data.contratti.reduce((sum, c) => sum + (+c.importo || 0), 0);
    
    // Cerca elementi per ID specifici (home.html)
    const activeEl = document.getElementById('contratti-attivi');
    const totalEl = document.getElementById('incassi-totali');
    
    // Se non trova per ID, cerca per selettori CSS (tipologie.html e altre pagine)
    const activeElFallback = activeEl || document.querySelector('.stat-item:first-child .stat-value');
    const totalElFallback = totalEl || document.querySelector('.stat-item:last-child .stat-value');
    
    // Aggiorna tutti gli elementi trovati
    if (activeElFallback) activeElFallback.textContent = active;
    if (totalElFallback) totalElFallback.textContent = `€ ${total.toFixed(2)}`;
    
    // Cerca anche eventuali altri elementi con classi specifiche
    document.querySelectorAll('[data-stat="contratti-attivi"]').forEach(el => el.textContent = active);
    document.querySelectorAll('[data-stat="incassi-totali"]').forEach(el => el.textContent = `€ ${total.toFixed(2)}`);
  }
}

// Initialize
let ombrelloniManager;
document.addEventListener('DOMContentLoaded', () => {
  ombrelloniManager = new OmbrelloniManager();
  console.log("Sistema Ombrelloni caricato - Versione Ultra-Ottimizzata Compatta");
});