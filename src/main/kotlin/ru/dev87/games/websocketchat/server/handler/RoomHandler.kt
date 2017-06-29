package ru.dev87.games.websocketchat.server.handler

import org.eclipse.jetty.websocket.WebSocket
import org.eclipse.jetty.websocket.WebSocketHandler
import org.slf4j.LoggerFactory
import ru.dev87.games.websocketchat.server.socket.RoomSocket
import java.util.concurrent.CopyOnWriteArraySet
import javax.servlet.http.HttpServletRequest

class RoomHandler : WebSocketHandler() {

	// logger
	private val log = LoggerFactory.getLogger(RoomHandler::class.java)

	val webSockets = CopyOnWriteArraySet<RoomSocket>()

	override fun doWebSocketConnect(request: HttpServletRequest?, protocol: String?): WebSocket {
		log.info("Ктото подключился: ${request}")
		return RoomSocket(webSockets)
	}

}
