import type { BoardStore } from '$lib/stores/board'
import type { MarketSocket } from '$lib/utils/ws-client'

// Wires a market socket into a board store and connects it. Returns a cleanup
// function for `onMount`. Shared by the big-screen board and the trading desk.
export const connectMarketFeed = (board: BoardStore, socket: MarketSocket) => {
  const unsubscribers = [
    socket.onStatus((connection) => board.setConnection(connection)),
    socket.on('prices.update', (payload, frame) =>
      board.applyPriceUpdate(payload, frame.timestamp)
    ),
    socket.on('event.started', (payload, frame) =>
      board.applyEvent('event.started', payload, frame.timestamp)
    ),
    socket.on('event.ended', (payload, frame) =>
      board.applyEvent('event.ended', payload, frame.timestamp)
    )
  ]
  socket.connect()

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe())
    socket.disconnect()
    board.destroy()
  }
}
