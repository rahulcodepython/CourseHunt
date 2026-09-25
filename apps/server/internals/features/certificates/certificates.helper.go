package certificates

type CertificatesListPayload struct {
	Total int           `json:"total"`
	Data  []Certificate `json:"data"`
}
