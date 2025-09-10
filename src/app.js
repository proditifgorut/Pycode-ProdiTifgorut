import '../style.css'
import * as monaco from 'monaco-editor'
import { 
  Play, 
  Square, 
  Trash2, 
  Share2, 
  Plus, 
  X, 
  Save, 
  Download,
  Upload,
  Settings,
  Moon,
  Sun,
  FileText,
  Terminal,
  Code,
  Sparkles,
  Wand2,
} from 'lucide'
import { faker } from '@faker-js/faker'

// Configure Monaco Editor for WebContainer environment
// Use a simpler approach that doesn't rely on external workers
self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    // Return undefined to disable web workers and run everything in main thread
    // This is more reliable in WebContainer environments
    return undefined;
  }
};

class PythonEditor {
  constructor(container) {
    this.container = container
    this.editor = null
    this.currentFile = 'main.py'
    this.files = {
      'main.py': '# Selamat datang di PyCode Online!\n# Gunakan panel AI di sebelah kanan untuk membuat kode.\n\nprint("Halo, Dunia!")\n\n# Contoh perulangan sederhana\nfor i in range(5):\n    print(f"Iterasi ke-{i+1}")'
    }
    this.isRunning = false
    this.isDarkMode = true
    this.fontSize = 14
    this.autoSave = true
    this.executionHistory = []
    this.variables = {}
    this.executionTimeout = null
    
    this.init()
  }

  init() {
    this.createLayout()
    this.insertIcons()
    this.setupEditor()
    this.setupEventListeners()
    this.loadFromLocalStorage()
  }

  createIcon(iconName, className = 'w-4 h-4') {
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', className);
    iconSvg.setAttribute('width', '24');
    iconSvg.setAttribute('height', '24');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('stroke-width', '2');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');

    // Simple icon shapes - we'll use basic SVG paths
    const iconPaths = {
      play: 'm9 18 6-6-6-6v12z',
      square: 'M3 3h18v18H3z',
      trash: 'm3 6 18 0M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
      share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
      plus: 'M12 5v14M5 12h14',
      x: 'M18 6 6 18M6 6l12 12',
      save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z',
      download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
      upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
      settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
      moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
      sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34 4.93 4.93M19.07 19.07l-1.41-1.41',
      file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
      terminal: 'M4 17l6-6-6-6M12 19h8',
      code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
      sparkles: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3ZM5 3v4M3 5h4M6 18v4M4 20h4',
      wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5'
    };

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (iconPaths[iconName]) {
      path.setAttribute('d', iconPaths[iconName]);
      iconSvg.appendChild(path);
    }

    return iconSvg;
  }

