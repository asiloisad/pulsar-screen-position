'use babel'

import { CompositeDisposable } from 'atom'

export default {

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.workspace.observeTextEditors((editor) => {
         const onMouseWheel = () => {
          let lntrbr = editor.component.lineNumbersToRender.bufferRows
          editor.component.focusBufferRow = lntrbr[Math.round((lntrbr.length-1)/2)]
          editor.component.focusRowCenter = true
        }
        editor.element.onmousewheel= onMouseWheel ; onMouseWheel()
        editor.disposables.add(editor.onDidChangeCursorPosition((e) => {
          if (e.oldBufferPosition.row!==e.newBufferPosition.row) {
            editor.component.focusBufferRow = e.newBufferPosition.row
            editor.component.focusRowCenter = false
          }
        }))
        setTimeout(() => { editor.scrollToCursorPosition() }, 50)
        editor.element.saveFocusBufferRow = onMouseWheel // API
        editor.element.scrollToFocusBufferRow = () => {
          let midBufferRow = editor.component.focusBufferRow
          let midScreenRow = editor.bufferPositionForScreenPosition([midBufferRow, 0]).row
          if (midBufferRow!==midScreenRow) {
            setTimeout(() => { editor.scrollToBufferPosition([midBufferRow, 0], { center:editor.component.focusRowCenter }) }, 50)
          }
        }
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
