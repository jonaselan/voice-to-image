const fs = require('fs')
const historyFilePath = './history.json'

function formatContent(id) {
  const result = {}
  const key = new Date().toUTCString()
  result[key] = id

  return result
}

async function save(content) {
  const jsonContent = load()
  jsonContent.push(formatContent(content))

  return fs.writeFileSync(historyFilePath, JSON.stringify(jsonContent))
}

function load() {
  // TODO: verificar problema de estar quebrando o layout
  // Criar arquivo se n existir

  const contentJson = fs.readFileSync(historyFilePath, 'utf-8')

  return JSON.parse(contentJson)
}

module.exports = {
  save,
  load
}