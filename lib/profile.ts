import { apiFetch } from "@/lib/api";

/**
 * Authenticated user profile (Postman: Authentication/Get Profile).
 * Endpoint: GET users/profile.
 */

export interface Profile {
  id: number;
  uuid: string | null;
  status: string;
  email: string;
  isVerified: boolean;
  firstName: string;
  lastName: string;
  mobile: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  studioName: string | null;
  bio: string | null;
  experience: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const profileApi = {
  get: () => apiFetch<Profile>("users/profile"),
};
