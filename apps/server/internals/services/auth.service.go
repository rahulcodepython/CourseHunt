package services

import (
	"context"
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/helpers"
	"coursehunt/server/internals/repositories"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

type AuthService struct {
	Repo *repositories.AuthRepository
	Cfg  *config.Config
}

func NewAuthService(repo *repositories.AuthRepository, cfg *config.Config) *AuthService {
	return &AuthService{Repo: repo, Cfg: cfg}
}

func (s *AuthService) LoginWithEmailService(req entities.LoginRequest) (*entities.TokenResponse, string, error) {
	rawRefreshToken := helpers.GenerateRandomToken()
	refreshTokenHash := helpers.HashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, hash, err := s.Repo.LoginWithEmailRepository(req.Email, refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", generic.ErrAuthInvalidCredentials
	}

	if user.Banned {
		return nil, "", generic.ErrAuthUserBanned
	}

	if hash == "" || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		return nil, "", generic.ErrAuthInvalidCredentials
	}

	accessToken, err := helpers.GenerateJWT(s.Cfg, user)
	if err != nil {
		return nil, "", err
	}

	return &entities.TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}

func (s *AuthService) LoginWithGoogleService(ctx context.Context, req entities.GoogleLoginRequest) (*entities.TokenResponse, string, error) {
	payload, err := idtoken.Validate(ctx, req.IDToken, s.Cfg.GoogleClientID)
	if err != nil {
		return nil, "", generic.ErrAuthInvalidCredentials
	}

	email, _ := payload.Claims["email"].(string)
	if email == "" {
		return nil, "", generic.ErrAuthNoEmailInToken
	}

	rawRefreshToken := helpers.GenerateRandomToken()
	refreshTokenHash := helpers.HashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, err := s.Repo.LoginWithGoogleRepository(email, refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", generic.ErrAuthUserNotFound
	}

	if user.Banned {
		return nil, "", generic.ErrAuthUserBanned
	}

	accessToken, err := helpers.GenerateJWT(s.Cfg, user)
	if err != nil {
		return nil, "", err
	}

	return &entities.TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}

func (s *AuthService) RefreshTokenService(refreshToken string) (*entities.TokenResponse, string, error) {
	oldHash := helpers.HashToken(refreshToken)

	newRawRefreshToken := helpers.GenerateRandomToken()
	newRefreshTokenHash := helpers.HashToken(newRawRefreshToken)
	newExpiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, err := s.Repo.RotateSessionRepository(oldHash, newRefreshTokenHash, newExpiresAt)
	if err != nil {
		return nil, "", generic.ErrAuthSessionExpired
	}

	if user.Banned {
		return nil, "", generic.ErrAuthUserBanned
	}

	accessToken, err := helpers.GenerateJWT(s.Cfg, user)
	if err != nil {
		return nil, "", err
	}

	return &entities.TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, newRawRefreshToken, nil
}

func (s *AuthService) LogoutService(refreshToken string) error {
	hash := helpers.HashToken(refreshToken)
	return s.Repo.DeleteSessionRepository(hash)
}

func (s *AuthService) CreateUserService(createdBy string, req entities.CreateUserRequest) (*entities.CreateUserResponse, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	userID, err := s.Repo.CreateUserRepository(string(hashedPassword), req.Name, req.Email, createdBy, req.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, generic.ErrAuthRoleNotFound
		}
		return nil, generic.ErrAuthFailedToCreateUser
	}

	return &entities.CreateUserResponse{
		ID:    userID,
		Name:  req.Name,
		Email: req.Email,
		Role:  req.Role,
	}, nil
}

func (s *AuthService) ChangePasswordService(userID string, req entities.ChangePasswordRequest) (*entities.TokenResponse, string, error) {
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", generic.ErrAuthFailedToChangePassword
	}

	rawRefreshToken := helpers.GenerateRandomToken()
	refreshTokenHash := helpers.HashToken(rawRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	user, oldHash, err := s.Repo.ChangePasswordRepository(userID, string(newHash), refreshTokenHash, expiresAt)
	if err != nil {
		return nil, "", generic.ErrAuthFailedToChangePassword
	}

	if oldHash == "" || bcrypt.CompareHashAndPassword([]byte(oldHash), []byte(req.CurrentPassword)) != nil {
		return nil, "", generic.ErrAuthInvalidCurrentPassword
	}

	accessToken, err := helpers.GenerateJWT(s.Cfg, user)
	if err != nil {
		return nil, "", err
	}

	return &entities.TokenResponse{
		AccessToken: accessToken,
		User:        user,
	}, rawRefreshToken, nil
}
