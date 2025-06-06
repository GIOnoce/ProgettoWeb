// Sistema Gestione Ombrelloni 

class OmbrelloniManager {
  constructor() {
    this.data = { ombrelloni: [], tipologie: [], tariffe: [], contratti: [], clienti: [], venduti: [], disponibilita: [] };
    this.config = { apiUrl: 'https://progettoweb-ivxb.onrender.com', dateFormat: 'it-IT' };
    this.init();
  }

  
  async init() {
    try { await this.loadData(); this.setupEvents(); this.handleURL(); this.updateStats(); } 
    catch (e) { this.notify('Errore: ' + e.message, 'error'); }
  }

  // Utilities compatte
  id = () => `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  arr = v => !v ? [] : Array.isArray(v) ? v : (typeof v === 'string' && v.includes(',') ? v.split(',').map(s => s.trim()).filter(Boolean) : [String(v)]);
  
  notify(msg, type = 'info') {
    const colors = { error: '#f44336', success: '#4caf50', info: '#2196f3' };
    let container = document.getElementById('notifications') || Object.assign(document.createElement('div'), { 
      id: 'notifications', 
      style: 'position:fixed;top:20px;right:20px;z-index:1000' 
    });
    if (!container.parentNode) document.body.appendChild(container);
    
    const notification = Object.assign(document.createElement('div'), {
      textContent: msg,
      style: `background:${colors[type]};color:white;padding:12px 16px;margin-bottom:8px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2)`
    });
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

async loadData() {
  try {
    // Carica tutti i dati necessari in parallelo
    const [dataResponse, tariffeResponse] = await Promise.all([
      fetch(`${this.config.apiUrl}/api/data`),
      fetch(`${this.config.apiUrl}/api/Tariffe`)
    ]);
    
    if (!dataResponse.ok) throw new Error(`HTTP ${dataResponse.status} - Data`);
    if (!tariffeResponse.ok) throw new Error(`HTTP ${tariffeResponse.status} - Tariffe`);
    
    const data = await dataResponse.json();
    const tariffe = await tariffeResponse.json();
    
    Object.assign(this.data, {
      ombrelloni: data.ombrelloni || [],
      tipologie: data.tipologie || [],
      tariffe: tariffe || [],
      clienti: data.clienti || [],
      contratti: (data.contratti || []).map(c => ({ ...c, stipulatoDa: this.arr(c.stipulatoDa), importo: +c.importo || 0 })),
      venduti: (data.ombrelloneVenduto || []).map(v => ({ 
        idOmbrellone: v.idOmbrellone, 
        data: v.data ? new Date(v.data) : null,
        dataInizio: v.dataInizio ? new Date(v.dataInizio) : null,
        dataFine: v.dataFine ? new Date(v.dataFine) : null,
        contratto: v.contratto 
      })),
      disponibilita: (data.giornoDisponibilita || []).map(d => ({ idOmbrellone: d.idOmbrellone, data: new Date(d.data) }))
    });
    
    //Popola la select dei clienti dopo aver caricato i dati
    const clienteSelect = document.getElementById('cliente');
    if (clienteSelect && clienteSelect.tagName.toLowerCase() === 'select') {
      this.setupClienteSelect(clienteSelect);
    }
    
  } catch(e) {
    this.notify('Errore caricamento: ' + e.message, 'error');
    throw e;
  }
}


setupEvents() {
  const els = ['filtroForm', 'tipoTariffa', 'cliente'].map(id => document.getElementById(id));
  if (els[0]) els[0].addEventListener("submit", e => this.handleFilter(e));
  if (els[1]) els[1].addEventListener("change", () => this.toggleMinDays());
  if (els[2]) {
    // Controlla se è una select o un input
    if (els[2].tagName.toLowerCase() === 'select') {
      this.setupClienteSelect(els[2]);
    } else {
      this.setupClienteAutocomplete(els[2]);
    }
  }
}

//Nuova funzione per popolare la select dei clienti
setupClienteSelect(select) {
  const allOption = select.querySelector('option[value=""]');
  select.innerHTML = '';
  
  if (allOption) {
    select.appendChild(allOption);
  } else {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Tutti';
    select.appendChild(defaultOption);
  }
  
  // Ordina i clienti alfabeticamente per nome e cognome
  const clientiOrdinati = [...this.data.clienti].sort((a, b) => {
    const nomeA = `${a.nome} ${a.cognome}`.toLowerCase();
    const nomeB = `${b.nome} ${b.cognome}`.toLowerCase();
    return nomeA.localeCompare(nomeB);
  });
  
  // Aggiunge un'opzione per ogni cliente
  clientiOrdinati.forEach(cliente => {
    const option = document.createElement('option');
    option.value = cliente.codice; // Usa il codice come valore
    option.textContent = `${cliente.nome} ${cliente.cognome}`;
    option.setAttribute('data-codice', cliente.codice);
    option.setAttribute('data-email', cliente.email || '');
    select.appendChild(option);
  });
  
  console.log(`Popolata select clienti con ${clientiOrdinati.length} clienti`);
}


  setupClienteAutocomplete(input) {
    const datalist = Object.assign(document.createElement('datalist'), { id: 'clientiList' });
    this.data.clienti.forEach(c => datalist.appendChild(Object.assign(document.createElement('option'), {
      value: `${c.nome} ${c.cognome}`,
      'data-codice': c.codice
    })));
    input.setAttribute('list', 'clientiList');
    input.parentNode.appendChild(datalist);
  }

  handleURL = () => { const view = new URLSearchParams(window.location.search).get('view'); if (view) setTimeout(() => this.showList(view), 100); }

  showList(type) {
    const container = document.getElementById("risultati");
    if (!container) return;
    container.innerHTML = "";
    
    const displays = {
      ombrelloni: () => this.displayOmbrelloni(container),
      tipologie: () => container.innerHTML = `<div class="tipologie-container">${['standard.jpg', 'family.jpg', 'luxury.jpg'].map((img, i) => 
        `<div class="tipologia-card"><img src="${img}" class="tipologia-image"><div class="tipologia-content">
        <h3 class="tipologia-title"><i class="fas fa-${['umbrella-beach', 'crown', 'gem'][i]}"></i>${['Standard<br>(T1)', 'Family<br>(T2)', 'Luxury<br>(T3)'][i]}</h3>
        <div class="tipologia-price">+€${[0, 5, 10][i]},00/giorno</div><br>
        <div class="tipologia-features">${[['2 Lettini', 'Servizi Base', 'Pulizia'], ['2 Lettini Premium', 'Ombrellone', 'Tavolino', 'Servizi aggiuntivi'], ['Ombrellone doppio', 'Lettini', 'Tavolino', 'Cassetta sicurezza', 'Servizi aggiuntivi']][i].map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div></div></div>`).join('')}</div>`,
      tipologiatariffa: () => this.data.tariffe.forEach(t => container.innerHTML += `<strong>Codice: ${t.codice}</strong><br>Tariffa: ${t.codTariffa || 'N/A'}<br>Prezzo: €${(+t.prezzo || 0).toFixed(2)}<br>Tipo: ${t.tipo || 'N/A'}<br><hr>`),
      clienti: () => this.data.clienti.forEach(c => container.innerHTML += `<strong>${c.nome} ${c.cognome}</strong> (${c.codice})<br>Email: ${c.email || 'N/A'}<br>${c.dataNascita ? `Nascita: ${new Date(c.dataNascita).toLocaleDateString(this.config.dateFormat)}<br>` : ''}${c.indirizzo ? `Indirizzo: ${c.indirizzo}<br>` : ''}<hr>`),
      contratti: () => this.data.contratti?.length ? this.displayContratti(container) : container.innerHTML = `<div class="no-contracts"><h3>📋 Contratti</h3><p><strong>Non disponibili</strong></p><p>Nessun contratto presente nel sistema.</p></div>`,
      guida: () => container.innerHTML = `<h3>Guida Gestione Ombrelloni</h3><ul><li><strong>Contratti</strong>: Crea, modifica, elimina contratti</li><li><strong>Ombrelloni</strong>: Visualizza stato e disponibilità</li><li><strong>Clienti</strong>: Gestisci anagrafica clienti</li><li><strong>Tipologie</strong>: Visualizza tipologie ombrelloni</li></ul><p>Sistema basato su MongoDB Atlas per gestione dati ottimale.</p>`
    };
    (displays[type] || (() => container.innerHTML = "<p>Tipo non riconosciuto</p>"))();
  }

displayOmbrelloni(container) {
  if (!this.data.ombrelloni.length) return container.innerHTML = "<p>Nessun ombrellone disponibile.</p>";
  
  // Filtra solo gli ombrelloni occupati
  const ombrelloniOccupati = this.data.ombrelloni.filter(o => {
    const id = o.id || o._id;
    const sold = this.data.venduti.find(v => v.idOmbrellone === id);
    return sold; // Restituisce true solo se l'ombrellone è venduto/occupato
  });
  
  if (!ombrelloniOccupati.length) {
    return container.innerHTML = "<p>🎉 Nessun ombrellone occupato al momento!</p>";
  }
  
  ombrelloniOccupati.forEach(o => {
    const id = o.id || o._id;
    container.appendChild(Object.assign(document.createElement("div"), {
      className: "ombrellone-box",
      innerHTML: `<div class="info-ombrellone"><strong>Ombrellone #${id}</strong>
      <br>Settore: ${o.settore || 'N/A'}<br>Fila: ${o.fila || 'N/A'}, Posto: ${o.postoFila || o.numFila || o.ordine || 'N/A'}<br>Tipologia: ${o.tipologia || 'N/A'}</div><div class="stato-ombrellone">${this.getStatus(id)}</div>`
    }));
  });
}

getStatus(id) {
  const available = this.data.disponibilita.filter(d => d.idOmbrellone === id);
  const sold = this.data.venduti.filter(v => v.idOmbrellone === id); // Cambiato da find a filter per prendere tutti
  let status = "";
  
  // Mostra date libere
  if (available.length) {
    status += `<div class="libero"><strong>Libero</strong><br>${available.map(a => a.data.toLocaleDateString(this.config.dateFormat)).join('<br>')}</div>`;
  }
  
  // Mostra TUTTE le date occupate
  if (sold.length) {
    status += `<div class="occupato"><strong>Occupato</strong><br>`;
    
    // Raggruppa le vendite per contratto per una visualizzazione più ordinata
    const venditePeriodi = [];
    
    sold.forEach(vendita => {
      const contract = this.data.contratti.find(c => c.numProgr == vendita.contratto);
      const clienteNome = this.getClientNames(contract?.stipulatoDa || []);
      
      if (vendita.dataInizio && vendita.dataFine) {
        // Periodo con data inizio e fine
        const start = new Date(vendita.dataInizio).toLocaleDateString(this.config.dateFormat);
        const end = new Date(vendita.dataFine).toLocaleDateString(this.config.dateFormat);
        
        if (vendita.dataInizio === vendita.dataFine) {
          venditePeriodi.push(`${start} - ${clienteNome}`);
        } else {
          venditePeriodi.push(`dal ${start} al ${end} - ${clienteNome}`);
        }
      } else if (vendita.data) {
        // Singola data
        const dataVendita = new Date(vendita.data).toLocaleDateString(this.config.dateFormat);
        venditePeriodi.push(`${dataVendita} - ${clienteNome}`);
      }
    });
    
    // Ordina i periodi per data
    venditePeriodi.sort((a, b) => {
      const dateA = new Date(a.split(' - ')[0].replace('dal ', ''));
      const dateB = new Date(b.split(' - ')[0].replace('dal ', ''));
      return dateA - dateB;
    });
    
    status += venditePeriodi.join('<br>');
    status += `</div>`;
  }
  
  return status || `<div class="nessuno"><em>Disponibile in ogni data</em></div>`;
}

  getClientNames = codes => this.arr(codes).map(code => {
    const client = this.data.clienti.find(c => c.codice === code);
    return client ? `${client.nome} ${client.cognome}` : code;
  }).join(", ") || "Cliente sconosciuto";

  displayContratti = (container) => this.displayContrattiList(container, this.data.contratti);

  toggleEditContract(id) {
    const [display, edit] = [`display-${id}`, `edit-${id}`].map(id => document.getElementById(id));
    if (display && edit) {
      const isEditing = edit.style.display !== 'none';
      display.style.display = isEditing ? 'block' : 'none';
      edit.style.display = isEditing ? 'none' : 'block';
    }
  }

  async saveContractEdit(event, id) {
    event.preventDefault();
    const form = new FormData(event.target);
    const updated = { data: form.get('data'), importo: +form.get('importo'), stipulatoDa: [form.get('cliente')] };
    
    if (!updated.data || !updated.importo || updated.importo <= 0 || !updated.stipulatoDa[0]) 
      return this.notify('Compila tutti i campi correttamente', 'error');

    try {
      const response = await fetch(`${this.config.apiUrl}/api/Contratti/${id}`, {
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
    this.data.contratti.forEach(c => {
      const contractId = this.extractId(c._id);
      if (contractId !== excludeContractId) this.arr(c.stipulatoDa).forEach(code => usedCodes.add(code));
    });
    return this.data.clienti.filter(c => !usedCodes.has(c.codice));
  }

  async handleContractSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = { data: form.get('data'), importo: +form.get('importo'), stipulatoDa: [form.get('cliente')] };
    
    if (!data.data || !data.importo || data.importo <= 0 || !data.stipulatoDa[0]) 
      return this.notify('Compila tutti i campi correttamente', 'error');

    try {
      await this.saveContract(data);
      e.target.reset();
      this.showList('contratti');
    } catch (error) {
      this.notify('Errore salvataggio: ' + error.message, 'error');
    }
  }

  async saveContract(data) {
    const response = await fetch(`${this.config.apiUrl}/api/Contratti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    saved.stipulatoDa = this.arr(saved.stipulatoDa);
    saved.importo = +saved.importo;
    this.data.contratti.push(saved);
    this.updateStats();
  }

  extractId = id => typeof id === 'string' && id.includes('ObjectId') ? (id.match(/ObjectId\('([^']+)'\)/) || [])[1] || id : id?.$oid || id;

  deleteContract = id => this.showDeleteConfirmation(id);

  showDeleteConfirmation(id) {
    const displayDiv = document.getElementById(`display-${id}`);
    if (!displayDiv) return;
    
    displayDiv.style.display = 'none';
    let confirmDiv = document.getElementById(`confirm-delete-${id}`) || Object.assign(document.createElement('div'), {
      id: `confirm-delete-${id}`,
      className: 'contratto-delete-confirmation'
    });
    if (!confirmDiv.parentNode) displayDiv.parentNode.insertBefore(confirmDiv, displayDiv.nextSibling);
    
    const contract = this.data.contratti.find(c => this.extractId(c._id) === id);
    const [clientName, amount, date] = [
      contract ? this.getClientNames(contract.stipulatoDa) : 'Cliente sconosciuto',
      contract ? contract.importo.toFixed(2) : '0.00',
      contract ? new Date(contract.data).toLocaleDateString(this.config.dateFormat) : ''
    ];
    
    confirmDiv.innerHTML = `
      <div class="delete-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <h4>Conferma Eliminazione Contratto</h4>
          <p><strong>Stai per eliminare:</strong></p>
          <ul><li><strong>Cliente:</strong> ${clientName}</li><li><strong>Data:</strong> ${date}</li><li><strong>Importo:</strong> €${amount}</li></ul>
          <p class="warning-text">⚠️ <strong>Attenzione:</strong> Azione irreversibile!</p>
        </div>
      </div>
      <div class="confirmation-actions">
        <button class="btn-confirm-delete" onclick="ombrelloniManager.confirmDeleteContract('${id}')"><i class="fas fa-trash"></i> Elimina</button>
        <button class="btn-cancel-delete" onclick="ombrelloniManager.cancelDeleteContract('${id}')"><i class="fas fa-times"></i> Annulla</button>
      </div>`;
    confirmDiv.style.display = 'block';
  }

async confirmDeleteContract(id) {
  try {
    // Trova il contratto da eliminare per ottenere il numProgr
    const contractToDelete = this.data.contratti.find(c => this.extractId(c._id) === id);
    if (!contractToDelete) {
      throw new Error('Contratto non trovato');
    }

    console.log('Eliminando contratto:', contractToDelete.numProgr);

    // PRIMO: Elimina gli ombrelloni venduti associati PRIMA di eliminare il contratto
    try {
      const ombrelloniResponse = await fetch(
        `${this.config.apiUrl}/api/ombrelloneVenduto?contratto=${contractToDelete.numProgr}`, 
        { method: 'DELETE' }
      );
      
      if (ombrelloniResponse.ok) {
        const result = await ombrelloniResponse.json();
        console.log('Ombrelloni venduti eliminati:', result.deletedCount);
      } else {
        console.warn(`Avviso: impossibile eliminare ombrelloni venduti per contratto ${contractToDelete.numProgr}`);
      }
    } catch (error) {
      console.warn(`Errore eliminazione ombrelloni venduti:`, error);
    }

    // SECONDO: Elimina il contratto
    const contractResponse = await fetch(`${this.config.apiUrl}/api/Contratti/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!contractResponse.ok) {
      throw new Error(`Errore eliminazione contratto: HTTP ${contractResponse.status}`);
    }

    console.log('Contratto eliminato:', id);

    // Aggiorna i dati locali
    this.data.contratti = this.data.contratti.filter(c => this.extractId(c._id) !== id);
    
    // Filtra gli ombrelloni venduti anche localmente
    const ombrelloniVendutiAssociati = this.data.venduti.filter(v => 
      v.contratto === contractToDelete.numProgr
    );
    this.data.venduti = this.data.venduti.filter(v => v.contratto !== contractToDelete.numProgr);
    
    // Rimuovi l'elemento dal DOM con animazione
    const contractItem = document.getElementById(`display-${id}`).closest('.contratto-item');
    if (contractItem) {
      Object.assign(contractItem.style, { 
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        opacity: '0',
        transform: 'translateX(-20px)'
      });
      
      setTimeout(() => {
        contractItem.remove();
      
        let successMessage = "Contratto eliminato";
        if (ombrelloniVendutiAssociati.length > 0) {
          successMessage += ` e liberati ${ombrelloniVendutiAssociati.length} ombrellone/i`;
        }
        this.notify(successMessage, 'success');
        
        this.updateStats();
        
        // Se non ci sono più contratti, mostra il messaggio di "nessun contratto"
        if (this.data.contratti.length === 0) {
          const container = document.getElementById("risultati");
          if (container && container.children.length === 0) {
            container.innerHTML = `<div class="no-contracts"><h3>📋 Contratti</h3><p><strong>Non disponibili</strong></p><p>Nessun contratto presente nel sistema.</p></div>`;
          }
        }
      }, 300);
    }

  } catch (error) {
    console.error('Errore completo eliminazione:', error);
    this.notify('Errore eliminazione: ' + error.message, 'error');
    this.cancelDeleteContract(id);
  }
}

  cancelDeleteContract(id) {
    const [displayDiv, confirmDiv] = [`display-${id}`, `confirm-delete-${id}`].map(id => document.getElementById(id));
    if (displayDiv) displayDiv.style.display = 'block';
    if (confirmDiv) confirmDiv.remove();
  }





  // Gestione filtri unificata
handleFilter(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const isContratti = window.location.pathname.includes('contratti.html') || 
                     new URLSearchParams(window.location.search).get('view') === 'contratti';
  
  if (!isContratti) {
    const required = ['dataInizio', 'dataFine', 'tipoTariffa'].map(k => form.get(k));
    if (required.some(v => !v)) return this.notify('Inserire: Data Inizio, Data Fine e Tipo Tariffa', 'error');
    if (!["Giornaliera", "Abbonamento"].includes(required[2])) 
      return this.notify('Tipo Tariffa deve essere "Giornaliera" o "Abbonamento"', 'error');
  }
  
  const filters = Object.fromEntries(['dataInizio', 'dataFine', 'settore', 'fila', 'tipologia', 'tipoTariffa', 'cliente']
    .map(k => [k, form.get(k)]).concat([
      ['numMinGiorni', +form.get('numMinGiorni') || 0],
      ['prezzoMin', +form.get('prezzoMin') || 0], 
      ['prezzoMax', +form.get('prezzoMax') || Infinity]
    ]));
    
  isContratti ? this.applyContractFilters(filters) : this.applyFilters(filters);
}

applyContractFilters(filters) {
  const container = document.getElementById("risultati");
  if (!container) return;
  
  container.innerHTML = "<h3>🔍 Contratti Filtrati</h3>";
  let filtered = this.data.contratti
    .filter(c => !filters.dataInizio || c.data.split('T')[0] === filters.dataInizio)
    .filter(c => {
      if (!filters.cliente?.trim()) return true;
      
      // Se il filtro cliente è un codice (dalla select)
      if (this.arr(c.stipulatoDa).includes(filters.cliente)) {
        return true;
      }
      
      // Se il filtro cliente è un nome (backward compatibility con input)
      return this.getClientNames(c.stipulatoDa).toLowerCase().includes(filters.cliente.trim().toLowerCase());
    });
  
  if (!filtered.length) {
    container.innerHTML += `<div class="no-results">🚫 Nessun contratto trovato</div>`;
    return;
  }
  
  this.displayContrattiList(container, filtered);
  this.displayStats(container, filtered);
}

// OPZIONALE: Funzione per aggiornare la select se i clienti cambiano
refreshClienteSelect() {
  const clienteSelect = document.getElementById('cliente');
  if (clienteSelect && clienteSelect.tagName.toLowerCase() === 'select') {
    this.setupClienteSelect(clienteSelect);
  }
}

// Display contratti unificato
displayContrattiList(container, contratti) {
  contratti.sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach((c, i) => {
      const [date, id, num] = [new Date(c.data).toLocaleDateString(this.config.dateFormat), 
                               this.extractId(c._id), i + 1];
      const clients = this.getAvailableClients(id);
      const current = this.data.clienti.find(cl => this.arr(c.stipulatoDa).includes(cl.codice));
      const allClients = current && !clients.some(ac => ac.codice === current.codice) 
                        ? [current, ...clients] : clients;
      
      container.appendChild(Object.assign(document.createElement('div'), {
        className: 'contratto-item',
        innerHTML: this.generateContractHTML(c, id, date, num, allClients)
      }));
    });
}

// HTML contratto 
generateContractHTML(c, id, date, num, clients) {
  const clientOptions = clients.map(cl => 
    `<option value="${cl.codice}" ${this.arr(c.stipulatoDa).includes(cl.codice) ? 'selected' : ''}>
      ${cl.nome} ${cl.cognome}
    </option>`).join('');
  
  // Calcola i limiti per le date (1 giugno - 15 settembre dell'anno corrente)
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-06-01`; // 1 giugno
  const maxDate = `${currentYear}-09-15`; // 15 settembre
    
  return `
    <div class="contratto-display" id="display-${id}">
      <div class="contratto-header">
        <strong>Contratto #${num}</strong>
        <div class="contratto-actions">
          <button class="btn-edit" onclick="ombrelloniManager.toggleEditContract('${id}')">
            <i class="fas fa-edit"></i> Modifica</button>
          <button class="btn-delete" onclick="ombrelloniManager.deleteContract('${id}')">
            <i class="fas fa-trash"></i> Elimina</button>
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
            <label>Data: 
              <input type="date" 
                     name="data" 
                     value="${c.data.split('T')[0]}" 
                     min="${minDate}" 
                     max="${maxDate}"
                     required>
            </label>
          </div>
          <div class="form-group">
            <label>Importo (€): <input type="number" step="0.01" name="importo" value="${c.importo}" required min="0"></label>
          </div>
          <div class="form-group">
            <label>Cliente: <select name="cliente" required>${clientOptions}</select></label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-save"><i class="fas fa-save"></i> Salva</button>
          <button type="button" class="btn-cancel" onclick="ombrelloniManager.toggleEditContract('${id}')">
            <i class="fas fa-times"></i> Annulla</button>
        </div>
      </form>
    </div>`;
}

// Applicazione filtri generali
applyFilters(filters) {
  this.lastFilterApplied = filters;
  const container = document.getElementById("risultati");
  const isOmbrelloni = new URLSearchParams(window.location.search).get('view') === 'ombrelloni';
  
  if (isOmbrelloni) {
    // MODIFICA: Costruisci il titolo con il periodo completo
    let dateText = 'Disponibili';
    if (filters.dataInizio) {
      if (filters.dataFine && filters.dataFine !== filters.dataInizio) {
        // Periodo da... a...
        dateText = `dal ${new Date(filters.dataInizio).toLocaleDateString(this.config.dateFormat)} al ${new Date(filters.dataFine).toLocaleDateString(this.config.dateFormat)}`;
      } else {
        // Solo una data
        dateText = `per ${new Date(filters.dataInizio).toLocaleDateString(this.config.dateFormat)}`;
      }
    }
    
    container.innerHTML = `<h3>🏖️ Ombrelloni ${dateText}</h3>`;
    this.displayFilteredOmbrelloni(container, this.filterOmbrelloni(filters), filters);
  } else {
    container.innerHTML = "<h3>Contratti Filtrati</h3>";
    this.displayFilteredContratti(container, this.filterContratti(filters));
  }
}


// Calcolo prezzo 
calculatePeriodPrice(ombrellone, dataInizio, dataFine, tipoTariffa) {
  try {
    console.log(`Calcolando prezzo per ombrellone:`, ombrellone);
    console.log(`Periodo: ${dataInizio} - ${dataFine}, Tipo: ${tipoTariffa}`);
    
    const [start, end] = [new Date(dataInizio), new Date(dataFine || dataInizio)];
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Date non valide');
      return 0;
    }
    
    if (end < start) {
      console.log('Invertendo date...');
      [start, end] = [end, start];
    }
    
    const giorni = this.calculateDays(start, end);
    console.log(`Giorni calcolati: ${giorni}`);
    
    // Ottieni il prezzo per il primo giorno (assumendo tariffa uniforme nel periodo)
    const prezzoGiornaliero = this.getPriceForDate(ombrellone.tipologia, start, tipoTariffa);
    console.log(`Prezzo giornaliero: €${prezzoGiornaliero}`);
    
    if (prezzoGiornaliero === 0) {
      console.warn('Prezzo giornaliero è 0');
      return 0;
    }
    
    // Calcola prezzo totale
    const prezzoTotale = prezzoGiornaliero * giorni;
    console.log(`Prezzo base: €${prezzoTotale} (${prezzoGiornaliero} x ${giorni})`);
    
    // Applica sconto se abbonamento
    const prezzoFinale = tipoTariffa === 'Abbonamento' ? 
                        this.applyAbbonamentoDiscount(prezzoTotale, giorni) : 
                        prezzoTotale;
    
    console.log(`Prezzo finale: €${prezzoFinale}`);
    return prezzoFinale;
    
  } catch (error) {
    console.error('Errore nel calcolo prezzo:', error);
    return 0;
  }
}



getPriceForDate(tipologia, data, tipoTariffa) {
  console.log(`Cercando prezzo per: tipologia=${tipologia}, data=${data.toISOString().split('T')[0]}, tipo=${tipoTariffa}`);
  
  const tariffe = this.data.tariffe.filter(t => {
    // Match per tipo tariffa (Giornaliera/Abbonamento)
    const tipoMatch = t.tipo === tipoTariffa;
    
    // Verifica range date della tariffa
    const dataTarget = new Date(data);
    const dataInizioTariffa = t.dataInizio ? new Date(t.dataInizio) : null;
    const dataFineTariffa = t.dataFine ? new Date(t.dataFine) : null;
    
    const inRange = (!dataInizioTariffa || dataTarget >= dataInizioTariffa) && 
                    (!dataFineTariffa || dataTarget <= dataFineTariffa);
    
    console.log(`Tariffa ${t.codice}: tipo=${tipoMatch}, range=${inRange}, prezzo=${t.prezzo}`);
    
    return tipoMatch && inRange;
  });
  
  console.log(`Tariffe trovate: ${tariffe.length}`);
  
  if (!tariffe.length) {
    console.warn(`Nessuna tariffa trovata per tipologia ${tipologia} e tipo ${tipoTariffa}`);
    return 0;
  }
  
  const tariffa = tariffe[0];
  let prezzoBase = parseFloat(tariffa.prezzo) || 0;
  
  // AGGIUNGI SOVRAPPREZZO IN BASE ALLA TIPOLOGIA
  const sovrapprezzi = {
    'T1': 0,    // Standard - nessun sovrapprezzo
    'T2': 5,    // Family - +€5/giorno
    'T3': 10    // Luxury - +€10/giorno
  };
  
  const sovrapprezzo = sovrapprezzi[tipologia] || 0;
  const prezzoFinale = prezzoBase + sovrapprezzo;
  
  console.log(`Prezzo base: €${prezzoBase}, Sovrapprezzo ${tipologia}: €${sovrapprezzo}, Prezzo finale: €${prezzoFinale}`);
  
  return prezzoFinale;
}

// Sconto abbonamento
applyAbbonamentoDiscount = (prezzo, giorni) => 
  prezzo * (giorni >= 30 ? 0.7 : giorni >= 14 ? 0.8 : giorni >= 7 ? 0.9 : 1);

// Utility functions 
calculateDays = (start, end) => Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

filterOmbrelloni = (filters) => this.data.ombrelloni.filter(o => 
  (!filters.settore || o.settore === filters.settore) &&
  (!filters.fila || o.fila == filters.fila) &&
  (!filters.tipologia || o.tipologia === filters.tipologia) &&
  (!filters.dataInizio || this.isAvailableInPeriod(o.id || o._id, filters.dataInizio, filters.dataFine))
);

isAvailableOn = (id, date) => {
  const target = new Date(date).setHours(0, 0, 0, 0);
  return !this.data.venduti.some(v => v.idOmbrellone === id && new Date(v.data).setHours(0,0,0,0) === target) &&
         this.data.disponibilita.some(d => d.idOmbrellone === id && new Date(d.data).setHours(0,0,0,0) === target);
};

isAvailableInPeriod(ombrelloneId, dataInizio, dataFine) {
  if (!dataInizio) return true;
  
  const [start, end] = [new Date(dataInizio), new Date(dataFine || dataInizio)]
    .map(d => { d.setHours(0, 0, 0, 0); return d; });
  if (end < start) [start, end] = [end, start];
  
  return !this.data.venduti.some(v => {
    if (v.idOmbrellone !== ombrelloneId) return false;
    
    if (v.dataInizio && v.dataFine) {
      const [vStart, vEnd] = [new Date(v.dataInizio), new Date(v.dataFine)]
        .map(d => { d.setHours(0, 0, 0, 0); return d; });
      return !(end < vStart || start > vEnd);
    }
    
    return v.data && new Date(v.data).setHours(0,0,0,0) >= start.getTime() && 
           new Date(v.data).setHours(0,0,0,0) <= end.getTime();
  });
}

filterContratti = (filters) => this.data.contratti.filter(c => {
  const date = new Date(c.data), amount = +c.importo || 0;
  return (!filters.dataInizio || date >= new Date(filters.dataInizio)) &&
         (amount >= filters.prezzoMin && amount <= filters.prezzoMax) &&
         (filters.tipoTariffa !== "Abbonamento" || filters.numMinGiorni <= 0 || 
          this.arr(c.stipulatoDa).length >= filters.numMinGiorni);
});

// Display ombrelloni 
displayFilteredOmbrelloni(container, results, filters) {
  if (!results.length) {
    let periodoText = '';
    if (filters.dataInizio) {
      if (filters.dataFine && filters.dataFine !== filters.dataInizio) {
        periodoText = ` dal ${new Date(filters.dataInizio).toLocaleDateString(this.config.dateFormat)} al ${new Date(filters.dataFine).toLocaleDateString(this.config.dateFormat)}`;
      } else {
        periodoText = ` per il ${new Date(filters.dataInizio).toLocaleDateString(this.config.dateFormat)}`;
      }
    }
    
    container.innerHTML += `<div class="no-results">🚫 Nessun ombrellone disponibile${periodoText}</div>`;
    return;
  }
  
  results.forEach(o => {
    const id = o.id || o._id;
    const prezzo = this.calculatePeriodPrice(o, filters.dataInizio, filters.dataFine || filters.dataInizio, filters.tipoTariffa);
    const giorni = this.calculateDays(new Date(filters.dataInizio), new Date(filters.dataFine || filters.dataInizio));
    const prezzoTxt = prezzo > 0 ? `€${prezzo.toFixed(2)} (${filters.tipoTariffa} - ${giorni} giorn${giorni > 1 ? 'i' : 'o'})` : 'Prezzo da definire';
    
    container.appendChild(Object.assign(document.createElement("div"), {
      className: "ombrellone-box ombrellone-disponibile",
      innerHTML: `
        <div class="info-ombrellone">
          <strong>Ombrellone #${id}</strong><br>
          Settore: ${o.settore || 'N/A'} | Fila: ${o.fila || 'N/A'} | Posto: ${o.postoFila || o.numFila || 'N/A'}<br>
          Tipologia: ${o.tipologia || 'N/A'}
        </div>
        <div class="stato-ombrellone">
          <div class="disponibile">✅ <strong>DISPONIBILE</strong></div>
          <div class="prezzo-dettaglio">${prezzoTxt}</div>
          <button class="btn-acquista" onclick="ombrelloniManager.handleAcquistaPeriod('${id}', ${prezzo}, '${filters.dataInizio || ''}', '${filters.dataFine || ''}')">
            💰 Acquista ${prezzo > 0 ? `€${prezzo.toFixed(2)}` : ''}
          </button>
        </div>`
    }));
  });
}

// Utility compatte
getPeriodoText = (dataInizio, dataFine) => !dataInizio ? '' : 
  (!dataFine || dataInizio === dataFine) ? 
    ` per il ${new Date(dataInizio).toLocaleDateString(this.config.dateFormat)}` :
    ` dal ${new Date(dataInizio).toLocaleDateString(this.config.dateFormat)} al ${new Date(dataFine).toLocaleDateString(this.config.dateFormat)}`;

calcolaDurata = (dataInizio, dataFine) => {
  const days = this.calculateDays(new Date(dataInizio), new Date(dataFine));
  return days === 1 ? "1 giorno" : `${days} giorni`;
};

// Gestione acquisto 
async handleAcquistaPeriod(ombrelloneId, prezzoVecchio, dataInizio, dataFine) {
  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  if (!ombrellone) return this.notify('Ombrellone non trovato', 'error');

  const tipoTariffa = this.lastFilterApplied?.tipoTariffa || 'Giornaliera';
  const prezzo = this.calculatePeriodPrice(ombrellone, dataInizio, dataFine || dataInizio, tipoTariffa);
  
  this.showAcquistaConfirmation(ombrelloneId, ombrellone, prezzo, dataInizio, dataFine, tipoTariffa);
}

// Conferma acquisto compatta
showAcquistaConfirmation(ombrelloneId, ombrellone, prezzo, dataInizio, dataFine, tipoTariffa) {
  const container = document.getElementById("risultati");
  if (!container) return;
  
  const giorni = this.calculateDays(new Date(dataInizio), new Date(dataFine || dataInizio));
  
  // CONTROLLO ABBONAMENTO MINIMO 7 GIORNI
  if (tipoTariffa === 'Abbonamento' && giorni < 7) {
    container.innerHTML = `
      <div class="alert alert-error">
        <h3>❌ Abbonamento Non Disponibile</h3>
        <p><strong>Per acquistare un abbonamento è richiesto un periodo minimo di 7 giorni.</strong></p>
        <p>Periodo selezionato: <strong>${giorni} giorn${giorni > 1 ? 'i' : 'o'}</strong></p>
        <div class="actions">
          <button class="btn-back" onclick="ombrelloniManager.tornaAiFiltri()">🔙 Torna ai Filtri</button>
        </div>
      </div>`;
    return;
  }
  
  const prezzoTxt = prezzo > 0 ? `€${prezzo.toFixed(2)}` : 'Da definire';
  const prezzoMedio = prezzo > 0 ? (prezzo / giorni).toFixed(2) : '0.00';
  
  const row = (label, value) => `<div class="riepilogo-row"><span class="label">${label}:</span><span class="value">${value}</span></div>`;
  
  container.innerHTML = `
    <div class="acquista-confirmation">
      <h3>🏖️ Conferma Acquisto Ombrellone</h3>
      <div class="riepilogo-card">
        <div class="riepilogo-content">
          <div class="riepilogo-section">
            <h5>🏖️ Ombrellone #${ombrelloneId}</h5>
            ${row('Settore', ombrellone.settore || 'N/A')}
            ${row('Fila', ombrellone.fila || 'N/A')}
            ${row('Tipologia', ombrellone.tipologia || 'N/A')}
          </div>
          <div class="riepilogo-section">
            <h5>📅 Periodo</h5>
            ${row('Dal', new Date(dataInizio).toLocaleDateString(this.config.dateFormat))}
            ${row('Al', new Date(dataFine || dataInizio).toLocaleDateString(this.config.dateFormat))}
            ${row('Durata', this.calcolaDurata(dataInizio, dataFine || dataInizio))}
          </div>
          <div class="riepilogo-section">
            <h5>💰 Tariffa ${tipoTariffa}</h5>
            ${row('Prezzo/giorno', `€${prezzoMedio}`)}
            ${row('Giorni', giorni)}
            <div class="riepilogo-row totale">${row('Totale', `<span class="price">${prezzoTxt}</span>`)}</div>
          </div>
        </div>
      </div>
      <div class="confirmation-actions">
        <button class="btn-confirm-acquista" onclick="ombrelloniManager.confermaAcquisto('${ombrelloneId}', ${prezzo}, '${dataInizio}', '${dataFine || dataInizio}')">✅ Conferma</button>
        <button class="btn-cancel-acquista" onclick="ombrelloniManager.tornaAiFiltri()">❌ Annulla</button>
      </div>
    </div>`;
}

// Actions compatte
confermaAcquisto = (id, prezzo, start, end) => this.showContractFormForOmbrellone(id, prezzo, start, end);
tornaAiFiltri = () => this.lastFilterApplied ? this.applyFilters(this.lastFilterApplied) : this.showList('ombrelloni');

// Acquisto singolo
async handleAcquista(ombrelloneId, prezzo, dataSelezionata) {
  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  if (!ombrellone) return this.notify('Ombrellone non trovato', 'error');

  const prezzoTxt = prezzo > 0 ? `€${prezzo.toFixed(2)}` : 'prezzo da definire';
  const dataTxt = dataSelezionata ? ` per il ${new Date(dataSelezionata).toLocaleDateString(this.config.dateFormat)}` : '';
  
  if (confirm(`Acquistare Ombrellone #${ombrelloneId}?\nSettore: ${ombrellone.settore} - Fila: ${ombrellone.fila}\nPrezzo: ${prezzoTxt}${dataTxt}`)) {
    this.showContractFormForOmbrellone(ombrelloneId, prezzo, dataSelezionata);
  }
}

// Form contratto 
showContractFormForOmbrellone(ombrelloneId, prezzo, dataInizio, dataFine = null) {
  const container = document.getElementById("risultati");
  if (!container) return;
  
  const available = this.getAvailableClients();
  if (!available.length) {
    container.innerHTML = `<div class="alert alert-warning">
      <h3>Nessun Cliente Disponibile</h3>
      <button onclick="ombrelloniManager.showList('clienti')">Vedi Clienti</button>
      <button onclick="ombrelloniManager.applyFilters({})">Torna agli Ombrelloni</button>
    </div>`;
    return;
  }

  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  const today = new Date().toISOString().split('T')[0];
  
  // Ricalcola il prezzo con il tipo tariffa attuale
  const tipoTariffa = this.lastFilterApplied?.tipoTariffa || 'Giornaliera';
  const prezzoCalcolato = this.calculatePeriodPrice(ombrellone, dataInizio || today, dataFine || dataInizio || today, tipoTariffa);
  
  console.log(`Prezzo calcolato per il form: €${prezzoCalcolato}`);
  
  container.innerHTML = `
    <h3>🏖️ Nuovo Contratto - Ombrellone #${ombrelloneId}</h3>
    <div class="ombrellone-info">
      <p><strong>Settore:</strong> ${ombrellone?.settore || 'N/A'} | <strong>Fila:</strong> ${ombrellone?.fila || 'N/A'} | <strong>Tipologia:</strong> ${ombrellone?.tipologia || 'N/A'}</p>
      <p><strong>Tipo Tariffa:</strong> ${tipoTariffa}</p>
    </div>
    <form id="formContratto">
      <input type="hidden" name="ombrelloneId" value="${ombrelloneId}">
      <input type="hidden" name="tipoTariffa" value="${tipoTariffa}">
      <div class="form-group">
        <label>Data Inizio: 
          <input type="date" name="dataInizio" value="${dataInizio || today}" required onchange="ombrelloniManager.updatePrezzoForm()">
        </label>
      </div>
      <div class="form-group">
        <label>Data Fine: 
          <input type="date" name="dataFine" value="${dataFine || dataInizio || today}" required onchange="ombrelloniManager.updatePrezzoForm()">
        </label>
      </div>
      <div class="form-group">
        <label>Importo (€): 
          <input type="number" step="0.01" name="importo" value="${prezzoCalcolato > 0 ? prezzoCalcolato.toFixed(2) : ''}" required min="0" id="importoInput">
        </label>
        <small style="color: #666; font-size: 0.9em;">Prezzo calcolato automaticamente in base alle tariffe</small>
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

updatePrezzoForm() {
  const form = document.getElementById('formContratto');
  if (!form) return;
  
  const dataInizio = form.querySelector('[name="dataInizio"]').value;
  const dataFine = form.querySelector('[name="dataFine"]').value;
  const ombrelloneId = form.querySelector('[name="ombrelloneId"]').value;
  const tipoTariffa = form.querySelector('[name="tipoTariffa"]').value;
  const importoInput = document.getElementById('importoInput');
  
  if (!dataInizio || !dataFine || !ombrelloneId) return;
  
  const ombrellone = this.data.ombrelloni.find(o => (o.id || o._id) === ombrelloneId);
  if (!ombrellone) return;
  
  const prezzoCalcolato = this.calculatePeriodPrice(ombrellone, dataInizio, dataFine, tipoTariffa);
  
  if (importoInput && prezzoCalcolato > 0) {
    importoInput.value = prezzoCalcolato.toFixed(2);
    console.log(`Prezzo aggiornato nel form: €${prezzoCalcolato}`);
  }
}

// Submit contratto 
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

  if (new Date(data.dataFine) < new Date(data.dataInizio)) {
    return this.notify('Data fine deve essere >= data inizio', 'error');
  }

  try {
    await this.saveContract({ data: data.dataInizio, importo: data.importo, stipulatoDa: data.stipulatoDa });
    await this.createOmbrelloneSalesPeriod(data.ombrelloneId, data.dataInizio, data.dataFine);
    e.target.reset();
    this.notify(`Contratto creato per ombrellone #${data.ombrelloneId}!`, 'success');
    setTimeout(() => this.showList('ombrelloni'), 1000);
  } catch (error) {
    this.notify('Errore: ' + error.message, 'error');
  }
}
// Crea vendita periodo
async createOmbrelloneSalesPeriod(ombrelloneId, dataInizio, dataFine) {
  const lastContract = this.data.contratti[this.data.contratti.length - 1];
  
  try {
    const response = await fetch(`${this.config.apiUrl}/api/ombrelloneVenduto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        idOmbrellone: ombrelloneId, 
        dataInizio,
        dataFine: dataFine || dataInizio,
        data: dataInizio,
        contratto: lastContract?.numProgr || 'AUTO' 
      })
    });

    if (response.ok) {
      const saved = await response.json();
      this.data.venduti.push({ 
        idOmbrellone: saved.idOmbrellone, 
        data: saved.data ? new Date(saved.data) : null,
        dataInizio: new Date(saved.dataInizio),
        dataFine: new Date(saved.dataFine || saved.dataInizio),
        contratto: saved.contratto 
      });
    }
  } catch (error) {
    console.error('Errore creazione vendita periodo:', error);
  }
}

// Gestisci submit contratto con ombrellone
async handleContractSubmitWithOmbrellone(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const data = {
    data: form.get('data'),
    importo: +form.get('importo'),
    stipulatoDa: [form.get('cliente')],
    ombrelloneId: form.get('ombrelloneId')
  };
  
  if (!data.data || !data.importo || data.importo <= 0 || !data.stipulatoDa[0]) {
    return this.notify('Compila tutti i campi correttamente', 'error');
  }

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

// Crea vendita ombrellone
async createOmbrelloneSale(ombrelloneId, data) {
  try {
    const response = await fetch(`${this.config.apiUrl}/api/ombrelloneVenduto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        idOmbrellone: ombrelloneId, 
        data,
        dataInizio: data,
        dataFine: data,
        contratto: this.data.contratti[this.data.contratti.length - 1]?.numProgr || 'AUTO' 
      })
    });

    if (response.ok) {
      const saved = await response.json();
      this.data.venduti.push({ 
        idOmbrellone: saved.idOmbrellone, 
        data: new Date(saved.data),
        dataInizio: new Date(saved.dataInizio || saved.data),
        dataFine: new Date(saved.dataFine || saved.data),
        contratto: saved.contratto 
      });
    }
  } catch (error) {
    console.error('Errore creazione vendita ombrellone:', error);
  }
}

