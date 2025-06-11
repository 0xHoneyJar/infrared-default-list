import {
  array,
  type InferOutput,
  nonEmpty,
  optional,
  picklist,
  pipe,
  strictObject,
  string,
  url,
} from 'valibot'

export const ProtocolTypeSchema = picklist([
  'aggregator',
  'money-market',
  'defi',
  'derivatives',
  'dex',
  'lst',
  'yield',
  'unknown',
  'vault',
])

export const DefaultListProtocolSchema = strictObject({
  description: string(),
  id: string(),
  imageDark: string(),
  imageLight: string(),
  imageOnTop: optional(string()),
  name: string(),
  prefix: optional(string()),
  type: ProtocolTypeSchema,
  url: pipe(string(), nonEmpty('Please enter a url'), url()),
})
export type DefaultListProtocol = InferOutput<typeof DefaultListProtocolSchema>

export const DefaultListProtocolsSchema = array(DefaultListProtocolSchema)
export type DefaultListProtocols = InferOutput<
  typeof DefaultListProtocolsSchema
>
