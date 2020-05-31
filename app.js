require('dotenv').config()
const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser')
const chalk = require('chalk');
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const imageDownloader = require('image-downloader')
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

const {
  GENIUS_API_URL,
  GENIUS_TOKEN,
  GOOGLE_API_KEY,
  SEARCH_ENGINE_ID
} = process.env
const USELESS_WORDS = [
  'can not', 'can\'t', 'don\'t', 'do not', 'wasn\'t', 'was not', 'it\'s',
  'in', 'are', 'be', 'of', 'is', 'so', 'to', 'the', 'a', 'an', 'and', 'or', '.', ','
]

const axios = require('axios').default;
const axios_genius = axios.create({
  baseURL: GENIUS_API_URL,
  headers: { 'Authorization': `Bearer ${GENIUS_TOKEN}` }
});

async function search(term) {
  return axios_genius.get(`/search?q=${term.trim()}`).then(function (response) {
    if (response.data.meta.status == 200) {
      return response.data.response.hits;
    }
  }).catch(function (error) {
    console.log(chalk.red(error))
  })
}

async function getSongWebPage(song_id) {
  return axios.get(`https://genius.com/songs/${song_id}`).then(function (response) {
    return response.data;
  }).catch(function (error) {
    console.log(chalk.red(error))
  })
}

async function fetchLyric(song_id) {
  return Promise.resolve(getSongWebPage(song_id)).then(rawBody => {
    var $ = cheerio.load(rawBody, { normalizeWhitespace: true, decodeEntities: false });
    console.log(chalk.blue('rawBody: ' + rawBody))
    var lyric = ''

    $('.lyrics').each(function() {
      var link = $(this);
      lyric = link.text();

    console.log(chalk.blue('lyric: ' + lyric))
    });
    if (!lyric) throw Error('Couldn\'t fetch lyric for this song')

    // remove breaklines
    return lyric.replace(/(\r\n|\n|\r)/gm," ");

  }).catch(error => {
    console.log(chalk.red(error))
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

  if (!finalLyric) throw Error('Couldn\'t format lyrics for this song')
  return finalLyric
}

async function fetchImagesBasedOnLyrics(lyric) {
  const arrayWords = lyric.split(' ')

  try {
    for (let i = 0; i < arrayWords.length; i++) {
    let word = arrayWords[i]

      const response = await customSearch.cse.list({
        cx: SEARCH_ENGINE_ID,
        q: word,
        auth: GOOGLE_API_KEY,
        searchType: 'image',
        num: 1
      })

      // TODO: gerar mais resultados e pegar um randomicamente
      // TODO: lidar quando não for retornado nenhuma imagem
      await downloadAndSave(response.data.items[0].link, `${i}-${word}.png`)
    }

    return true
  }
  catch (error) {
    console.log(chalk.red(`Error trying to download or save images: ${error}`))
  }
}

async function downloadAndSave(url, fileName) {
  return imageDownloader.image({
    url: url,
    dest: `./content/${fileName}`
  })
}

app.get('/generate/:song_id', async function(req, res){
  const { song_id } = req.params
  var errors = []
  try {
    const rawLyric = await fetchLyric(song_id)
    const lyric = formatLyric(rawLyric)
    await fetchImagesBasedOnLyrics(lyric)
  }
  catch (error) {
    errors.push(error.message)
  }

  res.render('index.ejs', errors)
});

app.post('/search', async function (req, res) {
  const { term } = req.body
  const search_items = await search(term)

  res.render('index.ejs', { search_items })
});

app.get('/', async function (req, res) {
  res.render('index.ejs');
});

app.listen(3000, () => console.log('Server running on port 3000!'))

// TODO: limit size lyric
// TODO: create a folder with title song