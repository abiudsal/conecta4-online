const express = require('express');
const cors = require('cors');


const { socketController } = require('../sockets/controller');

class Server {

    constructor() {
        this.app  = express();
        this.port = process.env.PORT;
        this.server = require('http').createServer( this.app );
        this.io = require('socket.io')(this.server);

        this.paths = {
            connect: '/api/connect'
        }

        // Middlewares
        this.middlewares();

        // Rutas
        this.routes();

        // Sockets
        this.sockets();
    }


    middlewares() {

        // CORS
        //this.app.use( cors() );

        // Lectura y parseo del body
        this.app.use( express.json() );

        // Directorio Público
        this.app.use( express.static('public') );
    }

    routes() {        
        //this.app.use( this.paths.connect, require('../routes/connect'));                
    }

    sockets(){
        this.io.on('connection', ( socket ) => socketController(socket, this.io));
    }

    listen() {
        this.server.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }

}




module.exports = Server;
