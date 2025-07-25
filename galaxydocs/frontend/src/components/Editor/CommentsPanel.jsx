import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

function CommentsPanel({ comments, editor, onAddComment }) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [selectedText, setSelectedText] = useState('')

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const selection = editor.state.selection
    const selectedContent = editor.state.doc.textBetween(selection.from, selection.to)

    const comment = {
      id: Date.now().toString(),
      content: newComment,
      selectedText: selectedContent,
      author: user.displayName || user.email,
      authorId: user.uid,
      createdAt: new Date().toISOString(),
      position: selection.from
    }

    onAddComment(comment)
    setNewComment('')
    setSelectedText('')
  }

  const handleTextSelection = () => {
    if (!editor) return

    const selection = editor.state.selection
    const selectedContent = editor.state.doc.textBetween(selection.from, selection.to)
    setSelectedText(selectedContent)
  }

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h3>Comments</h3>
        <span className="comments-count">{comments.length}</span>
      </div>

      <div className="add-comment">
        <div className="selected-text">
          {selectedText && (
            <div className="selection-preview">
              <strong>Selected:</strong> "{selectedText}"
            </div>
          )}
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="comment-input"
          onFocus={handleTextSelection}
        />
        <button 
          onClick={handleAddComment}
          className="add-comment-btn"
          disabled={!newComment.trim()}
        >
          Add Comment
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            No comments yet. Select text and add a comment!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </div>
              </div>
              {comment.selectedText && (
                <div className="comment-context">
                  <strong>Re:</strong> "{comment.selectedText}"
                </div>
              )}
              <div className="comment-content">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentsPanel
