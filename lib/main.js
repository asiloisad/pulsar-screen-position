const { CompositeDisposable, Disposable } = require('atom')

module.exports = {

  activate () {
    this.disposables = new CompositeDisposable()

    // ===== patch text editors ===== //

    this.disposables.add(atom.workspace.observeTextEditors((editor) => {

      // initialize
      editor.sp = { row:null, center:null }

      // wheel event listener define
      editor.sp.wheel = throttle(() => {
        if (editor.isDestroyed()) { return }
        let lntrbr = editor.component.lineNumbersToRender.bufferRows
        editor.sp.row = lntrbr[Math.round((lntrbr.length-1)/2)]
        editor.sp.center = true
      }, 250)

      // wheel event listener register
      editor.element.addEventListener('mousewheel', editor.sp.wheel)

      // wheel event listener dispose
      editor.disposables.add(new Disposable(() => {
        editor.element.removeEventListener('mousewheel', editor.sp.wheel)
      }))

      // cursor event define
      editor.sp.cursor = throttle((e) => {
        if (editor.isDestroyed()) { return }
        if (e.newBufferPosition.isEqual(e.oldBufferPosition)) { return }
        editor.sp.row = editor.getLastCursor().getBufferPosition().row
        editor.sp.center = false
      }, 250)

      // cursor event register & dispose
      editor.disposables.add(editor.onDidChangeCursorPosition(editor.sp.cursor))

      // create scroll method
      let newItem = true
      editor.sp.scroll = throttle(() => {
        if (newItem) {
          editor.scrollToCursorPosition()
          newItem = false
          editor.sp.row = editor.getLastCursor().getBufferPosition().row
          editor.sp.center = false
          return
        }
        if (editor.isDestroyed()) {
          return
        }
        editor.scrollToBufferPosition([editor.sp.row, 0], { center:editor.sp.center })
      }, 100)

      editor.disposables.add(editor.onDidChangeSoftWrapped(() => {
        editor.sp.scroll()
      }))
    }))

    // ===== patch panes ===== //

    this.disposables.add(atom.workspace.getCenter().observePanes((pane) => {
      // pane observer define
      const resizeObserver = new ResizeObserver(() => {
        for (let item of pane.getItems()) {
          if (atom.workspace.isTextEditor(item)) {
            item.sp.scroll()
          }
        }
      })

      // pane observer register
      resizeObserver.observe(pane.getElement())

      // pane observer dispose
      pane.onWillDestroy(() => { resizeObserver.disconnect() })
    }))

    // ===== observe font size ===== //

    this.disposables.add(atom.config.onDidChange('editor.fontSize', () => {
      for (let editor of atom.workspace.getTextEditors()) {
        editor.sp.scroll()
      }
    }))
  },

  deactivate () {
    this.disposables.dispose()
  },
}

function throttle(func, timeout) {
  let timer = false
  return (...args) => {
    if (timer) { return }
    timer = setTimeout(() => {
      func.apply(this, args)
      timer = false
    }, timeout)
  }
}
