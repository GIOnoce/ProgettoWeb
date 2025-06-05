const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gnocerino:Chitarra03@clusterweb.ihyfzo5.mongodb.net/?retryWrites=true&w=majority&appName=ClusterWeb';
const DATABASE_NAME = 'DatabaseSpiaggia';

let db, client;

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// Utilities
const ensureArray = (value) => !value ? [] : Array.isArray(value) ? value : 
    typeof value === 'string' && value.includes(',') ? value.split(',').map(s => s.trim()).filter(Boolean) : [String(value)];
const generateId = () => Math.floor(Math.random() * 1000000);
const isValidObjectId = (id) => ObjectId.isValid(id);
const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).json({ error: message, details: error.message });
};

// MongoDB connection
async function connectToMongoDB() {
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DATABASE_NAME);
        console.log('Connected to MongoDB Atlas');
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'home.html')));
app.get('/api/status', (req, res) => res.json({ status: 'Server running', database: 'MongoDB Atlas' }));

// GET all data
app.get('/api/data', async (req, res) => {
    try {
        const collections = ['ombrellone', 'tipologia', 'tariffa', 'contratto', 'cliente', 'ombrelloneVenduto', 'giornoDisponibilita'];
        const data = {};
        
        await Promise.all(collections.map(async (name) => {
            const key = name === 'ombrellone' ? 'ombrelloni' : 
                       name === 'tipologia' ? 'tipologie' : 
                       name === 'tariffa' ? 'tariffe' : 
                       name === 'contratto' ? 'contratti' : 
                       name === 'cliente' ? 'clienti' : name;
            data[key] = await db.collection(name).find({}).toArray();
        }));

        data.contratti = data.contratti.map(contract => ({ ...contract, stipulatoDa: ensureArray(contract.stipulatoDa) }));
        res.json(data);
    } catch (error) {
        handleError(res, error, 'Failed to retrieve data');
    }
});

