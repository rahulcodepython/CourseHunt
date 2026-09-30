package notifications

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) List(ctx context.Context, userID, role string, afterID, beforeID *int64, limit int) ([]Notification, error) {
	if role != generic.RoleAdmin && role != generic.RoleTutor && role != generic.RoleUser {
		return nil, utils.ErrForbidden("Access denied. Notifications are not available for this role.", nil)
	}

	list, err := a.ListRepository(ctx, userID, role, afterID, beforeID, limit)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch notifications.", err)
	}
	return list, nil
}

func (a *App) MarkSeen(ctx context.Context, userID, role string, lastSeenID int64) error {
	if role != generic.RoleAdmin && role != generic.RoleTutor && role != generic.RoleUser {
		return utils.ErrForbidden("Access denied. Notifications are not available for this role.", nil)
	}

	if err := a.MarkSeenRepository(ctx, userID, lastSeenID); err != nil {
		return utils.ErrInternal("Failed to mark notifications as seen.", err)
	}
	return nil
}
