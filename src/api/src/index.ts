import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import {
  createTransferNote,
  getTransferNote,
  getAllTransferNotes,
  updateTransferNoteSignature,
  renderNoteAsHTML,
  renderNoteAsPlain
} from './transfer-note';

const app: Application = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bed data endpoint
app.get('/api/beds', (_req: Request, res: Response) => {
  const beds = [
    { id: 'A1', row: 0, col: 0, unit: 'ICU-A', occupied: true, patient: { id: 'P001', name: '张三', isolationLevel: 'MRSA' } },
    { id: 'A2', row: 0, col: 1, unit: 'ICU-A', occupied: true, patient: { id: 'P002', name: '李四', isolationLevel: 'NONE' } },
    { id: 'A3', row: 0, col: 2, unit: 'ICU-A', occupied: true, patient: { id: 'P003', name: '王五', isolationLevel: 'IMMUNOCOMPROMISED' } },
    { id: 'A4', row: 0, col: 3, unit: 'ICU-A', occupied: false, patient: null },
    { id: 'B1', row: 1, col: 0, unit: 'ICU-A', occupied: true, patient: { id: 'P004', name: '赵六', isolationLevel: 'NONE' } },
    { id: 'B2', row: 1, col: 1, unit: 'ICU-A', occupied: true, patient: { id: 'P005', name: '钱七', isolationLevel: 'VRE' } },
    { id: 'B3', row: 1, col: 2, unit: 'ICU-A', occupied: false, patient: null },
    { id: 'B4', row: 1, col: 3, unit: 'ICU-A', occupied: true, patient: { id: 'P006', name: '孙八', isolationLevel: 'PROTECTIVE' } },
    { id: 'C1', row: 2, col: 0, unit: 'ICU-A', occupied: true, patient: { id: 'P007', name: '周九', isolationLevel: 'NONE' } },
    { id: 'C2', row: 2, col: 1, unit: 'ICU-A', occupied: false, patient: null },
    { id: 'C3', row: 2, col: 2, unit: 'ICU-A', occupied: true, patient: { id: 'P008', name: '吴十', isolationLevel: 'AIRBORNE' } },
    { id: 'C4', row: 2, col: 3, unit: 'ICU-A', occupied: false, patient: null },
  ];
  res.json({ success: true, data: beds });
});

// Transfer suggestion endpoint
app.get('/api/transfer-suggestions', (_req: Request, res: Response) => {
  const suggestions = [
    {
      id: 'SUG001',
      fromBed: 'A1',
      toBed: 'A4',
      reason: 'MRSA患者(A1)周围检测到免疫抑制患者(A3)，建议调床',
      priority: 1,
      conflicts: ['MRSA_ADJACENT_IMMUNOCOMPROMISED'],
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    },
    {
      id: 'SUG002',
      fromBed: 'A3',
      toBed: 'C2',
      reason: '免疫抑制患者(A3)周围检测到MRSA患者(A1)，建议调床',
      priority: 1,
      conflicts: ['MRSA_ADJACENT_IMMUNOCOMPROMISED'],
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    }
  ];
  res.json({ success: true, data: suggestions });
});

// Signature session endpoints
let signatureSessions: any[] = [];

app.post('/api/signature-sessions', (req: Request, res: Response) => {
  const { suggestionId, requiredSigners } = req.body;
  const session = {
    id: `SS_${Date.now()}`,
    suggestionId,
    requiredSigners,
    signatures: [],
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  signatureSessions.push(session);
  res.json({ success: true, data: session });
});

app.get('/api/signature-sessions/:id', (req: Request, res: Response) => {
  const session = signatureSessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, data: session });
});

app.post('/api/signature-sessions/:id/sign', (req: Request, res: Response) => {
  const { signer, role, decision, comment } = req.body;
  const session = signatureSessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  session.signatures.push({ signer, role, decision, comment, signedAt: new Date().toISOString() });
  if (session.signatures.length >= session.requiredSigners.length) {
    session.status = 'COMPLETED';
  }
  res.json({ success: true, data: session });
});

app.get('/api/signature-sessions', (_req: Request, res: Response) => {
  res.json({ success: true, data: signatureSessions });
});

// Transfer note endpoints
app.post('/api/transfer-notes', (req: Request, res: Response) => {
  const { suggestionId, fromBed, toBed, patient, reason, priority, conflicts, signatures } = req.body;
  const note = createTransferNote(suggestionId, fromBed, toBed, patient, reason, priority, conflicts, signatures);
  res.json({ success: true, data: note });
});

app.get('/api/transfer-notes', (_req: Request, res: Response) => {
  const notes = getAllTransferNotes();
  res.json({ success: true, data: notes });
});

app.get('/api/transfer-notes/:id', (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const note = getTransferNote(noteId);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Transfer note not found' });
  }
  res.json({ success: true, data: note });
});

app.patch('/api/transfer-notes/:id/sign', (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const { role, signer, comment } = req.body;
  const note = updateTransferNoteSignature(noteId, role, signer, comment);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Transfer note not found' });
  }
  res.json({ success: true, data: note });
});

app.get('/api/transfer-notes/:id/html', (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const html = renderNoteAsHTML(noteId);
  if (!html) {
    return res.status(404).json({ success: false, error: 'Transfer note not found' });
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.get('/api/transfer-notes/:id/print', (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const html = renderNoteAsHTML(noteId);
  if (!html) {
    return res.status(404).json({ success: false, error: 'Transfer note not found' });
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`ICU-Chess-CC API server running on port ${PORT}`);
});

export default app;