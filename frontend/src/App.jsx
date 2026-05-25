import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Image, Code, Eye, Home } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import PreviewPage from './pages/PreviewPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Image to HTML</h1>
                <p className="text-xs text-gray-500">AI-Powered UI Converter</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition">
                <Home className="w-4 h-4" />
                <span>Upload</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/preview/:jobId" element={<PreviewPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p>Powered by Florence-2, PaddleOCR, Qwen2.5-Coder, and Ollama</p>
            <p className="mt-1">Optimized for RTX 3060 6GB with 4-bit quantization</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
