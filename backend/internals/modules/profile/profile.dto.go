package profile

// ── Auth / Profile ──

type UpdateProfileRequest struct {
	Headline *string `json:"headline"`
	Bio      *string `json:"bio"`
	Website  *string `json:"website"`
}
