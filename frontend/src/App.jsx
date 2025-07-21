import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Editor from './components/Editor'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('galaxydocs-user')
    if (saved) setUser(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = (userObj) => {
    setUser(userObj)
    localStorage.setItem('galaxydocs-user', JSON.stringify(userObj))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('galaxydocs-user')
  }

  if (loading) return <div className="galaxy-app loading-screen"><div className="loading-container"><div className="galaxy-loader"><div className="star"></div><div className="star"></div><div className="star"></div></div><h2>í¼Œ Initializing GalaxyDocs</h2></div></div>

  return (
    <div className="galaxy-app">
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onRegister={login} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} />
          <Route path="/editor/:documentId" element={user ? <Editor user={user} onLogout={logout} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
