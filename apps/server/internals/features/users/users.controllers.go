package users

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleAssignRole(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	if err := a.AssignRole(c.Context(), c.Params("id"), req.RoleIDs); err != nil {
		return err
	}
	return utils.OK(c, "Roles assigned.", RoleAssignmentResponse{UserID: c.Params("id"), RoleIDs: req.RoleIDs})
}

func (a *App) handleDeleteRole(c *fiber.Ctx) error {
	var req AssignRoleRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	if err := a.DeleteRole(c.Context(), c.Params("id"), req.RoleIDs); err != nil {
		return err
	}
	return utils.OK(c, "Roles revoked.", RoleAssignmentResponse{UserID: c.Params("id"), RoleIDs: req.RoleIDs})
}

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := a.List(c.Context(), page, limit, c.Query("name"), c.Query("email"), c.Query("role"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Users fetched.", generic.PaginatedResponse[[]UserListResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

// ── Profile ──
//
// The user-profile and tutor-profile endpoints are self-scoped (via
// middlewares.UserID) and share one underlying implementation — the old
// codebase's ReadUserProfileController/ReadTutorProfileController literally
// called the same ReadProfileController, and likewise for the upsert pair.
// Kept as two thin handlers only because they're mounted on two different
// URL paths.

func (a *App) handleReadProfile(c *fiber.Ctx) error {
	p, err := a.ReadProfile(c.Context(), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Profile fetched.", p)
}

func (a *App) handleUpsertProfile(c *fiber.Ctx) error {
	var req UpdateProfileRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}
	p, err := a.UpsertProfile(c.Context(), middlewares.UserID(c), req)
	if err != nil {
		return err
	}
	return utils.OK(c, "Profile saved.", p)
}

func (a *App) handleAdminListProfiles(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := a.AdminListProfiles(c.Context(), page, limit)
	if err != nil {
		return err
	}
	return utils.OK(c, "Profiles listed.", generic.PaginatedResponse[[]AdminProfileItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
