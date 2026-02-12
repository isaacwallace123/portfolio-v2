FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o infra-agent .

FROM alpine:3.21

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/infra-agent /usr/local/bin/infra-agent

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["infra-agent"]
