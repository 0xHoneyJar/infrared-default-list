import type { Address, PublicClient } from 'viem'

import type { ProtocolsSchema } from '@/types/protocols'
import type { TokensSchema } from '@/types/tokens'

import { delay } from './delay'
import { getFile } from './get-file'
import { getTokenName } from './get-token-name'
import { getTokenSymbol } from './get-token-symbol'
import { validateDecimals } from './validate-decimals'
import { validateImage } from './validate-image'

const RPC_REQUESTS_PER_SECOND = 10
const ONE_SECOND = 1000

interface Counter {
  value: number
}

const validateSymbol = async ({
  errors,
  onChainSymbol,
  token,
}: {
  errors: Array<string>
  onChainSymbol: string
  token: TokensSchema['tokens'][number]
}) => {
  if (token.symbol !== onChainSymbol) {
    errors.push(
      `${token.symbol}’s symbol does not match the on-chain symbol ${onChainSymbol}`,
    )
  }
}

const validateName = async ({
  errors,
  onChainName,
  onChainSymbol,
  publicClient,
  rpcLookupCount,
  token,
}: {
  errors: Array<string>
  onChainName: string
  onChainSymbol: string
  publicClient: PublicClient
  rpcLookupCount: Counter
  token: TokensSchema['tokens'][number]
}) => {
  if ('underlyingTokens' in token) {
    const symbols = await Promise.all(
      token.underlyingTokens.map(async (underlyingToken) => {
        rpcLookupCount.value += 1
        if (rpcLookupCount.value % RPC_REQUESTS_PER_SECOND === 0) {
          await delay(ONE_SECOND)
        }
        return await getTokenSymbol({
          errors,
          publicClient,
          tokenAddress: underlyingToken as Address,
        })
      }),
    )
    const underlyingTokenSymbols = symbols.join('-')

    if (token.name !== underlyingTokenSymbols) {
      rpcLookupCount.value += 1
      if (rpcLookupCount.value % RPC_REQUESTS_PER_SECOND === 0) {
        await delay(ONE_SECOND)
      }

      if (token.name !== onChainName && token.name !== onChainSymbol) {
        // exception for cases like bWBERA
        errors.push(`${token.name} does not match ${underlyingTokenSymbols}`)
      }
    }
  } else if (token.name !== onChainName && token.name !== onChainSymbol) {
    errors.push(`${token.name} does not match ${onChainName}`)
  }
}

const protocolsList: ProtocolsSchema = getFile('src/protocols.json')

const validateProtocol = ({
  errors,
  token,
}: {
  errors: Array<string>
  token: TokensSchema['tokens'][number]
}) => {
  if (!('protocol' in token)) {
    return
  }

  const protocol = protocolsList.protocols.find(
    ({ id }) => id === token.protocol,
  )

  if (!protocol) {
    errors.push(`${token.symbol} does not have a protocol (token validation)`)
  }
}

const validateMintUrl = ({
  errors,
  token,
}: {
  errors: Array<string>
  token: TokensSchema['tokens'][number]
}) => {
  if (!('mintUrl' in token) || !token.mintUrl) {
    return
  }

  if (token.protocol === 'bex') {
    const expectedMintUrl = `https://hub.berachain.com/pools/`
    if (!token.mintUrl.startsWith(expectedMintUrl)) {
      errors.push(
        `${token.symbol} mintUrl is incorrect. It should start with ${expectedMintUrl}`,
      )
    }
  } else if (token.protocol === 'dolomite') {
    const expectedMintUrl = `https://app.dolomite.io/balances`
    if (!token.mintUrl.startsWith(expectedMintUrl)) {
      errors.push(
        `${token.symbol} mintUrl is incorrect. It should be ${expectedMintUrl}`,
      )
    }
  } else if (token.protocol === 'kodiak') {
    const expectedMintUrl = `https://app.kodiak.finance/#/liquidity/pools/${token.address}?chain=berachain_mainnet`
    if (token.mintUrl !== expectedMintUrl) {
      errors.push(
        `${token.symbol} mintUrl is incorrect. It should be ${expectedMintUrl}`,
      )
    }
  }
}

export const validateTokenDetails = async ({
  errors,
  publicClient,
  tokens,
}: {
  errors: Array<string>
  publicClient: PublicClient
  tokens: TokensSchema['tokens']
}) => {
  const rpcLookupCount = { value: 0 }

  for (const token of tokens) {
    await validateDecimals({ errors, publicClient, token })
    await validateImage({
      errors,
      item: token,
      required: false,
      type: 'tokens',
    })
    await validateMintUrl({ errors, token })
    validateProtocol({ errors, token })

    const onChainSymbol = await getTokenSymbol({
      errors,
      publicClient,
      tokenAddress: token.address as Address,
    })
    const onChainName = await getTokenName({
      errors,
      publicClient,
      tokenAddress: token.address as Address,
    })

    await validateSymbol({ errors, onChainSymbol, token })
    await validateName({
      errors,
      onChainName,
      onChainSymbol,
      publicClient,
      rpcLookupCount,
      token,
    })
  }
}
