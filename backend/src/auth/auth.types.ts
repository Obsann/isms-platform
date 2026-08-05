/** Claims signed into the access token issued by `POST /api/auth/login`. */
export interface JwtPayload {
  /** Standard JWT subject claim — the staff account id. */
  sub: string;
  tenantId: string | null;
  role: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
  staff: {
    id: string;
    tenantId: string | null;
    email: string;
    fullName: string;
    role: string;
  };
}
