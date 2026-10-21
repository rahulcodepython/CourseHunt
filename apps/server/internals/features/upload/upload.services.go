package upload

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func (a *App) GetSignedURL(ctx context.Context, userID, userRole, rawFileName, visibility string) (*SignedURLResponse, error) {
	cleanName, err := sanitizeFileName(rawFileName)
	if err != nil {
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(cleanName))

	if visibility != VisibilityPublic && visibility != VisibilityPrivate {
		return nil, utils.ErrBadRequest(generic.ErrMsgInvalidVisibility, nil)
	}
	// Students may only upload their avatar: a public image.
	if userRole == generic.RoleUser && (visibility != VisibilityPublic || !imageExtensions[ext]) {
		return nil, utils.ErrBadRequest(generic.ErrMsgExtensionNotAllowed, nil)
	}
	public := visibility == VisibilityPublic

	// Isolate by role, user ID, and a cryptographically secure UUID
	namespacedKey := fmt.Sprintf("%s/%s/%s%s", userRole, userID, uuid.NewString(), ext)

	uploadURL, err := a.Storage.GetSignedUploadURL(ctx, namespacedKey, public, 15*time.Minute)
	if errors.Is(err, minio.ErrDisabled) {
		return nil, &utils.APIError{
			Status:  fiber.StatusServiceUnavailable,
			Message: "File uploads are not available yet.",
			Err:     err,
		}
	}
	if err != nil {
		return nil, utils.ErrInternal("Failed to generate presigned upload URL.", err)
	}

	objectURL := a.Storage.ObjectURL(namespacedKey, public)
	return &SignedURLResponse{
		URL:         uploadURL,
		DownloadURL: objectURL,
		HTMLURL:     objectURL,
	}, nil
}
