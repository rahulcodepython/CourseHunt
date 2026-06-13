package v1

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type TransactionHandler struct {
	Transactions *services.TransactionService
}

func NewTransactionHandler() *TransactionHandler {
	return &TransactionHandler{Transactions: services.NewTransactionService()}
}

func (h *TransactionHandler) TransactionsAdmin(c *fiber.Ctx) error {
	transactions, err := h.Transactions.ListAdmin()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transactions")
	}
	stats, err := h.Transactions.GetStatsAdmin()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transaction stats")
	}
	return utils.OK(c, "Transactions fetched successfully", fiber.Map{"transactions": transactions, "stats": stats})
}

func (h *TransactionHandler) TransactionsUser(c *fiber.Ctx) error {
	transactions, err := h.Transactions.ListUser(authUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transactions")
	}
	return utils.OK(c, "Transactions fetched successfully", transactions)
}

func (h *TransactionHandler) Checkout(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid course ID")
	}
	data, err := h.Transactions.Checkout(authUserID(c), id)
	if err != nil {
		return utils.BadRequest(c, "Course not found")
	}
	return utils.OK(c, "Checkout fetched successfully", data)
}

func (h *TransactionHandler) Purchase(c *fiber.Ctx) error {
	var body struct {
		CourseID  int     `json:"courseId"`
		CouponID  *int    `json:"couponId"`
		Price     float64 `json:"price"`
		FirstName string  `json:"firstName"`
		LastName  string  `json:"lastName"`
		Phone     string  `json:"phone"`
		Address   string  `json:"address"`
		City      string  `json:"city"`
		Zip       string  `json:"zip"`
		Country   string  `json:"country"`
	}
	if err := c.BodyParser(&body); err != nil || body.CourseID == 0 {
		return utils.BadRequest(c, "Course ID is required")
	}
	user := &models.User{FirstName: body.FirstName, LastName: body.LastName, Phone: body.Phone, Address: body.Address, City: body.City, Zip: body.Zip, Country: body.Country}
	transaction, err := h.Transactions.Purchase(authUserID(c), body.CourseID, body.CouponID, body.Price, user)
	if err != nil {
		return utils.BadRequest(c, err.Error())
	}
	return utils.Created(c, "Course purchased successfully", fiber.Map{"transaction": transaction})
}

func (h *TransactionHandler) InitiateRefund(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid transaction ID")
	}
	if err := h.Transactions.InitiateRefund(id); err != nil {
		return utils.InternalError(c, "Failed to initiate refund")
	}
	return utils.OK(c, "Refund initiated successfully", nil)
}

func (h *TransactionHandler) AcceptRefund(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid transaction ID")
	}
	if err := h.Transactions.AcceptRefund(id); err != nil {
		return utils.InternalError(c, "Failed to accept refund")
	}
	return utils.OK(c, "Refund accepted and access revoked", nil)
}

func (h *TransactionHandler) RejectRefund(c *fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return utils.BadRequest(c, "Invalid transaction ID")
	}
	if err := h.Transactions.RejectRefund(id); err != nil {
		return utils.InternalError(c, "Failed to reject refund")
	}
	return utils.OK(c, "Refund rejected", nil)
}
