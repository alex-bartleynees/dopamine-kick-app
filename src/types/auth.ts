export interface UserClaim {
  type: string
  value: string
}

export interface User {
  isAuthenticated: boolean
  claims: UserClaim[]
}

export interface ParsedUser {
  isAuthenticated: boolean
  id: string 
  name: string
  email: string
  preferredUsername: string
  givenName: string
  familyName: string
  emailVerified: boolean
  sessionId: string 
  authTime: number
  jti: string
  claims: UserClaim[] // Keep original claims for flexibility
}

export function parseUser(user: User): ParsedUser {
  const getClaim = (type: string): string => {
    const claim = user.claims.find(c => c.type === type)
    return claim?.value || ''
  }
  
  const getBooleanClaim = (type: string): boolean => {
    const claim = user.claims.find(c => c.type === type)
    return claim?.value === 'true'
  }
  
  const getNumberClaim = (type: string): number => {
    const claim = user.claims.find(c => c.type === type)
    return claim?.value ? parseInt(claim.value, 10) : 0
  }
  
  return {
    isAuthenticated: user.isAuthenticated,
    id: getClaim('sub'),
    name: getClaim('name'),
    email: getClaim('email'),
    preferredUsername: getClaim('preferred_username'),
    givenName: getClaim('given_name'),
    familyName: getClaim('family_name'),
    emailVerified: getBooleanClaim('email_verified'),
    sessionId: getClaim('sid'),
    authTime: getNumberClaim('auth_time'),
    jti: getClaim('jti'),
    claims: user.claims,
  }
}