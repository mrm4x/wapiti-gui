# Wapiti-GUI

**Wapiti-GUI** è un'interfaccia web moderna per gestire sessioni di scansione di vulnerabilità con [Wapiti](https://github.com/wapiti-scanner/wapiti), uno scanner open source per applicazioni web.

## ✨ Funzionalità

- Creazione e gestione di sessioni di scansione
- Personalizzazione dei parametri Wapiti
- Visualizzazione dello stato della scansione in tempo reale
- Download di log ed esiti JSON
- Supporto per note e descrizioni per ogni sessione
- Interfaccia responsive in Angular

## 🛠️ Requisiti

- Node.js >= 16.x
- MongoDB >= 4.x
- Angular CLI (per sviluppo frontend)
- Wapiti installato nel sistema (per eseguire le scansioni)

## 🚀 Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/<user>/wapiti-gui.git
   cd wapiti-gui
   ```

2. Installa le dipendenze backend:
   ```bash
   cd server
   npm install
   ```

3. Installa le dipendenze frontend:
   ```bash
   cd ../gui/wapiti-gui
   npm install
   ```

4. Avvia MongoDB e il backend:
   ```bash
   docker run -d \
   --name mongo-rs \
   -p 27017:27017 \
   -e MONGO_INITDB_DATABASE=wapiti-gui \
   mongo:6 \
   --replSet rs0

   docker exec -it mongo-rs mongosh -u admin -p adminpass
   rs.initiate()
   rs.status()
   ```

5. Avvia il frontend Angular:
   ```bash
   cd ../gui/wapiti-gui
   npm run start
   ```

6. Avvia il frontend Angular:
   ```bash
   cd ../server
   npm run dev
   ```

7. Visita [http://localhost:4200](http://localhost:4200)

## ⚙️ Variabili d’ambiente

Crea un file `.env` nella cartella `server/` con le seguenti variabili:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/wapiti-gui?replicaSet=rs0
JWT_SECRET=una-chiave-segreta
```

## 📄 Licenza

Distribuito sotto licenza **GPLv3** – vedi il file [LICENSE](./LICENSE) per i dettagli.

---

> Realizzato con ♥ da Massimiliano Tommasi
