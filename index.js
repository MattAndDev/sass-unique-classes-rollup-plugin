const { name } = require('./package.json')
const { join, dirname } = require('path')
const { existsSync } = require('fs')

const {
  createUniqueClassNames,
  compileSassSync,
  prefixAndMinify
} = require('./utils')

module.exports = function myExample () {
  return {
    name,
    async resolveId (source, importer) {
      if (source.match(/.*\.scss/)) {
        const local = join(dirname(importer), source)
        if (await existsSync(local)) {
          return local
        }
        const dependency = join(process.cwd(), './node_modules', source)
        if (await existsSync(dependency)) {
          return dependency
        }
      }
      return null
    },
    // most things happen here
    async transform (code, id) {
      // if matches scss:
      if (id.match(/.*\.scss/)) {
        const compiled = await compileSassSync(code, id)
        const { map, raw } = await createUniqueClassNames(compiled)
        const pref = await prefixAndMinify(raw)
        return 'export default {\nraw: ' + JSON.stringify(pref) + ',\nmap:' + JSON.stringify(map) + '}'
      }
    }
  }
}
