const cheerio = require('cheerio')
const chalk = require('chalk')
const USELESS_WORDS = [
  'fuck', 'can not', 'can\'t', 'don\'t', 'do not', 'wasn\'t', 'was not', 'it\'s', 'it is', 'i\'m', '[chorus]',
  'fucking', 'in', 'are', 'be', 'of', 'is', 'so', 'to', 'he\'s', 'the', 'a', 'an', 'and', 'or', '.', ','
]
const {
  GENIUS_API_URL,
  GENIUS_TOKEN,
} = process.env

const axios = require('axios').default;
const axios_genius = axios.create({
  baseURL: GENIUS_API_URL,
  headers: { 'Authorization': `Bearer ${GENIUS_TOKEN}` }
});

async function searchInGenius(term) {
  return axios_genius.get(`/search?q=${term.trim()}`).then(function (response) {
    if (response.data.meta.status == 200) {
      return response.data.response.hits;
    }
  }).catch(function (error) {
    console.log(chalk.red(error))
  })
}

async function fetchLyric(song_id) {
  console.log(chalk.blue(`Fetch lyric ${song_id}: start...`))

  const songRawWebPage = getSongWebPage(song_id)
  return Promise.resolve(songRawWebPage).then(rawBody => {
    let $ = cheerio.load(rawBody, { normalizeWhitespace: true, decodeEntities: false });
    let lyric = ''

    $('.lyrics').each(function() {
      let link = $(this);
      lyric = link.text();
    });

    console.log(lyric)
    console.log(chalk.blue(`Fetch lyric ${song_id}: finished\n`))

    return lyric;

  }).catch(error => {
    console.log(chalk.red(error))
  });
}

async function getSongWebPage(song_id) {
  return axios.get(`https://genius.com/songs/${song_id}`).then(function (response) {
    return response.data;
  }).catch(function (error) {
    console.log(chalk.red(error))
  })
}

function formatLyric(rawLyric) {
  console.log(chalk.blue('Format lyrics: start...'))
  let finalLyric = rawLyric
  finalLyric = finalLyric.replace(/(\r\n|\n|\r)/gm, " ") // remove breaklines
  finalLyric = finalLyric.trim().toLowerCase() // remove spaces
  finalLyric = finalLyric.replace(/ *\[[^\]]*]/, '') // remove words between brackets

  USELESS_WORDS.forEach(word => {
    finalLyric = finalLyric.replace(word, '')
  })

  console.log(chalk.blue('Format lyrics: finished \n'))

  return finalLyric
}

function lyricToArray(lyric) {
  return lyric
    .split(' ')
    .filter(function (word) {
      return word != '';
    })
}

module.exports = {
  searchInGenius,
  fetchLyric,
  formatLyric,
  lyricToArray
}