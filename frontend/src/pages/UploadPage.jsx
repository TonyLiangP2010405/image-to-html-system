import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileImage, Loader2, ArrowRight } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return
    }
    
    setSelectedFile(file)
    setError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      
      const { job_id } = response.data
      navigate(`/preview/${job_id}`)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Convert Image to HTML
        </h2>
        <p className="text-gray-600">
          Upload a screenshot or UI design. Our AI will analyze it and generate clean HTML with TailwindCSS.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFile ? 'bg-green-50 border-green-300' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
            <p className="text-sm text-gray-600">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your image here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PNG, JPG, WEBP, BMP (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      {selectedFile && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Generate HTML
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="mt-2 text-sm text-gray-500">
            This may take 30-60 seconds as the AI analyzes your image
          </p>
        </div>
      )}

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <FileImage className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">OCR + Layout</h3>
          <p className="text-sm text-gray-600 mt-1">
            Uses Florence-2 and PaddleOCR to detect text, buttons, and layout structure
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <Upload className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">AI HTML Generation</h3>
          <p className="text-sm text-gray-600 mt-1">
            Qwen2.5-Coder 7B generates semantic HTML with TailwindCSS classes
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <ArrowRight className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Local & Private</h3>
          <p className="text-sm text-gray-600 mt-1">
            All processing runs locally via Ollama. No data leaves your machine
          </p>
        </div>
      </div>
    </div>
  )
}
