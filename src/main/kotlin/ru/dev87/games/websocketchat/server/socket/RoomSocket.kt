package ru.dev87.games.websocketchat.server.socket

import org.eclipse.jetty.websocket.WebSocket
import org.slf4j.LoggerFactory
import java.util.regex.Pattern

class RoomSocket(var webSockets: Set<RoomSocket>) : WebSocket.OnTextMessage {

	// logger
	private val log = LoggerFactory.getLogger(RoomSocket::class.java)

	// хранилище соединения
	var connection: WebSocket.Connection? = null

	// имя пользователя
	var username: String? = null

	// паттерн команды входа
	val authCmdPattern = Pattern.compile("^\\/auth ([\\S]+).*")

	// паттерн команды запроса пользвоателей
	val getUsersCmdPattern = Pattern.compile("^\\/getUsers.*")

	override fun onOpen(connection: WebSocket.Connection?) {
		log.info("Сокет открылся: ${connection}")

		this.connection = connection
		webSockets += this
	}

	override fun onClose(closeCode: Int, message: String?) {
		log.info("Сокет закрылся: ${connection}")

		webSockets -= this
	}

	override fun onMessage(data: String) {
		log.info("Пришло сообщение: ${data}")

		if (authCmdPattern.matcher(data).matches()) {
			val matcher = authCmdPattern.matcher(data)
			matcher.find()
			username = matcher.group(1)

			for (webSocket in webSockets) {
				if(webSocket == this)
					webSocket.sendMessage("inf|Вы успешны")
				else
					webSocket.sendMessage("inf|В чат подключился ${username}")
			}
		}

		else if(getUsersCmdPattern.matcher(data).matches()) {
			val users= ArrayList<String>()

			for(webSocket in webSockets)
				users.add(webSocket.username!!)

			sendMessage("inf|Список пользователей: " + users.joinToString())
		}

		else if(username == null || username!!.isEmpty()) {
			sendMessage("err|Вы не авторизованы. Воспользуйтесь командой auth")
		}

		else {
			sendMessage("err|Вы отправили неизвестную команду")
		}
	}

	fun sendMessage(data: String) {
		log.info("Отправляю сообщение: ${data}")

		connection?.sendMessage(data)
	}
}
