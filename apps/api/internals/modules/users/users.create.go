package users

import (
	"database/sql"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=admin tutor"`
}

type CreateUserResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (m *UsersModule) CreateUserController(c *fiber.Ctx) error {
	var req CreateUserRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	user, ok := c.Locals("user").(generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.InternalError(c, "Failed to hash password.", err)
	}

	tx, err := m.DB.Beginx()
	if err != nil {
		return utils.InternalError(c, "Failed to start transaction.", err)
	}
	defer tx.Rollback()

	var userID string
	err = tx.Get(&userID, `INSERT INTO "user" (name, email, "emailVerified", "createdBy", "createdAt", "updatedAt") VALUES ($1, $2, true, $3, NOW(), NOW()) RETURNING id`,
		req.Name, req.Email, user.UserID)
	if err != nil {
		return utils.InternalError(c, "Failed to create user.", err)
	}

	_, err = tx.Exec(`INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, 'credential', $1, $2, NOW(), NOW())`,
		userID, string(hashedPassword))
	if err != nil {
		return utils.InternalError(c, "Failed to create account.", err)
	}

	var roleID int
	err = tx.Get(&roleID, `SELECT id FROM roles WHERE name = $1`, req.Role)
	if err != nil {
		if err == sql.ErrNoRows {
			return utils.BadRequest(c, "Role not found.", nil)
		}
		return utils.InternalError(c, "Failed to find role.", err)
	}

	_, err = tx.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, userID, roleID)
	if err != nil {
		return utils.InternalError(c, "Failed to assign role.", err)
	}

	if err := tx.Commit(); err != nil {
		return utils.InternalError(c, "Failed to commit transaction.", err)
	}

	return utils.Created(c, "User created successfully.", CreateUserResponse{
		ID: userID, Name: req.Name, Email: req.Email, Role: req.Role,
	})
}
