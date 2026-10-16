import React, { useState, useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'

export interface EstimateInputProps {
  /**
   * Valor em minutos (1–600) ou null / undefined para "sem estimativa"
   */
  value: number | null | undefined
  /**
   * Callback invocado quando o valor muda
   */
  onChange: (val: number | null) => void
  /**
   * Se true, permite limpar o valor para null ("Sem estimativa")
   * Padrão: false
   */
  allowClear?: boolean
  /**
   * Texto quando vazio/sem estimativa
   */
  placeholder?: string
  /**
   * Callback chamado ao pressionar Enter no input
   */
  onConfirm?: () => void
  /**
   * Se true, exibe a fileira de chips de atalho rápido (5, 15, 25, 45, 90)
   * Padrão: true
   */
  showQuickChips?: boolean
  /**
   * Se true, exibe aviso sutil quando >90 min
   * Padrão: true
   */
  showWarning?: boolean
  /**
   * Variante visual: 'compact' (para barras/linhas compactas) ou 'full' (painel de detalhe)
   * Padrão: 'compact'
   */
  variant?: 'compact' | 'full'
  /**
   * Classe CSS adicional
   */
  className?: string
  /**
   * Se deve focar automaticamente
   */
  autoFocus?: boolean
}

const QUICK_PRESETS = [5, 15, 25, 45, 90]

export function EstimateInput({
  value,
  onChange,
  allowClear = false,
  placeholder = 'min',
  onConfirm,
  showQuickChips = true,
  showWarning = true,
  variant = 'compact',
  className = '',
  autoFocus = false,
}: EstimateInputProps) {
  const numericValue = typeof value === 'number' && value > 0 ? value : null
  const [textValue, setTextValue] = useState<string>(
    numericValue !== null ? String(numericValue) : '',
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTextValue(numericValue !== null ? String(numericValue) : '')
  }, [numericValue])

  const commitValue = (valStr: string) => {
    const trimmed = valStr.trim()
    if (!trimmed) {
      if (allowClear) {
        onChange(null)
      } else {
        onChange(25)
        setTextValue('25')
      }
      return
    }

    const parsed = parseInt(trimmed, 10)
    if (isNaN(parsed) || parsed < 1) {
      if (allowClear) {
        onChange(null)
      } else {
        onChange(25)
        setTextValue('25')
      }
      return
    }

    const clamped = Math.max(1, Math.min(600, parsed))
    onChange(clamped)
    setTextValue(String(clamped))
  }

  const handleStep = (delta: number) => {
    const current = numericValue !== null ? numericValue : 25
    const next = Math.max(1, Math.min(600, current + delta))
    onChange(next)
    setTextValue(String(next))
  }

  const isHighEstimate = numericValue !== null && numericValue > 90

  return (
    <div className={`estimate-input-container ${variant} ${className}`}>
      <div className="estimate-input-box">
        <button
          type="button"
          className="estimate-step-btn minus"
          onClick={() => handleStep(-5)}
          title="Diminuir 5 minutos"
          aria-label="Diminuir 5 minutos"
        >
          −
        </button>

        <div className="estimate-numeric-wrap">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={textValue}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, '')
              setTextValue(cleaned)
            }}
            onBlur={() => commitValue(textValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitValue(textValue)
                onConfirm?.()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                handleStep(5)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                handleStep(-5)
              }
            }}
            className="estimate-text-input"
            title="Digite uma estimativa livre de 1 a 600 minutos"
          />
          <span className="estimate-unit-label">MIN</span>
        </div>

        <button
          type="button"
          className="estimate-step-btn plus"
          onClick={() => handleStep(5)}
          title="Aumentar 5 minutos"
          aria-label="Aumentar 5 minutos"
        >
          +
        </button>
      </div>

      {showQuickChips && (
        <div className="estimate-quick-chips">
          {QUICK_PRESETS.map((preset) => {
            const isSelected = numericValue === preset
            return (
              <button
                key={preset}
                type="button"
                className={`estimate-chip ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onChange(preset)
                  setTextValue(String(preset))
                  onConfirm?.()
                }}
                title={`Definir ${preset} minutos`}
              >
                {preset}m
              </button>
            )
          })}
          {allowClear && numericValue !== null && (
            <button
              type="button"
              className="estimate-chip clear"
              onClick={() => {
                onChange(null)
                setTextValue('')
              }}
              title="Remover estimativa"
            >
              Sem est.
            </button>
          )}
        </div>
      )}

      {showWarning && isHighEstimate && (
        <div className="estimate-warning-badge" role="status">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#C5A880]" />
          <span>90+ min? Considere quebrar a tarefa em partes menores.</span>
        </div>
      )}
    </div>
  )
}
