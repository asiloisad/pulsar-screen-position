'use babel'

import { CompositeDisposable } from 'atom'

export default {

  config: {
    center: {
      type: 'boolean',
      title: "Keep center position",
      description: "Slightly more aggressive, but more precise",
      default: false,
      order: 1,
    },
  },

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('keep-position.center', (value) => {
        this.center = value
      }),
      atom.workspace.observeTextEditors((editor) => {
        const getValue = () => {
          let lntrbr = editor.component.lineNumbersToRender.bufferRows
          if (!lntrbr.length) {
            editor.component.middleBufferRow = 0
          } else {
            editor.component.middleBufferRow = lntrbr[Math.round((lntrbr.length-1)/2)]
          }
        }
        getValue() ; editor.element.onmousewheel = () => { getValue() }
      }),
      atom.workspace.getCenter().observePanes((pane) => {
        let count = 0
        let resizeObserver = new ResizeObserver(() => {
          if ((count+=1)===1) { return }
          for (let item of pane.getItems()) {
            if (!atom.workspace.isTextEditor(item) || !item.softWrapped) { return }
            setTimeout(() => { item.scrollToBufferPosition([item.component.middleBufferRow, 0], { center:this.center }) }, 10)
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
