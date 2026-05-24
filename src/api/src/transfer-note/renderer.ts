import { TransferNote } from './model';
import { formatDate, getConflictDescription, getRoleDescription } from './model';

// Transfer note HTML template
export function renderTransferNoteHTML(note: TransferNote): string {
  const conflictsHtml = note.conflicts
    .map(c => `<li>${getConflictDescription(c)}</li>`)
    .join('');

  const signaturesHtml = note.signatures
    .map(s => {
      const roleDesc = getRoleDescription(s.role);
      const status = s.signed ? '✓' : '○';
      const signedInfo = s.signed
        ? `<div class="signature-info">签署人：${s.signer} | ${s.signedAt ? formatDate(s.signedAt) : ''}</div>
           <div class="signature-comment">备注：${s.comment || ''}</div>`
        : '';
      return `
        <div class="signature-item ${s.signed ? 'signed' : ''}">
          <div class="signature-role">${status} ${roleDesc}</div>
          ${signedInfo}
          <div class="signature-line"></div>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ICU调床建议单 - ${note.id}</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 20px;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
    }
    .section-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
      color: #333;
      border-left: 3px solid #333;
      padding-left: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      font-weight: bold;
      width: 100px;
      flex-shrink: 0;
    }
    .info-value {
      flex: 1;
    }
    .conflict-list {
      margin: 0;
      padding-left: 20px;
    }
    .conflict-list li {
      margin: 5px 0;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .signature-item {
      flex: 1;
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .signature-item.signed {
      border-color: #4caf50;
      background-color: #f1f8f1;
    }
    .signature-role {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .signature-info {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .signature-comment {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
    .signature-line {
      height: 30px;
      border-bottom: 1px solid #333;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .print-btn {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px 20px;
      background: #333;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-btn:hover {
      background: #555;
    }
    @media print {
      .print-btn { display: none; }
    }
    .isolation-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
    .tag-mrsa { background: #ffebee; color: #c62828; }
    .tag-vre { background: #fff3e0; color: #e65100; }
    .tag-immuno { background: #e3f2fd; color: #1565c0; }
    .tag-airborne { background: #f3e5f5; color: #6a1b9a; }
    .tag-protective { background: #e8f5e9; color: #2e7d32; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ICU 调床建议单</h1>
    <div class="subtitle">Isolation Transfer Suggestion Form</div>
  </div>

  <div class="section">
    <div class="section-title">基本信息</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">单据编号：</span>
        <span class="info-value">${note.id}</span>
      </div>
      <div class="info-item">
        <span class="info-label">建议时间：</span>
        <span class="info-value">${formatDate(note.createdAt)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">原床位：</span>
        <span class="info-value">${note.fromBed}</span>
      </div>
      <div class="info-item">
        <span class="info-label">目标床位：</span>
        <span class="info-value">${note.toBed}</span>
      </div>
      <div class="info-item">
        <span class="info-label">患者姓名：</span>
        <span class="info-value">${note.patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">患者ID：</span>
        <span class="info-value">${note.patient.id}</span>
      </div>
      <div class="info-item">
        <span class="info-label">隔离等级：</span>
        <span class="info-value">${note.patient.isolationLevel}</span>
      </div>
      <div class="info-item">
        <span class="info-label">优先级：</span>
        <span class="info-value">${note.priority === 1 ? '高' : note.priority === 2 ? '中' : '低'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">调床原因</div>
    <p>${note.reason}</p>
    <div style="margin-top: 10px;">
      <strong>冲突类型：</strong>
      <ul class="conflict-list">
        ${conflictsHtml}
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">三方会签</div>
    <div class="signatures">
      ${signaturesHtml}
    </div>
  </div>

  <div class="section">
    <div class="section-title">会签状态</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">状态：</span>
        <span class="info-value">${
          note.status === 'APPROVED' ? '✓ 已批准' :
          note.status === 'REJECTED' ? '✗ 已拒绝' : '○ 待会签'
        }</span>
      </div>
      <div class="info-item">
        <span class="info-label">批准时间：</span>
        <span class="info-value">${note.approvedAt ? formatDate(note.approvedAt) : '-'}</span>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">打印调床单</button>

  <div class="footer">
    本表单由 ICU-Chess-CC 系统生成 | 打印时间：${formatDate(new Date().toISOString())}
  </div>
</body>
</html>
  `.trim();
}

// Plain text version for console/debug
export function renderTransferNotePlain(note: TransferNote): string {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    '                    ICU 调床建议单',
    '═══════════════════════════════════════════════════════════',
    `单据编号：${note.id}`,
    `建议时间：${formatDate(note.createdAt)}`,
    '───────────────────────────────────────────────────────────',
    '【基本信息】',
    `原床位：${note.fromBed}  →  目标床位：${note.toBed}`,
    `患者姓名：${note.patient.name}`,
    `患者ID：${note.patient.id}`,
    `隔离等级：${note.patient.isolationLevel}`,
    `优先级：${note.priority === 1 ? '高' : note.priority === 2 ? '中' : '低'}`,
    '───────────────────────────────────────────────────────────',
    '【调床原因】',
    note.reason,
    '',
    '【冲突类型】',
    ...note.conflicts.map(c => `  • ${getConflictDescription(c)}`),
    '───────────────────────────────────────────────────────────',
    '【三方会签】',
    ...note.signatures.map(s => {
      const roleDesc = getRoleDescription(s.role);
      if (s.signed) {
        return `  ✓ ${roleDesc}：${s.signer} [${s.signedAt ? formatDate(s.signedAt) : ''}]`;
      }
      return `  ○ ${roleDesc}：待签署`;
    }),
    '───────────────────────────────────────────────────────────',
    `【会签状态】${note.status === 'APPROVED' ? '✓ 已批准' : note.status === 'REJECTED' ? '✗ 已拒绝' : '○ 待会签'}`,
    note.approvedAt ? `批准时间：${formatDate(note.approvedAt)}` : '',
    '═══════════════════════════════════════════════════════════',
  ].filter(l => l !== '');

  return lines.join('\n');
}