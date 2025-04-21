// Dati simulati (non abbiamo ancora il collegamento a Excel)
let ombrelloni = [];
let tipologie = [];
let tariffe = [];
let contratti = [];

// Genero gli Id
const generateId = () => Math.floor(Math.random() * 1000000);

// Mostra liste dinamiche
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

    case "contratti":
      if (contratti.length === 0) return container.innerHTML = "<p>Nessun contratto disponibile.</p>";
      contratti.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `
          <strong>Contratto #${c.numero}</strong><br>
          Data: ${c.data}, Importo: €${c.importo}<br>
          Giorni prenotati: ${c.giorni.join(", ")}<br>
          <hr>
        `;
        container.appendChild(div);
      });
      break;
  }
}

function aggiungiOmbrellone(settore, fila, ordine, tipologia) {
  if (!settore || !fila || !ordine || !tipologia) {
    alert("Tutti i campi dell'ombrellone sono obbligatori.");
    return;
  }

  const nuovo = {
    id: generateId(),
    settore,
    fila,
    ordine,
    tipologia
  };
  ombrelloni.push(nuovo);
  alert("Ombrellone aggiunto con successo.");
}

function modificaOmbrellone(id) {
  const ombrellone = ombrelloni.find(o => o.id === id);
  if (!ombrellone) return alert("Ombrellone non trovato.");
  const nuovoSettore = prompt("Modifica settore:", ombrellone.settore);
  const nuovaFila = prompt("Modifica fila:", ombrellone.fila);
  const nuovoOrdine = prompt("Modifica ordine:", ombrellone.ordine);
  const nuovaTipologia = prompt("Modifica tipologia:", ombrellone.tipologia);

  if (nuovoSettore && nuovaFila && nuovoOrdine && nuovaTipologia) {
    ombrellone.settore = nuovoSettore;
    ombrellone.fila = parseInt(nuovaFila);
    ombrellone.ordine = parseInt(nuovoOrdine);
    ombrellone.tipologia = nuovaTipologia;
    alert("Ombrellone aggiornato.");
    mostraLista("ombrelloni");
  } else {
    alert("Modifica annullata o dati non validi.");
  }
}

function eliminaOmbrellone(id) {
  if (confirm("Sei sicuro di voler eliminare questo ombrellone?")) {
    ombrelloni = ombrelloni.filter(o => o.id !== id);
    alert("Ombrellone eliminato.");
    mostraLista("ombrelloni");
  }
}

// Filtro

