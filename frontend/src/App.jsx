import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Image, Sparkles } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import PreviewPage from './pages/PreviewPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 pattern-grid">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-50 glass border-b border-white/50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Image to HTML</h1>
                <p className="text-xs text-slate-400 -mt-0.5">AI-Powered UI Converter</p>
              </div>
            </Link>
            <a
              href="https://github.com/TonyLiangP2010405/image-to-html-system"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/preview/:jobId" element={<PreviewPage />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-200/60 bg-white/50 mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-400">
            <p>Powered by Florence-2 + PaddleOCR + Qwen2.5-Coder</p>
            <p>Optimized for RTX 3060 6GB</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
