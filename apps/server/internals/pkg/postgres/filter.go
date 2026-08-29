package postgres

import (
	"fmt"
	"strings"
)

// QueryFilter manages SQL WHERE clauses and positional query arguments ($1, $2, ...).
type QueryFilter struct {
	conditions []string
	Args       []any
}

// NewFilter creates a new QueryFilter pre-populated with optional initial arguments.
func NewFilter(initialArgs ...any) *QueryFilter {
	qf := &QueryFilter{
		conditions: make([]string, 0),
		Args:       make([]any, 0, len(initialArgs)),
	}
	if len(initialArgs) > 0 {
		qf.Args = append(qf.Args, initialArgs...)
	}
	return qf
}

// NextIdx returns the 1-based parameter index for the next argument ($N).
func (f *QueryFilter) NextIdx() int {
	return len(f.Args) + 1
}

// Add formats clauseFormat with the next argument index (%d -> $N), adds the condition, and appends val to Args.
// Example: filter.Add("u.name ILIKE $%d", "%"+userName+"%")
func (f *QueryFilter) Add(clauseFormat string, val any) *QueryFilter {
	f.conditions = append(f.conditions, fmt.Sprintf(clauseFormat, f.NextIdx()))
	f.Args = append(f.Args, val)
	return f
}

// Add2 formats clauseFormat with the next argument index twice (%d and %d -> $N and $N), and appends val once.
// Useful for conditions like: filter.Add2("(c.title ILIKE $%d OR c.short_description ILIKE $%d)", "%"+search+"%")
func (f *QueryFilter) Add2(clauseFormat string, val any) *QueryFilter {
	idx := f.NextIdx()
	f.conditions = append(f.conditions, fmt.Sprintf(clauseFormat, idx, idx))
	f.Args = append(f.Args, val)
	return f
}

// AddRaw appends a static SQL condition that does not require parameterized arguments.
// Example: filter.AddRaw("e.revoked = true") or filter.AddRaw("c.status = 'published'")
func (f *QueryFilter) AddRaw(clause string) *QueryFilter {
	if clause != "" {
		f.conditions = append(f.conditions, clause)
	}
	return f
}

// AddArgs appends additional query parameters (e.g. limit, offset) to Args without adding conditions.
func (f *QueryFilter) AddArgs(args ...any) *QueryFilter {
	f.Args = append(f.Args, args...)
	return f
}

// Conditions returns all current conditions.
func (f *QueryFilter) Conditions() []string {
	return f.conditions
}

// Join joins all conditions with " AND ". If no conditions exist, defaultClause is returned.
// Example: filter.Join("1=1") or filter.Join("")
func (f *QueryFilter) Join(defaultClause string) string {
	if len(f.conditions) == 0 {
		return defaultClause
	}
	return strings.Join(f.conditions, " AND ")
}

// Where returns "WHERE <conditions>" if conditions exist, or defaultClause if empty.
// Example: filter.Where("") returns "WHERE a = $1" or ""
func (f *QueryFilter) Where(defaultClause string) string {
	j := f.Join("")
	if j == "" {
		return defaultClause
	}
	return "WHERE " + j
}

// AndPrefix returns " AND <conditions>" if conditions exist, or "" if empty.
func (f *QueryFilter) AndPrefix() string {
	j := f.Join("")
	if j == "" {
		return ""
	}
	return " AND " + j
}
