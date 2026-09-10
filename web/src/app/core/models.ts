export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'traveler';
  tourAccess: boolean;
  createdAt: string;
}

export interface GuideCard {
  slug: string;
  title: string;
  kicker: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  telegram: string;
  message: string;
  createdAt: string;
}
