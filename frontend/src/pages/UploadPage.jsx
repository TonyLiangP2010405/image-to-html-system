import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileImage, Loader2, ArrowRight, Zap, Eye, Code2, Download, ImageIcon } from 'lucide-react'
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
      setError('请上传图片文件 (PNG/JPG/WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('文件太大，最大 10MB')
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
        timeout: 180000,
      })
      const { job_id } = response.data
      navigate(`/preview/${job_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up">
      {/* Hero 区域 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          <span>本地 AI 处理，数据不上云</span>
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          截图转 HTML
        </h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          上传网页截图或 App 界面，AI 自动识别布局、文字和组件，生成干净的 Tailwind CSS HTML 代码
        </p>
      </div>

      {/* 上传区域 */}
      <div className="max-w-xl mx-auto mb-16">
        <div
          className={`
            relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
            transition-all duration-300
            ${dragActive
              ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100'
              : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
            }
          `}
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
            <div className="space-y-4 animate-fade-in">
              <img src={preview} alt="Preview" className="max-h-56 mx-auto rounded-xl shadow-md ring-1 ring-slate-200" />
              <p className="text-sm font-medium text-slate-600">{selectedFile?.name}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">
                  拖拽图片到此处，或点击上传
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  支持 PNG、JPG、WEBP、BMP（最大 10MB）
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {selectedFile && (
          <div className="mt-6 text-center animate-fade-in">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white gradient-bg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  生成 HTML
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-slate-400">
              预计耗时 30–60 秒，取决于图片复杂度
            </p>
          </div>
        )}
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Eye className="w-6 h-6" />,
            title: '智能 OCR + 布局分析',
            desc: '使用 Florence-2 和 PaddleOCR 识别文字、按钮、输入框等 UI 组件',
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50',
          },
          {
            icon: <Code2 className="w-6 h-6" />,
            title: 'AI 生成 HTML',
            desc: 'Qwen2.5-Coder 7B 自动生成语义化 HTML + Tailwind CSS',
            color: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-50',
          },
          {
            icon: <Download className="w-6 h-6" />,
            title: '实时预览 + 下载',
            desc: '即时预览生成的网页，一键下载源码，响应式适配',
            color: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50',
          },
        ].map((card, i) => (
          <div
            key={i}
            className="group bg-white rounded-2xl p-6 border border-slate-100 card-shadow hover-lift cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <div className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
                {card.icon}
              </div>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
