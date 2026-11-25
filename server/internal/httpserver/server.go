package httpserver

import (
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"itour/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Server struct {
	Store     *store.Store
	GuidesDir string
	StaticDir string
}

func New(st *store.Store, guidesDir, staticDir string) http.Handler {
	s := &Server{Store: st, GuidesDir: guidesDir, StaticDir: staticDir}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins(),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		AllowOriginFunc: func(_ *http.Request, origin string) bool {
			if origin == "" {
				return true
			}
			for _, o := range corsOrigins() {
				if o == "*" || o == origin {
					return true
				}
			}
			return strings.HasSuffix(origin, ".vercel.app")
		},
	}))

	r.Get("/api/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	r.Get("/api/tour", s.tour)

	if staticDir != "" {
		fileServer(r, staticDir)
	}
	return r
}

func (s *Server) tour(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"brand":     "ARALA",
		"name":      "Классический Евротур",
		"days":      "9–11",
		"from":      "Алматы",
		"instagram": "https://www.instagram.com/arala.tours/",
		"whatsapp":  "https://wa.me/77066089508",
		"route":     []string{"Алматы", "Милан", "Венеция", "Рим (Ватикан)", "Париж", "Базель", "Цюрих", "Лаутербруннен", "Мюррен", "Алматы"},
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func corsOrigins() []string {
	origins := []string{"http://localhost:4200", "http://127.0.0.1:4200"}
	if extra := os.Getenv("CORS_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			o = strings.TrimSpace(o)
			if o != "" {
				origins = append(origins, o)
			}
		}
	}
	return origins
}

func fileServer(r chi.Router, staticDir string) {
	root := http.Dir(staticDir)
	r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
		if strings.HasPrefix(req.URL.Path, "/api/") {
			http.NotFound(w, req)
			return
		}
		p := strings.TrimPrefix(req.URL.Path, "/")
		if p == "" {
			p = "index.html"
		}
		f, err := root.Open(p)
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				http.ServeFile(w, req, filepath.Join(staticDir, "index.html"))
				return
			}
			http.Error(w, "file error", http.StatusInternalServerError)
			return
		}
		stat, err := f.Stat()
		_ = f.Close()
		if err != nil || stat.IsDir() {
			http.ServeFile(w, req, filepath.Join(staticDir, "index.html"))
			return
		}
		http.ServeFile(w, req, filepath.Join(staticDir, p))
	})
}
