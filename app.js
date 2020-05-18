const request = require('request')
const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser');
require('dotenv').config()
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

const axios_default = require('axios').default;
const axios = axios_default.create({
  baseURL: process.env.GENIUS_API_URL,
  headers: { 'Authorization': `Bearer ${process.env.GENIUS_TOKEN}` }
});

// TODO: split in multiple files: api, pages, routes

async function fetchLyric(song_id) {
  request({ uri: `https://genius.com/songs/${song_id}`, }, function(error, response, body) {
    var $ = cheerio.load(body);
    var text

    $(".lyrics").each(function() {
      var link = $(this);
      text = link.text();

      // console.log(text);
    });

    return text
  });
}

async function search(term) {
  return axios.get(`/search?q=${term}`).then(function (response) {
    if (response.data.meta.status == 200) {
      return response.data.response.hits;
    }
  }).catch(function (error) {
    console.log(error);
  })
}

app.get('/generate/:song_id', async function(req, res){
  // TODO: remove useless words
  // TODO: remove [words]
  // TODO: remove numbers
  // TODO: ignore '.', ','

  const { song_id } = req.params
  const lyric = fetchLyric(song_id)
  console.log(lyric);

  // TODO: retornar para a tela atual
  // res.render('index.ejs')
});

app.post('/search', async function(req, res) {
  const { term } = req.body
  const search_items = await search(term)

  res.render('index.ejs', { search_items })
});

app.get('/', function (req, res) {
  res.render('index.ejs');
});

app.listen(3000, () => console.log('Server running on port 3000!'))
