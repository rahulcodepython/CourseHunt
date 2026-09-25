package chapters

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

var (
	chapterCourseErrMap = postgres.StatusErrorMap{
		0: generic.ErrChaptersCourseNotFound,
		1: generic.ErrChaptersUnauthorized,
	}
	chapterItemErrMap = postgres.StatusErrorMap{
		0: generic.ErrChaptersChapterNotFound,
		1: generic.ErrChaptersUnauthorized,
	}
)
