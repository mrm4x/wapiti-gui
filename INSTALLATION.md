# INSTALLAZIONE - Wapiti-GUI

Guida passo passo nell’installazione di **Wapiti-GUI** usando **Docker per MongoDB**, **backend e frontend** eseguiti localmente con Node.js e Angular.

---

## Requisiti

- [Node.js >= 18](https://nodejs.org/)
- [npm >= 9](https://www.npmjs.com/)
- [Docker](https://www.docker.com/)
- [Angular CLI](https://angular.io/cli) → `npm install -g @angular/cli`

---

## 1. Clona il repository

```bash
git clone https://github.com/tuo-utente/wapiti-gui.git
cd wapiti-gui
```

---

## 2. Avvia MongoDB con Docker (Replica Set)

### Crea un file di inizializzazione:

```bash
echo "rs.initiate()" > init-rs.js
```

### Avvia MongoDB:

```bash
docker run -d \
  --name wapiti-mongo \
  -p 27017:27017 \
  -v "$(pwd)/mongo-data:/data/db" \
  -v "$(pwd)/init-rs.js:/docker-entrypoint-initdb.d/init-rs.js" \
  mongo:6 --replSet rs0
```

MongoDB sarà accessibile a: `mongodb://localhost:27017/wapiti-gui?replicaSet=rs0`

---

## 3. Configura variabili ambiente backend

Crea un file `server/.env` con:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/wapiti-gui?replicaSet=rs0
JWT_SECRET=una-chiave-segreta-sicura
```

---

## 4. Avvia il Backend (Node.js)

```bash
cd server
npm install
npm run dev
```

Il server sarà attivo su: [http://localhost:3000](http://localhost:3000)

---

## 5. Avvia il Frontend (Angular)

```bash
cd ../gui/wapiti-gui
npm install
npm run start
```

Il frontend sarà attivo su: [http://localhost:4200](http://localhost:4200)

---

## 6. Test API (facoltativo)

Puoi usare Postman o curl per testare:

### Registra utente
```http
POST http://localhost:3000/api/register
Content-Type: application/json

{
  "email": "admin@admin.admin",
  "password": "password"
}
```

### Login
```http
POST http://localhost:3000/api/login
Content-Type: application/json

{
  "email": "admin@admin.admin",
  "password": "password"
}
```

---

## Struttura del progetto

```
wapiti-gui/
├── gui/              # Frontend Angular
├── server/           # Backend Node.js
├── mongo-data/       # Volume persistente MongoDB (Docker)
├── init-rs.js        # Script di replica set
└── INSTALLATION.md   # Questo file
```

---

## Note finali

- Il backend e il frontend restano leggeri e facilmente modificabili senza rebuilding
- MongoDB viene isolato in Docker, ma resta persistente localmente
