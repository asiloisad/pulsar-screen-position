'use babel'

import { CompositeDisposable } from 'atom'

export default {

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.workspace.observeTextEditors((editor) => {
        editor.element.onmousewheel = () => {
          let lntrbr = editor.component.lineNumbersToRender.bufferRows
          if (!lntrbr.length) {
            editor.component.focusBufferRow = 0
            editor.component.focusRowCenter = false
          } else {
            editor.component.focusBufferRow = lntrbr[Math.round((lntrbr.length-1)/2)]
            editor.component.focusRowCenter = true
          }
        }
        editor.disposables.add(editor.onDidChangeCursorPosition((e) => {
          if (e.oldBufferPosition.row!==e.newBufferPosition.row) {
            editor.component.focusBufferRow = e.newBufferPosition.row
            editor.component.focusRowCenter = false
          }
        }))
      }),
      atom.workspace.getCenter().observePanes((pane) => {
        let count = 0
        let resizeObserver = new ResizeObserver(() => {
          if ((count+=1)===1) { return }
          for (let item of pane.getItems()) {
            if (atom.workspace.isTextEditor(item) && item.softWrapped) {
              let midBufferRow = item.component.focusBufferRow
              let midScreenRow = item.bufferPositionForScreenPosition([midBufferRow, 0]).row
              if (midBufferRow!==midScreenRow) {
                setTimeout(() => { item.scrollToBufferPosition([midBufferRow, 0], { center:item.component.focusRowCenter }) }, 50)
              }
            }
          }
        })
        resizeObserver.observe(pane.getElement())
        let onWillDestroy = pane.onWillDestroy(() => {
          resizeObserver.disconnect() ; onWillDestroy.dispose()
        })
      }),
    )
  },

  deactivate () {
    this.disposables.dispose()
  },
}
