package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

var (
	ErrInvalidCredentials     = errors.New("login failed: invalid email or password")
	ErrUserBanned             = errors.New("account is banned")
	ErrUserNotFound           = errors.New("user not found, please register")
	ErrNoEmailInToken         = errors.New("no email provided in token")
	ErrSessionExpired         = errors.New("session expired")
	ErrRoleNotFound           = errors.New("role not found")
	ErrFailedToCreateUser     = errors.New("failed to create user")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrFailedToChangePassword = errors.New("failed to change password")
)

func (m *AuthModule) LoginWithEmailService(req LoginRequest) (*TokenResponse, string, error) {
	rawRefreshToken := generateRandomToken()
	refreshTokenHash := hashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, hash, err := m.LoginWithEmailRepository(req.Email, refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	if user.Banned {
		return nil, "", ErrUserBanned
	}

	if hash == "" || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		return nil, "", ErrInvalidCredentials
	}

	accessToken, err := m.generateJWT(user)
	if err != nil {
		return nil, "", err
	}

	return &TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}

func (m *AuthModule) LoginWithGoogleService(ctx context.Context, req GoogleLoginRequest) (*TokenResponse, string, error) {
	payload, err := idtoken.Validate(ctx, req.IDToken, m.Cfg.GoogleClientID)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	email, _ := payload.Claims["email"].(string)
	if email == "" {
		return nil, "", ErrNoEmailInToken
	}

	rawRefreshToken := generateRandomToken()
	refreshTokenHash := hashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, err := m.LoginWithGoogleRepository(email, refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", ErrUserNotFound
	}

	if user.Banned {
		return nil, "", ErrUserBanned
	}

	accessToken, err := m.generateJWT(user)
	if err != nil {
		return nil, "", err
	}

	return &TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}

func (m *AuthModule) RefreshTokenService(refreshToken string) (*TokenResponse, string, error) {
	oldHash := hashToken(refreshToken)

	newRawRefreshToken := generateRandomToken()
	newRefreshTokenHash := hashToken(newRawRefreshToken)
	newExpiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, err := m.RotateSessionRepository(oldHash, newRefreshTokenHash, newExpiresAt)
	if err != nil {
		return nil, "", ErrSessionExpired
	}

	if user.Banned {
		return nil, "", ErrUserBanned
	}

	accessToken, err := m.generateJWT(user)
	if err != nil {
		return nil, "", err
	}

	return &TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, newRawRefreshToken, nil
}

func (m *AuthModule) LogoutService(refreshToken string) error {
	hash := hashToken(refreshToken)
	return m.DeleteSessionRepository(hash)
}

func (m *AuthModule) CreateUserService(createdBy string, req CreateUserRequest) (*CreateUserResponse, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	userID, err := m.CreateUserRepository(string(hashedPassword), req.Name, req.Email, createdBy, req.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRoleNotFound
		}
		return nil, ErrFailedToCreateUser
	}

	return &CreateUserResponse{
		ID:    userID,
		Name:  req.Name,
		Email: req.Email,
		Role:  req.Role,
	}, nil
}

func (m *AuthModule) ChangePasswordService(userID string, req ChangePasswordRequest) (*TokenResponse, string, error) {
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", ErrFailedToChangePassword
	}

	rawRefreshToken := generateRandomToken()
	refreshTokenHash := hashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, oldHash, err := m.ChangePasswordRepository(userID, string(newHash), refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", ErrFailedToChangePassword
	}

	if oldHash == "" || bcrypt.CompareHashAndPassword([]byte(oldHash), []byte(req.CurrentPassword)) != nil {
		return nil, "", ErrInvalidCurrentPassword
	}

	accessToken, err := m.generateJWT(user)
	if err != nil {
		return nil, "", err
	}

	return &TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}
