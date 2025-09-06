import './style.css'
import { setupPythonEditor } from './src/app.js'

document.querySelector('#app').innerHTML = `
  <div id="python-editor-root"></div>
`

setupPythonEditor(document.querySelector('#python-editor-root'))
