package v1

import (
	"strconv"

	"coursehunt-backend/internals/models"
)

// serializeUser converts the database user shape into the frontend-compatible payload.
func serializeUser(user *models.User) models.UserResponse {
	if user == nil {
		return models.UserResponse{}
	}

	return user.ToResponse()
}

// serializeUsers converts a user slice into the frontend-compatible payload slice.
func serializeUsers(users []models.User) []models.UserResponse {
	items := make([]models.UserResponse, 0, len(users))
	for index := range users {
		items = append(items, serializeUser(&users[index]))
	}
	return items
}

// serializeCategories keeps the old frontend category identifier shape.
func serializeCategories(categories []models.Category) []models.CategoryResponse {
	items := make([]models.CategoryResponse, 0, len(categories))
	for _, category := range categories {
		items = append(items, models.CategoryResponse{
			ID:  strconv.Itoa(category.ID),
			Name: category.Name,
		})
	}
	return items
}
