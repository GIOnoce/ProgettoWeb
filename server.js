const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// MongoDB Atlas connection string - REPLACE WITH YOUR CONNECTION STRING
const MONGODB_URI = 'mongodb+srv://gnocerino:Chitarra03@clusterweb.ihyfzo5.mongodb.net/?retryWrites=true&w=majority&appName=ClusterWeb';
const DATABASE_NAME = 'DatabaseSpiaggia';

let db;
let client;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servire i file statici dalla cartella 'frontend'
app.use(express.static(path.join(__dirname, 'frontend')));

// Connect to MongoDB Atlas
async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB Atlas');
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Ensure stipulatoDa is always an array
const ensureArrayBackend = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    
    if (typeof value === 'string') {
      if (value.includes(',')) {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [value];
    }
    
    return [String(value)];
};

// Generate a random ID for new items
const generateId = () => Math.floor(Math.random() * 1000000);

// Serve il sito principale - serve home.html dalla cartella frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

// Health check endpoint - spostato su /api/status
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server running', database: 'MongoDB Atlas' });
});

// GET endpoint to serve all data
app.get('/api/data', async (req, res) => {
    try {
        const data = {
            ombrelloni: await db.collection('ombrellone').find({}).toArray(),
            tipologie: await db.collection('tipologia').find({}).toArray(),
            tariffe: await db.collection('tariffa').find({}).toArray(),
            contratti: await db.collection('contratto').find({}).toArray(),
            clienti: await db.collection('cliente').find({}).toArray(),
            ombrelloneVenduto: await db.collection('ombrelloneVenduto').find({}).toArray(),
            giornoDisponibilita: await db.collection('giornoDisponibilita').find({}).toArray()
        };

        // Process contratti to ensure stipulatoDa is always an array
        data.contratti = data.contratti.map(contract => ({
            ...contract,
            stipulatoDa: ensureArrayBackend(contract.stipulatoDa)
        }));

        res.json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// GET single contract by ID
app.get('/api/Contratti/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid contract ID format' });
        }

        const contract = await db.collection('contratto').findOne({ 
            _id: new ObjectId(id) 
        });

        if (!contract) {
            return res.status(404).json({ error: `Contract with ID ${id} not found.` });
        }

        res.json({
            ...contract,
            stipulatoDa: ensureArrayBackend(contract.stipulatoDa)
        });
    } catch (error) {
        console.error('Error retrieving contract:', error);
        res.status(500).json({ error: 'Failed to retrieve contract' });
    }
});

// POST endpoint to add a new contract
app.post('/api/Contratti', async (req, res) => {
    try {
        console.log('Received contract data:', req.body);
        
        const stipulatoDaArray = ensureArrayBackend(req.body.stipulatoDa);
        console.log('Processed stipulatoDa:', stipulatoDaArray);
        
        const newContract = {
            numProgr: req.body.numProgr || generateId(),
            data: req.body.data,
            importo: parseFloat(req.body.importo),
            stipulatoDa: stipulatoDaArray
        };

        console.log('Processed contract data to save:', newContract);

        const result = await db.collection('contratto').insertOne(newContract);
        
        if (result.insertedId) {
            res.status(201).json({
                ...newContract,
                _id: result.insertedId,
                stipulatoDa: stipulatoDaArray
            });
        } else {
            res.status(500).json({ error: 'Failed to add new contract.' });
        }
    } catch (error) {
        console.error('Error adding contract:', error);
        res.status(500).json({ error: 'Failed to add contract: ' + error.message });
    }
});

// POST endpoint to add a new client
app.post('/api/Clienti', async (req, res) => {
    try {
        console.log('Received client data:', req.body);
        
        const newClient = {
            codice: req.body.codice || `CLI${generateId()}`,
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email || '',
            dataNascita: req.body.dataNascita || null,
            indirizzo: req.body.indirizzo || ''
        };

        console.log('Processed client data to save:', newClient);

        const result = await db.collection('cliente').insertOne(newClient);
        
        if (result.insertedId) {
            res.status(201).json({
                ...newClient,
                _id: result.insertedId
            });
        } else {
            res.status(500).json({ error: 'Failed to add new client.' });
        }
    } catch (error) {
        console.error('Error adding client:', error);
        res.status(500).json({ error: 'Failed to add client: ' + error.message });
    }
});

