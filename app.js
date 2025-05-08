
let ombrelloni = [];
let tipologie = [];
let tariffe = [];
let contratti = [];
let guida= [];
let clienti=[];
const venduti = [];
const disponibilita = []; 

// Genera un numero casuale tra 0 e 999999 per usarlo come ID
const generateId = () => Math.floor(Math.random() * 1000000);

//funzione che avvia attività appena si apre la finestra
window.addEventListener('load', () => {
  caricaExcelDaCartella('Database_SpiaggiaFacile_Aggiornato.xlsx');

  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  if (view === 'contratti') {
    // Aspetta il caricamento dei dati prima di mostrare
    setTimeout(() => mostraLista('contratti'), 50);
  }
  if (view === 'ombrelloni') {
    // Aspetta il caricamento dei dati prima di mostrare
    setTimeout(() => mostraLista('ombrelloni'), 50);
  }
  if (view === 'tipologie') {
    // Aspetta il caricamento dei dati prima di mostrare
    setTimeout(() => mostraLista('tipologie'), 50);
  }
});

//funzione che caricaExcel
function caricaExcelDaCartella(percorsoFile) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', percorsoFile, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function () {
    if (xhr.status === 200) {
      const data = new Uint8Array(xhr.response);
      const workbook = XLSX.read(data, { type: 'array' });

      console.log("File Excel caricato:", workbook);  // Log per verificare che il file venga caricato
      // Carica i dati da ogni foglio
      caricaOmbrelloni(workbook);
      caricaTipologie(workbook);
      caricaTipologiaTariffa(workbook);
      caricaTariffa(workbook);
      caricaGiornoDisponibilita(workbook);
      caricaOmbrelloneVenduto(workbook);
      caricaContratti(workbook);
      caricaClienti(workbook);  
      
    } else {
      alert("Errore nel caricamento del file Excel.");
    }
  };

  xhr.onerror = function () {
    console.error("Errore durante la richiesta del file:", xhr.statusText);
    alert("Errore durante la richiesta del file.");
  };
  xhr.send();
}

function caricaOmbrelloni(workbook) {
  const sheet = workbook.Sheets['Ombrelloni'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.settore && row.fila) {
        ombrelloni.push({
          id: row.id || crypto.randomUUID(),
          settore: row.settore,
          fila: row.fila,
          ordine: row.PostoFila || "N/A",
          tipologia: row.tipologia || "Standard"
        });
      }
    });
  }
}

function caricaTipologie(workbook) {
  const sheet = workbook.Sheets['Tipologie'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.codice && row.nome) {
        tipologie.push({
          codice: row.codice,
          nome: row.nome,
          descrizione: row.descrizione || "N/A",
        });
      }
    });
  }
}

function caricaTipologiaTariffa(workbook) {
  const sheet = workbook.Sheets['TipologiaTariffa'];  // Assicurati che il nome del foglio sia corretto
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.codTipologia && row.codTariffa ) {
        // Aggiungi i dati nel vettore tariffe
        tariffe.push({
          codTipologia: row.codTipologia,   // Codice della tipologia (trattato come stringa)
          codTariffa: row.codTariffa,       // Codice della tariffa (trattato come stringa)
        });
      }
    });
  }

}

function caricaTariffa(workbook) {
  const sheet = workbook.Sheets['Tariffa'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.codice) {
        tariffe.push({
          codice: row.codice,
          prezzo: row.prezzo,
          dataInizio: row.dataInizio,
          dataFine: row.dataFine,
          tipo: row.tipo,
          numMinGiorni: row.numMinGiorni || null  // Può essere undefined, quindi default a null
        });
      }
    });
  }
}

function caricaOmbrelloneVenduto(workbook) {
  const sheet = workbook.Sheets['OmbrelloneVenduto']; // Nome foglio atteso
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.idOmbrellone && row.data && row.contratto) {
        venduti.push({
          idOmbrellone: row.idOmbrellone,
          data: row.data,
          contratto: row.contratto
        });
      }
    });
  }
}

function caricaGiornoDisponibilita(workbook) {
  const sheet = workbook.Sheets['GiornoDisponibilita']; // Nome foglio atteso
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.idOmbrellone && row.data) {
        disponibilita.push({
          idOmbrellone: row.idOmbrellone,
          data: row.data
        });
      }
    });
  }
}

