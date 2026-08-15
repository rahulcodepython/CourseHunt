# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy Go module files and download dependencies
COPY apps/server/go.mod apps/server/go.sum ./apps/server/
WORKDIR /app/apps/server
RUN go mod download

# Copy source code
WORKDIR /app
COPY apps/server ./apps/server

# Build static Linux binary
WORKDIR /app/apps/server
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Stage 2: Minimal Runtime
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

EXPOSE 8080

USER appuser

CMD ["./server"]
