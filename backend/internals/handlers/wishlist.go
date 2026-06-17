package handlers

import (
	"net/http"

	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type WishlistHandler struct{ Svc *services.WishlistService }

func NewWishlistHandler() *WishlistHandler { return &WishlistHandler{Svc: services.NewWishlistService()} }

func (h *WishlistHandler) Add(c *fiber.Ctx) error {
	if err := h.Svc.Add(getUserID(c), c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add to wishlist", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "added to wishlist", nil, nil)
}

func (h *WishlistHandler) Remove(c *fiber.Ctx) error {
	if err := h.Svc.Remove(getUserID(c), c.Params("courseID")); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to remove from wishlist", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "removed from wishlist", nil, nil)
}

func (h *WishlistHandler) List(c *fiber.Ctx) error {
	list, err := h.Svc.List(getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch wishlist", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "wishlist fetched", list, nil)
}