// Mostra contratti filtrati
displayFilteredContratti(container, results) {
  [...results].sort((a, b) => new Date(a.data) - new Date(b.data)).forEach((c, i) => {
    const date = new Date(c.data).toLocaleDateString(this.config.dateFormat);
    const id = this.extractId(c._id);
    container.innerHTML += `
      <div class="contratto-item">
        <strong>Contratto #${i + 1}</strong><br>
        Data: ${date} | Importo: €${c.importo.toFixed(2)} | Cliente: ${this.getClientNames(c.stipulatoDa)}<br>
        <button onclick="ombrelloniManager.toggleEditContract('${id}')">Modifica</button>
        <button onclick="ombrelloniManager.deleteContract('${id}')">Elimina</button>
        <hr>
      </div>`;
  });
  this.displayStats(container, results);
}

// Mostra statistiche
displayStats(container, results) {
  const total = results.reduce((sum, r) => sum + (+r.importo || 0), 0);
  container.insertAdjacentHTML('afterbegin', 
    `<div class="stats-summary">
      <h4>📊 Statistiche</h4>
      <p>Risultati: <strong>${results.length}</strong> | Totale: <strong>€${total.toFixed(2)}</strong></p>
    </div>`);
}

// Toggle giorni minimi
toggleMinDays() {
  const [select, label] = [document.getElementById("tipoTariffa"), document.getElementById("labelMinGiorni")];
  if (select && label) label.style.display = select.value === "Abbonamento" ? "block" : "none";
}

