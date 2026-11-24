import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const STAFF_ROLES = ['gerant', 'serveur'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

type StaffUser = { collection: 'users'; role?: StaffRole | null; id: number | string }

function staffUser(req: PayloadRequest): StaffUser | null {
  const user = req.user as (StaffUser & { collection: string }) | null
  return user && user.collection === 'users' ? user : null
}

export function isGerantReq(req: PayloadRequest): boolean {
  return staffUser(req)?.role === 'gerant'
}

export function isStaffReq(req: PayloadRequest): boolean {
  const role = staffUser(req)?.role
  return role === 'gerant' || role === 'serveur'
}

export const anyone: Access = () => true
export const isGerant: Access = ({ req }) => isGerantReq(req)
export const isStaff: Access = ({ req }) => isStaffReq(req)

/** Gérant : tout. Autre membre du staff : uniquement son propre document. */
export const isGerantOrSelf: Access = ({ req }) => {
  if (isGerantReq(req)) return true
  const user = staffUser(req)
  return user ? { id: { equals: user.id } } : false
}

export const isGerantField: FieldAccess = ({ req }) => isGerantReq(req)
