// ============================================
// Genre Types (Жанр книги)
// ============================================

export interface Genre {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenreFormData {
  name: string;
  description?: string;
}
