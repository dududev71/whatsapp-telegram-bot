// tdl-loader.cjs
async function load() {
  const tdl = await import('tdl')
  const { getTdjson } = await import('prebuilt-tdlib')
  return {
    configure: tdl.configure,
    createClient: tdl.createClient,
    getTdjson
  }
}

module.exports = { load }
