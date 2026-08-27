package controllers

import (
	"errors"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type CertificatesController struct {
	Repo *repositories.CertificatesRepository
	Cfg  *config.Config
}

func NewCertificatesController(repo *repositories.CertificatesRepository, cfg *config.Config) *CertificatesController {
	return &CertificatesController{Repo: repo, Cfg: cfg}
}

func (ctrl *CertificatesController) ClaimController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	courseID := c.Params("courseID")

	cert, err := ctrl.Repo.IssueRepository(userID, courseID)
	if err != nil {
		if errors.Is(err, generic.ErrCertificateNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		if errors.Is(err, generic.ErrCertificateNotCompleted) {
			return utils.Forbidden(c, "Course not completed.", err)
		}
		return utils.InternalError(c, "Failed to claim certificate.", err)
	}

	return utils.Created(c, "Certificate claimed.", cert)
}

func (ctrl *CertificatesController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := ctrl.Repo.ListRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch certificates.", err)
	}
	return utils.OK(c, "Certificates fetched.", generic.PaginatedResponse[[]entities.Certificate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

// VerifyController is public and unauthenticated — reached by scanning a
// certificate's QR code. Always 200s; legitimacy is carried in the
// `valid` field of the response body, not the HTTP status.
func (ctrl *CertificatesController) VerifyController(c *fiber.Ctx) error {
	verification, err := ctrl.Repo.VerifyRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to verify certificate.", err)
	}
	return utils.OK(c, "Certificate verification checked.", verification)
}