// Aggiorna statistiche
updateStats() {
  const active = this.data.contratti.length;
  const total = this.data.contratti.reduce((sum, c) => sum + (+c.importo || 0), 0);
  
  // Aggiorna elementi con ID specifici
  const elementsById = ['contratti-attivi', 'incassi-totali'];
  elementsById.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = id.includes('contratti') ? active : `€ ${total.toFixed(2)}`;
    }
  });
  
  // Aggiorna elementi con data-stat attribute
  const contractElements = document.querySelectorAll('[data-stat="contratti-attivi"]');
  const incomeElements = document.querySelectorAll('[data-stat="incassi-totali"]');
  
  contractElements.forEach(el => el.textContent = active);
  incomeElements.forEach(el => el.textContent = `€ ${total.toFixed(2)}`);
  
  // Aggiorna eventuali altri elementi con classi specifiche
  const statContractElements = document.querySelectorAll('.stat-value[data-type="contratti"]');
  const statIncomeElements = document.querySelectorAll('.stat-value[data-type="incassi"]');
  
  statContractElements.forEach(el => el.textContent = active);
  statIncomeElements.forEach(el => el.textContent = `€ ${total.toFixed(2)}`);
}
}
// Inizializza sistema
let ombrelloniManager;
document.addEventListener('DOMContentLoaded', () => {
  ombrelloniManager = new OmbrelloniManager();
});