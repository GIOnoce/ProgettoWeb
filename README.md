# ProgettoWeb
<!--  Base di dati per la gestione del noleggio degli ombrelloni in una spiaggia attrezzata in cui si ha la necessità 
di gestire l’affitto degli ombrelloni ai clienti, in base al tipo di ombrellone e al periodo. 

Ogni ombrellone è identificato da un identificatore numerico, ed è caratterizzato dal settore della spiaggia, 
dal numero di fila e dal numero d’ordine all’interno della fila. Gli ombrelloni sono associati ad una tipologia, 
dove ogni tipologia è identificata da un codice ed è caratterizzata da un nome e dalla descrizione (testuale) 
degli accessori in dotazione agli ombrelloni di quella tipologia (per esempio, sdraio, lettino, ecc.). Per ogni 
tipologia, si ha un insieme di tariffe associate: le tariffe indicano quale prezzo applicare a seconda del periodo 
e del tipo di affitto che viene scelto dal cliente. Pertanto, una tariffa è identificata da un codice ed è 
caratterizzata dal periodo di validità della tariffa, nonché dal prezzo; inoltre, le tariffe vengono suddivise in 
giornaliere (che valgono per un affitto di un solo giorno) o in abbonamento e per queste ultime si vuole 
sapere il numero minimo di giorni per far decorrere l’abbonamento. 
Per poter affittare gli ombrelloni senza correre il rischio di affittare lo stesso ombrellone a due clienti 
contemporaneamente, occorre predisporre, per ciascun ombrellone, un insieme di giorni di disponibilità: 
ogni giorno di disponibilità è identificato univocamente dalla data rispetto all’ombrellone di riferimento 
(ovviamente, possono esserci giorni di disponibilità con la stessa data ma per ombrelloni diversi). 
Per finire, l’ufficio vendite effettua un contratto di affitto con un cliente; il contratto è identificato da un 
numero progressivo ed è caratterizzato dalla data, dall’importo complessivo e dai giorni di disponibilità degli 
ombrelloni affittati con quel contratto (ad un giorno di disponibilità può essere associato al più un contratto).  -->