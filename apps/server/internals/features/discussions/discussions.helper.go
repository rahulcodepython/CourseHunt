package discussions

import (
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

type cachedDiscussionsList struct {
	Data  []Discussion `json:"data"`
	Total int          `json:"total"`
}

func mapDiscussionError(err error) error {
	switch {
	case errors.Is(err, generic.ErrDiscussionsTargetNotFound),
		errors.Is(err, generic.ErrDiscussionsLessonNotFound),
		errors.Is(err, generic.ErrDiscussionsDiscussionNotFound),
		errors.Is(err, generic.ErrDiscussionsParentNotFound):
		return utils.ErrNotFound("Resource not found.", err)
	case errors.Is(err, generic.ErrDiscussionsNotEnrolled),
		errors.Is(err, generic.ErrDiscussionsAccessDenied),
		errors.Is(err, generic.ErrDiscussionsParentInvalid):
		return utils.ErrForbidden(err.Error(), err)
	case errors.Is(err, generic.ErrDiscussionsMissingTarget):
		return utils.ErrBadRequest(err.Error(), err)
	default:
		return utils.ErrInternal("Operation failed.", err)
	}
}

func errorForScopeAuth(scope generic.AuthScope) error {
	switch scope {
	case generic.ScopeUser:
		return generic.ErrDiscussionsNotEnrolled
	case generic.ScopeTutor:
		return generic.ErrDiscussionsAccessDenied
	default:
		return generic.ErrDiscussionsAccessDenied
	}
}
