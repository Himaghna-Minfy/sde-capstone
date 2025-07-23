const jwt = require('jsonwebtoken')

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    
    if (!token) {
      return next(new Error('No token provided'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded
    next()
  } catch (error) {
    next(new Error('Invalid token'))
  }
}

module.exports = {
  authenticate,
  authenticateSocket
}
