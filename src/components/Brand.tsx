import logo from '@/assets/monograma-barbosa-transparente-master-ae2e0.png'
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <img src={logo} alt="Barbosa System" />
      <span className={compact ? 'sr-only' : ''}>
        BARBOSA
        <br />
        SYSTEM
      </span>
    </div>
  )
}
export function BrandMark({ className = '' }: { className?: string }) {
  return <img className={className} src={logo} alt="" />
}
