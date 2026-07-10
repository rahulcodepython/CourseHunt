package discussions

import "database/sql"

func (m *DiscussionsModule) ScanDiscussions(rows *sql.Rows) []DiscussionResponse {
	var list []DiscussionResponse
	for rows.Next() {
		var d DiscussionResponse
		rows.Scan(&d.ID, &d.Content, &d.Depth, &d.ReplyCount, &d.CreatedAt,
			&d.User.ID, &d.User.Name, &d.User.Image)
		list = append(list, d)
	}
	if list == nil {
		list = []DiscussionResponse{}
	}
	return list
}
