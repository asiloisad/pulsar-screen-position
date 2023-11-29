'use babel'

import { CompositeDisposable, Disposable } from 'atom'

export default {

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.workspace.observeTextEditors((editor) => {
         const onMouseWheel = throttle(() => {
          if (editor.isDestroyed()) { return }
          let lntrbr = editor.component.lineNumbersToRender.bufferRows
          editor.component.focusBufferRow = lntrbr[Math.round((lntrbr.length-1)/2)]
          editor.component.focusRowCenter = true
        }, 200)
        editor.element.addEventListener('mousewheel', onMouseWheel) ; onMouseWheel()
        editor.disposables.add(new Disposable(() => {
          editor.element.removeEventListener('mousewheel', onMouseWheel)
        }))
        editor.disposables.add(editor.onDidChangeCursorPosition(throttle((e) => {
          if (editor.isDestroyed()) { return }
          if (e.oldBufferPosition.row!==e.newBufferPosition.row) {
            editor.component.focusBufferRow = e.newBufferPosition.row
            editor.component.focusRowCenter = false
          }
        }, 200)))
        setTimeout(() => { editor.scrollToCursorPosition() }, 10)
        editor.element.saveFocusBufferRow = onMouseWheel // API
        editor.element.scrollToFocusBufferRow = throttle(() => {
          if (editor.isDestroyed()) { return }
          let midBufferRow = editor.component.focusBufferRow
          let midScreenRow = editor.bufferPositionForScreenPosition([midBufferRow, 0]).row
          if (midBufferRow!==midScreenRow) {
            editor.scrollToBufferPosition([midBufferRow, 0], { center:editor.component.focusRowCenter })
          }
        }, 100)
      }),
      atom.workspace.getCenter().observePanes((pane) => {
        let count = 0
        let resizeObserver = new ResizeObserver(() => {
          if ((count+=1)===1) { return }
          for (let item of pane.getItems()) {
            if (atom.workspace.isTextEditor(item) && item.softWrapped) {
              item.element.scrollToFocusBufferRow()
            }
          }
        })
        resizeObserver.observe(pane.getElement())
        let onWillDestroy = pane.onWillDestroy(() => {
          resizeObserver.disconnect() ; onWillDestroy.dispose()
        })
      }),
      atom.config.onDidChange('editor.fontSize', () => {
        for (let editor of atom.workspace.getTextEditors()) {
          editor.element.scrollToFocusBufferRow()
        }
      }),
    )
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
