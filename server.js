require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const routes = require('./src/routes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);


app.get('/', (req, res) => {
  res.send('Welcome to GenPRD API!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});