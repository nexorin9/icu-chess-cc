package rules

import (
	"fmt"
	"testing"
)

func TestIsolationLevelConstants(t *testing.T) {
	if IsolationLevelNone != 0 {
		t.Errorf("IsolationLevelNone expected 0, got %d", IsolationLevelNone)
	}
	if IsolationLevelContact != 1 {
		t.Errorf("IsolationLevelContact expected 1, got %d", IsolationLevelContact)
	}
	if IsolationLevelDroplet != 2 {
		t.Errorf("IsolationLevelDroplet expected 2, got %d", IsolationLevelDroplet)
	}
	if IsolationLevelAirborne != 3 {
		t.Errorf("IsolationLevelAirborne expected 3, got %d", IsolationLevelAirborne)
	}
	if IsolationLevelProtective != 4 {
		t.Errorf("IsolationLevelProtective expected 4, got %d", IsolationLevelProtective)
	}
}

func TestNewRuleEngine(t *testing.T) {
	engine := NewRuleEngine()
	if engine == nil {
		t.Fatal("NewRuleEngine returned nil")
	}
	if len(engine.requirements) != 3 {
		t.Errorf("expected 3 requirements, got %d", len(engine.requirements))
	}
}

func TestGetAdjacentBeds(t *testing.T) {
	engine := NewRuleEngine()

	// Create a 3x3 grid
	grid := make([][]*Bed, 3)
	for i := range grid {
		grid[i] = make([]*Bed, 3)
		for j := range grid[i] {
			grid[i][j] = &Bed{
				ID:  fmt.Sprintf("B%d%d", i, j),
				Row: i,
				Col: j,
			}
		}
	}

	// Test center bed (1,1) - should have 4 adjacent
	center := grid[1][1]
	adjacent := engine.GetAdjacentBeds(center, grid)
	if len(adjacent) != 4 {
		t.Errorf("center bed should have 4 adjacent, got %d", len(adjacent))
	}

	// Test corner bed (0,0) - should have 2 adjacent
	corner := grid[0][0]
	adjacent = engine.GetAdjacentBeds(corner, grid)
	if len(adjacent) != 2 {
		t.Errorf("corner bed should have 2 adjacent, got %d", len(adjacent))
	}

	// Test edge bed (0,1) - should have 3 adjacent
	edge := grid[0][1]
	adjacent = engine.GetAdjacentBeds(edge, grid)
	if len(adjacent) != 3 {
		t.Errorf("edge bed should have 3 adjacent, got %d", len(adjacent))
	}
}

func TestValidateBedPlacement_EmptyBed(t *testing.T) {
	engine := NewRuleEngine()

	grid := make([][]*Bed, 2)
	for i := range grid {
		grid[i] = make([]*Bed, 2)
		for j := range grid[i] {
			grid[i][j] = &Bed{
				ID:  fmt.Sprintf("B%d%d", i, j),
				Row: i,
				Col: j,
			}
		}
	}

	patient := &Patient{
		ID:     "P1",
		Name:   "Test Patient",
		IsMRSA: false,
	}

	emptyBed := grid[0][0]
	valid, conflicts := engine.ValidateBedPlacement(patient, emptyBed, grid)
	if !valid {
		t.Errorf("expected valid placement, got conflicts: %v", conflicts)
	}
	if len(conflicts) != 0 {
		t.Errorf("expected no conflicts, got %d", len(conflicts))
	}
}

func TestValidateBedPlacement_OccupiedBed(t *testing.T) {
	engine := NewRuleEngine()

	grid := make([][]*Bed, 2)
	for i := range grid {
		grid[i] = make([]*Bed, 2)
		for j := range grid[i] {
			grid[i][j] = &Bed{
				ID:  fmt.Sprintf("B%d%d", i, j),
				Row: i,
				Col: j,
				Patient: &Patient{
					ID:   "ExistingPatient",
					Name: "Existing",
				},
			}
		}
	}

	patient := &Patient{ID: "P1", Name: "New Patient"}
	occupiedBed := grid[0][0]

	valid, conflicts := engine.ValidateBedPlacement(patient, occupiedBed, grid)
	if valid {
		t.Error("expected invalid placement for occupied bed")
	}
	if len(conflicts) == 0 {
		t.Error("expected conflicts for occupied bed")
	}
}

func TestValidateBedPlacement_MRSA_Immunocompromised(t *testing.T) {
	engine := NewRuleEngine()

	// Create 2x2 grid
	grid := make([][]*Bed, 2)
	for i := range grid {
		grid[i] = make([]*Bed, 2)
		for j := range grid[i] {
			grid[i][j] = &Bed{
				ID:       fmt.Sprintf("B%d%d", i, j),
				Row:      i,
				Col:      j,
				BedType:  "normal",
			}
		}
	}

	// Place immunocompromised patient at (0,0)
	grid[0][0].Patient = &Patient{
		ID:                 "P1",
		IsImmunocompromised: true,
	}

	// Try to place MRSA patient at (0,1) - should conflict
	mrsaPatient := &Patient{
		ID:     "P2",
		IsMRSA: true,
	}

	valid, conflicts := engine.ValidateBedPlacement(mrsaPatient, grid[0][1], grid)
	if valid {
		t.Error("expected conflict: MRSA adjacent to immunocompromised")
	}
	if len(conflicts) == 0 {
		t.Error("expected at least one conflict message")
	}
}

func TestValidateBedPlacement_ProtectiveBed(t *testing.T) {
	engine := NewRuleEngine()

	grid := make([][]*Bed, 1)
	grid[0] = make([]*Bed, 1)
	grid[0][0] = &Bed{
		ID:      "B00",
		Row:     0,
		Col:     0,
		BedType: "protective",
	}

	// MRSA patient cannot be in protective bed
	mrsaPatient := &Patient{
		ID:     "P1",
		IsMRSA: true,
	}

	valid, _ := engine.ValidateBedPlacement(mrsaPatient, grid[0][0], grid)
	if valid {
		t.Error("expected conflict: MRSA in protective bed")
	}
}

func TestCheckAllBeds(t *testing.T) {
	engine := NewRuleEngine()

	// Create 2x2 grid
	grid := make([][]*Bed, 2)
	for i := range grid {
		grid[i] = make([]*Bed, 2)
		for j := range grid[i] {
			grid[i][j] = &Bed{
				ID:       fmt.Sprintf("B%d%d", i, j),
				Row:      i,
				Col:      j,
				BedType:  "normal",
			}
		}
	}

	// Place conflicting patients: MRSA at (0,0), immunocompromised at (0,1)
	grid[0][0].Patient = &Patient{
		ID:     "P1",
		IsMRSA: true,
	}
	grid[0][1].Patient = &Patient{
		ID:                   "P2",
		IsImmunocompromised:  true,
	}

	conflicts := engine.CheckAllBeds(grid)
	if len(conflicts) == 0 {
		t.Error("expected conflicts to be detected")
	}
}

func TestCalculatePriority(t *testing.T) {
	engine := NewRuleEngine()

	// Test with conflicts
	priority := engine.calculatePriority([]string{"conflict1"})
	if priority != 2 {
		t.Errorf("expected priority 2 for conflicts, got %d", priority)
	}

	// Test with no conflicts (edge case)
	priority = engine.calculatePriority([]string{})
	if priority != 1 {
		t.Errorf("expected priority 1 for no conflicts, got %d", priority)
	}
}