import pb from '@/lib/pocketbase/client'
import type { McpTokenRecord, CreatedMcpTokenResponse } from '@/types'

/**
 * Retorna a URL base do servidor MCP (/backend/v1/mcp)
 * Baseada na URL de PocketBase configurada na aplicação.
 */
export function getMcpServerUrl(): string {
  const baseUrl = (pb.baseUrl || window.location.origin).replace(/\/$/, '')
  return `${baseUrl}/backend/v1/mcp`
}

/**
 * Lista todos os tokens MCP do usuário autenticado ordenados pelos mais recentes.
 */
export async function getMcpTokens(): Promise<McpTokenRecord[]> {
  try {
    const records = await pb.collection('mcp_tokens').getFullList<McpTokenRecord>({
      sort: '-created',
    })
    return records
  } catch (err) {
    console.error('Erro ao listar tokens MCP:', err)
    return []
  }
}

/**
 * Cria um novo token pessoal MCP chamando o endpoint seguro do backend.
 * Devolve o valor cru `bs_mcp_...` que só é visível nesta resposta.
 */
export async function createMcpToken(name: string): Promise<CreatedMcpTokenResponse> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('O nome do token é obrigatório.')
  }

  const response = await pb.send<CreatedMcpTokenResponse>('/backend/v1/mcp-tokens', {
    method: 'POST',
    body: { name: trimmed },
  })

  return response
}

/**
 * Revoga um token MCP (marca revoked = true).
 */
export async function revokeMcpToken(tokenId: string): Promise<McpTokenRecord> {
  return await pb.collection('mcp_tokens').update<McpTokenRecord>(tokenId, {
    revoked: true,
  })
}

/**
 * Exclui permanentemente um token MCP.
 */
export async function deleteMcpToken(tokenId: string): Promise<boolean> {
  return await pb.collection('mcp_tokens').delete(tokenId)
}
