package handlers

import (
	"net/http"

	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type CartHandler struct{ Svc *services.CartService }

func NewCartHandler() *CartHandler { return &CartHandler{Svc: services.NewCartService()} }

func (h *CartHandler) Add(c *fiber.Ctx) error {
	if err := h.Svc.Add(getUserID(c), c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add to cart", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "added to cart", nil, nil)
}

func (h *CartHandler) Remove(c *fiber.Ctx) error {
	if err := h.Svc.Remove(getUserID(c), c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to remove from cart", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "removed from cart", nil, nil)
}

func (h *CartHandler) List(c *fiber.Ctx) error {
	list, err := h.Svc.List(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch cart", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "cart fetched", list, nil)
}

func (h *CartHandler) Clear(c *fiber.Ctx) error {
	if err := h.Svc.Clear(getUserID(c)); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to clear cart", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "cart cleared", nil, nil)
}
