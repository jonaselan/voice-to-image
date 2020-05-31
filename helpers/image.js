const fs = require('fs')
const imageDownloader = require('image-downloader')
const chalk = require('chalk');
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const MAX_LYRIC_LENGTH = 50
const {
  GOOGLE_API_KEY,
  SEARCH_ENGINE_ID
} = process.env

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

function pickRandomImage(links) {
  return links[Math.floor(Math.random() * links.length)];
}

module.exports = {
  fetchImagesBasedOnLyrics,
  downloadAndSave,
}