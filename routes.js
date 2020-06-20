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
  const histories = history.load()
  res.render('index.ejs', { histories });
});

routes.get('/generate/:song_id', async function(req, res){
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

routes.post('/search', async function (req, res) {
  const { term } = req.body
  const search_items = await searchInGenius(term)

  res.render('index.ejs', { search_items })
});

module.exports = routes;