const routes = require('express').Router();
const {
  fetchImagesBasedOnLyrics,
  downloadAndSave,
} = require('./helpers/image');
const {
  searchInGenius,
  fetchLyric,
  formatLyric,
} = require('./helpers/lyric');
const history = require('./helpers/history');

routes.get('/', async function (req, res) {
  // DEBUG
  // const song_id = 123
  // const images = [
  //   { title: 'yes.png', url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Yes_4G_Logo.png' },
  //   { title: 'no.png', url: 'https://i.ya-webdesign.com/images/no-png-5.png'},
  // ]
  // await downloadAndSave(song_id, images)

  const histories = history.load()
  res.render('index.ejs', { histories });
});

routes.post('/search', async function (req, res) {
  const { term } = req.body

  const search_items = await searchInGenius(term)
  // TODO: fix history save
  // history.save(term)

  res.render('index.ejs', { search_items })
});

routes.get('/generate/:song_id', async function (req, res) {
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

  res.render('index.ejs', { errors })
});

module.exports = routes;