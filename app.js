const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const xml2js = require('xml2js').parseString;

const app = express();
const { DB_URL } = process.env;

const PORT = process.env.PORT || 3000;

/*
xml2js(xml, (err, result) => {
  console.log(result);
})
*/

const subirNoticiasADB = async (arrDeNoticias) => {
  const client = new MongoClient(DB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
  await client.connect();
  const database = await client.db('Catalogo');
  const collection = await database.collection('noticias');
  await collection.deleteMany({});
  const resultado = await collection.insertMany(arrDeNoticias);
  await client.close();
  return resultado;
}

const buscarNoticiasEnDB = async () => {
  const client = new MongoClient(DB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
  await client.connect();
  const database = await client.db('Catalogo');
  const collection = await database.collection('noticias');
  const resultado = await collection.find({}).toArray();
  await client.close()
  return resultado;
}

app.get('/actualizar', async (req, res) => {
  const { data } = await axios.get('https://www.telam.com.ar/rss2/ultimasnoticias.xml');

  xml2js(data, async (err, resultado) => {
    if (err) throw new Error(err);
    const noticias = resultado.rss.channel[0].item;

    const arrayDeNoticias = noticias.map(noticia => {
      const { title, link, description, pubDate: date, enclosure } = noticia
      const image = enclosure ? enclosure[0].$.url : '';
      const noticiaLimpia = {
        title: title[0],
        link: link[0],
        description: description[0],
        date: date[0],
        image,
      };
      return noticiaLimpia;
    });
    
    const dbResultado = await subirNoticiasADB(arrayDeNoticias);

    res.send(`Datos agregados correctamente: ${dbResultado.result.n}`)
  });
  
});

app.get('/noticias', async (req, res) => {

  const datos = await buscarNoticiasEnDB();

  res.json(datos)
})

app.get('/noticias/:id', (req, res) => {
  res.send(`Working Server on port ${PORT}.`);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
