package ru.dev87.games.websocketchat.server.app

import org.eclipse.jetty.server.Server
import org.eclipse.jetty.server.handler.DefaultHandler
import ru.dev87.games.websocketchat.server.handler.RoomHandler

fun main(args: Array<String>) {
	val roomHandler = RoomHandler()
	roomHandler.handler = DefaultHandler()

	val jettyServer = Server(3333)
	jettyServer.handler = roomHandler
	jettyServer.start()
}
