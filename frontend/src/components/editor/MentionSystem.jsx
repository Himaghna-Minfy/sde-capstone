import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function MentionSuggestions({ 
  query, 
  position, 
  onSelectMention, 
  onClose, 
  isVisible 
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query && query.length > 0) {
      searchUsers(query);
    } else {
      setUsers([]);
    }
  }, [query]);

  const searchUsers = async (searchQuery) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onSelectMention(user);
    onClose();
  };

  if (!isVisible || (!loading && users.length === 0)) {
    return null;
  }

  return (
    <div 
      className="mention-suggestions"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="mention-suggestions-header">
        <span>í±¥ Mention someone</span>
      </div>
      
      {loading ? (
        <div className="mention-loading">
          <div className="loading-spinner"></div>
          <span>Searching users...</span>
        </div>
      ) : (
        <div className="mention-suggestions-list">
          {users.map(user => (
            <div
              key={user.id}
              className="mention-suggestion-item"
              onClick={() => handleSelectUser(user)}
            >
              <div className="mention-user-avatar">{user.avatar}</div>
              <div className="mention-user-info">
                <div className="mention-user-name">{user.name}</div>
                <div className="mention-user-email">{user.email}</div>
              </div>
              <div className="mention-user-role">{user.role}</div>
            </div>
          ))}
        </div>
      )}
      
      {users.length === 0 && !loading && query && (
        <div className="mention-no-results">
          <span>No users found for "{query}"</span>
        </div>
      )}
    </div>
  );
}

export function useMentions(editorRef) {
  const [mentionState, setMentionState] = useState({
    isActive: false,
    query: '',
    position: { top: 0, left: 0 },
    range: null
  });

  const detectMention = useCallback((event) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    const cursorPosition = range.startOffset;

    // Look for @ symbol before cursor
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      const rect = range.getBoundingClientRect();
      
      setMentionState({
        isActive: true,
        query,
        position: {
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX
        },
        range: range.cloneRange()
      });
    } else {
      setMentionState(prev => ({ ...prev, isActive: false }));
    }
  }, [editorRef]);

  const handleMentionSelect = useCallback((user) => {
    if (!mentionState.range) return;

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(mentionState.range);

    const range = mentionState.range;
    const text = range.startContainer.textContent || '';
    const cursorPosition = range.startOffset;

    // Find the @ symbol position
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const mentionStart = cursorPosition - mentionMatch[0].length;
      const mentionEnd = cursorPosition;

      // Create mention element
      const mentionElement = document.createElement('span');
      mentionElement.className = 'mention';
      mentionElement.contentEditable = 'false';
      mentionElement.dataset.userId = user.id;
      mentionElement.textContent = `@${user.name}`;
      mentionElement.style.cssText = `
        background: linear-gradient(45deg, #e94560, #ff6b96);
        color: white;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 0.9em;
        font-weight: 500;
        margin: 0 2px;
        display: inline-block;
      `;

      // Replace the @ query with the mention element
      range.setStart(range.startContainer, mentionStart);
      range.setEnd(range.startContainer, mentionEnd);
      range.deleteContents();
      range.insertNode(mentionElement);

      // Add space after mention
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(mentionElement);
      range.insertNode(spaceNode);
      range.setStartAfter(spaceNode);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    }

    setMentionState(prev => ({ ...prev, isActive: false }));
  }, [mentionState.range]);

  const closeMentions = useCallback(() => {
    setMentionState(prev => ({ ...prev, isActive: false }));
  }, []);

  return {
    mentionState,
    detectMention,
    handleMentionSelect,
    closeMentions
  };
}

export default MentionSuggestions;
