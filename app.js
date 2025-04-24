
let ombrelloni = [];
let tipologie = [];
let tariffe = [];
let contratti = [];
let guida= [];

// Genera un numero casuale tra 0 e 999999 per usarlo come ID
const generateId = () => Math.floor(Math.random() * 1000000);

//funzione che avvia attività appena si apre la finestra
window.addEventListener('load', () => {
  caricaGuida();
  caricaExcelDaCartella('Database_SpiaggiaFacile_Aggiornato.xlsx'); // Carica il file Excel automaticamente
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
      caricaContratti(workbook);

     
       alert("File Excel caricato automaticamente!"); // Rimuovi questo alert se non lo vuoi
       caricaGuida();
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
  mostraLista('ombrelloni');
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
  mostraLista('tipologie');
}

function caricaTipologiaTariffa(workbook) {
  const sheet = workbook.Sheets['TipologiaTariffa'];  // Assicurati che il nome del foglio sia corretto
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.codTipologia && row.codTariffa && row.tipoTariffa) {
        // Aggiungi i dati nel vettore tariffe
        tariffe.push({
          codTipologia: row.codTipologia,   // Codice della tipologia (trattato come stringa)
          codTariffa: row.codTariffa,       // Codice della tariffa (trattato come stringa)
          tipoTariffa: String(row.tipoTariffa),  // Tipo di tariffa (stringa, es. "Giornaliera" o "Abbonamento")
        });
      }
    });
  }
  mostraLista('tipologiatariffa');  // Funzione per visualizzare le tariffe
}

/*function caricaClienti(workbook) {
  const sheet = workbook.Sheets['Cliente'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.nome && row.cognome) {
        clienti.push({
          id: row.id || crypto.randomUUID(),
          nome: row.nome,
          cognome: row.cognome,
          email: row.email || "N/A",
        });
      }
    });
  }
  mostraLista('clienti');
}*/

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

      if (row.numero && data && row.giorni) {
        contratti.push({
          numero: row.numero,
          data: data,
          importo: parseFloat(row.importo || 0),
          giorni: (row.giorni || '').split(',').map(g => g.trim()).filter(Boolean),
        });
        console.log("Contratto aggiunto:", row.numero);  // Verifica quale contratto viene aggiunto
      }
    });
  } else {
    console.log("Foglio 'Contratti' non trovato.");
  }

  console.log('Contratti caricati:', contratti);
  // Rimuovi la chiamata a mostraLista('contratti')
  // mostraLista('contratti');  // Non vuoi che questo venga eseguito automaticamente
}

function caricaGuida() {
  const container = document.getElementById("risultati");
  container.innerHTML = "";   
  const guidaHtml = `
    <h3>Guida alla Gestione Ombrelloni</h3>
    <p>Benvenuto nella sezione di gestione ombrelloni! Ecco cosa puoi fare:</p>
    <ul>
      <li><strong>Aggiungi Contratto</strong>: Crea un nuovo contratto di affitto ombrellone.</li>
      <li><strong>Contratti</strong>: Visualizza, modifica o elimina contratti esistenti.</li>
      <li><strong>Prenotazioni Ombrelloni</strong>: Controlla le prenotazioni degli ombrelloni.</li>
      <li><strong>Tipologie Ombrelloni</strong>: Gestisci le diverse tipologie di ombrelloni disponibili.</li>
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
      if (ombrelloni.length === 0) return container.innerHTML = "<p>Nessun ombrellone disponibile.</p>";
      ombrelloni.forEach(o => {
        const div = document.createElement("div");
        div.innerHTML = 
          `<strong>Ombrellone #${o.id}</strong><br>
          Settore: ${o.settore}, Fila: ${o.fila}, Ordine: ${o.ordine}<br>
          Tipologia: ${o.tipologia}<br>
          <hr>`;
        container.appendChild(div);
      });
      break;

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
            Codice Tariffa: ${t.codTariffa}<br>
            Tipo Tariffa: ${t.tipoTariffa}<br> <!-- Mostra tipoTariffa come stringa -->
            <hr>`;
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
            `<strong>Contratto #${c.numero}</strong><br>
            Data: ${formattedDate}, Importo: €${c.importo.toFixed(2)}<br>  <!-- Usa toFixed per visualizzare 2 decimali -->
            Giorni prenotati: ${c.giorni.join(", ")}<br>
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
function aggiungiContratto(data, importo, giorni) {
  const numero = generateId();
  if (!data || isNaN(importo) || giorni.length === 0) { //controllo
    return alert("Tutti i campi del contratto sono richiesti.");
  }
  if (giorni.length === 0) {
    alert("Inserisci almeno un giorno valido.");
    return;
  }
  contratti.push({ numero, data, importo: parseFloat(importo), giorni }); //pusha i contratti
  alert(`Contratto #${numero} aggiunto.`);
  mostraLista("contratti");
  
}

