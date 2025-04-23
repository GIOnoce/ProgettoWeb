
let ombrelloni = [];
let tipologie = [];
let tariffe = [];
let contratti = [];

// Genera un numero casuale tra 0 e 999999 per usarlo come ID
const generateId = () => Math.floor(Math.random() * 1000000);
// Funzione per mostrare i contratti


window.addEventListener('load', () => {
  caricaExcelDaCartella('Database_SpiaggiaFacile_Aggiornato.xlsx'); // Carica il file Excel automaticamente appena la pagina si carica
});

function caricaExcelDaCartella(percorsoFile) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', percorsoFile, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function () {
    if (xhr.status === 200) {
      const data = new Uint8Array(xhr.response);
      const workbook = XLSX.read(data, { type: 'array' });

      // Carica i dati da ogni foglio
      caricaOmbrelloni(workbook);
      caricaTipologie(workbook);
      caricaTariffe(workbook);
      caricaClienti(workbook);
      caricaContratti(workbook);

      alert("File Excel caricato automaticamente!");
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

function caricaTariffe(workbook) {
  const sheet = workbook.Sheets['Tariffe'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.tipologia && row.tariffa) {
        tariffe.push({
          tipologia: row.tipologia,
          tariffa: parseFloat(row.tariffa || 0),
        });
      }
    });
  }
  mostraLista('tariffe');
}

function caricaClienti(workbook) {
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
}

function caricaContratti(workbook) {
  const sheet = workbook.Sheets['Contratti'];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet);
    rows.forEach(row => {
      if (row.numero && row.data) {
        contratti.push({
          numero: row.numero,
          data: row.data,
          importo: parseFloat(row.importo || 0),
          giorni: (row.giorni || '').split(',').map(g => g.trim()).filter(Boolean),
        });
      }
    });
  } else {
    console.log("Foglio 'Contratti' non trovato.");
  }
  console.log('Contratti finali:', contratti); // Log per vedere i contratti finali nell'array
  mostraLista('contratti');
}

function mostraLista(tipo) {
  let container = document.getElementById("risultati");
  container.innerHTML = "";

  switch (tipo) {
    case "ombrelloni":
      if (ombrelloni.length === 0) return container.innerHTML = "<p>Nessun ombrellone disponibile.</p>";
      ombrelloni.forEach(o => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Ombrellone #${o.id}</strong><br>
          Settore: ${o.settore}, Fila: ${o.fila}, Ordine: ${o.ordine}<br>
          Tipologia: ${o.tipologia}<br>
          <button onclick="modificaOmbrellone(${o.id})">✏️ Modifica</button>
          <button onclick="eliminaOmbrellone(${o.id})">🗑️ Elimina</button>
          <hr>
        `;
        container.appendChild(div);
      });
      break;

    case "tipologie":
      if (tipologie.length === 0) return container.innerHTML = "<p>Nessuna tipologia disponibile.</p>";
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

    case "tariffe":
      if (tariffe.length === 0) return container.innerHTML = "<p>Nessuna tariffa disponibile.</p>";
      tariffe.forEach(t => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Tipologia: ${t.tipologia}</strong><br>
          Tariffa: €${t.tariffa}<br>
          <hr>
        `;
        container.appendChild(div);
      });
      break;

    case "clienti":
      if (clienti.length === 0) return container.innerHTML = "<p>Nessun cliente disponibile.</p>";
      clienti.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Cliente: ${c.nome} ${c.cognome}</strong><br>
          Email: ${c.email}<br>
          <hr>
        `;
        container.appendChild(div);
      });
      break;

    case "contratti":
      if (contratti.length === 0) 
      return container.innerHTML = "<p>Nessun contratto disponibile.</p>";
      contratti.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Contratto #${c.numero}</strong><br>
          Data: ${c.data}, Importo: €${c.importo}<br>
          Giorni prenotati: ${c.giorni.join(", ")}<br>
          <button onclick="modificaContratto('${c.numero}')">✏️ Modifica</button>
          <button onclick="eliminaContratto('${c.numero}')">🗑️ Elimina</button>
          <hr>
        `;
        container.appendChild(div);
      });
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

// Funzione di filtro per contratti
document.getElementById("filtroForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = new FormData(this);
  const numero = form.get("numero").trim().toLowerCase();
  const data = form.get("data");

  const risultati = contratti.filter(c => {
    return (!numero || c.numero.toLowerCase().includes(numero)) &&
           (!data || c.data === data);
  });

  const container = document.getElementById("risultati");
  container.innerHTML = "";

  if (risultati.length === 0) {
    return container.innerHTML = "<p>Nessun risultato trovato.</p>";
  }

  risultati.forEach(c => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>Contratto #${c.numero}</strong><br>
      Data: ${c.data}, Importo: €${c.importo}<br>
      Giorni prenotati: ${c.giorni.join(", ")}<br>
      <button onclick="modificaContratto('${c.numero}')">✏️ Modifica</button>
      <button onclick="eliminaContratto('${c.numero}')">🗑️ Elimina</button>
      <hr>
    `;
    container.appendChild(div);
  });
});


