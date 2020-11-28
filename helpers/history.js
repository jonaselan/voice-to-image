const fs = require('fs')
const historyFilePath = './history.json'

function formatContent(id) {
  const result = {}
  const key = new Date().toUTCString()
  result[key] = id

  return result
}

function save(content) {
  const historyContent = load()
  const formatedContent = formatContent(content)

  historyContent.push(formatedContent)

  fs.writeFile(historyFilePath, JSON.stringify(historyContent), { overwrite: true }, function (err) {
    console.log('Error trying to save file');
    if (err) throw err;
  });

  return true
}

function load() {
  const contentJson = fs.readFileSync(historyFilePath, 'utf-8')

  return JSON.parse(contentJson)
}

module.exports = {
  save,
  load
}