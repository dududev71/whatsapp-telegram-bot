export interface NetflixCookies {
  LoginTv(code: string, cookie: string): Promise<void>
  isValidCookie(cookie: string): Promise<boolean>
}
