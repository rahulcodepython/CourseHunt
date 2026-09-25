package enrollments

type EnrollmentListPayload struct {
	Total int                      `json:"total"`
	Data  []ListEnrollmentResponse `json:"data"`
}