// Modifica un contratto esistente
function modificaContratto(numero) {
  numero = parseInt(numero);  // Assicurati che il numero sia un intero
  const c = contratti.find(c => c.numero === numero);
  if (!c) return alert("Contratto non trovato.");

  const nuovaData = prompt("Modifica data (YYYY-MM-DD):", c.data);
  const nuovoImporto = prompt("Modifica importo (€):", c.importo);
  const nuoviGiorni = prompt("Modifica giorni (separati da virgola):", c.giorni.join(", "));
  if (giorni.length === 0) {
    alert("Inserisci almeno un giorno valido.");
    return;
  }
  if (nuovaData && !isNaN(parseFloat(nuovoImporto)) && nuoviGiorni) {
    c.data = nuovaData;
    c.importo = parseFloat(nuovoImporto);
    c.giorni = nuoviGiorni.split(",").map(g => g.trim()).filter(Boolean);
    alert("Contratto aggiornato.");
    mostraLista("contratti");
  } else {
    alert("Modifica annullata o dati non validi.");
  }
}

// Elimina un contratto
function eliminaContratto(numero) {
  numero = parseInt(numero);  // Assicurati che il numero sia un intero
  if (confirm("Vuoi eliminare questo contratto?")) {
    contratti = contratti.filter(c => c.numero !== numero);
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
        Giorni prenotati (separati da virgola): <input name="giorni" required><br>
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

// Funzione unificata di filtro per contratti, ombrelloni, tipologie
document.getElementById("filtroForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = new FormData(this);

  // Parametri di filtro
  const settore = form.get("settore").trim().toLowerCase();
  const fila = form.get("fila").trim();
  const tipologia = form.get("tipologia").trim().toLowerCase();
  const tariffaTipo = form.get("tariffaTipo").trim().toLowerCase();
  const data = form.get("data").trim();

  const risultatiContratti = [];
  const risultatiOmbrelloni = [];
  const risultatiTipologie = [];

  // Filtro per contratti
  contratti.forEach(c => {
    let matches = true;
    if (settore && !c.settore.toLowerCase().includes(settore)) matches = false;
    if (fila && !c.fila.toString().includes(fila)) matches = false;
    if (tipologia && !c.tipologia.toLowerCase().includes(tipologia)) matches = false;
    if (tariffaTipo && !c.tariffaTipo.toLowerCase().includes(tariffaTipo)) matches = false;
    if (data && !c.data.includes(data)) matches = false;
    if (matches) risultatiContratti.push(c);
  });

  // Filtro per ombrelloni
  ombrelloni.forEach(o => {
    let matches = true;
    if (settore && !o.settore.toLowerCase().includes(settore)) matches = false;
    if (fila && !o.fila.toString().includes(fila)) matches = false;
    if (tipologia && !o.tipologia.toLowerCase().includes(tipologia)) matches = false;
    if (matches) risultatiOmbrelloni.push(o);
  });

  // Filtro per tipologie
  tipologie.forEach(t => {
    if (tipologia && t.nome.toLowerCase().includes(tipologia)) {
      risultatiTipologie.push(t);
    }
  });

  // Mostra i risultati nel container
  const container = document.getElementById("risultati");
  container.innerHTML = "";

  if (risultatiContratti.length === 0 && risultatiOmbrelloni.length === 0 && risultatiTipologie.length === 0) {
    return container.innerHTML = "<p>Nessun risultato trovato.</p>";
  }

  // Mostra i risultati filtrati
  risultatiContratti.forEach(c => {
    const div = document.createElement("div");
    const formattedDate = new Date(c.data).toLocaleDateString('it-IT');
    div.innerHTML = `
      <strong>Contratto #${c.numero}</strong><br>
      Data: ${formattedDate}, Importo: €${c.importo.toFixed(2)}<br>
      Giorni prenotati: ${c.giorni.join(", ")}<br>
      <button onclick="modificaContratto('${c.numero}')">✏️ Modifica</button>
      <button onclick="eliminaContratto('${c.numero}')">🗑️ Elimina</button>
      <hr>
    `;
    container.appendChild(div);
  });

  risultatiOmbrelloni.forEach(o => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>Ombrellone #${o.id}</strong><br>
      Settore: ${o.settore}, Fila: ${o.fila}, Ordine: ${o.ordine}<br>
      Tipologia: ${o.tipologia}<br>
      <hr>
    `;
    container.appendChild(div);
  });

  risultatiTipologie.forEach(t => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${t.nome}</strong> (${t.codice})<br>
      Accessori: ${t.accessori.join(", ")}<br>
      <hr>
    `;
    container.appendChild(div);
  });
});
