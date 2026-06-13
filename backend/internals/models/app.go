package models

import "time"

type Media struct {
	URL      string `json:"url"`
	FileType string `json:"fileType"`
}

type FAQ struct {
	ID       int    `json:"id,omitempty"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type Resource struct {
	ID      int    `json:"id,omitempty"`
	Title   string `json:"title"`
	FileURL Media  `json:"fileUrl"`
}

type CourseDetail struct {
	ID               int        `json:"id"`
	LegacyID         int        `json:"_id"`
	CreatorID        string     `json:"creatorId"`
	Title            string     `json:"title"`
	Description      string     `json:"description"`
	Duration         string     `json:"duration"`
	Students         int        `json:"students"`
	Rating           float64    `json:"rating"`
	Reviews          int        `json:"reviews"`
	Price            float64    `json:"price"`
	OriginalPrice    float64    `json:"originalPrice"`
	Category         string     `json:"category"`
	CategoryID       int        `json:"category_id"`
	Discount         string     `json:"discount"`
	TotalRevenue     float64    `json:"totalRevenue"`
	ImageURL         Media      `json:"imageUrl"`
	PreviewVideoURL  Media      `json:"previewVideoUrl"`
	LongDescription  string     `json:"longDescription"`
	WhatYouWillLearn []string   `json:"whatYouWillLearn"`
	Prerequisites    []string   `json:"prerequisites"`
	Requirements     []string   `json:"requirements"`
	Chapters         []Chapter  `json:"chapters"`
	ChaptersCount    int        `json:"chaptersCount"`
	LessonsCount     int        `json:"lessonsCount"`
	IsPublished      bool       `json:"isPublished"`
	FAQ              []FAQ      `json:"faq"`
	Resources        []Resource `json:"resources"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type CourseSummary struct {
	ID            int       `json:"id"`
	LegacyID      int       `json:"_id"`
	CreatorID     string    `json:"creatorId"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Duration      string    `json:"duration"`
	Students      int       `json:"students"`
	Rating        float64   `json:"rating"`
	Reviews       int       `json:"reviews"`
	Price         float64   `json:"price"`
	OriginalPrice float64   `json:"originalPrice"`
	Category      string    `json:"category"`
	Discount      string    `json:"discount"`
	TotalRevenue  float64   `json:"totalRevenue,omitempty"`
	ImageURL      Media     `json:"imageUrl"`
	CreatedAt     time.Time `json:"createdAt,omitempty"`
}

type Coupon struct {
	ID          int       `json:"id"`
	LegacyID    int       `json:"_id"`
	Code        string    `json:"code" validate:"required"`
	ExpiryDate  time.Time `json:"expiryDate" validate:"required"`
	Usage       int       `json:"usage"`
	MaxUsage    int       `json:"maxUsage" validate:"required"`
	OfferValue  float64   `json:"offerValue" validate:"required"`
	IsActive    bool      `json:"isActive"`
	Description string    `json:"description"`
}

type Feedback struct {
	ID         int       `json:"id"`
	LegacyID   int       `json:"_id"`
	UserID     string    `json:"userId"`
	UserName   string    `json:"userName"`
	UserEmail  string    `json:"userEmail"`
	Rating     int       `json:"rating"`
	CourseID   int       `json:"courseId"`
	CourseName string    `json:"courseName"`
	Message    string    `json:"message"`
	IsPinned   bool      `json:"isPinned"`
	CreatedAt  time.Time `json:"createdAt"`
}

type Transaction struct {
	ID            int       `json:"id"`
	LegacyID      int       `json:"_id"`
	TransactionID string    `json:"transactionId"`
	CreatedAt     time.Time `json:"createdAt"`
	CourseID      int       `json:"courseId,omitempty"`
	CourseName    string    `json:"courseName"`
	UserID        string    `json:"userId,omitempty"`
	UserEmail     string    `json:"userEmail,omitempty"`
	CouponID      *int      `json:"couponId,omitempty"`
	CouponCode    string    `json:"couponCode"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"` // 'idle', 'pending', 'refunded'
}

type CourseProgress struct {
	ID                 int            `json:"_id"`
	Title              string         `json:"title"`
	TotalLessons       int            `json:"totalLessons"`
	CompletedLessons   int            `json:"completedLessons"`
	Completed          bool           `json:"completed"`
	LastViewedLessonID int            `json:"lastViewedLessonId"`
	ViewedLessons      []ViewedLesson `json:"viewedLessons"`
	Chapters           []Chapter      `json:"chapters"`
	Resources          []Resource     `json:"resources"`
}

type RecentUpdate struct {
	ID          int       `json:"id"`
	LegacyID    int       `json:"_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	CreatedAt   time.Time `json:"createdAt"`
}

type UpdateSeenStatus struct {
	UserID   string    `json:"userId"`
	UpdateID int       `json:"updateId"`
	SeenAt   time.Time `json:"seenAt"`
}

type Certificate struct {
	ID             int       `json:"id"`
	UserID         string    `json:"userId"`
	CourseID       int       `json:"courseId"`
	CertificateURL string    `json:"certificateUrl"`
	IssuedAt       time.Time `issuedAt`
}

type DashboardStats struct {
	TotalUsers       int     `json:"totalUsers"`
	TotalCourses     int     `json:"totalCourses"`
	TotalRevenue     float64 `json:"totalRevenue"`
	TotalEnrollments int     `json:"totalEnrollments"`
}

type AdminDashboardResponse struct {
	Students         []UserResponse  `json:"students"`
	ActiveCourses    []CourseSummary `json:"activeCourses"`
	TotalUsers       int             `json:"totalUsers"`
	TotalCourses     int             `json:"totalCourses"`
	TotalRevenue     float64         `json:"totalRevenue"`
	TotalEnrollments int             `json:"totalEnrollments"`
}

type UserCourse struct {
	ID               int     `json:"_id"`
	Title            string  `json:"title"`
	TotalLessons     int     `json:"totalLessons"`
	CompletedLessons int     `json:"completedLessons"`
	Completed        bool    `json:"completed"`
	Duration         string  `json:"duration,omitempty"`
	Students         int     `json:"students,omitempty"`
	Rating           float64 `json:"rating,omitempty"`
	Reviews          int     `json:"reviews,omitempty"`
	Price            float64 `json:"price,omitempty"`
	OriginalPrice    float64 `json:"originalPrice,omitempty"`
	Category         string  `json:"category,omitempty"`
	Discount         string  `json:"discount,omitempty"`
	ImageURL         *Media  `json:"imageUrl,omitempty"`
}

type UserDashboardResponse struct {
	User            UserDashboardInfo `json:"user"`
	Courses         []UserCourse      `json:"courses"`
	EnrolledCourses int               `json:"enrolledCourses"`
}

type UserDashboardInfo struct {
	Name string `json:"name"`
}

type CheckoutCourse struct {
	ID            int     `json:"_id"`
	Title         string  `json:"title"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"originalPrice"`
	ImageURL      Media   `json:"imageUrl"`
	Category      string  `json:"category"`
}

type CheckoutUser struct {
	ID        string `json:"_id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	City      string `json:"city"`
	Country   string `json:"country"`
	Zip       string `json:"zip"`
}

type CheckoutResponse struct {
	Course CheckoutCourse `json:"course"`
	User   CheckoutUser   `json:"user"`
}

type Discussion struct {
	ID        int       `json:"id"`
	LessonID  int       `json:"lessonId"`
	UserID    string    `json:"userId"`
	UserName  string    `json:"userName"`
	UserImage string    `json:"userImage"`
	Role      string    `json:"role"`
	Message   string    `json:"message"`
	ParentID  *int      `json:"parentId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	Replies   []Discussion `json:"replies,omitempty"`
}
