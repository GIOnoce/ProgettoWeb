const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs if needed

const app = express();
const port = 3000;
const excelFilePath = './Database_SpiaggiaFacile_Aggiornato.xlsx'; // Adjust path if needed
const contractsSheetName = 'Contratti';

// Configure CORS more explicitly to ensure frontend can access the API
app.use(cors({
  origin: '*', // Allow all origins - in production, specify your domain
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Improved function to ensure stipulatoDa is always an array
const ensureArrayBackend = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    
    // Handle comma-separated strings (which might come from form submissions or Excel)
    if (typeof value === 'string') {
      // Check if the string contains commas, which would indicate multiple values
      if (value.includes(',')) {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [value];
    }
    
    return [String(value)]; // Convert any other type to string and wrap in array
};

// Helper function to read a sheet from Excel
const readExcelSheet = (sheetName) => {
    try {
        const workbook = XLSX.readFile(excelFilePath);
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.error(`Sheet "${sheetName}" not found in Excel file`);
            return [];
        }
        
        const data = XLSX.utils.sheet_to_json(sheet);
        
        // Special processing for contracts to ensure stipulatoDa is always an array
        if (sheetName === contractsSheetName) {
            return data.map(contract => ({
                ...contract,
                stipulatoDa: ensureArrayBackend(contract.stipulatoDa)
            }));
        }
        
        return data;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return [];
    }
};

// Helper function to write data to a sheet in Excel with special handling for arrays
const writeExcelSheet = (sheetName, data) => {
    try {
        const workbook = XLSX.readFile(excelFilePath);
        
        // Special processing for contracts to handle the stipulatoDa array
        let processedData = data;
        if (sheetName === contractsSheetName) {
            processedData = data.map(contract => {
                const clientCodes = ensureArrayBackend(contract.stipulatoDa);
                // Convert the array to a comma-separated string for Excel storage
                return {
                    ...contract,
                    stipulatoDa: clientCodes.join(',')
                };
            });
        }
        
        const newWorksheet = XLSX.utils.json_to_sheet(processedData);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, excelFilePath);
        return true;
    } catch (error) {
        console.error('Error writing to Excel file:', error);
        return false;
    }
};

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server running' });
});

