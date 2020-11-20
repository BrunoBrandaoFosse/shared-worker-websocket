// Abra uma conexão. Isso é comum
// conexão. Isso será aberto apenas uma vez.
const ws = new WebSocket("ws://localhost:3001");

// Create a broadcast channel to notify about state changes
const broadcastChannel = new BroadcastChannel("WebSocketChannel");

// Mapeamento para rastrear as portas. Você pode pensar em portas como
// meios, podemos nos comunicar de e para as guias.
// Este é um mapa de um uuid atribuído a cada contexto (guia)
// para seu porto. Isso é necessário porque a API de porta não tem
// qualquer identificador que possamos usar para identificar mensagens vindas dele.
const idToPortMap = {};

// Deixe todos os contextos conectados (guias) saberem sobre mudanças de estado
ws.onopen = () => {
    console.log("%cCONEXÃO ABERTA.", "font-size:25px;font-weight:bold;color:green;");
    broadcastChannel.postMessage({ type: "WSState", state: ws.readyState });
}

ws.onclose = () => {
    console.log("%cCONEXÃO FECHADA.", "font-size:25px;font-weight:bold;color:yellow;");
    broadcastChannel.postMessage({ type: "WSState", state: ws.readyState });
}

// Quando recebemos dados do servidor.
ws.onmessage = ({ data }) => {
    console.log("[STEP 1]");
    // Constrói o objeto a ser passado aos manipuladores
    const parsedData = { data: JSON.parse(data), type: "message" };
    if (!parsedData.data.from) {
        // Transmita para todos os contextos (guias). Isto é porque
        // nenhum ID específico foi definido no campo from.
        // Estamos usando este campo para identificar qual guia enviada a mensagem
        broadcastChannel.postMessage(parsedData);
    } else {
        // Obtenha a porta para postar usando o uuid, ou seja, enviar para
        // guia esperada apenas.
        idToPortMap[parsedData.data.from].postMessage(parsedData);
    }
};

// Manipulador de eventos chamado quando uma guia tenta se conectar a este trabalhador.
onconnect = e => {
    console.log("[STEP 2]");
    const port = e.ports[0];
    port.onmessage = msg => {
        console.log("[STEP 3]");
        // Colete informações da porta no mapa
        idToPortMap[msg.data.from] = port;

        // Encaminhe esta mensagem para a conexão ws.
        ws.send(JSON.stringify({ data: msg.data }));
    };
    
    // Precisamos disso para notificar o contexto recém-conectado para saber
    // o estado atual da conexão WS.
    port.postMessage({ state: ws.readyState, type: "WSState" });
};
