import React from 'react'

function UserPresence({ users }) {
  return (
    <div className="user-presence">
      <div className="online-users">
        {users.slice(0, 5).map(user => (
          <div
            key={user.id}
            className="user-avatar"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        ))}
        {users.length > 5 && (
          <div className="user-count">+{users.length - 5}</div>
        )}
      </div>
      <span className="users-label">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </span>
    </div>
  )
}

export default UserPresence
