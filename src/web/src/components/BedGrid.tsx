import type { Bed } from '../types'

interface BedGridProps {
  beds: Bed[][]
  conflicts: Record<string, string[]>
  selectedBed: Bed | null
  onSelectBed: (bed: Bed) => void
}

export function BedGrid({ beds, conflicts, selectedBed, onSelectBed }: BedGridProps) {
  if (!beds || beds.length === 0) {
    return <div className="loading">暂无床位数据</div>
  }

  const getBedClass = (bed: Bed): string => {
    const classes = ['bed-cell']
    if (!bed.patient) {
      classes.push('empty')
    } else {
      classes.push(bed.bedType)
      if (conflicts[bed.id]) {
        classes.push('warning')
      }
    }
    if (selectedBed?.id === bed.id) {
      classes.push('selected')
    }
    return classes.join(' ')
  }

  const getPatientTags = (bed: Bed) => {
    if (!bed.patient) return null
    const tags: { type: string; label: string }[] = []
    if (bed.patient.isMRSA) tags.push({ type: 'tag-mrsa', label: 'MRSA' })
    if (bed.patient.isVRE) tags.push({ type: 'tag-vre', label: 'VRE' })
    if (bed.patient.isImmunocompromised) tags.push({ type: 'tag-immuno', label: '免疫抑制' })
    if (bed.patient.isolationLevel === 'airborne') tags.push({ type: 'tag-airborne', label: '空气隔离' })
    if (bed.patient.isolationLevel === 'contact') tags.push({ type: 'tag-contact', label: '接触隔离' })
    if (bed.patient.isolationLevel === 'droplet') tags.push({ type: 'tag-droplet', label: '飞沫隔离' })
    return tags
  }

  return (
    <div className="bed-grid">
      {beds.flat().map((bed) => {
        const tags = getPatientTags(bed)
        return (
          <div
            key={bed.id}
            className={getBedClass(bed)}
            onClick={() => onSelectBed(bed)}
            title={conflicts[bed.id] ? `冲突: ${conflicts[bed.id].join(', ')}` : ''}
          >
            <div className="bed-id">{bed.id}</div>
            {bed.patient ? (
              <>
                <div className="patient-name">{bed.patient.name}</div>
                <div className="patient-tags">
                  {tags && tags.map((tag) => (
                    <span key={tag.type} className={`tag ${tag.type}`}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="patient-name" style={{ color: '#555' }}>空床</div>
            )}
          </div>
        )
      })}
    </div>
  )
}