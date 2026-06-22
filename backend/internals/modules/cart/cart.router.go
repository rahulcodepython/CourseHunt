package cart

import (
	"github.com/gofiber/fiber/v2"
)

func (c *CartModule) Routes(protected fiber.Router) {
	cart := protected.Group("/cart")
	cart.Get("", c.ListController)
	cart.Post("/course/:courseID", c.AddController)
	cart.Delete("/course/:courseID", c.RemoveController)
	cart.Delete("", c.ClearController)
}
