/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { runDateParserTests } from './lib/date-parser.test'

// Validação dos testes unitários do parser em tempo de carregamento
try {
  runDateParserTests()
} catch (err) {
  console.error('Falha nos testes de data/recorrência:', err)
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
