import { TransferNote } from './model';
import { renderTransferNoteHTML, renderTransferNotePlain } from './renderer';

// API response helper
export interface TransferNoteResponse {
  success: boolean;
  data?: TransferNote | TransferNote[];
  error?: string;
}

// In-memory store for transfer notes (in production, use a database)
const transferNotes: Map<string, TransferNote> = new Map();

// Create a new transfer note
export function createTransferNote(
  suggestionId: string,
  fromBed: string,
  toBed: string,
  patient: { id: string; name: string; isolationLevel: string },
  reason: string,
  priority: number,
  conflicts: string[],
  signatures: { role: string; signer: string; signed: boolean; signedAt?: string; comment?: string }[]
): TransferNote {
  const now = new Date().toISOString();
  const note: TransferNote = {
    id: `TN_${Date.now()}`,
    suggestionId,
    fromBed,
    toBed,
    patient,
    reason,
    priority,
    conflicts,
    signatures: signatures.map(s => ({
      role: s.role,
      signer: s.signer || '',
      signed: s.signed,
      signedAt: s.signedAt,
      comment: s.comment
    })),
    status: signatures.every(s => s.signed) ? 'APPROVED' : 'PENDING',
    createdAt: now,
    approvedAt: signatures.every(s => s.signed) ? now : undefined
  };

  transferNotes.set(note.id, note);
  return note;
}

// Get transfer note by ID
export function getTransferNote(id: string): TransferNote | undefined {
  return transferNotes.get(id);
}

// Get all transfer notes
export function getAllTransferNotes(): TransferNote[] {
  return Array.from(transferNotes.values());
}

// Update transfer note signatures
export function updateTransferNoteSignature(
  id: string,
  role: string,
  signer: string,
  comment?: string
): TransferNote | undefined {
  const note = transferNotes.get(id);
  if (!note) return undefined;

  const signature = note.signatures.find(s => s.role === role);
  if (signature) {
    signature.signed = true;
    signature.signer = signer;
    signature.signedAt = new Date().toISOString();
    signature.comment = comment;

    // Check if all signed
    if (note.signatures.every(s => s.signed)) {
      note.status = 'APPROVED';
      note.approvedAt = new Date().toISOString();
    }
  }

  return note;
}

// Render transfer note as HTML
export function renderNoteAsHTML(id: string): string | undefined {
  const note = transferNotes.get(id);
  if (!note) return undefined;
  return renderTransferNoteHTML(note);
}

// Render transfer note as plain text
export function renderNoteAsPlain(id: string): string | undefined {
  const note = transferNotes.get(id);
  if (!note) return undefined;
  return renderTransferNotePlain(note);
}

// Export functions for use in other modules
export { TransferNote } from './model';
export { renderTransferNoteHTML, renderTransferNotePlain } from './renderer';