app.put('/api/Contratti/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Updating contract ${id}:`, req.body);
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid contract ID format' });
        }
        
        const stipulatoDaArray = ensureArrayBackend(req.body.stipulatoDa);
        
        const updatedContractData = {
            numProgr: req.body.numProgr,
            data: req.body.data,
            importo: parseFloat(req.body.importo),
            stipulatoDa: stipulatoDaArray
        };
        
        const result = await db.collection('contratto').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedContractData }
        );

        if (result.matchedCount > 0) {
            res.json({ ...updatedContractData, _id: id });
        } else {
            res.status(404).json({ error: `Contract with ID ${id} not found.` });
        }
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Failed to update contract: ' + error.message });
    }
});

// DELETE endpoint to delete by _id
app.delete('/api/Contratti/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting contract ${id}`);
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid contract ID format' });
        }
        
        const result = await db.collection('contratto').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: `Contract with ID ${id} not found.` });
        }
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract: ' + error.message });
    }
});

// GET endpoint for Ombrelloni with filtering
app.get('/api/Ombrelloni', async (req, res) => {
    try {
        let filter = {};
        
        if (req.query.settore) {
            filter.settore = req.query.settore;
        }
        
        if (req.query.fila) {
            filter.fila = parseInt(req.query.fila);
        }
        
        if (req.query.tipologia) {
            filter.tipologia = req.query.tipologia;
        }
        
        const ombrelloni = await db.collection('ombrellone').find(filter).toArray();
        res.json(ombrelloni);
    } catch (error) {
        console.error('Error retrieving ombrelloni:', error);
        res.status(500).json({ error: 'Failed to retrieve ombrelloni' });
    }
});

// GET endpoint for clients
app.get('/api/Clienti', async (req, res) => {
    try {
        const clients = await db.collection('cliente').find({}).toArray();
        res.json(clients);
    } catch (error) {
        console.error('Error retrieving clients:', error);
        res.status(500).json({ error: 'Failed to retrieve clients' });
    }
});

// GET endpoint for tipologie
app.get('/api/Tipologie', async (req, res) => {
    try {
        const tipologie = await db.collection('tipologia').find({}).toArray();
        res.json(tipologie);
    } catch (error) {
        console.error('Error retrieving tipologie:', error);
        res.status(500).json({ error: 'Failed to retrieve tipologie' });
    }
});

// MODIFICHE AL BACKEND - Node.js/Express

// 1. MIGLIORA L'ENDPOINT TARIFFE ESISTENTE
app.get('/api/Tariffe', async (req, res) => {
    try {
        const tariffe = await db.collection('tariffa').find({}).toArray();
        
        // Log per debug
        console.log(`Trovate ${tariffe.length} tariffe nel database`);
        if (tariffe.length > 0) {
            console.log('Prima tariffa:', tariffe[0]);
        }
        
        // Trasforma le date in formato corretto e assicura che i prezzi siano numerici
        const tariffeProcessed = tariffe.map(t => ({
            ...t,
            prezzo: parseFloat(t.prezzo) || 0,
            dataInizio: t.dataInizio ? new Date(t.dataInizio).toISOString() : null,
            dataFine: t.dataFine ? new Date(t.dataFine).toISOString() : null
        }));
        
        res.json(tariffeProcessed);
    } catch (error) {
        console.error('Error retrieving tariffe:', error);
        res.status(500).json({ error: 'Failed to retrieve tariffe', details: error.message });
    }
});

