import { ChatMessageSelect } from '@games/db-schema'
import { gamesPubsubs } from '@games/redis'
import { observable } from '@trpc/server/observable'
import { procedure } from '../trpc'

export const subscription = procedure.subscription(() => {
  return observable<ChatMessageSelect>((observer) => {
    const unsubscribe = gamesPubsubs.chatMessages.subscribe((message) => {
      observer.next(message)
    })

    return () => unsubscribe()
  })
})
