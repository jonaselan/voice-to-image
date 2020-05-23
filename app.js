const request = require('request')
const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser');
require('dotenv').config()
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

const axios = require('axios').default;
const axios_genius = axios.create({
  baseURL: process.env.GENIUS_API_URL,
  headers: { 'Authorization': `Bearer ${process.env.GENIUS_TOKEN}` }
});

async function search(term) {
  return axios_genius.get(`/search?q=${term.trim()}`).then(function (response) {
    if (response.data.meta.status == 200) {
      return response.data.response.hits;
    }
  }).catch(function (error) {
    console.log(error);
  })
}

async function getSongWebPage(song_id) {
  return axios.get(`https://genius.com/songs/${song_id}`).then(function (response) {
    return response.data;
  }).catch(function (error) {
    console.log(error);
  })
}

async function fetchLyric(song_id) {
  return Promise.resolve(getSongWebPage(song_id)).then(rawBody => {
    var $ = cheerio.load(rawBody, { normalizeWhitespace: true });
    var lyric = ''

    $(".lyrics").each(function() {
      var link = $(this);
      lyric = link.text();
    });

    return lyric

  }).catch(err => {
    console.log(err)
  });
}

app.get('/generate/:song_id', async function(req, res){
  // TODO: remove useless words
  // TODO: remove [words]
  // TODO: remove numbers
  // TODO: ignore '.', ','

  const { song_id } = req.params
  const lyric = await fetchLyric(song_id)

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
