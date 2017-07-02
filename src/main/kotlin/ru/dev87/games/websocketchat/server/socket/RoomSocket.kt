package ru.dev87.games.websocketchat.server.socket

import org.eclipse.jetty.websocket.WebSocket
import org.slf4j.LoggerFactory
import java.util.regex.Pattern

class RoomSocket(var webSockets: MutableSet<RoomSocket>) : WebSocket.OnTextMessage {

	// logger
	private val log = LoggerFactory.getLogger(RoomSocket::class.java)

	// хранилище соединения
	private var connection: WebSocket.Connection? = null

	// имя пользователя клиента
	var username: String? = null
		get private set;

	// маска для проверки имени пользователя
	private val usernamePattern = Pattern.compile("^[A-Za-z0-9_]*$");

	/**
	 * Обработка события нового соединения с клиентом
	 */
	override fun onOpen(connection: WebSocket.Connection?) {
		log.info("Сокет открылся: ${connection}")

		this.connection = connection
		webSockets.add(this)
	}

	/**
	 * Обработка отключения клиента
	 */
	override fun onClose(closeCode: Int, message: String?) {
		log.info("Сокет закрылся: ${connection}")

		webSockets.remove(this)
	}

	/**
	 * Валидатор имени
	 */
	private fun checkUsername(username: String?): Boolean {
		if (username == null)
			return false

		return usernamePattern.matcher(username).matches()
	}

	/**
	 * Обработка события получения нового сообщения от клиента
	 */
	override fun onMessage(data: String) {
		log.info("Пришло сообщение: ${data}")

		// пользователь отправляет служебное сообщение
		if (data.startsWith("/") && data.indexOf(' ') > 0) {
			val k = data.indexOf(' ')
			val cmd = data.substring(1, k).toLowerCase()
			val value = data.substring(cmd.length + 2)

			if (cmd == "auth") {
				// команда авторизации
				val username = value.trim()

				if (!checkUsername(username)) {
					sendMessage("err|Вы указали запрещенное имя пользователя")
					return
				}

				// возможно, кто-то из пользователей уже занял это имя
				val usernameBusy = webSockets
						.filter { it.username == username }
						.isNotEmpty()

				// имя пользователя занято
				if (usernameBusy) {
					sendMessage("err|Имя пользователя уже занято")
					return
				}


				// запоминаю имя пользователя
				this.username = username

				// подтверждаю имя пользователя
				sendMessage("auth|${username}")

				// сообщаю о появлении нового пользвоаетля в чате
				webSockets.forEach { it.sendMessage("inf|В чат подключился ${username}") }
				return
			}
			// если служебное сообщение не было распознано,
			// то оно считается текстовым сообщением в чате
		}

		//
		// пользователь отправляет простое сообщение
		//

		// пользователь еще не авторизован
		if (username == null || username!!.isEmpty()) {
			sendMessage("err|Вы не авторизованы. Воспользуйтесь командой auth")
			return
		}

		// проверка сообщения
		if (data.isEmpty()) {
			sendMessage("err|Нельзя отправить пустое сообщение")
			return
		}

		// сообщу пользователю, что его сообщение принято
		sendMessage("you|${data}")

		// другим участникам чата также нужно отправить сообщение
		webSockets
				.filter { it != this }
				.forEach { it.sendMessage("message|${this.username}|${data}") }
	}

	/**
	 * Оправка сообщения клиенту
	 */
	fun sendMessage(data: String) {
		log.info("Отправляю сообщение: ${data}")

		connection?.sendMessage(data)
	}
}
