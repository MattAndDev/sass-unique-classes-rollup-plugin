const { name } = require('./package.json')
const { join, dirname, resolve } = require('path')
const { existsSync } = require('fs')
const { renderSync } = require('node-sass')
const csstree = require('css-tree')


const addExtname = (path) => path.match('.s(a|c)ss$') ? path : `${path}.scss`

module.exports = function myExample () {
  return {
    name,
    async resolveId (source, importer) {
      if (source.match(/.*\.scss/)) {
        // try to resolve from local
        const local = join(dirname(importer), source)
        if (await existsSync(local)) {
          return local
        }
        // try as dependency
        const dependency = join(process.cwd(), './node_modules', source)
        if (await existsSync(dependency)) {
          return dependency
        }
        // let it fall trough
      }
      return null
    },
    // most things happen here
    async transform (code, id) {
      // if matches scss:
      if (id.match(/.*\.scss/)) {
        // compiles sass sync
        // the importer is used to try and guess better what to include
        // might be still buggy
        const compiled = await renderSync({
          data: code,
          importer: function (url, prev, done) {
            let resolved = ''
            if (url.match(/^~.*/)) {
              resolved = join(process.cwd(), url.replace(/~/, './node_modules/'))
              resolved = addExtname(resolved)
              if (existsSync(resolved)) return {file: resolved}
            }
            if (prev === 'stdin') {
              resolved = addExtname(join(dirname(id), url))
              if (existsSync(resolved)) return {file: resolved}
              resolved = addExtname(join(dirname(id), '_' + url))
              if (existsSync(resolved)) return {file: resolved}
            }
          }
        })
        // get css
        const css = compiled.css.toString()
        // p.o.c. generate unique id
        const ast = csstree.parse(css)
        const map = {}
        // simple walk and replace
        csstree.walk(ast, function (node) {
          if (node.type === 'ClassSelector') {
            // do replace
            const id = Math.random().toString(36).substring(7)
            const name = node.name
            if (map[name]) {
              node.name = id
            }
            if (!map[name]) {
              map[node.name] = id
              node.name = id
            }
          }
        })
        // ugly but fastest way to escape quotes
        return 'export default {\nraw: `' + csstree.generate(ast) + '`,\nmap:' + JSON.stringify(map) + '}'
      }
    }
  }
}
