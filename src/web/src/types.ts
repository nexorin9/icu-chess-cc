export type IsolationLevel = 'none' | 'contact' | 'droplet' | 'airborne' | 'protective'

export interface Patient {
  id: string
  name: string
  isolationLevel: IsolationLevel
  isImmunocompromised: boolean
  isMRSA: boolean
  isVRE: boolean
  condition: string
}

export interface Bed {
  id: string
  row: number
  col: number
  patient: Patient | null
  bedType: 'normal' | 'isolation' | 'protective'
}

export interface TransferSuggestion {
  patient_id: string
  from_bed_id: string
  to_bed_id: string
  reason: string
  priority: number
  conflicts?: string[]
}

export interface Signature {
  role: 'head_nurse' | 'infection_control' | 'bed_manager'
  signed: boolean
  signedBy?: string
  signedAt?: string
}

export interface TransferRequest {
  id: string
  suggestions: TransferSuggestion[]
  signatures: Signature[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface GridApiResponse {
  beds: Bed[][]
  conflicts: Record<string, string[]>
}