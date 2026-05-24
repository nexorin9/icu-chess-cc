package rules

import (
	"fmt"
)

// IsolationLevel represents the isolation requirement level
type IsolationLevel int

const (
	IsolationLevelNone IsolationLevel = iota
	IsolationLevelContact
	IsolationLevelDroplet
	IsolationLevelAirborne
	IsolationLevelProtective
)

// Patient represents a patient in ICU
type Patient struct {
	ID                 string
	Name               string
	IsolationLevel     IsolationLevel
	IsImmunocompromised bool
	IsMRSA              bool
	IsVRE               bool
	Condition           string
}

// Bed represents a bed in ICU
type Bed struct {
	ID       string
	Row      int
	Col      int
	Patient  *Patient
	BedType  string // "normal", "isolation", "protective"
}

// IsolationRequirement defines which patients cannot be adjacent
type IsolationRequirement struct {
	PatientType   string
	ExclusionMask IsolationLevel
	Description   string
}

// RuleEngine handles isolation constraint calculations
type RuleEngine struct {
	requirements []IsolationRequirement
}

// NewRuleEngine creates a new isolation rule engine
func NewRuleEngine() *RuleEngine {
	return &RuleEngine{
		requirements: []IsolationRequirement{
			{
				PatientType:   "MRSA",
				ExclusionMask: IsolationLevelProtective,
				Description:   "MRSA患者周围不能有免疫抑制患者",
			},
			{
				PatientType:   "VRE",
				ExclusionMask: IsolationLevelProtective,
				Description:   "VRE患者周围不能有免疫抑制患者",
			},
			{
				PatientType:   "Airborne",
				ExclusionMask: IsolationLevelContact | IsolationLevelDroplet,
				Description:   "空气隔离患者需要独立空间",
			},
		},
	}
}

// Transfer Suggestion represents a suggested bed transfer
type TransferSuggestion struct {
	PatientID    string `json:"patient_id"`
	FromBedID    string `json:"from_bed_id"`
	ToBedID      string `json:"to_bed_id"`
	Reason       string `json:"reason"`
	Priority     int    `json:"priority"`
	Conflicts    []string `json:"conflicts,omitempty"`
}

// ValidateBedPlacement checks if a patient can be placed in a specific bed
func (e *RuleEngine) ValidateBedPlacement(patient *Patient, bed *Bed, grid [][]*Bed) (bool, []string) {
	conflicts := []string{}

	if bed.Patient != nil {
		conflicts = append(conflicts, fmt.Sprintf("床位 %s 已被占用", bed.ID))
		return false, conflicts
	}

	// Check isolation type compatibility
	if patient.IsMRSA && bed.BedType == "protective" {
		conflicts = append(conflicts, "MRSA患者不能安置在保护性隔离床位")
	}

	if patient.IsVRE && bed.BedType == "protective" {
		conflicts = append(conflicts, "VRE患者不能安置在保护性隔离床位")
	}

	if patient.IsImmunocompromised && bed.BedType == "isolation" {
		conflicts = append(conflicts, "免疫抑制患者不宜安置在隔离床位")
	}

	// Check adjacent beds for conflicts
	adjacentBeds := e.GetAdjacentBeds(bed, grid)
	for _, adjBed := range adjacentBeds {
		if adjBed.Patient == nil {
			continue
		}

		// MRSA patient adjacent to immunocompromised patient
		if patient.IsMRSA && adjBed.Patient.IsImmunocompromised {
			conflicts = append(conflicts, fmt.Sprintf("床位 %s 的免疫抑制患者与MRSA患者相邻", adjBed.ID))
		}

		if patient.IsImmunocompromised && adjBed.Patient.IsMRSA {
			conflicts = append(conflicts, fmt.Sprintf("床位 %s 的MRSA患者与免疫抑制患者相邻", adjBed.ID))
		}

		// VRE patient adjacent to immunocompromised patient
		if patient.IsVRE && adjBed.Patient.IsImmunocompromised {
			conflicts = append(conflicts, fmt.Sprintf("床位 %s 的免疫抑制患者与VRE患者相邻", adjBed.ID))
		}

		if patient.IsImmunocompromised && adjBed.Patient.IsVRE {
			conflicts = append(conflicts, fmt.Sprintf("床位 %s 的VRE患者与免疫抑制患者相邻", adjBed.ID))
		}
	}

	return len(conflicts) == 0, conflicts
}

// GetAdjacentBeds returns all adjacent beds (up, down, left, right)
func (e *RuleEngine) GetAdjacentBeds(bed *Bed, grid [][]*Bed) []*Bed {
	var adjacent []*Bed
	rows := len(grid)
	if rows == 0 {
		return adjacent
	}
	cols := len(grid[0])

	directions := []struct{ dr, dc int }{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

	for _, dir := range directions {
		newRow := bed.Row + dir.dr
		newCol := bed.Col + dir.dc

		if newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols {
			if grid[newRow][newCol] != nil {
				adjacent = append(adjacent, grid[newRow][newCol])
			}
		}
	}

	return adjacent
}

// GenerateTransferSuggestions generates transfer suggestions to resolve conflicts
func (e *RuleEngine) GenerateTransferSuggestions(beds [][]*Bed) []TransferSuggestion {
	var suggestions []TransferSuggestion

	// First pass: identify all conflicts
	type conflictPair struct {
		patient  *Patient
		bed      *Bed
		conflicts []string
	}

	var conflictedBeds []conflictPair

	for row := range beds {
		for col := range beds[row] {
			bed := beds[row][col]
			if bed == nil || bed.Patient == nil {
				continue
			}

			valid, conflicts := e.ValidateBedPlacement(bed.Patient, bed, beds)
			if !valid {
				conflictedBeds = append(conflictedBeds, conflictPair{
					patient:  bed.Patient,
					bed:      bed,
					conflicts: conflicts,
				})
			}
		}
	}

	// Generate transfer suggestions for each conflicted bed
	for _, cp := range conflictedBeds {
		// Find a suitable alternative bed
		for row := range beds {
			for col := range beds[row] {
				targetBed := beds[row][col]
				if targetBed == nil || targetBed.Patient != nil {
					continue
				}

				valid, _ := e.ValidateBedPlacement(cp.patient, targetBed, beds)
				if valid {
					suggestions = append(suggestions, TransferSuggestion{
						PatientID: cp.patient.ID,
						FromBedID: cp.bed.ID,
						ToBedID:   targetBed.ID,
						Reason:    cp.conflicts[0],
						Priority:  e.calculatePriority(cp.conflicts),
						Conflicts: cp.conflicts,
					})
					break
				}
			}

			if len(suggestions) > 0 && suggestions[len(suggestions)-1].PatientID == cp.patient.ID {
				break
			}
		}
	}

	return suggestions
}

// calculatePriority calculates the priority of a transfer suggestion
func (e *RuleEngine) calculatePriority(conflicts []string) int {
	priority := 1
	for _, conflict := range conflicts {
		if len(conflict) > 0 {
			priority = 2 // Default medium priority for conflicts
			break
		}
	}
	return priority
}

// CheckAllBeds validates all beds and returns conflicts
func (e *RuleEngine) CheckAllBeds(beds [][]*Bed) map[string][]string {
	conflictsMap := make(map[string][]string)

	for row := range beds {
		for col := range beds[row] {
			bed := beds[row][col]
			if bed == nil || bed.Patient == nil {
				continue
			}

			valid, conflicts := e.ValidateBedPlacement(bed.Patient, bed, beds)
			if !valid {
				conflictsMap[bed.ID] = conflicts
			}
		}
	}

	return conflictsMap
}