// Generic CRUD operations
const createCRUDRoutes = (collectionName, routeName, idField = '_id') => {
    // GET all with filtering
    app.get(`/api/${routeName}`, async (req, res) => {
        try {
            const filter = {};
            Object.keys(req.query).forEach(key => {
                const value = req.query[key];
                filter[key] = !isNaN(value) ? parseInt(value) : value;
            });
            
            const data = await db.collection(collectionName).find(filter).toArray();
            res.json(data);
        } catch (error) {
            handleError(res, error, `Failed to retrieve ${routeName}`);
        }
    });
    
    // GET single by ID
    app.get(`/api/${routeName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            if (idField === '_id' && !isValidObjectId(id)) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const query = idField === '_id' ? { _id: new ObjectId(id) } : { [idField]: id };
            const item = await db.collection(collectionName).findOne(query);

            if (!item) return res.status(404).json({ error: `${routeName} with ID ${id} not found` });

            if (collectionName === 'contratto') item.stipulatoDa = ensureArray(item.stipulatoDa);
            res.json(item);
        } catch (error) {
            handleError(res, error, `Failed to retrieve ${routeName}`);
        }
    });

    // POST new item
    app.post(`/api/${routeName}`, async (req, res) => {
        try {
            const newItem = { ...req.body };
            
            if (collectionName === 'contratto') {
                newItem.numProgr = newItem.numProgr || generateId();
                newItem.importo = parseFloat(newItem.importo);
                newItem.stipulatoDa = ensureArray(newItem.stipulatoDa);
            } else if (collectionName === 'cliente') {
                newItem.codice = newItem.codice || `CLI${generateId()}`;
            }

            const result = await db.collection(collectionName).insertOne(newItem);
            res.status(201).json({ ...newItem, _id: result.insertedId });
        } catch (error) {
            handleError(res, error, `Failed to add ${routeName}`);
        }
    });

    // PUT update item
    app.put(`/api/${routeName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            if (idField === '_id' && !isValidObjectId(id)) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const updateData = { ...req.body };
            if (collectionName === 'contratto') {
                updateData.importo = parseFloat(updateData.importo);
                updateData.stipulatoDa = ensureArray(updateData.stipulatoDa);
            }

            const query = idField === '_id' ? { _id: new ObjectId(id) } : { [idField]: id };
            const result = await db.collection(collectionName).updateOne(query, { $set: updateData });

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: `${routeName} with ID ${id} not found` });
            }

            res.json({ ...updateData, [idField]: id });
        } catch (error) {
            handleError(res, error, `Failed to update ${routeName}`);
        }
    });

    // DELETE item
    app.delete(`/api/${routeName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            if (idField === '_id' && !isValidObjectId(id)) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const query = idField === '_id' ? { _id: new ObjectId(id) } : { [idField]: id };
            const result = await db.collection(collectionName).deleteOne(query);

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: `${routeName} with ID ${id} not found` });
            }

            res.status(204).send();
        } catch (error) {
            handleError(res, error, `Failed to delete ${routeName}`);
        }
    });
};

// Create CRUD routes for all collections
createCRUDRoutes('contratto', 'Contratti');
createCRUDRoutes('cliente', 'Clienti');
createCRUDRoutes('ombrellone', 'Ombrelloni');
createCRUDRoutes('tipologia', 'Tipologie');
createCRUDRoutes('ombrelloneVenduto', 'ombrelloneVenduto');

// Enhanced Tariffe routes
app.get('/api/Tariffe', async (req, res) => {
    try {
        const tariffe = await db.collection('tariffa').find({}).toArray();
        const processed = tariffe.map(t => ({
            ...t,
            prezzo: parseFloat(t.prezzo) || 0,
            dataInizio: t.dataInizio ? new Date(t.dataInizio).toISOString() : null,
            dataFine: t.dataFine ? new Date(t.dataFine).toISOString() : null
        }));
        res.json(processed);
    } catch (error) {
        handleError(res, error, 'Failed to retrieve tariffe');
    }
});

// Price calculation
app.post('/api/calcola-prezzo', async (req, res) => {
    try {
        const { tipologia, dataInizio, dataFine, tipoTariffa } = req.body;
        if (!tipologia || !dataInizio || !tipoTariffa) {
            return res.status(400).json({ error: 'Missing parameters', required: ['tipologia', 'dataInizio', 'tipoTariffa'] });
        }

        const startDate = new Date(dataInizio);
        const endDate = dataFine ? new Date(dataFine) : startDate;
        const giorni = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const query = {
            $and: [
                { $or: [{ codice: tipologia }, { codTipologia: tipologia }, { tipologia }] },
                { tipo: tipoTariffa },
                { $or: [{ dataInizio: { $exists: false } }, { dataInizio: null }, { dataInizio: { $lte: endDate } }] },
                { $or: [{ dataFine: { $exists: false } }, { dataFine: null }, { dataFine: { $gte: startDate } }] }
            ]
        };

        const tariffe = await db.collection('tariffa').find(query).toArray();
        let prezzoTotale = 0;

        if (tariffe.length > 0) {
            const tariffa = tariffe.reduce((best, curr) => {
                const getRange = (t) => {
                    const start = t.dataInizio ? new Date(t.dataInizio) : new Date('1900-01-01');
                    const end = t.dataFine ? new Date(t.dataFine) : new Date('2100-12-31');
                    return end - start;
                };
                return getRange(curr) < getRange(best) ? curr : best;
            });

            prezzoTotale = (parseFloat(tariffa.prezzo) || 0) * giorni;

            if (tipoTariffa === 'Abbonamento') {
                const discount = giorni >= 30 ? 0.7 : giorni >= 14 ? 0.8 : giorni >= 7 ? 0.9 : 1;
                prezzoTotale *= discount;
            }
        }

        res.json({
            tipologia, dataInizio, dataFine: dataFine || dataInizio, tipoTariffa, giorni,
            prezzoTotale: Math.round(prezzoTotale * 100) / 100,
            tariffeApplicabili: tariffe.length,
            tariffa: tariffe[0] || null
        });
    } catch (error) {
        handleError(res, error, 'Failed to calculate price');
    }
});

// Test and debug routes
app.post('/api/tariffe-test', async (req, res) => {
    try {
        const tariffeTest = ['T1', 'T2', 'T3'].flatMap(code => 
            [{ codice: code, prezzo: (code === 'T1' ? 15 : code === 'T2' ? 20 : 25), tipo: 'Giornaliera' },
             { codice: code, prezzo: (code === 'T1' ? 12 : code === 'T2' ? 17 : 22), tipo: 'Abbonamento' }]
                .map(t => ({ ...t, dataInizio: new Date('2024-01-01'), dataFine: new Date('2024-12-31') }))
        );
        
        const result = await db.collection('tariffa').insertMany(tariffeTest);
        res.json({ message: 'Test tariffe created', inserted: result.insertedCount, tariffe: tariffeTest });
    } catch (error) {
        handleError(res, error, 'Failed to create test tariffe');
    }
});

app.get('/api/debug/database-status', async (req, res) => {
    try {
        const collections = await db.listCollections().toArray();
        const counts = {};
        await Promise.all(['tariffa', 'ombrellone', 'cliente'].map(async (name) => {
            counts[name] = await db.collection(name).countDocuments();
        }));
        
        res.json({
            collections: collections.map(c => c.name),
            counts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleError(res, error, 'Failed to check database status');
    }
});

// Delete ombrelloneVenduto by contract
app.delete('/api/ombrelloneVenduto', async (req, res) => {
    try {
        const { contratto } = req.query;
        console.log('Ricevuta richiesta eliminazione ombrelloni per contratto:', contratto);
        
        if (!contratto) {
            return res.status(400).json({ error: 'Contract number is required' });
        }

        // Converti il contratto in numero per essere sicuri
        const contractNumber = parseInt(contratto);
        if (isNaN(contractNumber)) {
            return res.status(400).json({ error: 'Contract number must be a valid number' });
        }

        console.log('Eliminando ombrelloni venduti per contratto numero:', contractNumber);
        
        // Prima verifica quanti record ci sono
        const count = await db.collection('ombrelloneVenduto').countDocuments({ contratto: contractNumber });
        console.log('Trovati', count, 'ombrelloni venduti da eliminare');
        
        // Elimina tutti i record con questo numero di contratto
        const result = await db.collection('ombrelloneVenduto').deleteMany({ contratto: contractNumber });
        
        console.log('Risultato eliminazione:', result);
        
        res.json({ 
            deletedCount: result.deletedCount, 
            message: `Deleted ${result.deletedCount} records for contract ${contractNumber}` 
        });
    } catch (error) {
        console.error('Errore eliminazione ombrelloneVenduto:', error);
        handleError(res, error, 'Failed to delete ombrelloneVenduto');
    }
});

// Fallback route
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
    }
});

// Server startup and graceful shutdown
connectToMongoDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`API: http://localhost:${port}/api | Database: MongoDB Atlas`);
    });
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (client) await client.close();
    process.exit(0);
});