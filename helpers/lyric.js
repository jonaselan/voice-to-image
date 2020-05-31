const cheerio = require('cheerio')
const chalk = require('chalk')
const USELESS_WORDS = [
  'can not', 'can\'t', 'don\'t', 'do not', 'wasn\'t', 'was not', 'it\'s',
  'in', 'are', 'be', 'of', 'is', 'so', 'to', 'the', 'a', 'an', 'and', 'or', '.', ','
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

async function getSongWebPage(song_id) {
  return axios.get(`https://genius.com/songs/${song_id}`).then(function (response) {
    return response.data;
  }).catch(function (error) {
    console.log(chalk.red(error))
  })
}

module.exports = {
  searchInGenius,
  fetchLyric,
  formatLyric,
}