import type { TransferRequest } from '../types'

interface TransferModalProps {
  request: TransferRequest
  onSign: (role: 'head_nurse' | 'infection_control' | 'bed_manager') => void
  onClose: () => void
}

export function TransferModal({ request, onSign, onClose }: TransferModalProps) {
  const roleLabels: Record<string, string> = {
    head_nurse: '护士长',
    infection_control: '感控护士',
    bed_manager: '床位中心'
  }

  const allSigned = request.signatures.every(s => s.signed)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>调床建议单</h2>

        <h3>调床建议</h3>
        {request.suggestions.map((suggestion, idx) => (
          <div key={idx} className="suggestion-item">
            <strong>{suggestion.from_bed_id} → {suggestion.to_bed_id}</strong>
            <p>患者: {suggestion.patient_id}</p>
            <p>原因: {suggestion.reason}</p>
            {suggestion.conflicts && suggestion.conflicts.length > 0 && (
              <ul className="conflict-list">
                {suggestion.conflicts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <h3>三方会签</h3>
        <div className="signature-section">
          {request.signatures.map(sig => (
            <div key={sig.role} className={`signature-item ${sig.signed ? 'signed' : ''}`}>
              <h4>{roleLabels[sig.role]}</h4>
              {sig.signed ? (
                <p>✓ 已签署</p>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => onSign(sig.role as 'head_nurse' | 'infection_control' | 'bed_manager')}
                >
                  签署
                </button>
              )}
            </div>
          ))}
        </div>

        {allSigned && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(0, 212, 255, 0.1)', borderRadius: 8, textAlign: 'center' }}>
            <p style={{ color: '#00d4ff' }}>✓ 三方会签已完成，调床建议已提交执行</p>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}