import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function CommentThread({ comment, onReply, onResolve, onDelete, users }) {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { user } = useAuth();

  const handleReply = async () => {
    if (replyText.trim()) {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  const getUser = (userId) => {
    return users.find(u => u.id === userId) || { name: 'Unknown User', avatar: 'U' };
  };

  const commentUser = getUser(comment.userId);

  return (
    <div className={`comment-thread ${comment.resolved ? 'resolved' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">{commentUser.avatar}</div>
          <div className="author-info">
            <span className="author-name">{commentUser.name}</span>
            <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="comment-actions">
          {!comment.resolved && (
            <button className="action-btn resolve-btn" onClick={() => onResolve(comment.id)}>
              ‚úì Resolve
            </button>
          )}
          {comment.userId === user?.id && (
            <button className="action-btn delete-btn" onClick={() => onDelete(comment.id)}>
              Ì∑ëÔ∏è Delete
            </button>
          )}
        </div>
      </div>

      <div className="comment-content">
        <p>{comment.content}</p>
      </div>

      {comment.mentions && comment.mentions.length > 0 && (
        <div className="comment-mentions">
          <span>Mentioned: </span>
          {comment.mentions.map(userId => {
            const mentionedUser = getUser(userId);
            return (
              <span key={userId} className="mention-tag">
                @{mentionedUser.name}
              </span>
            );
          })}
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <div key={reply.id} className="reply">
              <div className="reply-author">
                <div className="author-avatar">{getUser(reply.userId).avatar}</div>
                <span className="author-name">{getUser(reply.userId).name}</span>
                <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
              </div>
              <p className="reply-content">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {!comment.resolved && (
        <div className="comment-reply-section">
          {showReplyBox ? (
            <div className="reply-box">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="reply-input"
                rows={3}
              />
              <div className="reply-actions">
                <button className="reply-btn" onClick={handleReply}>
                  Reply
                </button>
                <button className="cancel-btn" onClick={() => setShowReplyBox(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="show-reply-btn" onClick={() => setShowReplyBox(true)}>
              Ì≤¨ Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentPanel({ documentId, isOpen, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && documentId) {
      loadComments();
      loadUsers();
    }
  }, [documentId, isOpen]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/${documentId}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/users/active');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        content: newComment,
        position: selectedPosition || { start: 0, end: 0 },
        mentions: extractMentions(newComment)
      };

      const response = await axios.post(`/api/documents/${documentId}/comments`, commentData);
      
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
      setSelectedPosition(null);
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleReply = async (commentId, replyText) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const reply = {
        id: Date.now().toString(),
        userId: user.id,
        content: replyText,
        createdAt: new Date().toISOString()
      };

      const updatedComment = {
        ...comment,
        replies: [...(comment.replies || []), reply]
      };

      await axios.put(`/api/comments/${commentId}`, { replies: updatedComment.replies });
      
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const handleResolve = async (commentId) => {
    try {
      await axios.put(`/api/comments/${commentId}`, { resolved: true });
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUser = users.find(u => 
        u.name.toLowerCase().includes(match[1].toLowerCase()) ||
        u.email.toLowerCase().includes(match[1].toLowerCase())
      );
      
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }
    
    return mentions;
  };

  return (
    <div className={`comment-panel ${isOpen ? 'open' : ''}`}>
      <div className="comment-panel-header">
        <h3>Ì≤¨ Comments</h3>
        <button className="close-btn" onClick={onClose}>√ó</button>
      </div>

      <div className="comment-panel-content">
        <div className="new-comment-section">
          <div className="new-comment-header">
            <div className="user-avatar">{user?.avatar}</div>
            <span>Add a comment</span>
          </div>
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your comment here... Use @username to mention someone"
            className="new-comment-input"
            rows={4}
          />
          
          <div className="new-comment-actions">
            <button 
              className="create-comment-btn"
              onClick={handleCreateComment}
              disabled={!newComment.trim()}
            >
              Ì≤¨ Add Comment
            </button>
          </div>
        </div>

        <div className="comments-list">
          {loading ? (
            <div className="loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              <div className="comments-filter">
                <button className="filter-btn active">All ({comments.length})</button>
                <button className="filter-btn">
                  Resolved ({comments.filter(c => c.resolved).length})
                </button>
                <button className="filter-btn">
                  Open ({comments.filter(c => !c.resolved).length})
                </button>
              </div>
              
              {comments.map(comment => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                  users={users}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentPanel;
