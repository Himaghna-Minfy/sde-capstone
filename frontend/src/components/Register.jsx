import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Register({ onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password || !name) return setError('All fields required')
    setLoading(true)
    setTimeout(() => {
      onRegister({
        id: Date.now(),
        name,
        email,
        avatar: (name[0] || 'U').toUpperCase(),
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
          <p>Create your account</p>
        </div>
        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input" />
          </div>
          <button className="auth-btn" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already have an account? <Link to="/login">Login</Link></span>
        </div>
      </div>
    </div>
  )
}

export default Register