function caricaContratti(workbook) {
  const sheet = workbook.Sheets['Contratti'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log("Righe lette dal foglio 'Contratti':", rows);

    rows.forEach(row => {
      let data = row.data;
      if (data && !data.includes("-01")) {
        data = data + "-01";  // Correggi la data se manca il giorno
      }

      if (row.numProgr && data && row.stipulatoDa) {
        contratti.push({
          numProgr: row.numProgr,
          data: data,
          importo: parseFloat(row.importo || 0),
          stipulatoDa: (row.stipulatoDa || '').split(',').map(g => g.trim()).filter(Boolean),
        });
        console.log("Contratto aggiunto:", row.numProgr);  // Verifica quale contratto viene aggiunto
      }
    });
  } else {
    console.log("Foglio 'Contratti' non trovato.");
  }
  
  console.log('Contratti caricati:', contratti);
  // Rimuovi la chiamata a mostraLista('contratti')
  // mostraLista('contratti');  // Non vuoi che questo venga eseguito automaticamente
}

function caricaClienti(workbook) {
  const sheet = workbook.Sheets['Cliente'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.nome && row.cognome && row.codice) {
        clienti.push({
          codice: row.codice,
          nome: row.nome,
          cognome: row.cognome,
          dataNascita: row.dataNascita || null,
          indirizzo: row.indirizzo || null
        });
      }
    });
  }
}

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
  
    // Dettagli base
    const dettagli = `
      <strong>Ombrellone #${o.id}</strong><br>
      Settore: ${o.settore} <br>
      Fila: ${o.fila}, numFila: ${o.ordine}<br>
      Tipologia: ${o.tipologia}
    `;
  
    // Sezione stato
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
      const clientiContratto = (contratto?.stipulatoDa || []).map(cod => {
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
  }); break;

    case "tipologie":
      if (tipologie.length === 0) return container.innerHTML = "<p>Nessuna tipologia disponibile.</p>";
      tipologie.forEach(t => {
        const div = document.createElement("div");
        div.innerHTML = 
          `<strong>${t.nome}</strong> (${t.codice})<br>
          Accessori: ${t.descrizione}<br>
          <hr>`;
        container.appendChild(div);
      });
      break;

      case "tipologiatariffa":
        if (tariffe.length === 0) return container.innerHTML = "<p>Nessuna tariffa disponibile.</p>";
        tariffe.forEach(t => {
          const div = document.createElement("div");
          div.innerHTML = 
            `<strong>Codice Tipologia: ${t.codTipologia}</strong><br>
            Codice Tariffa: ${t.codTariffa}`;
          container.appendChild(div);
        });
        break;

    case "clienti":
      if (clienti.length === 0) return container.innerHTML = "<p>Nessun cliente disponibile.</p>";
      clienti.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = 
          `<strong>Cliente: ${c.nome} ${c.cognome}</strong><br>
          Email: ${c.email}<br>
          <hr>`;
        container.appendChild(div);
      });
      break;

      case "contratti":
        if (contratti.length === 0) {
          return container.innerHTML = "<p>Nessun contratto disponibile.</p>";
        }
        contratti.forEach(c => {
          const div = document.createElement("div");
          // Forza il formato della data
          const formattedDate = new Date(c.data).toLocaleDateString('it-IT'); // Assicurati che la data venga formattata correttamente
          div.innerHTML = 
            `<strong>Contratto #${c.numProgr}</strong><br>
            Data: ${formattedDate}, Importo: €${c.importo.toFixed(2)}<br>  <!-- Usa toFixed per visualizzare 2 decimali -->
            Stipulato da: ${c.stipulatoDa.join(", ")}<br>
            <button onclick="modificaContratto('${c.numero}')">Modifica</button>
            <button onclick="eliminaContratto('${c.numero}')">Elimina</button>
            <hr>`;
          container.appendChild(div);
        });
        break;

        case "guida":
        caricaGuida(); // Chiama la funzione mostraGuida per visualizzare la guida
        break;
    
  }
}

// Aggiungi un nuovo contratto
function aggiungiContratto(data, importo, stipulatoDa) {
  const numProgr = generateId();
  if (!data || isNaN(importo) || stipulatoDa.length === 0) { //controllo
    return alert("Tutti i campi del contratto sono richiesti.");
  }
  if (stipulatoDa.length === 0) {
    alert("Inserisci almeno un giorno valido.");
    return;
  }
  contratti.push({ numProgr, data, importo: parseFloat(importo), stipulatoDa }); //pusha i contratti
  alert(`Contratto #${numProgr} aggiunto.`);
  mostraLista('contratti');
  
}

