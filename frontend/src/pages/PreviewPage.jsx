import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Code, Eye, FileJson, Loader2, ArrowLeft, Copy, Check } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PreviewPage() {
  const { jobId } = useParams()
  const [activeTab, setActiveTab] = useState('preview')
  const [html, setHtml] = useState('')
  const [layout, setLayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadResult()
  }, [jobId])

  const loadResult = async () => {
    setLoading(true)
    try {
      // Get HTML
      const htmlResponse = await axios.get(`${API_BASE}/preview/${jobId}`, {
        timeout: 30000,
      })
      setHtml(htmlResponse.data)
      
      // Get layout JSON
      try {
        const layoutResponse = await axios.get(`${API_BASE}/api/layout/${jobId}`, {
          timeout: 10000,
        })
        setLayout(layoutResponse.data)
      } catch (e) {
        console.warn('Layout fetch failed:', e)
      }
    } catch (err) {
      console.error('Load error:', err)
      setError('Failed to load result. Please try uploading again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/download/${jobId}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `generated_${jobId}.html`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Download failed')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-900">Loading result...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Generated Result</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Download HTML
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {[
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'code', label: 'HTML Code', icon: Code },
            { id: 'layout', label: 'Layout JSON', icon: FileJson },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {activeTab === 'preview' && (
          <div className="p-1">
            <iframe
              srcDoc={html}
              className="w-full min-h-[600px] border-0 rounded-lg"
              title="HTML Preview"
              sandbox="allow-scripts"
            />
          </div>
        )}
        
        {activeTab === 'code' && (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="p-6 overflow-auto max-h-[600px] text-sm bg-gray-900 text-gray-100">
              <code>{html}</code>
            </pre>
          </div>
        )}
        
        {activeTab === 'layout' && (
          <div className="relative">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(layout, null, 2))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="p-6 overflow-auto max-h-[600px] text-sm bg-gray-900 text-gray-100">
              <code>{JSON.stringify(layout, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
