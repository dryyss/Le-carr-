import { DEMO_ACCOUNTS, isDemo } from '@/lib/demo'

export function DemoLoginHint() {
  if (!isDemo()) return null
  return (
    <div className="lc-demo-box">
      <strong>Mode démo</strong>
      <p>Aucun SMS ni mail n’est réellement envoyé. Comptes de test :</p>
      <ul>
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email}>
            {a.label} : <code>{a.email}</code> / <code>{a.password}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
