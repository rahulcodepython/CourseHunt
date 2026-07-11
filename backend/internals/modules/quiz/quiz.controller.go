package quiz

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// POST /api/quiz/course/:courseID/lesson/:lessonID  — create or update quiz metadata
// @Summary CreateMetadataController
// @Description CreateMetadataController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param lessonID path string true "lessonID"
// @Param body body quiz.CreateQuizRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[QuizMetadata]
// @Router /api/v1/quiz/course/{courseID}/lesson/{lessonID} [post]
func (m *QuizModule) CreateMetadataController(c *fiber.Ctx) error {
	var req CreateQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	qm, err := m.CreateMetadataService(c.Params("lessonID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz saved successfully", qm, nil)
}

// POST /api/quiz/course/:courseID/:quizID/questions
// @Summary CreateQuestionController
// @Description CreateQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param quizID path string true "quizID"
// @Param body body quiz.CreateQuestionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[QuizQuestion]
// @Router /api/v1/quiz/course/{courseID}/{quizID}/questions [post]
func (m *QuizModule) CreateQuestionController(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	q, err := m.CreateQuestionService(c.Params("quizID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "question added successfully", q, nil)
}

// DELETE /api/quiz/course/:courseID/questions/:id
// @Summary DeleteQuestionController
// @Description DeleteQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/quiz/course/{courseID}/questions/{id} [delete]
func (m *QuizModule) DeleteQuestionController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Courses.IsCourseOwnerRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
	}
	id, err := m.DeleteQuestionService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "question deleted successfully", map[string]string{"id": id}, nil)
}

// POST /api/quiz/course/:courseID/lesson/:lessonID/quiz/:quizID/question
// @Summary GetQuestionController
// @Description GetQuestionController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param lessonID path string true "lessonID"
// @Param quizID path string true "quizID"
// @Param body body quiz.NextQuestionRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[NextQuestionResponse]
// @Router /api/v1/quiz/course/{courseID}/lesson/{lessonID}/quiz/{quizID}/question [post]
func (m *QuizModule) GetQuestionController(c *fiber.Ctx) error {
	var req NextQuestionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Enrollments.IsEnrolledRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
	}
	resp, err := m.GetQuestionService(c.Params("quizID"), userID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to get question", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "question fetched", resp, nil)
}

// POST /api/quiz/course/:courseID/lesson/:lessonID/quiz/:quizID/submit
// @Summary CreateSubmitController
// @Description CreateSubmitController for Quiz
// @Tags Quiz
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param lessonID path string true "lessonID"
// @Param quizID path string true "quizID"
// @Param body body quiz.SubmitQuizRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[SubmitQuizResponse]
// @Router /api/v1/quiz/course/{courseID}/lesson/{lessonID}/quiz/{quizID}/submit [post]
func (m *QuizModule) CreateSubmitController(c *fiber.Ctx) error {
	var req SubmitQuizRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")
	if !m.Enrollments.IsEnrolledRepository(userID, courseID) {
		return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
	}
	resp, err := m.SubmitService(c.Params("quizID"), userID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to submit quiz", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "quiz submitted successfully", resp, nil)
}
