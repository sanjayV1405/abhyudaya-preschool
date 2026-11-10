/**
 * Centralized error handling middleware for Express
 */
function errorHandler(err, req, res, next) {
  // Log error for server observability
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message)
    if (err.stack && process.env.NODE_ENV === 'development') {
      console.error(err.stack)
    }
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      details: messages,
    })
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource ID format: "${err.value}"`,
    })
  }

  // Handle JSON Syntax Error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload provided in request body',
    })
  }

  // Default response code and message
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

// 404 Route Not Found Handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  })
}

module.exports = {
  errorHandler,
  notFoundHandler,
}

