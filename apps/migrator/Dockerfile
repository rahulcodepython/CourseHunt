# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy Go module files and download dependencies
COPY apps/migrator/go.mod apps/migrator/go.sum ./apps/migrator/
WORKDIR /app/apps/migrator
RUN go mod download

# Copy source code (including the embedded migrations/ directory)
WORKDIR /app
COPY apps/migrator ./apps/migrator

# Build static Linux binary
WORKDIR /app/apps/migrator
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/migrator .

# Stage 2: Minimal Runtime
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy binary from builder — migrations are embedded in the binary via
# go:embed, so no separate migrations volume/mount is needed at runtime.
COPY --from=builder /app/migrator .

USER appuser

ENTRYPOINT ["./migrator"]
CMD ["commit"]
