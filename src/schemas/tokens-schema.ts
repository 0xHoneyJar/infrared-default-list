import {
  array,
  boolean,
  nonEmpty,
  number,
  optional,
  picklist,
  pipe,
  strictObject,
  string,
  type InferOutput,
  union,
  url,
} from 'valibot'

import { AddressSchema } from './address-schema'

const ProtocolSchema = string()
const TokenTypeSchema = picklist([
  'amm',
  'cdp',
  'perpetuals',
  'unknown',
  'vault',
])

export const DefaultListBasicTokenSchema = strictObject({
  address: AddressSchema,
  decimals: number(),
  image: string(),
  name: string(),
  symbol: string(),
})
export type DefaultListBasicToken = InferOutput<
  typeof DefaultListBasicTokenSchema
>
export const DefaultListTokenWithUnderlyingSchema = strictObject({
  ...DefaultListBasicTokenSchema.entries,
  imageNotFromUnderlying: optional(boolean()),
  mintUrl: pipe(string(), nonEmpty('Please enter a mintUrl'), url()),
  protocol: ProtocolSchema,
  type: TokenTypeSchema,
  underlyingTokens: array(AddressSchema),
})
export type DefaultListTokenWithUnderlying = InferOutput<
  typeof DefaultListTokenWithUnderlyingSchema
>

export const DefaultListTokenSchema = union([
  DefaultListBasicTokenSchema,
  DefaultListTokenWithUnderlyingSchema,
])
export type DefaultListToken = InferOutput<typeof DefaultListTokenSchema>

export const DefaultListTokensSchema = array(DefaultListTokenSchema)
export type DefaultListTokens = InferOutput<typeof DefaultListTokensSchema>
