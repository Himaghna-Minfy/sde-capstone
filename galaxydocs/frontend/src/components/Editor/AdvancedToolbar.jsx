import React, { useState } from 'react'

function AdvancedToolbar({ editor }) {
  const [activeDropdown, setActiveDropdown] = useState(null)

  if (!editor) return null

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Link URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  return (
    <div className="advanced-toolbar">
      {/* Text Formatting */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'active' : ''}
          title="Inline Code"
        >
          &lt;/&gt;
        </button>
      </div>

      {/* Headings */}
      <div className="toolbar-group">
        <div className="dropdown">
          <button 
            className="dropdown-toggle"
            onClick={() => toggleDropdown('headings')}
          >
            Heading ▼
          </button>
          {activeDropdown === 'headings' && (
            <div className="dropdown-menu">
              <button onClick={() => editor.chain().focus().setParagraph().run()}>
                Normal Text
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                Heading 1
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                Heading 2
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                Heading 3
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered List"
        >
          1. List
        </button>
      </div>

      {/* Blocks */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'active' : ''}
          title="Quote"
        >
          " Quote
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'active' : ''}
          title="Code Block"
        >
          { } Code
        </button>
        <button onClick={addTable} title="Insert Table">
          ⊞ Table
        </button>
      </div>

      {/* Media */}
      <div className="toolbar-group">
        <button onClick={addImage} title="Insert Image">
          🖼 Image
        </button>
        <button onClick={addLink} title="Insert Link">
          🔗 Link
        </button>
      </div>

      {/* Alignment */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
          title="Align Left"
        >
          ⬅
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
          title="Align Center"
        >
          ↔
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
          title="Align Right"
        >
          ➡
        </button>
      </div>

      {/* Actions */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>
    </div>
  )
}

export default AdvancedToolbar
