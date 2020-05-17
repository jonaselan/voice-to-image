const axios = require('axios').default;
const request = require('request')
const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser');
const app = express() // Create Express app
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

async function fetchSongId() {
  axios.get(process.env.GENIUS_API_URL + '/songs/378195', {
    headers: { 'Authorization': `Bearer ${process.env.GENIUS_TOKEN}` }
  }).then(function (response) {
    console.log(response.data);
  }).catch(function (error) {
    console.log(error);
  })
}

app.post('/generate', async function(req, res){
  // TODO: remove useless words
  // TODO: remove [words]
  // TODO: remove numbers
  // TODO: ignore '.', ','
  // TODO: split in multiple files

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

app.get('/', function (req, res) {
  res.render('index.ejs');
});

app.listen(3000, () => console.log('Server running on port 3000!'))
