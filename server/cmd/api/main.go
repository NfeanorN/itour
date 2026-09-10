package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"itour/internal/httpserver"
	"itour/internal/store"
)

func main() {
	addr := listenAddr()
	dataDir := env("DATA_DIR", filepath.Join(".", "data"))
	guidesDir := env("GUIDES_DIR", filepath.Join(".", "content", "guides"))
	staticDir := os.Getenv("STATIC_DIR")

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatal(err)
	}

	st, err := store.Open(filepath.Join(dataDir, "itour.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer st.DB.Close()

	handler := httpserver.New(st, guidesDir, staticDir)
	log.Printf("iTour API on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func listenAddr() string {
	if p := os.Getenv("PORT"); p != "" {
		if strings.HasPrefix(p, ":") {
			return p
		}
		return ":" + p
	}
	return env("ADDR", ":8080")
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
