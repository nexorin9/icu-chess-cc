import { useEffect, useState } from 'react'
import type { Bed, TransferRequest } from './types'
import { BedGrid } from './components/BedGrid'
import { TransferModal } from './components/TransferModal'

function App() {
  const [beds, setBeds] = useState<Bed[][]>([])
  const [conflicts, setConflicts] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null)

  const fetchBeds = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/beds')
      if (!res.ok) throw new Error('Failed to fetch beds')
      const data = await res.json()
      setBeds(data.beds)
      setConflicts(data.conflicts || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransferSuggestions = async () => {
    try {
      const res = await fetch('/api/transfer-suggestions')
      if (!res.ok) throw new Error('Failed to fetch suggestions')
      const data = await res.json()
      if (data.suggestions && data.suggestions.length > 0) {
        setTransferRequest({
          id: `req-${Date.now()}`,
          suggestions: data.suggestions,
          signatures: [
            { role: 'head_nurse', signed: false },
            { role: 'infection_control', signed: false },
            { role: 'bed_manager', signed: false }
          ],
          status: 'pending',
          createdAt: new Date().toISOString()
        })
        setShowTransferModal(true)
      } else {
        alert('当前无隔离冲突，无需调床建议')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleSign = async (role: 'head_nurse' | 'infection_control' | 'bed_manager') => {
    if (!transferRequest) return
    const updated = {
      ...transferRequest,
      signatures: transferRequest.signatures.map(s =>
        s.role === role ? { ...s, signed: true, signedBy: 'User', signedAt: new Date().toISOString() } : s
      )
    }
    setTransferRequest(updated)

    if (updated.signatures.every(s => s.signed)) {
      updated.status = 'approved'
      try {
        await fetch('/api/transfer-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
        await fetchBeds()
        setShowTransferModal(false)
        alert('调床建议已通过三方会签执行完成')
      } catch {
        setError('执行调床失败')
      }
    }
  }

  useEffect(() => {
    fetchBeds()
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="app">
      <header className="header">
        <h1>ICU-Chess-CC</h1>
        <p>战棋格隔离调床会签协同台</p>
      </header>

      <div className="controls">
        <button className="btn btn-primary" onClick={fetchBeds}>刷新床位</button>
        <button className="btn btn-secondary" onClick={fetchTransferSuggestions}>生成调床建议</button>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#2a4a2a' }} />
          <span>普通床位</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4a2a2a' }} />
          <span>隔离床位</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#2a2a4a' }} />
          <span>保护性隔离</span>
        </div>
        <div className="legend-item">
          <span className="tag tag-mrsa">MRSA</span>
          <span>耐甲氧西林金葡菌</span>
        </div>
        <div className="legend-item">
          <span className="tag tag-vre">VRE</span>
          <span>耐万古霉素肠球菌</span>
        </div>
        <div className="legend-item">
          <span className="tag tag-immuno">免疫抑制</span>
          <span>免疫抑制患者</span>
        </div>
      </div>

      <BedGrid beds={beds} conflicts={conflicts} selectedBed={selectedBed} onSelectBed={setSelectedBed} />

      {showTransferModal && transferRequest && (
        <TransferModal
          request={transferRequest}
          onSign={handleSign}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}

export default App