const ChatController = {

	// объект сокета
	webSocket: null,

	// имя пользователя
	username: null,

	// блок вывода сообщений
	outputBox: null,

	// поле ввода текста
	inputBox: null,

	// количество неудачных соединений подряд
	closeConnectionCount: 0,

	/**
	 * Инициализация контроллера
	 */
	init: function () {
		this.outputBox = document.getElementById('output');

		this.inputBox = document.getElementById('input_message');

		this.inputBox.onkeypress = e => {
			if (e.keyCode == 13) this.onSendMessage.call(this)
		};

		document.getElementById('submit_message').onclick = this.onSendMessage.bind(this);

		this.createConnection();

		this.inputBox.focus();
	},

	/**
	 * Обработчик отправки сообщения
	 */
	onSendMessage: function () {
		// проверяем соединение
		if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
			this.addNotice('Соединение не установлено. Некуда отпрвлять сообщение.');
			return;
		}

		// определяем сообщение
		const text = this.inputBox.value.trim();

		// выделяем весь текст в поле ввода
		// для удобства пользователя
		this.inputBox.setSelectionRange(0, text.length);

		// если текст пустой, ничего не делаем
		if (!text) return;

		// если пользователь пытается ввести служебную команду
		// все служебные команды начинаются со слеша
		if ('/' === text.substr(0, 1) && text.indexOf(' ') > 0) {
			const cmd = text.substr(1, text.indexOf(' ') - 1).toLowerCase();
			const value = text.substr(cmd.length + 2);

			switch (cmd) {
				case 'auth':
					this.auth(value);
					return;
			}
			// если служебная команда не определена,
			// то считаем, что это обычный текст
		}

		// проверяю автора
		if (!this.username) {
			this.addNotice('Сначала нужно указать автора. Введите команду "/auth <имя автора>"');
			return;
		}

		// отправляю новое сообщение от пользователя
		this.webSocket.send(text);
	},

	/**
	 * Авторизация на сервере
	 * @param name Имя пользователя
	 */
	auth: function (name) {
		// првоерка имени
		if (!name || name.length < 3) {
			this.addError('Имя должно быть не менее 3 символов');
			return;
		}

		this.webSocket.send(`/auth ${name}`);
	},

	/**
	 * Создание соединения
	 */
	createConnection: function () {
		let ws = new WebSocket('ws://localhost:3333');

		ws.onopen = () => {
			console.info('[OPEN CONNECTION]', arguments);
			this.addNotice('Соединение с сервером установлено.');
			// счетчик неудачных подключений сбрасывается
			this.closeConnectionCount = 0;
		};

		ws.onclose = this.onCloseConnection.bind(this);

		ws.onerror = () => {
			console.error('[ERROR CONNECTION]', arguments);
			this.addError('Ошибка соединения. Смотрите лог.');
		};

		ws.onmessage = this.onMessage.bind(this);

		this.webSocket = ws;
	},

	/**
	 * Обработчик потери соединения
	 */
	onCloseConnection() {
		console.warn('[CLOSE CONNECTION]', arguments);

		this.addError('Соединение с сервером разорвано.');

		// увеличиваем счетчик неудачных подключений
		this.closeConnectionCount++;

		// сервер все равно не запомнил пользователя
		this.username = null;

		if (this.closeConnectionCount > 6) {
			// если неудачи происходят слишком часто, то добавим кнопку для ручного повтора
			this.appendConnectButton();
			return;
		}

		// иначе будем пробовать переподключиться по таймеру
		const timeout = Math.pow(2, this.closeConnectionCount);

		this.addNotice(`Повторное подключение будет производиться через ${timeout} сек`);

		setTimeout(this.createConnection.bind(this), timeout * 1000);
	},

	/**
	 * Обработчик полученного сообщения
	 * @param message
	 */
	onMessage(message) {
		console.info('[MESSAGE RECEIVED]', message);

		// надо распарсить сообщение
		const k = message.data.indexOf('|');
		const type = message.data.substr(0, k);
		const text = message.data.substr(k + 1);

		if (type === 'auth') {
			// текст этой команды будет то самое разрешенное сервером имя
			this.username = text;
		}

		else if (type === 'err') {
			this.addError(text)
		}

		else if (type === 'inf') {
			this.addNotice(text)
		}

		else if (type === 'you') {
			// сервер подтвердил сообщение пользователя
			this.addMessage({
				date: +Date.now(),
				username: this.username,
				me: true,
				text
			})
		}

		else if (type === 'message') {
			// нужно определить имя автора, который прислал сообщение
			const k1 = text.indexOf('|');
			const username = text.substr(0, k1);
			const text1 = text.substr(k1 + 1);
			this.addMessage({
				date: +Date.now(),
				username,
				text: text1
			})
		}

		else
			this.addError(`Сервер прислал сообщение "${message.data}". Но его не удалось распознать`)
	},

	/**
	 * Добавляет новое сообщение в вывод
	 * @param messageObj
	 */
	addMessage(messageObj) {
		this.appendMessageToOutput(Object.assign({
			type: 'message',
		}, messageObj));
	},

	/**
	 * Добавляет новое извещение в вывод
	 * @param text
	 */
	addNotice(text) {
		this.appendMessageToOutput({
			type: 'notice',
			date: +Date.now(),
			text
		});
	},

	/**
	 * Добавляет новую ошибку в вывод
	 * @param text
	 */
	addError(text) {
		this.appendMessageToOutput({
			type: 'error',
			date: +Date.now(),
			text
		});
	},

	/**
	 * Добавляет сообщение в DOM вывода
	 * @param messageObj
	 */
	appendMessageToOutput(messageObj) {
		// проверка сообщения
		if (typeof messageObj !== 'object') {
			console.error('Невозможно отобразить сообщение', messageObj);
			messageObj = {
				type: 'error',
				date: +Date.now(),
				text: 'Не возможно отобразить сообщение: ' + messageObj.ToString()
			}
		}

		// составляем сообщение
		let msgNode = document.createElement('div');
		msgNode.className = messageObj.type; // тип сообщения совпадает с классом, повезло

		// дата сообщения
		const dateNode = document.createElement('span');
		dateNode.className = 'date';
		const dateStr = new Date(messageObj.date).toLocaleString();
		dateNode.appendChild(document.createTextNode(dateStr));
		msgNode.appendChild(dateNode);

		// автор если есть
		if (messageObj.username) {
			const usernameNode = document.createElement('span');
			usernameNode.className = 'username';
			if (messageObj.me) {
				usernameNode.className += ' me';
			}
			usernameNode.appendChild(document.createTextNode(messageObj.username));

			msgNode.appendChild(document.createTextNode(' '));
			msgNode.appendChild(usernameNode);
		}

		// двоеточие
		msgNode.appendChild(document.createTextNode(': '));

		// текст сообщения
		const textNode = document.createElement('span');
		textNode.className = 'text';
		textNode.appendChild(document.createTextNode(messageObj.text));
		msgNode.appendChild(textNode);

		this.outputBox.appendChild(msgNode);

		// автоскролл
		this.outputBox.scrollTop = this.outputBox.scrollHeight;
	},

	/**
	 * Добавляет кнопку повторного подключения в DOM вывода
	 */
	appendConnectButton: function () {
		const buttonNode = document.createElement('button');
		buttonNode.appendChild(document.createTextNode('Подключиться'));
		buttonNode.onclick = () => {
			buttonNode.remove();
			this.createConnection.call(this);
		};

		this.outputBox.appendChild(buttonNode);
	},
};

window.addEventListener('load', () => {
	ChatController.init();
});