FROM golang:1.26-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /out/api .
COPY content ./content
ENV GUIDES_DIR=/app/content/guides
ENV DATA_DIR=/app/data
EXPOSE 8080
CMD ["./api"]