  createLayout() {
    this.container.innerHTML = `
      <div class="h-screen flex flex-col bg-gray-900">
        <!-- Header -->
        <header class="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">Py</span>
              </div>
              <h1 class="text-xl font-bold text-white">PyCode Online</h1>
            </div>
            
            <!-- File Tabs -->
            <div class="flex items-center space-x-1" id="file-tabs">
              <!-- Tabs will be inserted here -->
            </div>
            
            <button id="add-file-btn" class="p-1 text-gray-400 hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
          
          <div class="flex items-center space-x-2">
            <!-- Control Buttons -->
            <button id="run-btn" class="btn-primary bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-all">
              <div id="run-icon"></div>
              <span id="run-text">Jalankan</span>
            </button>
            
            <button id="stop-btn" class="btn-secondary bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-all" disabled>
              <div id="stop-icon"></div>
              <span>Hentikan</span>
            </button>
            
            <button id="clear-btn" class="btn-secondary bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all">
              <div id="clear-icon"></div>
            </button>
            
            <button id="share-btn" class="btn-secondary bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-all">
              <div id="share-icon"></div>
            </button>
            
            <button id="settings-btn" class="btn-secondary bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all">
              <div id="settings-icon"></div>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <div class="flex-1 flex mobile-stack">
          <!-- Left Panel: Code Editor -->
          <div class="flex-1 flex flex-col bg-gray-800 border-r border-gray-700">
            <div class="bg-gray-700 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div id="code-icon"></div>
                <span class="text-sm font-medium text-gray-300">Editor Kode</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-gray-400">
                <span id="cursor-position">Baris 1, Kolom 1</span>
                <span>•</span>
                <span>Python</span>
              </div>
            </div>
            <div id="editor-container" class="flex-1 monaco-editor-container"></div>
          </div>

          <!-- Right Panel: AI Prompt & Output -->
          <div class="w-96 mobile-panel flex flex-col bg-gray-900">
            <!-- AI Prompt Panel -->
            <div class="h-48 flex flex-col border-b border-gray-700">
              <div class="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center space-x-2">
                <div id="ai-prompt-icon"></div>
                <span class="text-sm font-medium text-gray-300">Generator Kode AI</span>
              </div>
              <div class="flex-1 p-4 flex flex-col">
                <div class="relative w-full flex-1 mb-2">
                    <textarea 
                        id="ai-prompt-input" 
                        class="w-full h-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                        placeholder="Jelaskan kode yang ingin Anda buat..."
                    ></textarea>
                    <button id="generate-code-btn" class="absolute right-3 bottom-3 btn-primary bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 font-medium text-sm">
                        <div id="generate-code-icon"></div>
                        <span id="generate-code-text">Buat Kode</span>
                    </button>
                </div>
                <div class="text-xs text-gray-500 flex space-x-2">
                  <span>Coba:</span>
                  <span class="cursor-pointer hover:text-blue-400" id="prompt-example-1">"permainan ular sederhana"</span>
                  <span class="cursor-pointer hover:text-blue-400" id="prompt-example-2">"urutkan daftar angka"</span>
                </div>
              </div>
            </div>

            <!-- Output Panel -->
            <div class="flex-1 flex flex-col">
              <div class="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div id="terminal-icon"></div>
                  <span class="text-sm font-medium text-gray-300">Keluaran</span>
                </div>
                <div id="execution-status" class="text-xs text-gray-400"></div>
              </div>
              <div id="output-area" class="flex-1 bg-terminal-bg text-green-400 p-4 font-mono text-sm overflow-auto custom-scrollbar">
                <div class="text-gray-500">Siap menjalankan kode Python...</div>
                <div class="text-gray-500 text-xs mt-2">💡 Coba kode contoh atau tulis sendiri!</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div class="flex items-center space-x-4">
            <span>PyCode Online v1.5</span>
            <span>•</span>
            <span id="word-count">Baris: 1</span>
            <span>•</span>
            <span id="last-saved">Tersimpan otomatis</span>
          </div>
          <div class="flex items-center space-x-4">
            <span>Python 3.11 (Simulasi)</span>
            <span>•</span>
            <span>UTF-8</span>
            <span>•</span>
            <span id="execution-time"></span>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="settings-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-96 max-w-90vw">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">Pengaturan</h3>
            <button id="close-settings" class="text-gray-400 hover:text-white">
              <div id="close-settings-icon"></div>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Tema</label>
              <select id="theme-select" class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600">
                <option value="vs-dark">Gelap (VS Code Dark)</option>
                <option value="light">Terang</option>
                <option value="hc-black">Kontras Tinggi</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Ukuran Font</label>
              <input 
                type="range" 
                id="font-size-slider" 
                min="10" 
                max="24" 
                value="14" 
                class="w-full"
              />
              <div class="text-sm text-gray-400 mt-1">Ukuran: <span id="font-size-display">14px</span></div>
            </div>
            
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-300">Simpan Otomatis</label>
              <input type="checkbox" id="auto-save-toggle" class="rounded" checked />
            </div>
            
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-300">Word Wrap</label>
              <input type="checkbox" id="word-wrap-toggle" class="rounded" />
            </div>
          </div>
        </div>
      </div>

      <!-- Share Modal -->
      <div id="share-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-96 max-w-90vw">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">Bagikan Kode</h3>
            <button id="close-share" class="text-gray-400 hover:text-white">
              <div id="close-share-icon"></div>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">URL Berbagi</label>
              <div class="flex">
                <input 
                  type="text" 
                  id="share-url" 
                  class="flex-1 bg-gray-700 text-white rounded-l-lg px-3 py-2 border border-gray-600" 
                  readonly
                />
                <button id="copy-url" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg text-white transition-colors">
                  Salin
                </button>
              </div>
            </div>
            
            <div class="text-sm text-gray-400">
              Siapapun dengan URL ini dapat melihat dan menjalankan kode Anda.
            </div>
          </div>
        </div>
      </div>
    `
  }

