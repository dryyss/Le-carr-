import type { Access, ClientUser, Field, FieldAccess, PayloadRequest } from 'payload'

export const STAFF_ROLES = ['gerant', 'serveur'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

type StaffUser = { collection: 'users'; role?: StaffRole | null; id: number | string }

export function staffUser(req: PayloadRequest): StaffUser | null {
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
export const nobody: Access = () => false
export const isGerant: Access = ({ req }) => isGerantReq(req)
export const isStaff: Access = ({ req }) => isStaffReq(req)

/** Gérant : tout. Autre membre du staff : uniquement son propre document. */
export const isGerantOrSelf: Access = ({ req }) => {
  if (isGerantReq(req)) return true
  const user = staffUser(req)
  return user ? { id: { equals: user.id } } : false
}

export const isGerantField: FieldAccess = ({ req }) => isGerantReq(req)

/** Masque une collection dans l'admin pour tout le monde sauf le gérant. */
export const hiddenUnlessGerant = ({ user }: { user: ClientUser }) =>
  (user as unknown as { role?: string } | null)?.role !== 'gerant'

/** Applique « modifiable par le gérant uniquement » à des champs (le serveur garde la lecture). */
export function gerantOnly(fields: Field[]): Field[] {
  return fields.map((f) => {
    if ('name' in f && f.name && f.type !== 'ui') {
      const access = 'access' in f ? f.access : undefined
      return { ...f, access: { ...access, create: isGerantField, update: isGerantField } } as Field
    }
    if (f.type === 'row' || f.type === 'collapsible') {
      return { ...f, fields: gerantOnly(f.fields) } as Field
    }
    return f
  })
}
