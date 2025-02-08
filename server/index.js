const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Richiesta alla route principale');
  res.send('Wapiti-GUI Backend in esecuzione');
});

app.listen(3000, () => {
  logger.info('Server avviato sulla porta 3000');
});
