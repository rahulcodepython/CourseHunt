package handlers

import (
	"net/http"

	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type CertificateHandler struct{ Svc *services.CertificateService }

func NewCertificateHandler() *CertificateHandler { return &CertificateHandler{Svc: services.NewCertificateService()} }

func (h *CertificateHandler) Claim(c *fiber.Ctx) error {
	cert, err := h.Svc.Claim(getUserID(c), c.Params("courseID"))
	if err != nil {
		if err.Error() == "course not completed" {
			return utils.JSON(c, http.StatusForbidden, false, "course not completed", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to claim certificate", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "certificate claimed", cert, nil)
}

func (h *CertificateHandler) List(c *fiber.Ctx) error {
	list, err := h.Svc.List(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch certificates", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "certificates fetched", list, nil)
}