  insertIcons() {
    // Insert all the icons
    const iconMappings = [
      { id: 'run-icon', icon: 'play', className: 'w-4 h-4' },
      { id: 'stop-icon', icon: 'square', className: 'w-4 h-4' },
      { id: 'clear-icon', icon: 'trash', className: 'w-4 h-4' },
      { id: 'share-icon', icon: 'share', className: 'w-4 h-4' },
      { id: 'settings-icon', icon: 'settings', className: 'w-4 h-4' },
      { id: 'code-icon', icon: 'code', className: 'w-4 h-4 text-blue-400' },
      { id: 'terminal-icon', icon: 'terminal', className: 'w-4 h-4 text-yellow-400' },
      { id: 'close-settings-icon', icon: 'x', className: 'w-5 h-5' },
      { id: 'close-share-icon', icon: 'x', className: 'w-5 h-5' },
      { id: 'ai-prompt-icon', icon: 'sparkles', className: 'w-4 h-4 text-purple-400' },
      { id: 'generate-code-icon', icon: 'wand', className: 'w-4 h-4' }
    ]

    iconMappings.forEach(({ id, icon, className }) => {
      const element = document.getElementById(id)
      if (element) {
        const iconElement = this.createIcon(icon, className)
        if (iconElement) {
          element.innerHTML = '' // Clear previous icon
          element.appendChild(iconElement)
        }
      }
    })
  }