// GET endpoint to serve all data
app.get('/api/data', (req, res) => {
    try {
        const data = {
            ombrelloni: readExcelSheet('Ombrelloni'),
            tipologie: readExcelSheet('Tipologie'),
            tariffe: readExcelSheet('Tariffa'),
            contratti: readExcelSheet(contractsSheetName),
            clienti: readExcelSheet('Cliente'),
            ombrelloneVenduto: readExcelSheet('OmbrelloneVenduto'),
            giornoDisponibilita: readExcelSheet('GiornoDisponibilita')
        };
        res.json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// GET endpoint for contracts
app.get('/api/Contratti', (req, res) => {
    try {
        const contracts = readExcelSheet(contractsSheetName);
        res.json(contracts);
    } catch (error) {
        console.error('Error retrieving contracts:', error);
        res.status(500).json({ error: 'Failed to retrieve contracts' });
    }
});

// POST endpoint to add a new contract
app.post('/api/Contratti', (req, res) => {
    try {
        console.log('Received contract data:', req.body);
        
        // Process the stipulatoDa array consistently
        const stipulatoDaArray = ensureArrayBackend(req.body.stipulatoDa);
        console.log('Processed stipulatoDa:', stipulatoDaArray);
        
        const newContract = {
            numProgr: req.body.numProgr || uuidv4(), // Use provided ID or generate one
            data: req.body.data,
            importo: parseFloat(req.body.importo),
            stipulatoDa: stipulatoDaArray
        };

        console.log('Processed contract data to save:', newContract);

        const existingContracts = readExcelSheet(contractsSheetName);
        existingContracts.push(newContract);

        if (writeExcelSheet(contractsSheetName, existingContracts)) {
            // When sending the response, keep stipulatoDa as an array
            res.status(201).json({
                ...newContract,
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
app.post('/api/Clienti', (req, res) => {
    try {
        console.log('Received client data:', req.body);
        
        const newClient = {
            codice: req.body.codice || `CLI${uuidv4().substring(0, 8)}`,
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email || ''
        };

        console.log('Processed client data to save:', newClient);

        const existingClients = readExcelSheet('Cliente');
        existingClients.push(newClient);

        if (writeExcelSheet('Cliente', existingClients)) {
            res.status(201).json(newClient);
        } else {
            res.status(500).json({ error: 'Failed to add new client.' });
        }
    } catch (error) {
        console.error('Error adding client:', error);
        res.status(500).json({ error: 'Failed to add client: ' + error.message });
    }
});

// PUT endpoint to update an existing contract
app.put('/api/Contratti/:numProgr', (req, res) => {
    try {
        const numProgrToUpdate = req.params.numProgr;
        console.log(`Updating contract ${numProgrToUpdate}:`, req.body);
        
        // Process the stipulatoDa array consistently
        const stipulatoDaArray = ensureArrayBackend(req.body.stipulatoDa);
        console.log('Processed stipulatoDa for update:', stipulatoDaArray);
        
        // Extract and validate the contract data
        const updatedContractData = {
            numProgr: numProgrToUpdate, // Keep the original ID
            data: req.body.data,
            importo: parseFloat(req.body.importo),
            stipulatoDa: stipulatoDaArray
        };

        console.log("Prepared contract data for update:", updatedContractData);
        
        const existingContracts = readExcelSheet(contractsSheetName);
        const contractIndex = existingContracts.findIndex(c => c.numProgr == numProgrToUpdate);

        if (contractIndex !== -1) {
            // Replace the entire contract object
            existingContracts[contractIndex] = updatedContractData;
            
            console.log(`Updated contract at index ${contractIndex}:`, existingContracts[contractIndex]);
            
            if (writeExcelSheet(contractsSheetName, existingContracts)) {
                console.log("Contract updated successfully in Excel file");
                // When sending the response, keep stipulatoDa as an array
                res.json({
                    ...updatedContractData,
                    stipulatoDa: stipulatoDaArray
                });
            } else {
                console.error("Failed to write updated contracts to Excel file");
                res.status(500).json({ error: 'Failed to update contract.' });
            }
        } else {
            console.error(`Contract with ID ${numProgrToUpdate} not found`);
            res.status(404).json({ error: `Contract with ID ${numProgrToUpdate} not found.` });
        }
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Failed to update contract: ' + error.message });
    }
});

// DELETE endpoint to delete a contract
app.delete('/api/Contratti/:numProgr', (req, res) => {
    try {
        const numProgrToDelete = req.params.numProgr;
        console.log(`Deleting contract ${numProgrToDelete}`);
        
        const existingContracts = readExcelSheet(contractsSheetName);
        const updatedContracts = existingContracts.filter(c => c.numProgr != numProgrToDelete);

        if (updatedContracts.length < existingContracts.length) {
            if (writeExcelSheet(contractsSheetName, updatedContracts)) {
                res.status(204).send();
            } else {
                res.status(500).json({ error: 'Failed to delete contract.' });
            }
        } else {
            res.status(404).json({ error: `Contract with ID ${numProgrToDelete} not found.` });
        }
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract: ' + error.message });
    }
});

// GET endpoint for Ombrelloni with filtering
app.get('/api/Ombrelloni', (req, res) => {
    try {
        const ombrelloni = readExcelSheet('Ombrelloni');
        
        // Implement filtering based on req.query parameters
        let filteredOmbrelloni = ombrelloni;
        
        if (req.query.settore) {
            filteredOmbrelloni = filteredOmbrelloni.filter(o => o.settore === req.query.settore);
        }
        
        if (req.query.fila) {
            filteredOmbrelloni = filteredOmbrelloni.filter(o => o.fila == req.query.fila);
        }
        
        if (req.query.tipologia) {
            filteredOmbrelloni = filteredOmbrelloni.filter(o => o.tipologia === req.query.tipologia);
        }
        
        res.json(filteredOmbrelloni);
    } catch (error) {
        console.error('Error retrieving ombrelloni:', error);
        res.status(500).json({ error: 'Failed to retrieve ombrelloni' });
    }
});

// GET endpoint for clients
app.get('/api/Clienti', (req, res) => {
    try {
        const clients = readExcelSheet('Cliente');
        res.json(clients);
    } catch (error) {
        console.error('Error retrieving clients:', error);
        res.status(500).json({ error: 'Failed to retrieve clients' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`API base URL: http://localhost:${port}/api`);
    console.log(`To check if server is running, visit: http://localhost:${port}/`);
});