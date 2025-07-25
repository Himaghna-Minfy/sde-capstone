import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary glass-card">
            <div className="error-header">
              <h2>... GalaxyDocs Encountered an Issue</h2>
              <p>We're sorry, but something went wrong with the collaborative editor.</p>
            </div>

            <div className="error-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  window.location.reload()
                }}
              >
                ... Reload Editor
              </button>
              
              <button 
                className="btn-secondary"
                onClick={() => {
                  window.location.href = '/dashboard'
                }}
              >
                ... Back to Dashboard
              </button>
            </div>

            <details className="error-details">
              <summary>... Technical Details (for developers)</summary>
              <div className="error-content">
                <h4>Error Message:</h4>
                <pre className="error-message">
                  {this.state.error?.toString()}
                </pre>
                
                {this.state.error?.message?.includes('getXmlFragment') && (
                  <div className="error-hint">
                    <h4>... Common Solutions:</h4>
                    <ul>
                      <li>This usually indicates a Y.js collaboration initialization issue</li>
                      <li>Try refreshing the page to reinitialize the collaboration provider</li>
                      <li>Check if the document exists and you have proper access permissions</li>
                    </ul>
                  </div>
                )}

                {this.state.errorInfo && (
                  <>
                    <h4>Stack Trace:</h4>
                    <pre className="error-stack">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
