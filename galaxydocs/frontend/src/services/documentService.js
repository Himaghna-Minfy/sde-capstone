const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class DocumentService {
  async getDocuments() {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }

    return response.json()
  }

  async getDocument(id) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/documents/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch document')
    }

    return response.json()
  }

  async createDocument(title, content = '') {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    })

    if (!response.ok) {
      throw new Error('Failed to create document')
    }

    return response.json()
  }

  async updateDocument(id, updates) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update document')
    }

    return response.json()
  }

  async deleteDocument(id) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete document')
    }

    return response.json()
  }
}

export const documentService = new DocumentService()
