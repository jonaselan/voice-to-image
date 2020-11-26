const fs = require('fs')
const imageDownloader = require('image-downloader')
const chalk = require('chalk');
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const gm = require('gm').subClass({ imageMagick: true })
const path = require('path')
const rootPath = path.resolve(__dirname, '..')

const fromRoot = relPath => path.resolve(rootPath, relPath)
const MAX_LYRIC_LENGTH = 135
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
        const title = `${i}-${word}.png`
        console.log(title);

        result.push({ title, url: item.link })
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
      const dest = `${dir}/${img.title}`
      await imageDownloader.image({ url: img.url, dest })
      await convertImage(dest)
    })

    return true
  }
  catch (error) {
    console.log(chalk.red(`Error trying to download or save images: ${error}`))
  }
}

async function convertImage(title) {
  return new Promise((resolve, reject) => {
    const inputFile = fromRoot(`./${title}[0]`)
    const outputFile = fromRoot(`./${title}-converted.png`)
    const width = 1920
    const height = 1080

    gm()
      .in(inputFile)
      .out('(')
        .out('-clone')
        .out('0')
        .out('-background', 'white')
        .out('-blur', '0x9')
        .out('-resize', `${width}x${height}^`)
      .out(')')
      .out('(')
        .out('-clone')
        .out('0')
        .out('-background', 'white')
        .out('-resize', `${width}x${height}`)
      .out(')')
      .out('-delete', '0')
      .out('-gravity', 'center')
      .out('-compose', 'over')
      .out('-composite')
      .out('-extent', `${width}x${height}`)
      .write(outputFile, (error) => {
        if (error) {
          return reject(error)
        }

        resolve()
      })
  })
}

function pickRandomImage(links) {
  return links[Math.floor(Math.random() * links.length)];
}

module.exports = {
  fetchImagesBasedOnLyrics,
  downloadAndSave,
  convertImage,
}