require('dotenv').config()
const bodyParser = require('body-parser')
const chalk = require('chalk');
const express = require('express')
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./routes'));
app.set('views', __dirname)
app.use(express.static(__dirname + '/public'));

app.listen(3000, () => console.log(chalk.green('Server running on port 3000!')))
