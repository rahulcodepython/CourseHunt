package certificate

import (
	"fmt"
)

func (c *CertificateModule) ClaimService(userID, courseID string) (*Certificate, error) {
	completed, err := c.IsEnrollmentCompletedRepository(userID, courseID)
	if err != nil || !completed {
		return nil, fmt.Errorf("course not completed")
	}
	return c.IssueRepository(userID, courseID)
}

func (c *CertificateModule) ListService(userID string) ([]Certificate, error) {
	return c.ListRepository(userID)
}

func (c *CertificateModule) GetService(userID, courseID string) (*Certificate, error) {
	return c.GetRepository(userID, courseID)
}
