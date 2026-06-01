// ============================================
// Member Types (Читатель / Участник буккроссинга)
// ============================================

export interface Member {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  joinedDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFormData {
  cardNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  joinedDate?: string;
}

// Полное имя читателя
export const getMemberFullName = (member: Member): string => {
  return `${member.lastName} ${member.firstName}`.trim();
};

// Короткое имя (Фамилия И.)
export const getMemberShortName = (member: Member): string => {
  const initial = member.firstName ? `${member.firstName.charAt(0)}.` : '';
  return `${member.lastName} ${initial}`.trim();
};