// Modifica un contratto esistente
function modificaContratto(numProgr) {
  numProgr = parseInt(numProgr);  // Assicurati che il numero sia un intero
  const c = contratti.find(c => c.numProgr === numProgr);
  if (!c) return alert("Contratto non trovato.");

  const nuovaData = prompt("Modifica data (YYYY-MM-DD):", c.data);
  const nuovoImporto = prompt("Modifica importo (€):", c.importo);
  const nuoviGiorni = prompt("Modifica giorni (separati da virgola):", c.stipulatoDa.join(", "));
  if (nuoviGiorni.length === 0) {
    alert("Inserisci almeno un giorno valido.");
    return;
  }
  if (nuovaData && !isNaN(parseFloat(nuovoImporto)) && nuoviGiorni) {
    c.data = nuovaData;
    c.importo = parseFloat(nuovoImporto);
    c.stipulatoDa = nuoviGiorni.split(",").map(g => g.trim()).filter(Boolean);
    alert("Contratto aggiornato.");
    mostraLista("contratti");
  } else {
    alert("Modifica annullata o dati non validi.");
  }
}

// Elimina un contratto
function eliminaContratto(numProgr) {
  numProgr = parseInt(numProgr);  // Assicurati che il numero sia un intero
  if (confirm("Vuoi eliminare questo contratto?")) {
    contratti = contratti.filter(c => c.numProgr !== numProgr);
    alert("Contratto eliminato.");
    mostraLista("contratti");
  }
}

// Mostra il form per aggiungere un contratto
function mostraForm(tipo) {
  const container = document.getElementById("risultati");
  container.innerHTML = "";   
  let formHtml = "";

  if (tipo === "aggiungiContratto") {
    formHtml = `
      <h3>Aggiungi Contratto</h3>
      <form id="formContratto">
        Data: <input type="date" name="data" required><br>
        Importo (€): <input type="number" step="0.01" name="importo" required><br>
        Stipulato da: <input name="giorni" required><br>
        <button type="submit">Aggiungi</button>
      </form>
    `;
  }

  container.innerHTML = formHtml;

  if (tipo === "aggiungiContratto") {
    document.getElementById("formContratto").addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(this);
      const numero = data.get("numero");
      const date = data.get("data");
      const importo = parseFloat(data.get("importo"));
      const giorniRaw = data.get("giorni");
      const giorni = giorniRaw.split(",").map(g => g.trim()).filter(Boolean);
      if (giorni.length === 0) {
        alert("Inserisci almeno un giorno valido.");
        return;
      }
      aggiungiContratto(date, importo, giorni);
      this.reset();
      container.innerHTML = "";
    });
  }
}

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

  // Controlla se sei nella vista "ombrelloni"
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');

  if (view === 'ombrelloni') {
    let risultati = ombrelloni.filter(o => {
      if (settore && o.settore !== settore) return false;
      if (fila && o.fila != fila) return false;
      if (tipologia && o.tipologia !== tipologia) return false;
      return true;
    });

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
        const clientiContratto = (contratto?.stipulatoDa || []).map(cod => {
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
    // Altrimenti filtra i contratti (comportamento attuale)
    let risultati = contratti.filter(c => {
      const dataContratto = new Date(c.data);
      if (dataInizio && dataContratto < new Date(dataInizio)) return false;

      if (c.importo < prezzoMin || c.importo > prezzoMax) return false;

      if (tipoTariffa === "Abbonamento" && c.stipulatoDa.length < numMinGiorni) return false;

      return true;
    });

    if (settore || fila || tipologia) {
      risultati = risultati.filter(c => {
        const ombrellone = ombrelloni.find(o => 
          (!settore || o.settore === settore) &&
          (!fila || o.fila == fila) &&
          (!tipologia || o.tipologia === tipologia)
        );
        return ombrellone;
      });
    }

    if (risultati.length === 0) {
      container.innerHTML += "<p>Nessun risultato trovato con i filtri selezionati.</p>";
      return;
    }

    risultati.forEach(c => {
      const formattedDate = new Date(c.data).toLocaleDateString("it-IT");
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>Contratto #${c.numProgr}</strong><br>
        Data: ${formattedDate}, Importo: €${c.importo.toFixed(2)}<br>
        Giorni: ${c.stipulatoDa.join(", ")}<br>
        <hr>`;
      container.appendChild(div);
    });
  }
});


document.getElementById("tipoTariffa").addEventListener("change", function () {
  const isAbbonamento = this.value === "Abbonamento";
  document.getElementById("labelMinGiorni").style.display = isAbbonamento ? "block" : "none";
});
