package certificate

import (
	"fmt"
)

func (c *CertificateModule) ClaimService(userID, courseID string) (*Certificate, error) {
	var completed bool
	err := c.DB.QueryRow(`SELECT completed FROM enrollments WHERE user_id = $1 AND course_id = $2`, userID, courseID).Scan(&completed)
	if err != nil || !completed {
		return nil, fmt.Errorf("course not completed")
	}
	return c.IssueRepository(userID, courseID)
}

func (c *CertificateModule) ListService(userID string) ([]CertificateResponse, error) {
	return c.ListRepository(userID)
}

func (c *CertificateModule) GetService(userID, courseID string) (*Certificate, error) {
	return c.GetRepository(userID, courseID)
}
