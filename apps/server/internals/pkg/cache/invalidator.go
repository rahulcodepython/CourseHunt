package cache

import (
	"context"
	"fmt"
	"log"
)

// InvalidateCategories purges all category-related cache entries when CRUD actions occur.
func (c *Cache) InvalidateCategories(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating categories cache...")
	_ = c.DeleteByPattern(ctx, "categories:*")
}

// InvalidateCourses purges all course-related cache entries.
func (c *Cache) InvalidateCourses(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating courses cache...")
	_ = c.DeleteByPattern(ctx, "courses:*")
}

// InvalidateChapters purges chapter-related cache entries and parent course caches.
func (c *Cache) InvalidateChapters(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating chapters cache...")
	_ = c.DeleteByPattern(ctx, "chapters:*")
	_ = c.DeleteByPattern(ctx, "courses:*")
}

// InvalidateLessons purges lesson-related cache entries, chapter caches, and course caches.
func (c *Cache) InvalidateLessons(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating lessons cache...")
	_ = c.DeleteByPattern(ctx, "lessons:*")
	_ = c.DeleteByPattern(ctx, "chapters:*")
	_ = c.DeleteByPattern(ctx, "courses:*")
}

// InvalidateFaqs purges FAQ-related cache entries.
func (c *Cache) InvalidateFaqs(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating FAQs cache...")
	_ = c.DeleteByPattern(ctx, "faqs:*")
}

// InvalidateCoupons purges coupon-related cache entries.
func (c *Cache) InvalidateCoupons(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating coupons cache...")
	_ = c.DeleteByPattern(ctx, "coupons:*")
}

// InvalidateRoles purges roles and permission cache entries.
func (c *Cache) InvalidateRoles(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating roles and permissions cache...")
	_ = c.DeleteByPattern(ctx, "roles:*")
	_ = c.DeleteByPattern(ctx, "permissions:*")
}

// InvalidateQuiz purges quiz-related cache entries.
func (c *Cache) InvalidateQuiz(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating quiz cache...")
	_ = c.DeleteByPattern(ctx, "quiz:*")
}

// InvalidateNotes purges notes-related cache entries.
func (c *Cache) InvalidateNotes(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating notes cache...")
	_ = c.DeleteByPattern(ctx, "notes:*")
}

// InvalidateFeedbacks purges feedback-related cache entries.
func (c *Cache) InvalidateFeedbacks(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating feedbacks cache...")
	_ = c.DeleteByPattern(ctx, "feedbacks:*")
}

// InvalidateUpdates purges system updates/announcement cache entries.
func (c *Cache) InvalidateUpdates(ctx context.Context) {
	log.Println("[InvalidatorService] Invalidating updates cache...")
	_ = c.DeleteByPattern(ctx, "updates:*")
}

// InvalidateWishlist purges wishlist cache entries for a user.
func (c *Cache) InvalidateWishlist(ctx context.Context, userID string) {
	log.Printf("[InvalidatorService] Invalidating wishlist cache for user %s...", userID)
	if userID != "" {
		_ = c.DeleteByPattern(ctx, fmt.Sprintf("wishlist:user:%s:*", userID))
	} else {
		_ = c.DeleteByPattern(ctx, "wishlist:*")
	}
}
