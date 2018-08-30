const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT  = 8080

let dataOrders = []
ioConsumen = io.of('/consumen')
ioDepot = io.of('/depot')

app.get('/consumen', function(req, res) {
	res.sendFile('/consumen.html',{ root: __dirname })
})

app.get('/depot', function(req, res) {
	res.sendFile('/depot.html',{ root: __dirname })
})

app.get('/', function(req, res){
	res.send('url are /consumen or /depot');
}

ioConsumen.on('connection', function(socket){
	
	socket.on('join', consumenId => {
		socket.consumenId = consumenId;
		socket.join(consumenId);
		socket.emit('joinedRoom');
	})

	socket.on('leave', () => {
		socket.leave(socket.consumenId);
		socket.consumenId = undefined;
		socket.emit('leavedRoom')
	})

	socket.on('getHistory', () => {
		const  { consumenId } =  socket
		let dataConsumen = [];
		if (consumenId){
			dataConsumen = dataOrders.filter(dataOrder => {
				return dataOrder.consumenId === consumenId
			})
		}
		socket.emit('showHistory', dataConsumen)
	})

	socket.on('orderGallon', ( { depotId, qty = 0 } ) => {
		const  { consumenId } =  socket
		depotId = Number(depotId)
		qty = Number(qty)
		if (depotId && consumenId){
			const data = {
				consumenId,
				depotId,
				qty,
				createAt: new Date().toISOString()
			}
			dataOrders.push(data)
			ioDepot.to(depotId).emit('newOrderGallon', data);
			ioConsumen.in(consumenId).emit('orderGallonSuccess', data)
		}
	})
});

ioDepot.on('connection', function(socket){
	socket.on('join', depotId =>{
		socket.depotId = depotId;
		socket.join(depotId);
		socket.emit('joinedRoom');
	})

	socket.on('leave', () => {
		socket.leave(socket.depotId)
		socket.depotId = undefined
		socket.emit('leavedRoom')
	})

	socket.on('getHistory', () => {
		const { depotId } = socket
		let dataDepot = [];
		if (depotId){
			dataDepot = dataOrders.filter(dataOrder => {
				return dataOrder.depotId === depotId
			})
		}
		socket.emit('showHistory', dataDepot)
	})
});

http.listen(PORT,'0.0.0.0', function(){
	console.log(`listening on *:${PORT}`)
})
