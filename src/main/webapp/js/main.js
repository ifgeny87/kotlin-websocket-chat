let ws = null;

function checkAndSend() {
	let timeout = 10000;

	if (ws === null) {
		// нет подключения
		console.log('WS is null. Try to connect');
		ws = initWs();
		timeout = 1000
	} else if (ws.readyState === ws.CONNECTING) {
		// подключение устанавливается
		console.log('WS is connecting to ' + ws.url + '...');
		timeout = 200;
	}
	else if (ws.readyState === ws.OPEN) {
		// подключение установлено
		ws.send('Server! How are you?');
	}
	else if (ws.readyState === ws.CLOSING) {
		// подключение закрывается
		console.log('WS is closing...');
		timeout = 200;
	}
	else if (ws.readyState === ws.CLOSED) {
		// разъединено
		console.log(`WS ${ws.url} closed. Try again later.`);
		timeout = 5000;
		ws = null
	}

	setTimeout(checkAndSend, timeout);
}

let initWs = () => {
	let ws = new WebSocket("ws://localhost:3333");
	ws.onopen = () => ws.send('Hi, Server!');
	ws.onmessage = data => console.log('Server says: ', data);
	return ws;
};

window.onload = checkAndSend;