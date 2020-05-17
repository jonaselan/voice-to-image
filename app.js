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

async function fetchSongId() {
  axios.get('/songs/378195').then(function (response) {
    console.log(response.data);
  }).catch(function (error) {
    console.log(error);
  })
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

app.post('/generate', async function(req, res){
  // TODO: remove useless words
  // TODO: remove [words]
  // TODO: remove numbers
  // TODO: ignore '.', ','

  const { song } = req.body
  const song_id = await fetchSongId(song)
  request({ uri: `https://genius.com/songs/${song_id}`, }, function(error, response, body) {
    var $ = cheerio.load(body);

    $(".lyrics").each(function() {
      var link = $(this);
      var text = link.text();

      console.log(text);
    });
  });

  res.render('index.ejs')
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
