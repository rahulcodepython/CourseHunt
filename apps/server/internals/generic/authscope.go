package generic

type AuthScope string

const (
	ScopeAdmin AuthScope = "admin"
	ScopeTutor AuthScope = "tutor"
	ScopeUser  AuthScope = "user"
)

