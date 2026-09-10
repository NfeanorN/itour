package httpserver

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"itour/internal/auth"
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

type ctxKey string

const userKey ctxKey = "user"

func New(st *store.Store, guidesDir, staticDir string) http.Handler {
	s := &Server{Store: st, GuidesDir: guidesDir, StaticDir: staticDir}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
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

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	r.Get("/api/tour", s.tour)
	r.Post("/api/leads", s.createLead)
	r.Post("/api/auth/login", s.login)
	r.Get("/api/auth/me", s.authRequired(s.me))
	r.Get("/api/guides", s.authRequired(s.guides))
	r.Get("/api/guides/{slug}", s.authRequired(s.guide))

	r.Route("/api/admin", func(r chi.Router) {
		r.Use(s.adminOnly)
		r.Get("/users", s.listUsers)
		r.Post("/users", s.createUser)
		r.Patch("/users/{id}", s.patchUser)
		r.Get("/leads", s.listLeads)
	})

	if staticDir != "" {
		fileServer(r, staticDir)
	}
	return r
}

func (s *Server) tour(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"name":      "Eurotour",
		"days":      12,
		"from":      "Алматы",
		"instagram": "https://www.instagram.com/qairattt_t.e/",
		"whatsapp":  "https://wa.me/message/2UBIBW6WROJXP1",
		"route":     []string{"Алматы", "Рим", "Венеция", "Париж", "Цюрих", "Лаутербруннен", "Алматы"},
	})
}

func (s *Server) createLead(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Phone    string `json:"phone"`
		Telegram string `json:"telegram"`
		Message  string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	if body.Name == "" || (strings.TrimSpace(body.Phone) == "" && strings.TrimSpace(body.Telegram) == "") {
		writeError(w, http.StatusBadRequest, "Укажите имя и телефон или Telegram")
		return
	}
	if err := s.Store.CreateLead(body.Name, strings.TrimSpace(body.Phone), strings.TrimSpace(body.Telegram), strings.TrimSpace(body.Message)); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось сохранить заявку")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]bool{"ok": true})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	u, err := s.Store.UserByEmail(strings.TrimSpace(body.Email))
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}
	if auth.CheckPassword(u.PasswordHash, body.Password) != nil {
		writeError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}
	token, err := auth.Sign(u.ID, u.Email, u.Role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось выдать сессию")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": publicUser(u)})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, publicUser(currentUser(r)))
}

func (s *Server) guides(w http.ResponseWriter, r *http.Request) {
	if !canReadGuides(currentUser(r)) {
		writeError(w, http.StatusForbidden, "Гайд открывается после покупки тура. Напишите нам — выдадим доступ.")
		return
	}
	entries, err := os.ReadDir(s.GuidesDir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Гайды недоступны")
		return
	}
	type item struct {
		Slug   string `json:"slug"`
		Title  string `json:"title"`
		Kicker string `json:"kicker"`
	}
	meta := map[string]item{
		"visa-overview":  {Slug: "visa-overview", Title: "Шенген: с чего начать", Kicker: "Виза"},
		"visa-documents": {Slug: "visa-documents", Title: "Пакет документов", Kicker: "Виза"},
		"visa-italy":     {Slug: "visa-italy", Title: "Подача в Италию", Kicker: "Виза"},
		"after-approval": {Slug: "after-approval", Title: "После одобрения", Kicker: "Сборы"},
		"packing":        {Slug: "packing", Title: "Что взять с собой", Kicker: "Сборы"},
	}
	order := []string{"visa-overview", "visa-documents", "visa-italy", "after-approval", "packing"}
	have := map[string]bool{}
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") {
			have[strings.TrimSuffix(e.Name(), ".md")] = true
		}
	}
	list := make([]item, 0, len(order))
	for _, slug := range order {
		if have[slug] {
			list = append(list, meta[slug])
		}
	}
	writeJSON(w, http.StatusOK, list)
}

func (s *Server) guide(w http.ResponseWriter, r *http.Request) {
	if !canReadGuides(currentUser(r)) {
		writeError(w, http.StatusForbidden, "Гайд открывается после покупки тура.")
		return
	}
	slug := chi.URLParam(r, "slug")
	if strings.Contains(slug, "..") || strings.ContainsAny(slug, `/\`) {
		writeError(w, http.StatusBadRequest, "Некорректный гайд")
		return
	}
	b, err := os.ReadFile(filepath.Join(s.GuidesDir, slug+".md"))
	if err != nil {
		writeError(w, http.StatusNotFound, "Гайд не найден")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"slug": slug, "markdown": string(b)})
}

func (s *Server) listUsers(w http.ResponseWriter, _ *http.Request) {
	users, err := s.Store.ListUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось загрузить пользователей")
		return
	}
	out := make([]map[string]any, 0, len(users))
	for i := range users {
		out = append(out, publicUser(&users[i]))
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) createUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email      string `json:"email"`
		Name       string `json:"name"`
		Password   string `json:"password"`
		Role       string `json:"role"`
		TourAccess bool   `json:"tourAccess"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))
	body.Name = strings.TrimSpace(body.Name)
	if body.Email == "" || body.Name == "" || len(body.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Email, имя и пароль от 8 символов обязательны")
		return
	}
	if body.Role != "admin" {
		body.Role = "traveler"
	}
	u, err := s.Store.CreateUser(body.Email, body.Name, body.Password, body.Role, body.TourAccess)
	if err != nil {
		writeError(w, http.StatusConflict, "Пользователь с таким email уже есть")
		return
	}
	writeJSON(w, http.StatusCreated, publicUser(u))
}

func (s *Server) patchUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный id")
		return
	}
	var body struct {
		Name       *string `json:"name"`
		TourAccess *bool   `json:"tourAccess"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	u, err := s.Store.UpdateUser(id, body.Name, body.TourAccess)
	if err != nil {
		writeError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}
	writeJSON(w, http.StatusOK, publicUser(u))
}

func (s *Server) listLeads(w http.ResponseWriter, _ *http.Request) {
	leads, err := s.Store.ListLeads()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось загрузить заявки")
		return
	}
	if leads == nil {
		leads = []store.Lead{}
	}
	writeJSON(w, http.StatusOK, leads)
}

func (s *Server) authRequired(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := s.userFromRequest(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Нужно войти в аккаунт")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userKey, u)))
	}
}

func (s *Server) adminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, err := s.userFromRequest(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Нужно войти в аккаунт")
			return
		}
		if u.Role != "admin" {
			writeError(w, http.StatusForbidden, "Только для администратора")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userKey, u)))
	})
}

func (s *Server) userFromRequest(r *http.Request) (*store.User, error) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return nil, errors.New("no token")
	}
	claims, err := auth.Parse(strings.TrimPrefix(h, "Bearer "))
	if err != nil {
		return nil, err
	}
	u, err := s.Store.UserByID(claims.UserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user missing")
		}
		return nil, err
	}
	return u, nil
}

func currentUser(r *http.Request) *store.User {
	u, _ := r.Context().Value(userKey).(*store.User)
	return u
}

func canReadGuides(u *store.User) bool {
	return u != nil && (u.TourAccess || u.Role == "admin")
}

func publicUser(u *store.User) map[string]any {
	return map[string]any{
		"id":         u.ID,
		"email":      u.Email,
		"name":       u.Name,
		"role":       u.Role,
		"tourAccess": u.TourAccess,
		"createdAt":  u.CreatedAt,
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
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