document.getElementById("filtroForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = new FormData(this);
  const settore = form.get("settore").trim().toLowerCase();
  const fila = form.get("fila");
  const tipologia = form.get("tipologia");
  const data = form.get("data");

  const risultati = ombrelloni.filter(o => {
    return (!settore || o.settore.toLowerCase().includes(settore)) &&
           (!fila || o.fila == fila) &&
           (!tipologia || o.tipologia === tipologia);
  });

  const container = document.getElementById("risultati");
  container.innerHTML = "";

  if (risultati.length === 0) {
    return container.innerHTML = "<p>Nessun risultato trovato.</p>";
  }

  risultati.forEach(o => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>Ombrellone #${o.id}</strong><br>
      Settore: ${o.settore}, Fila: ${o.fila}, Ordine: ${o.ordine}<br>
      Tipologia: ${o.tipologia}<br>
      <hr>
    `;
    container.appendChild(div);
  });
});


// Provo a testare il sito
tipologie.push({ codice: "STD", nome: "Standard", descrizione: "1 sdraio, 1 lettino" });
tipologie.push({ codice: "LUX", nome: "Lusso", descrizione: "2 lettini, 1 sdraio, cassaforte" });

aggiungiOmbrellone("A", 1, 1, "STD");
aggiungiOmbrellone("B", 2, 2, "LUX");



// Tipologia

function aggiungiTipologia(codice, nome, descrizione) {
    if (!codice || !nome || !descrizione) {
      return alert("Tutti i campi sono obbligatori per aggiungere una tipologia.");
    }
  
    if (tipologie.some(t => t.codice === codice)) {
      return alert("Codice tipologia già esistente.");
    }
  
    tipologie.push({ codice, nome, descrizione });
    alert("Tipologia aggiunta.");
  }
  
  function modificaTipologia(codice) {
    const tip = tipologie.find(t => t.codice === codice);
    if (!tip) return alert("Tipologia non trovata.");
  
    const nuovoNome = prompt("Modifica nome:", tip.nome);
    const nuovaDescrizione = prompt("Modifica descrizione:", tip.descrizione);
  
    if (nuovoNome && nuovaDescrizione) {
      tip.nome = nuovoNome;
      tip.descrizione = nuovaDescrizione;
      alert("Tipologia aggiornata.");
      mostraLista("tipologie");
    } else {
      alert("Modifica annullata.");
    }
  }
  
  function eliminaTipologia(codice) {
    if (confirm("Eliminare questa tipologia?")) {
      tipologie = tipologie.filter(t => t.codice !== codice);
      alert("Tipologia eliminata.");
      mostraLista("tipologie");
    }
  }

  // Tariffe

  function aggiungiTariffa(periodo, giornoSettimana, tipologia, prezzo) {
    if (!periodo || !giornoSettimana || !tipologia || isNaN(prezzo)) {
      return alert("Inserire tutti i campi per la tariffa.");
    }
  
    tariffe.push({ id: generateId(), periodo, giornoSettimana, tipologia, prezzo: parseFloat(prezzo) });
    alert("Tariffa aggiunta.");
  }
  
  function mostraTariffe() {
    let container = document.getElementById("risultati");
    container.innerHTML = "";
  
    if (tariffe.length === 0) return container.innerHTML = "<p>Nessuna tariffa presente.</p>";
  
    tariffe.forEach(t => {
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>Tariffa</strong><br>
        Periodo: ${t.periodo}, Giorno: ${t.giornoSettimana}<br>
        Tipologia: ${t.tipologia}, Prezzo: €${t.prezzo}<br>
        <button onclick="eliminaTariffa(${t.id})">🗑️ Elimina</button>
        <hr>
      `;
      container.appendChild(div);
    });
  }
  
  function eliminaTariffa(id) {
    if (confirm("Vuoi eliminare questa tariffa?")) {
      tariffe = tariffe.filter(t => t.id !== id);
      alert("Tariffa eliminata.");
      mostraTariffe();
    }
  }

  // Contratti

  function aggiungiContratto(numero, data, importo, giorni) {
    if (!numero || !data || isNaN(importo) || giorni.length === 0) {
      return alert("Tutti i campi del contratto sono richiesti.");
    }
  
    contratti.push({ numero, data, importo: parseFloat(importo), giorni });
    alert("Contratto aggiunto.");
  }
  
  function mostraContratti() {
    let container = document.getElementById("risultati");
    container.innerHTML = "";
  
    if (contratti.length === 0) return container.innerHTML = "<p>Nessun contratto disponibile.</p>";
  
    contratti.forEach(c => {
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>Contratto #${c.numero}</strong><br>
        Data: ${c.data}, Importo: €${c.importo}<br>
        Giorni prenotati: ${c.giorni.join(", ")}<br>
        <hr>
      `;
      container.appendChild(div);
    });
  }

  // Mostra form dinamici

  function mostraForm(tipo) {
    const container = document.getElementById("formContainer");
    container.innerHTML = "";   
    let formHtml = "";
  
    switch (tipo) {
      case "ombrellone":
        formHtml = `
          <h3>Aggiungi Ombrellone</h3>
          <form id="formOmbrellone">
            Settore: <input name="settore" required><br>
            Fila: <input type="number" name="fila" required><br>
            Ordine: <input type="number" name="ordine" required><br>
            Tipologia: 
              <select name="tipologia" required>
                ${tipologie.map(t => `<option value="${t.codice}">${t.nome}</option>`).join("")}
              </select><br>
            <button type="submit">Aggiungi</button>
          </form>
        `;
        break;
  
      case "tipologia":
        formHtml = `
          <h3>Aggiungi Tipologia</h3>
          <form id="formTipologia">
            Codice: <input name="codice" required><br>
            Nome: <input name="nome" required><br>
            Descrizione: <input name="descrizione" required><br>
            <button type="submit">Aggiungi</button>
          </form>
        `;
        break;
  
      case "tariffa":
        formHtml = `
          <h3>Aggiungi Tariffa</h3>
          <form id="formTariffa">
            Periodo: <input name="periodo" required><br>
            Giorno della settimana: <input name="giornoSettimana" required><br>
            Tipologia: 
              <select name="tipologia" required>
                ${tipologie.map(t => `<option value="${t.codice}">${t.nome}</option>`).join("")}
              </select><br>
            Prezzo (€): <input type="number" step="0.01" name="prezzo" required><br>
            <button type="submit">Aggiungi</button>
          </form>
        `;
        break;
  
      case "contratto":
        formHtml = `
          <h3>Aggiungi Contratto</h3>
          <form id="formContratto">
            Numero: <input name="numero" required><br>
            Data: <input type="date" name="data" required><br>
            Importo (€): <input type="number" step="0.01" name="importo" required><br>
            Giorni prenotati (separati da virgola): <input name="giorni" required><br>
            <button type="submit">Aggiungi</button>
          </form>
        `;
        break;
    }
  
    container.innerHTML = formHtml;
  

    if (tipo === "ombrellone") {
      document.getElementById("formOmbrellone").addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(this);
        const settore = data.get("settore");
        const fila = parseInt(data.get("fila"));
        const ordine = parseInt(data.get("ordine"));
        const tipologia = data.get("tipologia");
        aggiungiOmbrellone(settore, fila, ordine, tipologia);
        this.reset();
        container.innerHTML = "";
      });
    }
  
    if (tipo === "tipologia") {
      document.getElementById("formTipologia").addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(this);
        const codice = data.get("codice");
        const nome = data.get("nome");
        const descrizione = data.get("descrizione");
        aggiungiTipologia(codice, nome, descrizione);
        this.reset();
        container.innerHTML = "";
      });
    }
  
    if (tipo === "tariffa") {
      document.getElementById("formTariffa").addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(this);
        const periodo = data.get("periodo");
        const giorno = data.get("giornoSettimana");
        const tipo = data.get("tipologia");
        const prezzo = parseFloat(data.get("prezzo"));
        aggiungiTariffa(periodo, giorno, tipo, prezzo);
        this.reset();
        container.innerHTML = "";
      });
    }
  
    if (tipo === "contratto") {
      document.getElementById("formContratto").addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(this);
        const numero = data.get("numero");
        const date = data.get("data");
        const importo = parseFloat(data.get("importo"));
        const giorniRaw = data.get("giorni");
        const giorni = giorniRaw.split(",").map(g => g.trim()).filter(Boolean);
        aggiungiContratto(numero, date, importo, giorni);
        this.reset();
        container.innerHTML = "";
      });
    }
  }