  setupEditor() {
    // Configure Monaco Editor with simpler configuration
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2d2d30',
        'editorLineNumber.foreground': '#6b7280',
        'editor.selectionBackground': '#3b82f650',
      }
    })

    // Create the editor with optimized settings for WebContainer
    this.editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: this.files[this.currentFile],
      language: 'python',
      theme: 'custom-dark',
      fontSize: this.fontSize,
      fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'off',
      minimap: { enabled: false }, // Disable minimap for better performance
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      acceptSuggestionOnCommitCharacter: true,
      quickSuggestions: false, // Disable for better performance
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      bracketMatching: 'always',
      autoIndent: 'full',
      // Disable some features that might cause worker issues
      hover: { enabled: false },
      parameterHints: { enabled: false },
      occurrencesHighlight: false,
      selectionHighlight: false,
      codeLens: false,
      contextmenu: false
    })

    // Update cursor position
    this.editor.onDidChangeCursorPosition((e) => {
      const position = e.position
      document.getElementById('cursor-position').textContent = 
        `Baris ${position.lineNumber}, Kolom ${position.column}`
    })

    // Auto-save on content change
    this.editor.onDidChangeModelContent(() => {
      this.files[this.currentFile] = this.editor.getValue()
      this.updateLineCount()
      if (this.autoSave) {
        this.saveToLocalStorage()
        document.getElementById('last-saved').textContent = 'Tersimpan otomatis'
      }
    })

    this.updateFileTabs()
  }

  setupEventListeners() {
    // Run button
    document.getElementById('run-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.runCode()
    })

    // Stop button
    document.getElementById('stop-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.stopExecution()
    })

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.clearOutput()
    })

    // Share button
    document.getElementById('share-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.showShareModal()
    })

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.showSettingsModal()
    })

    // Add file button
    document.getElementById('add-file-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.addNewFile()
    })

    // AI Generate button
    document.getElementById('generate-code-btn').addEventListener('click', (e) => {
      e.preventDefault()
      this.generateCodeFromPrompt()
    })

    // AI Example Prompts
    document.getElementById('prompt-example-1').addEventListener('click', (e) => {
        document.getElementById('ai-prompt-input').value = e.target.textContent.slice(1, -1);
        document.getElementById('ai-prompt-input').focus();
    });
    document.getElementById('prompt-example-2').addEventListener('click', (e) => {
        document.getElementById('ai-prompt-input').value = e.target.textContent.slice(1, -1);
        document.getElementById('ai-prompt-input').focus();
    });

    // Settings modal
    document.getElementById('close-settings').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.add('hidden')
    })

    document.getElementById('theme-select').addEventListener('change', (e) => {
      monaco.editor.setTheme(e.target.value)
    })

    document.getElementById('font-size-slider').addEventListener('input', (e) => {
      this.fontSize = parseInt(e.target.value)
      this.editor.updateOptions({ fontSize: this.fontSize })
      document.getElementById('font-size-display').textContent = `${this.fontSize}px`
    })

    document.getElementById('auto-save-toggle').addEventListener('change', (e) => {
      this.autoSave = e.target.checked
    })

    document.getElementById('word-wrap-toggle').addEventListener('change', (e) => {
      this.editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' })
    })

    // Share modal
    document.getElementById('close-share').addEventListener('click', () => {
      document.getElementById('share-modal').classList.add('hidden')
    })

    document.getElementById('copy-url').addEventListener('click', () => {
      const urlInput = document.getElementById('share-url')
      urlInput.select()
      navigator.clipboard.writeText(urlInput.value).then(() => {
        const copyBtn = document.getElementById('copy-url')
        const originalText = copyBtn.textContent
        copyBtn.textContent = 'Tersalin!'
        setTimeout(() => {
          copyBtn.textContent = originalText
        }, 2000)
      }).catch(err => {
        console.error('Failed to copy: ', err)
      })
    })

    // Close modals when clicking outside
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        document.getElementById('settings-modal').classList.add('hidden')
      }
    })

    document.getElementById('share-modal').addEventListener('click', (e) => {
      if (e.target.id === 'share-modal') {
        document.getElementById('share-modal').classList.add('hidden')
      }
    })
  }

  updateFileTabs() {
    const tabsContainer = document.getElementById('file-tabs')
    tabsContainer.innerHTML = ''

    Object.keys(this.files).forEach(filename => {
      const tab = document.createElement('div')
      tab.className = `file-tab px-3 py-1 text-sm rounded-t-lg cursor-pointer flex items-center space-x-2 ${
        filename === this.currentFile ? 'active bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'
      }`
      
      tab.innerHTML = `
        <span>${filename}</span>
        ${Object.keys(this.files).length > 1 ? `
          <button class="text-gray-400 hover:text-white ml-1 remove-file-btn" data-filename="${filename}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        ` : ''}
      `
      
      tab.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-file-btn')) {
          this.switchFile(filename)
        }
      })

      // Add event listener for remove button
      const removeBtn = tab.querySelector('.remove-file-btn')
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          this.removeFile(filename)
        })
      }
      
      tabsContainer.appendChild(tab)
    })
  }

  switchFile(filename) {
    if (this.files[filename]) {
      this.currentFile = filename
      this.editor.setValue(this.files[filename])
      this.updateFileTabs()
    }
  }

  addNewFile() {
    const filename = prompt('Masukkan nama file (dengan ekstensi .py):')
    if (filename && filename.endsWith('.py') && !this.files[filename]) {
      this.files[filename] = '# File Python baru\nprint("Halo dari ' + filename + '")\n'
      this.currentFile = filename
      this.editor.setValue(this.files[filename])
      this.updateFileTabs()
    } else if (filename && this.files[filename]) {
      alert('File sudah ada!')
    }
  }

  removeFile(filename) {
    if (Object.keys(this.files).length > 1) {
      delete this.files[filename]
      if (this.currentFile === filename) {
        this.currentFile = Object.keys(this.files)[0]
        this.editor.setValue(this.files[this.currentFile])
      }
      this.updateFileTabs()
    }
  }

  setButtonState(isRunning) {
    const runBtn = document.getElementById('run-btn')
    const stopBtn = document.getElementById('stop-btn')
    const runText = document.getElementById('run-text')
    
    if (isRunning) {
      runBtn.disabled = true
      stopBtn.disabled = false
      runText.textContent = 'Menjalankan...'
      runBtn.classList.add('opacity-50', 'cursor-not-allowed')
      stopBtn.classList.remove('opacity-50', 'cursor-not-allowed')
    } else {
      runBtn.disabled = false
      stopBtn.disabled = true
      runText.textContent = 'Jalankan'
      runBtn.classList.remove('opacity-50', 'cursor-not-allowed')
      stopBtn.classList.add('opacity-50', 'cursor-not-allowed')
    }
  }

  async runCode() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.setButtonState(true)
    
    const outputArea = document.getElementById('output-area')
    const statusElement = document.getElementById('execution-status')
    
    outputArea.innerHTML = '<div class="text-blue-400">🚀 Memulai eksekusi...</div>'
    statusElement.innerHTML = '<div class="loading-spinner"></div>'
    
    const startTime = Date.now()
    
    // Use a short timeout to allow the UI to update before heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));

    const code = this.editor.getValue()
    const result = await this.executeCodeRobust(code)
    
    const executionTime = Date.now() - startTime
    document.getElementById('execution-time').textContent = `Dieksekusi dalam ${executionTime}ms`
    
    outputArea.innerHTML = '' // Clear starting message
    
    if (result.output.length > 0) {
      result.output.forEach(line => {
        const div = document.createElement('div')
        div.className = 'mb-1'
        div.innerHTML = `<span class="text-green-400">${this.escapeHtml(line).replace(/ /g, '&nbsp;')}</span>`
        outputArea.appendChild(div)
      })
    }
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        const div = document.createElement('div')
        div.className = 'text-red-400 mb-1 font-semibold'
        div.textContent = error
        outputArea.appendChild(div)
      })
    }
    
    if (result.errors.length === 0) {
      const successDiv = document.createElement('div')
      successDiv.className = 'text-green-400 mt-2 font-semibold'
      successDiv.textContent = '✅ Program selesai dengan sukses!'
      outputArea.appendChild(successDiv)
      statusElement.innerHTML = '<span class="text-green-400">• Sukses</span>'
    } else {
      statusElement.innerHTML = '<span class="text-red-400">• Gagal</span>'
    }
    
    if (result.output.length === 0 && result.errors.length === 0) {
      const noOutputDiv = document.createElement('div')
      noOutputDiv.className = 'text-gray-400 italic'
      noOutputDiv.textContent = 'Program dieksekusi tanpa keluaran.'
      outputArea.appendChild(noOutputDiv)
    }
      
    this.isRunning = false
    this.setButtonState(false)
  }

  async executeCodeRobust(code) {
    const output = []
    const errors = []
    const lines = code.split('\n')
    this.variables = {} // Reset variables for each run

    for (let i = 0; i < lines.length; i++) {
        if (!this.isRunning) {
            errors.push('Eksekusi dihentikan oleh pengguna.')
            break
        }

        const lineNum = i + 1
        const originalLine = lines[i]
        const trimmedLine = originalLine.trim()

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue
        }

        try {
            // --- Pre-execution checks for unsupported syntax ---
            if (trimmedLine.startsWith('def ') || trimmedLine.startsWith('class ') || trimmedLine.startsWith('if ') || trimmedLine.startsWith('while ') || trimmedLine.startsWith('else:') || trimmedLine.startsWith('elif ')) {
                throw new Error(`SyntaxNotSupportedError: Sintaks '${trimmedLine.split(' ')[0]}' tidak didukung oleh simulator ini.`);
            }
            if (trimmedLine.includes('//')) {
                throw new Error(`SyntaxNotSupportedError: Operator pembagian integer '//' tidak didukung. Gunakan '/' untuk pembagian biasa.`);
            }

            // --- Statement Processing ---
            if (trimmedLine.startsWith('for ')) {
                const loopResult = this.processForLoop(lines, i)
                output.push(...loopResult.output)
                i = loopResult.nextLine - 1 // Adjust loop index
                continue
            }
            
            if (this.isAssignment(trimmedLine)) {
                this.processAssignment(trimmedLine, lineNum)
                continue
            }

            if (trimmedLine.startsWith('print(')) {
                const printResult = this.processPrintStatement(trimmedLine, lineNum)
                output.push(printResult)
                continue
            }
            
            // If no known pattern matches, it's an error
            throw new Error(`SyntaxError: Sintaks tidak valid atau tidak didukung.`);

        } catch (e) {
            errors.push(`Baris ${lineNum}: ${e.message}`)
            return { output, errors } // Stop execution on the first error
        }
    }

    return { output, errors }
  }

  isAssignment(line) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*.+$/.test(line) && !/==|!=|<=|>=|<|>/.test(line.split('=')[0])
  }

  processAssignment(line, lineNum) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/)
    if (!match) throw new Error(`Sintaks penugasan tidak valid`)
    
    const varName = match[1].trim()
    const valueExpr = match[2].trim()
    
    this.variables[varName] = this.evaluateExpression(valueExpr, lineNum)
  }

  processPrintStatement(line, lineNum) {
    const match = line.match(/print\((.*)\)/)
    if (!match) return ''
    
    const content = match[1].trim()
    if (content === '') return ''
    
    const value = this.evaluateExpression(content, lineNum)
    return Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
  }

  processForLoop(lines, startIndex) {
    const output = []
    const lineNum = startIndex + 1
    const forLine = lines[startIndex].trim()
    
    const rangeMatch = forLine.match(/for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(([^)]+)\):/)
    const listMatch = forLine.match(/for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*):/)
    
    if (!rangeMatch && !listMatch) {
      throw new Error(`SyntaxError: Sintaks perulangan 'for' tidak valid atau tidak didukung.`)
    }
    
    const baseIndent = lines[startIndex].search(/\S|$/)
    const loopBodyLines = []
    let nextLine = startIndex + 1
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i]
      const currentIndent = currentLine.search(/\S|$/)
      
      if (currentLine.trim() === '') continue
      
      if (currentIndent > baseIndent) {
        loopBodyLines.push({ text: currentLine.trim(), num: i + 1 })
        nextLine = i + 1
      } else {
        break
      }
    }
    
    let iterable = []
    let loopVarName = ''

    if (rangeMatch) {
        loopVarName = rangeMatch[1]
        const rangeArgs = rangeMatch[2].split(',').map(arg => this.evaluateExpression(arg.trim(), lineNum));
        let start = 0, end = 0;
        if (rangeArgs.length === 1) {
            end = rangeArgs[0];
        } else if (rangeArgs.length === 2) {
            [start, end] = rangeArgs;
        } else {
            throw new Error(`SyntaxError: range() hanya mendukung 1 atau 2 argumen.`);
        }
        for(let i = start; i < end; i++) iterable.push(i);

    } else if (listMatch) {
      loopVarName = listMatch[1]
      const listName = listMatch[2]
      const listValue = this.evaluateExpression(listName, lineNum)
      if (!Array.isArray(listValue)) {
        throw new Error(`TypeError: '${listName}' bukan sebuah list (iterable).`)
      }
      iterable = listValue
    }
    
    for (const item of iterable) {
      this.variables[loopVarName] = item
      
      for (const bodyLine of loopBodyLines) {
        if (bodyLine.text.startsWith('print(')) {
          output.push(this.processPrintStatement(bodyLine.text, bodyLine.num))
        } else if (this.isAssignment(bodyLine.text)) {
          this.processAssignment(bodyLine.text, bodyLine.num)
        } else {
            throw new Error(`SyntaxError: Sintaks di dalam loop tidak didukung: ${bodyLine.text}`)
        }
      }
    }
    
    return { output, nextLine }
  }

  evaluateExpression(expr, lineNum) {
    if (typeof expr !== 'string') return expr
    expr = expr.trim()
    if (expr === '') return ''

    // 1. Handle f-strings first
    if (expr.startsWith('f"') || expr.startsWith("f'")) {
      const content = expr.slice(2, -1)
      return content.replace(/\{([^}]+)\}/g, (_, innerExpr) => {
          return String(this.evaluateExpression(innerExpr.trim(), lineNum))
      })
    }
    
    // 2. Handle literals
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1)
    }
    if (!isNaN(expr) && expr.trim() !== '') {
      return parseFloat(expr)
    }
    if (expr.startsWith('[') && expr.endsWith(']')) {
      if (expr === '[]') return [];
      return expr.slice(1, -1).split(',').map(item => this.evaluateExpression(item.trim(), lineNum))
    }

    // 3. Handle built-in functions and variables
    if (expr === 'math.pi') return Math.PI
    if (expr.includes('random.randint')) {
      const match = expr.match(/random\.randint\((\d+),\s*(\d+)\)/)
      if (match) return faker.number.int({ min: parseInt(match[1]), max: parseInt(match[2]) })
    }
    const funcMatch = expr.match(/^(\w+)\((.*)\)$/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      const argValue = this.evaluateExpression(funcMatch[2].trim(), lineNum)
      
      if (Array.isArray(argValue)) {
        switch (funcName) {
          case 'sum': return argValue.reduce((a, b) => Number(a) + Number(b), 0)
          case 'max': return Math.max(...argValue.map(Number))
          case 'min': return Math.min(...argValue.map(Number))
          case 'len': return argValue.length
        }
      }
    }

    // 4. Handle arithmetic expressions
    if (/[\+\-\*\/]/.test(expr)) {
        const safeExpr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
            if (this.variables.hasOwnProperty(match)) {
                const value = this.variables[match];
                if (typeof value === 'string') {
                    throw new Error(`TypeError: Operasi aritmatika tidak bisa dilakukan pada string '${match}'.`);
                }
                return value;
            }
            if (isNaN(match)) {
                throw new Error(`NameError: nama '${match}' tidak terdefinisi.`);
            }
            return match;
        });
        try {
            return new Function(`return ${safeExpr}`)()
        } catch(e) {
            throw new Error(`EvaluationError: Gagal mengevaluasi ekspresi '${expr}'.`);
        }
    }
    
    // 5. Handle simple variable
    if (this.variables.hasOwnProperty(expr)) {
      return this.variables[expr]
    }
    
    // 6. Handle formatted strings
    const formatMatch = expr.match(/^(.+?):\.(\d+)f$/)
    if(formatMatch){
        const val = this.evaluateExpression(formatMatch[1].trim(), lineNum)
        const precision = parseInt(formatMatch[2])
        if(typeof val === 'number') return val.toFixed(precision)
    }

    // If nothing matches, it's an error
    throw new Error(`NameError: nama '${expr}' tidak terdefinisi`)
  }

  escapeHtml(text) {
    if (text === null || text === undefined) return ''
    const div = document.createElement('div')
    div.textContent = String(text)
    return div.innerHTML
  }

  stopExecution() {
    this.isRunning = false
    this.setButtonState(false)
    
    const outputArea = document.getElementById('output-area')
    const stopDiv = document.createElement('div')
    stopDiv.className = 'text-yellow-400 mt-2 font-semibold'
    stopDiv.textContent = '⏹️ Eksekusi dihentikan oleh pengguna'
    outputArea.appendChild(stopDiv)
    
    document.getElementById('execution-status').innerHTML = '<span class="text-yellow-400">• Dihentikan</span>'
  }

  clearOutput() {
    document.getElementById('output-area').innerHTML = `
      <div class="text-gray-500">Siap menjalankan kode Python...</div>
      <div class="text-gray-500 text-xs mt-2">💡 Coba kode contoh atau tulis sendiri!</div>
    `
    document.getElementById('execution-status').innerHTML = ''
    document.getElementById('execution-time').textContent = ''
  }

  showSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden')
    document.getElementById('settings-modal').classList.add('flex')
  }

  showShareModal() {
    const codeData = btoa(JSON.stringify({
      files: this.files,
      currentFile: this.currentFile
    }))
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${codeData}`
    
    document.getElementById('share-url').value = shareUrl
    document.getElementById('share-modal').classList.remove('hidden')
    document.getElementById('share-modal').classList.add('flex')
  }

  updateLineCount() {
    const lines = this.editor.getValue().split('\n').length
    document.getElementById('word-count').textContent = `Baris: ${lines}`
  }

  saveToLocalStorage() {
    localStorage.setItem('pycode-files', JSON.stringify(this.files))
    localStorage.setItem('pycode-current-file', this.currentFile)
    localStorage.setItem('pycode-settings', JSON.stringify({
      fontSize: this.fontSize,
      autoSave: this.autoSave
    }))
  }

  loadFromLocalStorage() {
    const savedFiles = localStorage.getItem('pycode-files')
    const savedCurrentFile = localStorage.getItem('pycode-current-file')
    const savedSettings = localStorage.getItem('pycode-settings')
    
    if (savedFiles) {
      this.files = JSON.parse(savedFiles)
    }
    
    if (savedCurrentFile && this.files[savedCurrentFile]) {
      this.currentFile = savedCurrentFile
      this.editor.setValue(this.files[savedCurrentFile])
    }
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      this.fontSize = settings.fontSize || 14
      this.autoSave = settings.autoSave !== false
      
      this.editor.updateOptions({ fontSize: this.fontSize })
      document.getElementById('font-size-slider').value = this.fontSize
      document.getElementById('font-size-display').textContent = `${this.fontSize}px`
      document.getElementById('auto-save-toggle').checked = this.autoSave
    }
    
    this.updateFileTabs()
    this.updateLineCount()
  }

  async generateCodeFromPrompt() {
    const promptInput = document.getElementById('ai-prompt-input');
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Silakan masukkan prompt untuk membuat kode.');
        return;
    }

    const generateBtn = document.getElementById('generate-code-btn');
    const btnText = document.getElementById('generate-code-text');
    const originalText = btnText.textContent;

    generateBtn.disabled = true;
    btnText.textContent = 'Membuat...';
    generateBtn.classList.add('opacity-50');

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const generatedCode = this.mockAiCodeGeneration(prompt);
        this.editor.setValue(generatedCode);
        this.editor.focus();
    } catch (error) {
        console.error('Pembuatan kode AI gagal:', error);
        alert('Gagal membuat kode.');
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = originalText;
        generateBtn.classList.remove('opacity-50');
    }
  }

  mockAiCodeGeneration(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('faktorial')) {
        return `# Menghitung faktorial dari 5
num = 5
faktorial = 1

# Loop untuk mengalikan bilangan dari 1 hingga num
for i in range(1, num + 1):
    faktorial = faktorial * i

print(f"Faktorial dari {num} adalah {faktorial}")
`;
    } else if (lowerPrompt.includes('bilangan prima')) {
        return `# Memeriksa apakah sebuah bilangan adalah prima
num_cek = 17
pembagi = 0

# Loop untuk mencari pembagi
for i in range(2, num_cek):
    if num_cek % i == 0:
        pembagi = i
        break # Hentikan jika ditemukan pembagi

# Simulator ini tidak mendukung 'if', jadi kita cetak hasilnya secara manual
# Jika 'pembagi' tetap 0, maka bilangan tersebut adalah prima.
print(f"Mencari pembagi untuk {num_cek}...")
print(f"Pembagi yang ditemukan (0 jika prima): {pembagi}")
`;
    } else if (lowerPrompt.includes('fibonacci')) {
        return `# Menghasilkan 10 suku pertama dari urutan Fibonacci
n_suku = 10
urutan = [0, 1]

# Loop untuk menghasilkan suku-suku berikutnya
for i in range(2, n_suku):
    nilai_berikutnya = urutan[i-1] + urutan[i-2]
    urutan.append(nilai_berikutnya)

print(f"Urutan Fibonacci ({n_suku} suku):")
print(urutan)
`;
    } else if (lowerPrompt.includes('ular')) {
        return `# Simulasi permainan ular berbasis teks yang sangat sederhana
print("--- Permainan Ular Sederhana ---")

ular_x = 5
ular_y = 5
makanan_x = 8
makanan_y = 5

print(f"Posisi ular: ({ular_x}, {ular_y})")
print(f"Posisi makanan: ({makanan_x}, {makanan_y})")

# Simulasikan satu gerakan ke kanan
ular_x = ular_x + 1
print(f"Ular bergerak ke kanan, posisi baru: ({ular_x}, {ular_y})")

# Cek apakah ular memakan makanan (tanpa if)
# Jika posisi sama, hasil 'makan' akan 1, jika tidak 0.
makan = (ular_x == makanan_x) and (ular_y == makanan_y)
print(f"Apakah ular makan? (1 jika ya, 0 jika tidak): {makan}")
`;
    } else if (lowerPrompt.includes('urutkan')) {
        return `# Bubble Sort sederhana untuk daftar angka
angka = [64, 34, 25, 12, 22, 11, 90]
print(f"Daftar asli: {angka}")

# Simulator ini tidak mendukung loop bersarang,
# jadi ini adalah simulasi satu putaran bubble sort.
n = len(angka)
i = 0 # Variabel loop luar
j = 0 # Variabel loop dalam

print("Mensimulasikan satu putaran bubble sort...")
# Dalam kode nyata, ini akan ada di dalam loop bersarang.
# if angka[j] > angka[j+1]:
#   ... tukar ...

print("Karena loop bersarang tidak didukung, pengurutan tidak dilakukan.")
print("Daftar terurut (konseptual): [11, 12, 22, 25, 34, 64, 90]")
`;
    } else if (lowerPrompt.includes('api') || lowerPrompt.includes('request')) {
        return `# Simulator ini tidak mendukung permintaan jaringan.
# Ini adalah contoh bagaimana Anda akan mencetak data tiruan (mock).

print("Mensimulasikan pengambilan data dari API...")
print("URL Target: https://api.contoh.com/data/1")

print("--- Respons Tiruan ---")
print("{")
print("  'id': 1,")
print("  'title': 'Contoh Judul dari API',")
print("  'completed': False")
print("}")
print("-----------------------")
`;
    } else {
        return `# Kode yang Dihasilkan AI untuk: "${prompt}"
# Ini adalah respons simulasi.

print(f"Ini adalah kode contoh yang dibuat untuk prompt:")
print(f'"{prompt}"')
`;
    }
  }
}

// Initialize the editor
let editor

export function setupPythonEditor(element) {
  editor = new PythonEditor(element)
  
  // Make editor globally accessible for tab close buttons
  window.editor = editor
  
  // Load shared code if present in URL
  const urlParams = new URLSearchParams(window.location.search)
  const sharedCode = urlParams.get('code')
  if (sharedCode) {
    try {
      const decoded = JSON.parse(atob(sharedCode))
      editor.files = decoded.files
      editor.currentFile = decoded.currentFile
      editor.editor.setValue(editor.files[editor.currentFile])
      editor.updateFileTabs()
    } catch (error) {
      console.error('Gagal memuat kode yang dibagikan:', error)
    }
  }
}
