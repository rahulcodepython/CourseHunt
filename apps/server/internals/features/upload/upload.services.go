package upload

import (
	"context"
	"path/filepath"
	"strings"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
	".mp4": true, ".webm": true, ".pdf": true, ".doc": true, ".docx": true,
}

// sanitizeFileName guards against path traversal and disallowed extensions
// before a signed URL is generated for the file.
func sanitizeFileName(fileName string) (string, error) {
	if fileName == "" {
		return "", utils.ErrBadRequest(generic.ErrMsgInvalidFileName, nil)
	}

	cleanFileName := filepath.Base(filepath.Clean(fileName))
	if cleanFileName == "." || cleanFileName == "/" || cleanFileName != fileName {
		return "", utils.ErrBadRequest(generic.ErrMsgUnsafeFileName, nil)
	}

	ext := strings.ToLower(filepath.Ext(cleanFileName))
	if !allowedExtensions[ext] {
		return "", utils.ErrBadRequest(generic.ErrMsgExtensionNotAllowed, nil)
	}

	return cleanFileName, nil
}

func (a *App) GetSignedURL(ctx context.Context, fileName string) (*SignedURLResponse, error) {
	cleanFileName, err := sanitizeFileName(fileName)
	if err != nil {
		return nil, err
	}

	url, err := a.Storage.GetSignedURL(ctx, cleanFileName)
	if err != nil {
		return nil, utils.ErrInternal("Failed to generate signed URL.", err)
	}

	publicURL := a.Storage.GetPublicURL(cleanFileName)

	return &SignedURLResponse{
		URL:         url,
		DownloadURL: publicURL,
		HTMLURL:     publicURL,
	}, nil
}
