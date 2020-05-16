// const axios = require('axios').default;
const request = require('request')
const cheerio = require("cheerio")
const express = require('express')
const bodyParser = require('body-parser');
const app = express() // Create Express app

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname)

// axios.get('http://www.sitepoint.com').then(function (response) {
//   // var $ = cheerio.load(response.body);
//   // console.log($);
// }).catch(function (error) {
//   // handle error
//   console.log(error);
// })

app.post('/generate', function(req, res){
  // TODO: remove useless words
  // TODO: remove [words]
  // TODO: remove numbers
  // TODO: ignore '.', ','

  const { song_id } = req.body
  request({ uri: `https://genius.com/songs/${song_id}`, }, function(error, response, body) {
    var $ = cheerio.load(body);

    $(".lyrics").each(function() {
      var link = $(this);
      var text = link.text();

      console.log(text);
    });
  });

  res.render('index.ejs')
});

app.get('/', function(req, res){
  res.render('index.ejs');
});

app.listen(3000, () => console.log('Server running on port 3000!'))
