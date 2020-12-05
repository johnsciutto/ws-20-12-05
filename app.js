const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const xml2js = require('xml2js').parseString;
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const app = express();
app.use(cookieParser())

const { DB_URL, JWT_SECRET } = process.env;

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
  //const client = new MongoClient(DB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
  //await client.connect();
  
  const client = await MongoClient.connect( DB_URL, { useUnifiedTopology : true } ) 

  const database = await client.db('Catalogo');
  const collection = await database.collection('noticias');
  const resultado = await collection.find({}).toArray();
  await client.close()
  return resultado;
}

const buscarNoticiaPorId = async (id) => {
  const client = new MongoClient(DB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
  await client.connect();
  const database = await client.db('Catalogo');
  const collection = await database.collection('noticias');
  const resultado = await collection.find({ "_id": ObjectId(id) }).toArray();
  await client.close()
  return resultado;
}

const cors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  next()
}

app.use(cors)

const validarToken = (req, res, next) => {

  const { token } = req.query 

  jwt.verify(token, JWT_SECRET, (error, data) => {

      if( error ){
          res.end("ERROR: Token expirado o inválido")
      } else {
          next()
      }

  })

  //console.log(req.cookies)

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
        source: link[0],
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

app.get('/noticias', validarToken, async (req, res) => {
  const datos = await buscarNoticiasEnDB();
  res.json(datos)
});

app.get('/noticias/:id', validarToken, async (req, res) => {
  const resutado = await buscarNoticiaPorId(req.params.id);
  res.json(resutado);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

app.get('/auth', (req, res) => {
  const token = jwt.sign({ 'user' : 'silvioEANT', 'email' : 'silvio@eant.com', expiresIn : 60 * 60 }, JWT_SECRET)

  return res.json(token)

})