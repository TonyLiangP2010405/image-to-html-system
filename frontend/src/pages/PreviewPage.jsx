import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Code2, Eye, FileJson, Loader2, ArrowLeft, Copy, Check, Sparkles, Monitor, Layers } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PreviewPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
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
      // Use fetch for HTML to avoid axios auto-parsing issues
      const htmlRes = await fetch(`${API_BASE}/api/preview/${jobId}`)
      if (!htmlRes.ok) throw new Error(`Preview failed: ${htmlRes.status}`)
      const htmlText = await htmlRes.text()
      setHtml(htmlText)
      try {
        const layoutRes = await axios.get(`${API_BASE}/api/layout/${jobId}`, { timeout: 10000 })
        setLayout(layoutRes.data)
      } catch (e) {
        console.warn('Layout fetch failed:', e)
      }
    } catch (err) {
      console.error('Preview load error:', err)
      setError('加载结果失败，请返回重新上传')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/download/${jobId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `generated_${jobId}.html`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('下载失败')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-600">加载结果中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上传
          </button>
        </div>
      </div>
    )
  }

  const elementsCount = layout?.elements?.length ?? 0

  return (
    <div className="animate-slide-up">
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上传
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">生成结果</h2>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {elementsCount} 个元素
                </span>
                <span className="flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" />
                  {html.length.toLocaleString()} 字符
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white gradient-bg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          下载 HTML
        </button>
      </div>

      {/* Tab 导航 */}
      <div className="bg-white rounded-t-2xl border border-slate-200/60 border-b-0">
        <div className="flex gap-1 p-1.5">
          {[
            { id: 'preview', label: '实时预览', icon: Monitor },
            { id: 'code', label: 'HTML 源码', icon: Code2 },
            { id: 'layout', label: '布局 JSON', icon: FileJson },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="bg-white rounded-b-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        {activeTab === 'preview' && (
          <div className="p-1 bg-slate-50/50">
            <iframe
              srcDoc={html}
              className="w-full min-h-[600px] border-0 rounded-xl bg-white"
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => console.log('Iframe loaded, html length:', html.length)}
            />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-600 transition-all border border-slate-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制'}
            </button>
            <pre className="p-6 overflow-auto max-h-[600px] text-sm bg-[#1e1e2e] text-[#cdd6f4]">
              <code className="font-mono">{html}</code>
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
              className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-600 transition-all border border-slate-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制'}
            </button>
            <pre className="p-6 overflow-auto max-h-[600px] text-sm bg-[#1e1e2e] text-[#cdd6f4]">
              <code className="font-mono">{JSON.stringify(layout, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
