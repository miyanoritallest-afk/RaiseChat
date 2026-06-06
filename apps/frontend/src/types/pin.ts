export type PinUser = {
  id: string
  displayName: string
  avatarUrl: string | null
}

export type PinMessage = {
  id: string
  content: string
  createdAt: string
  user: PinUser
}

export type Pin = {
  id: string
  messageId: string
  channelId: string
  createdAt: string
  user: PinUser
  message: PinMessage
}

export type PinUpdatedPayload =
  | { action: 'add'; pin: Pin }
  | { action: 'remove'; pin: { id: string; messageId: string } }
