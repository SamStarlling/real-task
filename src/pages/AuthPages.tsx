import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { BrandMark } from '@/components/Brand'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify'
const content = {
  login: ['Entrar', 'Acesse seu espaço de foco.'],
  signup: ['Criar conta', 'Comece com clareza.'],
  forgot: ['Recuperar senha', 'Enviaremos as instruções por e-mail.'],
  reset: ['Nova senha', 'Defina sua nova senha de acesso.'],
  verify: ['Verifique seu e-mail', 'Ative sua conta para continuar.'],
} as const
export function AuthPage({ mode }: { mode: Mode }) {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [form, setForm] = useState({
    name: '',
    email: params.get('email') || '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        nav('/')
      }
      if (mode === 'signup') {
        if (form.password.length < 8) {
          setErrors({ password: 'Use no mínimo 8 caracteres.' })
          return
        }
        await pb
          .collection('users')
          .create({
            name: form.name,
            email: form.email,
            password: form.password,
            passwordConfirm: form.password,
          })
        await pb.collection('users').requestVerification(form.email)
        nav(`/verify-email?email=${encodeURIComponent(form.email)}`)
      }
      if (mode === 'forgot') {
        await pb.collection('users').requestPasswordReset(form.email)
        setMessage('Se o e-mail estiver cadastrado, você receberá o link de recuperação.')
      }
      if (mode === 'reset') {
        if (form.password !== form.passwordConfirm) {
          setErrors({ passwordConfirm: 'As senhas não coincidem.' })
          return
        }
        await pb
          .collection('users')
          .confirmPasswordReset(params.get('token') || '', form.password, form.passwordConfirm)
        setMessage('Senha atualizada. Você já pode entrar.')
      }
      if (mode === 'verify') {
        const token = params.get('token')
        if (token) {
          await pb.collection('users').confirmVerification(token)
          setMessage('E-mail confirmado. Sua conta está pronta.')
        } else if (form.email) {
          await pb.collection('users').requestVerification(form.email)
          setMessage('E-mail de verificação reenviado.')
        }
      }
    } catch (err) {
      const fields = extractFieldErrors(err)
      setErrors(Object.keys(fields).length ? fields : { form: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <BrandMark className="auth-logo" />
        <h1>{content[mode][0]}</h1>
        <p>{content[mode][1]}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <Field
              label="Nome"
              name="name"
              value={form.name}
              error={errors.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
          )}
          {!['reset'].includes(mode) && (!params.get('token') || mode !== 'verify') && (
            <Field
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          )}
          {['login', 'signup', 'reset'].includes(mode) && (
            <Field
              label={mode === 'reset' ? 'Nova senha' : 'Senha'}
              name="password"
              type="password"
              value={form.password}
              error={errors.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          )}
          {mode === 'reset' && (
            <Field
              label="Confirmar senha"
              name="passwordConfirm"
              type="password"
              value={form.passwordConfirm}
              error={errors.passwordConfirm}
              onChange={(v) => setForm({ ...form, passwordConfirm: v })}
            />
          )}
          {errors.form && <span className="field-error">{errors.form}</span>}
          {message && <div className="success">{message}</div>}
          <button className="primary" disabled={busy}>
            {busy
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : mode === 'forgot'
                    ? 'Enviar link de recuperação'
                    : mode === 'reset'
                      ? 'Salvar nova senha'
                      : params.get('token')
                        ? 'Confirmar e-mail'
                        : 'Reenviar e-mail'}
          </button>
        </form>
        <div className="auth-links">
          {mode === 'login' ? (
            <>
              <Link to="/signup">Criar conta</Link>
              <Link to="/forgot-password">Esqueci minha senha</Link>
            </>
          ) : (
            <Link to="/login">Entrar</Link>
          )}
        </div>
      </div>
    </main>
  )
}
function Field({
  label,
  name,
  type = 'text',
  value,
  error,
  onChange,
}: {
  label: string
  name: string
  type?: string
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      {error && <small>{error}</small>}
    </label>
  )
}
