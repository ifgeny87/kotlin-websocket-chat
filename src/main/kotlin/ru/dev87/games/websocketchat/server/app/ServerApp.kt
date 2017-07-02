package ru.dev87.games.websocketchat.server.app

import org.eclipse.jetty.server.Server
import ru.dev87.games.websocketchat.server.handler.RoomHandler

// порт сервера
val SERVER_PORT = 3333

fun main(args: Array<String>) {
	val jettyServer = Server(SERVER_PORT)
	jettyServer.handler = RoomHandler()
	jettyServer.start()
}
