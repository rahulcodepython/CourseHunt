package handlers

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type ProfileHandler struct{ Svc *services.ProfileService }

func NewProfileHandler() *ProfileHandler { return &ProfileHandler{Svc: services.NewProfileService()} }

func (h *ProfileHandler) GetUser(c *fiber.Ctx) error {
	p, err := h.Svc.GetUser(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "profile not found", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "profile fetched", p, nil)
}

func (h *ProfileHandler) GetTutor(c *fiber.Ctx) error {
	// Can get for self or specific tutor by passing id param, let's allow "id" param or self.
	id := c.Params("id")
	if id == "" {
		id = getUserID(c)
	}
	p, err := h.Svc.GetTutor(id)
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "tutor profile not found", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "tutor profile fetched", p, nil)
}

func (h *ProfileHandler) UpsertUser(c *fiber.Ctx) error {
	var req models.UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := h.Svc.UpsertUser(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save profile", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "profile saved", p, nil)
}

func (h *ProfileHandler) UpsertTutor(c *fiber.Ctx) error {
	var req models.UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := h.Svc.UpsertTutor(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to save tutor profile", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "tutor profile saved", p, nil)
}