// 2. AGGIUNGI NUOVO ENDPOINT PER CALCOLO PREZZO SPECIFICO
app.post('/api/calcola-prezzo', async (req, res) => {
    try {
        const { tipologia, dataInizio, dataFine, tipoTariffa } = req.body;
        
        if (!tipologia || !dataInizio || !tipoTariffa) {
            return res.status(400).json({ 
                error: 'Parametri mancanti', 
                required: ['tipologia', 'dataInizio', 'tipoTariffa'] 
            });
        }
        
        const startDate = new Date(dataInizio);
        const endDate = dataFine ? new Date(dataFine) : new Date(dataInizio);
        
        // Trova tariffe applicabili
        const query = {
            $and: [
                {
                    $or: [
                        { codice: tipologia },
                        { codTipologia: tipologia },
                        { tipologia: tipologia }
                    ]
                },
                { tipo: tipoTariffa },
                {
                    $or: [
                        { dataInizio: { $exists: false } },
                        { dataInizio: null },
                        { dataInizio: { $lte: endDate } }
                    ]
                },
                {
                    $or: [
                        { dataFine: { $exists: false } },
                        { dataFine: null },
                        { dataFine: { $gte: startDate } }
                    ]
                }
            ]
        };
        
        const tariffe = await db.collection('tariffa').find(query).toArray();
        
        let prezzoTotale = 0;
        const giorni = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        if (tariffe.length > 0) {
            // Usa la tariffa più specifica (con range di date più piccolo)
            const tariffa = tariffe.reduce((best, curr) => {
                const getRangeSize = (t) => {
                    const start = t.dataInizio ? new Date(t.dataInizio) : new Date('1900-01-01');
                    const end = t.dataFine ? new Date(t.dataFine) : new Date('2100-12-31');
                    return end - start;
                };
                return getRangeSize(curr) < getRangeSize(best) ? curr : best;
            });
            
            const prezzoGiornaliero = parseFloat(tariffa.prezzo) || 0;
            prezzoTotale = prezzoGiornaliero * giorni;
            
            // Applica sconti per abbonamenti
            if (tipoTariffa === 'Abbonamento') {
                if (giorni >= 30) {
                    prezzoTotale *= 0.7; // 30% sconto
                } else if (giorni >= 14) {
                    prezzoTotale *= 0.8; // 20% sconto
                } else if (giorni >= 7) {
                    prezzoTotale *= 0.9; // 10% sconto
                }
            }
        }
        
        res.json({
            tipologia,
            dataInizio,
            dataFine: dataFine || dataInizio,
            tipoTariffa,
            giorni,
            prezzoTotale: Math.round(prezzoTotale * 100) / 100,
            tariffeApplicabili: tariffe.length,
            tariffa: tariffe.length > 0 ? tariffe[0] : null
        });
        
    } catch (error) {
        console.error('Error calculating price:', error);
        res.status(500).json({ error: 'Failed to calculate price', details: error.message });
    }
});

// 3. AGGIUNGI ENDPOINT PER CREARE TARIFFE DI TEST (per debug)
app.post('/api/tariffe-test', async (req, res) => {
    try {
        const tariffeTest = [
            {
                codice: 'T1',
                prezzo: 15.00,
                tipo: 'Giornaliera',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            },
            {
                codice: 'T2',
                prezzo: 20.00,
                tipo: 'Giornaliera',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            },
            {
                codice: 'T3',
                prezzo: 25.00,
                tipo: 'Giornaliera',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            },
            {
                codice: 'T1',
                prezzo: 12.00,
                tipo: 'Abbonamento',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            },
            {
                codice: 'T2',
                prezzo: 17.00,
                tipo: 'Abbonamento',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            },
            {
                codice: 'T3',
                prezzo: 22.00,
                tipo: 'Abbonamento',
                dataInizio: new Date('2024-01-01'),
                dataFine: new Date('2024-12-31')
            }
        ];
        
        const result = await db.collection('tariffa').insertMany(tariffeTest);
        res.json({ 
            message: 'Tariffe di test create', 
            inserted: result.insertedCount,
            tariffe: tariffeTest 
        });
        
    } catch (error) {
        console.error('Error creating test tariffe:', error);
        res.status(500).json({ error: 'Failed to create test tariffe', details: error.message });
    }
});

// 4. AGGIUNGI ENDPOINT PER VERIFICARE STATO DATABASE
app.get('/api/debug/database-status', async (req, res) => {
    try {
        const collections = await db.listCollections().toArray();
        const tariffeCount = await db.collection('tariffa').countDocuments();
        const ombrelloniCount = await db.collection('ombrelloni').countDocuments();
        const clientiCount = await db.collection('clienti').countDocuments();
        
        res.json({
            collections: collections.map(c => c.name),
            counts: {
                tariffe: tariffeCount,
                ombrelloni: ombrelloniCount,
                clienti: clientiCount
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking database status:', error);
        res.status(500).json({ error: 'Failed to check database status', details: error.message });
    }
});

// Fallback per tutte le altre route che non sono API - serve sempre home.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
  }
});

// Start the server after connecting to MongoDB
connectToMongoDB().then(() => {
    app.listen(port, () => {
        console.log(`Backend server running at http://localhost:${port}`);
        console.log(`Website: http://localhost:${port}`);
        console.log(`API base URL: http://localhost:${port}/api`);
        console.log(`Database: MongoDB Atlas`);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});