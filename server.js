require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 8080;
const routes = require('./src/routes');

// Konfigurasi CORS untuk mengizinkan request dari aplikasi mobile
app.use(cors({
  origin: '*', // Untuk development, lebih baik spesifikasikan origin yang diizinkan di production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to GenPRD Express Root!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});