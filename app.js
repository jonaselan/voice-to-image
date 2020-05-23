const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser');
require('dotenv').config()
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

const USELESS_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'don\’t', 'do not', 'wasn\’t', 'was not', 'to',
  'in', 'are', 'be', 'of', 'is', 'so' , '.', ','
]

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
    var $ = cheerio.load(rawBody, { normalizeWhitespace: true, decodeEntities: false });
    console.log('rawBody: ' + rawBody);
    var lyric = ''

    $('.lyrics').each(function() {
      var link = $(this);
      lyric = link.text();

      console.log('lyric: ' + lyric);
    });
    if (!lyric) throw Error('Não foi possivel recuperar a letra desta música.')

    // remove breaklines
    return lyric.replace(/(\r\n|\n|\r)/gm," ");

  }).catch(err => {
    console.log(err)
  });
}

function formatLyric(rawLyric) {
  // basic format
  let finalLyric = rawLyric.trim().toLowerCase();

  finalLyric = finalLyric.replace(/ *\[[^\]]*]/, '');
  // remove useless words
  USELESS_WORDS.forEach(word => {
    finalLyric = finalLyric.replace(word, '')
  })

  if (!finalLyric) throw Error('Não foi possivel formatar a letra desta música.')
  return finalLyric
}

app.get('/generate/:song_id', async function(req, res){
  const { song_id } = req.params
  var errors = []
  try {
    const rawLyric = await fetchLyric(song_id)
    const lyric = formatLyric(rawLyric)

    console.log(lyric);

    // generateImages(lyric)
  }
  catch (error) {
    errors.push(error.message)
  }

  res.render('index.ejs', errors)
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
