const fs = require('fs')
const imageDownloader = require('image-downloader')
const chalk = require('chalk');
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const gm = require('gm').subClass({ imageMagick: true })
const path = require('path')
const rootPath = path.resolve(__dirname, '..')
const fromRoot = relPath => path.resolve(rootPath, relPath)
const {
  GOOGLE_API_KEY,
  SEARCH_ENGINE_ID
} = process.env
const MAX_LYRIC_LENGTH = 200
const MAX_IMAGE_RESULTS = 5

async function fetchImagesBasedOnLyrics(lyric) {
  const lyricLength = lyric.length
  if (lyricLength > MAX_LYRIC_LENGTH) {
    throw Error(`Max length for lyric is ${MAX_LYRIC_LENGTH}. This song have ${lyricLength} formatted`)
  }
  const result = new Array()

  try {
    console.log(chalk.blue(`Fetch images: start...`))

    for (let i = 0; i < lyricLength; i++) {
      const word = lyric[i]

      console.log(`>> term: ${word}`)

      const response = await searchImages(word)

      if (response.data.items) {
        const item = pickRandomImage(response.data.items)
        const title = `${i}-${word}.png`

        console.log(`>> ${title}: ${item.link}`)

        result.push({ title, url: item.link })
      }
    }

    console.log(chalk.blue(`Fetch images: finished \n`))
  }
  catch (error) {
    console.log(chalk.red(`Error trying to fetch images: ${error}`))
  }

  return result
}

async function downloadAndSave(folder, images) {
  if (images.length === 0) {
    console.log(chalk.blue(`Nothing to download...`))
    return
  }

  console.log(chalk.blue(`Download images: start...`))

  const dir = `./content/${folder}`;
  if (!fs.existsSync(dir)){
    console.log(`Create folder ${dir}`)
    fs.mkdirSync(dir);
  }

  try {
    images.forEach(async img => {
      console.log(`Download ${img.url} to ${dir}`)

      const dest = `${dir}/${img.title}`
      await imageDownloader
        .image({ url: img.url, dest })
        .then(async result => {
          await convertImages(dest)
        })
    })

    console.log(chalk.blue(`Download images: finished \n`))

    return true
  }
  catch (error) {
    console.log(chalk.red(`Error trying to download or save images: ${error}`))
  }
}

async function convertImages(title) {
  return new Promise((resolve, reject) => {
    const inputFile = fromRoot(`./${title}[0]`)
    const outputFile = fromRoot(`./${title}-converted.png`)
    const width = 1280
    const height = 720

    console.log(`Convert image ${title}: start`)

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
          console.log(chalk.red(`Convert image ${title}: error`))
          return reject(error)
        }

        console.log(`Convert image ${title}: finish`)

        resolve()
      })
  })
}

async function searchImages(word) {
  return customSearch.cse.list({
    cx: SEARCH_ENGINE_ID,
    q: word,
    auth: GOOGLE_API_KEY,
    searchType: 'image',
    num: MAX_IMAGE_RESULTS,
    imgSize: 'medium'
  })
}

function pickRandomImage(links) {
  return links[Math.floor(Math.random() * links.length)];
}

module.exports = {
  fetchImagesBasedOnLyrics,
  downloadAndSave
}