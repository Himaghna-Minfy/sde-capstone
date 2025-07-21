import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Email and password required')
    setLoading(true)
    // Demo: Accept any credentials
    setTimeout(() => {
      onLogin({
        id: Date.now(),
        email,
        name: email.split('@')[0] || 'User',
        avatar: (email[0] || 'U').toUpperCase(),
        role: 'editor'
      })
      setLoading(false)
    }, 800)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>í¼Œ GalaxyDocs</h1>
          <p>Real-time collaborative document editing</p>
        </div>
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input" />
          </div>
          <button className="auth-btn" disabled={loading}>
            {loading ? "Launching..." : "Login"}
          </button>
        </form>
        <div className="auth-footer">
          <span>Don't have an account? <Link to="/register">Sign up</Link></span>
        </div>
      </div>
    </div>
  )
}

export default Login
