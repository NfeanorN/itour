package store

import (
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"time"

	"itour/internal/auth"

	_ "modernc.org/sqlite"
)

type Store struct {
	DB *sql.DB
}

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
	TourAccess   bool      `json:"tourAccess"`
	CreatedAt    time.Time `json:"createdAt"`
	PasswordHash string    `json:"-"`
}

type Lead struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Telegram  string    `json:"telegram"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

func Open(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil && filepath.Dir(path) != "." {
		return nil, err
	}
	db, err := sql.Open("sqlite", path+"?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	s := &Store{DB: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	if err := s.seed(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) migrate() error {
	_, err := s.DB.Exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'traveler',
  tour_access INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
`)
	return err
}

func (s *Store) seed() error {
	var n int
	if err := s.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminPass == "" {
		adminPass = "AralaAdmin2026!"
	}
	adminHash, err := auth.HashPassword(adminPass)
	if err != nil {
		return err
	}
	guestHash, err := auth.HashPassword("Eurotour2026!")
	if err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = s.DB.Exec(`
INSERT INTO users (email, name, password_hash, role, tour_access, created_at) VALUES
(?, ?, ?, 'admin', 1, ?),
(?, ?, ?, 'traveler', 1, ?);
`, "admin@arala.tours", "Админ ARALA", adminHash, now,
		"guest@arala.tours", "Путешественник", guestHash, now)
	return err
}

func (s *Store) UserByEmail(email string) (*User, error) {
	return s.scanUser(s.DB.QueryRow(`
SELECT id, email, name, password_hash, role, tour_access, created_at
FROM users WHERE lower(email) = lower(?)`, email))
}

func (s *Store) UserByID(id int64) (*User, error) {
	return s.scanUser(s.DB.QueryRow(`
SELECT id, email, name, password_hash, role, tour_access, created_at
FROM users WHERE id = ?`, id))
}

func (s *Store) ListUsers() ([]User, error) {
	rows, err := s.DB.Query(`
SELECT id, email, name, password_hash, role, tour_access, created_at
FROM users ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []User
	for rows.Next() {
		u, err := scanUserRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *u)
	}
	return out, rows.Err()
}

func (s *Store) CreateUser(email, name, password, role string, access bool) (*User, error) {
	if role == "" {
		role = "traveler"
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}
	flag := 0
	if access {
		flag = 1
	}
	res, err := s.DB.Exec(`
INSERT INTO users (email, name, password_hash, role, tour_access, created_at)
VALUES (?, ?, ?, ?, ?, ?)`, email, name, hash, role, flag, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return s.UserByID(id)
}

func (s *Store) UpdateUser(id int64, name *string, access *bool) (*User, error) {
	u, err := s.UserByID(id)
	if err != nil {
		return nil, err
	}
	if name != nil {
		u.Name = *name
	}
	if access != nil {
		u.TourAccess = *access
	}
	flag := 0
	if u.TourAccess {
		flag = 1
	}
	_, err = s.DB.Exec(`UPDATE users SET name = ?, tour_access = ? WHERE id = ?`, u.Name, flag, id)
	if err != nil {
		return nil, err
	}
	return s.UserByID(id)
}

func (s *Store) CreateLead(name, phone, telegram, message string) error {
	_, err := s.DB.Exec(`
INSERT INTO leads (name, phone, telegram, message, created_at)
VALUES (?, ?, ?, ?, ?)`, name, phone, telegram, message, time.Now().UTC().Format(time.RFC3339))
	return err
}

func (s *Store) ListLeads() ([]Lead, error) {
	rows, err := s.DB.Query(`SELECT id, name, phone, telegram, message, created_at FROM leads ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Lead
	for rows.Next() {
		var l Lead
		var ts string
		if err := rows.Scan(&l.ID, &l.Name, &l.Phone, &l.Telegram, &l.Message, &ts); err != nil {
			return nil, err
		}
		l.CreatedAt, _ = time.Parse(time.RFC3339, ts)
		out = append(out, l)
	}
	return out, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func (s *Store) scanUser(row rowScanner) (*User, error) {
	u, err := scanUserRow(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return u, nil
}

func scanUserRow(row rowScanner) (*User, error) {
	var u User
	var access int
	var ts string
	if err := row.Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role, &access, &ts); err != nil {
		return nil, err
	}
	u.TourAccess = access == 1
	u.CreatedAt, _ = time.Parse(time.RFC3339, ts)
	return &u, nil
}
