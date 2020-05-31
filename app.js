require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const chalk = require('chalk');
const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./routes'));
app.set('views', __dirname)

app.listen(3000, () => console.log(chalk.green('Server running on port 3000!')))
