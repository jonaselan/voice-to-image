require('dotenv').config()
const fs = require('fs');
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

const MAX_LYRIC_LENGTH = 50
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
  return finalLyric.split(' ')
}

async function fetchImagesBasedOnLyrics(lyric) {
  const lyricLength = lyric.length
  if (lyricLength > MAX_LYRIC_LENGTH) {
    throw Error(`Max length for lyric is ${MAX_LYRIC_LENGTH}. This song have ${lyricLength} formatted`)
  }
  const result = new Array()

  try {
    for (let i = 0; i < lyricLength; i++) {
      const word = lyric[i]

      const response = await customSearch.cse.list({
        cx: SEARCH_ENGINE_ID,
        q: word,
        auth: GOOGLE_API_KEY,
        searchType: 'image',
        num: 5
      })

      // TODO: lidar melhor quando não for retornado nenhuma imagem, talvez criar uma imagem vazia
      if (response.data.items) {
        const item = pickRandomImage(response.data.items)
        result.push({ title: `${i}-${word}.png`, url: item.link })
      }
    }
  }
  catch (error) {
    console.log(chalk.red(`Error trying to fetch images: ${error}`))
  }

  return result
}

function pickRandomImage(links) {
  return links[Math.floor(Math.random() * links.length)];
}

async function downloadAndSave(folder, images) {
  const dir = `./content/${folder}`;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  try {
    images.forEach(async img => {
      await imageDownloader.image({ url: img.url, dest: `${dir}/${img.title}` })
    })

    return true
  }
  catch (error) {
    console.log(chalk.red(`Error trying to download or save images: ${error}`))
  }
}

app.get('/generate/:song_id', async function(req, res){
  const { song_id } = req.params
  var errors = []
  try {
    const rawLyric = await fetchLyric(song_id)
    const formattedlyric = formatLyric(rawLyric)
    const images = await fetchImagesBasedOnLyrics(formattedlyric)
    await downloadAndSave(song_id, images)
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
