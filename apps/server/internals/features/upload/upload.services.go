package upload

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/google/uuid"
)

func (a *App) GetSignedURL(ctx context.Context, userID, userRole, rawFileName string) (*SignedURLResponse, error) {
	cleanName, err := sanitizeFileName(rawFileName)
	if err != nil {
		return nil, err
	}

	// Role Guard: Only instructors and administrators can upload curriculum assets
	if userRole != generic.RoleTutor && userRole != generic.RoleAdmin {
		return nil, utils.ErrForbidden("Only tutors and administrators can upload files.", nil)
	}

	ext := strings.ToLower(filepath.Ext(cleanName))
	// Isolate by role, user ID, and a cryptographically secure UUID
	namespacedKey := fmt.Sprintf("%s/%s/%s%s", userRole, userID, uuid.NewString(), ext)

	uploadURL, err := a.Storage.GetSignedUploadURL(ctx, namespacedKey, 15*time.Minute)
	if err != nil {
		return nil, utils.ErrInternal("Failed to generate presigned upload URL.", err)
	}

	return &SignedURLResponse{
		URL:         uploadURL,
		DownloadURL: a.Storage.GetPublicURL(namespacedKey),
		HTMLURL:     a.Storage.GetPublicURL(namespacedKey),
	}, nil
}
