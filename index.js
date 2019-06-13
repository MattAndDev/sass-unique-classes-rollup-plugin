const { name } = require('./package.json')
const { join, dirname } = require('path')
const { existsSync } = require('fs')
const crypto = require('crypto')

const {
  createUniqueClassNames,
  compileSassSync,
  prefixAndMinify
} = require('./utils')

const defaultIdGenerator = (classname) => {
  return crypto.randomBytes(7).toString('hex')
}

module.exports = function sassUniqueClasses ({ generateUniqueName = false } = {}) {
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
        const uniqueFn = generateUniqueName || defaultIdGenerator
        const { map, raw } = await createUniqueClassNames(compiled, uniqueFn)
        const pref = await prefixAndMinify(raw)
        return 'export default {\nraw: ' + JSON.stringify(pref) + ',\nmap:' + JSON.stringify(map) + '}'
      }
    }
  }
}
