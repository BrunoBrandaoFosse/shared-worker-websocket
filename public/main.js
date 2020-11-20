
let elLista = document.getElementById("lista");

let input = document.querySelector("input");
document.querySelector("button").addEventListener("click", sendMessage);

const worker = new SharedWorker("worker.js");
const id = uuid.v4();

// Set initial state
let webSocketState = WebSocket.CONNECTING;

console.log(`Initializing the web worker for user: ${id}`);
worker.port.start();

/**
 * Recebe mensagem do Service Worker
 * @param {*} event 
 */
worker.port.onmessage = event => {
  switch (event.data.type) {
    case "WSState":
      webSocketState = event.data.state;
      break;
    case "message":
      handleMessageFromPort(event.data);
      break;
  }
};

/**
 * Transmite para todos os clientes
 */
const broadcastChannel = new BroadcastChannel("WebSocketChannel");
broadcastChannel.addEventListener("message", event => {
  switch (event.data.type) {
    case "WSState":
      webSocketState = event.data.state;
      break;
    case "message":
      handleBroadcast(event.data);
      break;
  }
});

// Ouça as transmissões do servidor
function handleBroadcast(data) {
  // console.log("Esta mensagem é para todos!");
  // console.log(data);
  // console.log(data.data.broadcast);
  elLista.innerHTML += `<li class="destaque">${data.data.broadcast}</li>`;
  elLista.scrollTo(0, 9999);
}

function handleMessageFromPort(data) {
  // console.log(`Esta mensagem destina-se apenas ao usuário com id: ${id}`);
  // console.log(data);
  elLista.innerHTML += `<li>${data.data.data} - ${data.data.from}</li>`;
  elLista.scrollTo(0, 9999);
}

// Use este método para enviar dados ao servidor.
function postMessageToWSServer(input) {
  if (webSocketState === WebSocket.CONNECTING) {
    console.log("Still connecting to the server, try again later!");
  } else if (
    webSocketState === WebSocket.CLOSING ||
    webSocketState === WebSocket.CLOSED
  ) {
    console.log("Connection Closed!");
  } else {
    worker.port.postMessage({
      // Inclua as informações do remetente como um uuid para obter a resposta
      from: id,
      data: input
    });
  }
}

function sendMessage(event) {
  event.preventDefault();
  // setInterval(() => postMessageToWSServer(input.value), 1000);
  postMessageToWSServer(input.value);
  input.value = "";
}
