const express = require('express');
const mongodb = require('mongodb');
const axios = require('axios');
const xml2js = require('xml2js').parseString;

const app = express();

const PORT = process.env.PORT || 3000;

/*
xml2js(xml, (err, result) => {
  console.log(result);
})
*/

app.get('/noticias', (req, res) => {

  xml2js(xml, (err, result) => {
    console.log(result);
})
  
});

app.get('/noticias/:id', (req, res) => {
  res.send(`Working Server on port ${PORT}.`);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
