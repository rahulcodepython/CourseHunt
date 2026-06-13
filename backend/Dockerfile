FROM golang:1.21-alpine

WORKDIR /app

COPY go.mod go.sum ./
# Note: go mod download might fail if go.sum is missing or outdated,
# but we are generating the files.
RUN go mod download

COPY . .

RUN go build -o main .

EXPOSE 8080

CMD ["./main"]
