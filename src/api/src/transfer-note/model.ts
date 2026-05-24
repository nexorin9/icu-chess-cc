// Transfer note data model
export interface TransferNote {
  id: string;
  suggestionId: string;
  fromBed: string;
  toBed: string;
  patient: {
    id: string;
    name: string;
    isolationLevel: string;
  };
  reason: string;
  priority: number;
  conflicts: string[];
  signatures: {
    role: string;
    signer: string;
    signed: boolean;
    signedAt?: string;
    comment?: string;
  }[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
}

// Generate transfer note from transfer suggestion
export function generateTransferNote(
  suggestion: any,
  patient: any,
  signatures: any[]
): TransferNote {
  const now = new Date().toISOString();
  return {
    id: `TN_${Date.now()}`,
    suggestionId: suggestion.id,
    fromBed: suggestion.fromBed,
    toBed: suggestion.toBed,
    patient: {
      id: patient.id,
      name: patient.name,
      isolationLevel: patient.isolationLevel
    },
    reason: suggestion.reason,
    priority: suggestion.priority,
    conflicts: suggestion.conflicts || [],
    signatures: signatures.map(s => ({
      role: s.role,
      signer: s.signer || '',
      signed: s.signed || false,
      signedAt: s.signedAt,
      comment: s.comment
    })),
    status: suggestion.status === 'COMPLETED' ? 'APPROVED' : 'PENDING',
    createdAt: suggestion.createdAt || now,
    approvedAt: suggestion.status === 'COMPLETED' ? now : undefined
  };
}

// Format date for display
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get conflict description in Chinese
export function getConflictDescription(conflict: string): string {
  const descriptions: Record<string, string> = {
    'MRSA_ADJACENT_IMMUNOCOMPROMISED': 'MRSA患者与免疫抑制患者相邻',
    'VRE_ADJACENT_IMMUNOCOMPROMISED': 'VRE患者与免疫抑制患者相邻',
    'AIRBORNE_ADJACENT': '空气隔离患者与他人相邻',
    'PROTECTIVE_ADJACENT_MRSA': '保护性隔离床位安置了MRSA患者',
    'PROTECTIVE_ADJACENT_VRE': '保护性隔离床位安置了VRE患者',
    'PROTECTIVE_ADJACENT_IMMUNOCOMPROMISED': '保护性隔离床位安置了免疫抑制患者'
  };
  return descriptions[conflict] || conflict;
}

// Get role description in Chinese
export function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    'head_nurse': '护士长',
    'infection_control': '感控科',
    'bed_manager': '床位管理中心',
    'nurse_manager': '护士长',
    'icc': '感控科',
    'bed_center': '床位中心'
  };
  return descriptions[role] || role;
}