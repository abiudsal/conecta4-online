const { 
    rooms, 
    desconectarUsuario, 
    existeUsuario, 
    siguienteTurno,
    turnoActual 
} = require('../shared/rooms');
const { v4: uuidv4 } = require('uuid');

//const { users } = require('../shared/users');
const boardControl = require('../models/board-control');
const { makeID } = require('../helpers/utils');

const colors = [
    {'color': '#4285f4', 'name': 'blue'},
    {'color': '#ea4335', 'name': 'red'},
    {'color': '#34a853', 'name': 'green'},
    {'color': '#fbbc05', 'name': 'yellow'},
]

const turn = (x, y, { id, room, rgb, nombre }, io) => {
    console.log('Se recibio', x, y);
    if( id === turnoActual( room )){
        console.log(' si -- o:');
        const nY = rooms[ room ].board.getNewY(x, y);   
        console.log(nY);
        if( nY !== -1 ){
            const playerWon = rooms[ room ].board.makeTurn(x, nY, rgb);                
            //console.log('A punto de emitir...', usuario.room, x, nY);
            io.to( room ).emit( 'turn', { x, y: nY, color: rgb });
            //console.log('Emitido');
    
            if( playerWon ){
                io.to( room ).emit('message', { msg: `Ganó el jugador ${ nombre }`});
                io.to( room ).emit('message', { msg: 'Nueva partida iniciará pronto...'} );

                let contador = 6;
                const timer = setInterval( () => {
                    contador--;

                    io.to( room ).emit( 'time-out', { timeout: true } );

                    if( contador < 0 ){
                        clearInterval( timer );
                        rooms[ room ].board.clear();
                        io.to( room ).emit( 'board', rooms[ room ].board.getBoard() );
                        rooms[ room ].turn = 0;

                        const idT = turnoActual( room );
                        io.to( room ).emit('current-turn', {
                            turn: idT,
                            usuarios: rooms[ room ].users
                        });
                        io.to( room ).emit( 'time-out', { timeout: false });
                    }
                    else{
                        io.to( room ).emit('message', { msg: `Nueva partida en ${contador}s`} );
                    }
                }, 1000 );
            }
            else{
                siguienteTurno( room );

                const idT = turnoActual( room );

                io.to( room ).emit('current-turn', {
                    turn: idT,
                    usuarios: rooms[ room ].users
                    //name: colors[t-1].name,
                    //color: colors[t-1].color
                });
            }
        }
        else{
            console.log( "Error")
        }
    }
    else{
        console.log('Not your turn');
    }
}

const socketController = async ( socket, io ) => {

    //const id = socket.handshake.headers['id'];
    let name = socket.handshake.headers['name'];
    let roomCode = socket.handshake.headers['room'];
    let id;
    let user;
    let num;

    id = uuidv4();

    console.log('Intento')

    if( roomCode !== 'no-room'){
        console.log(roomCode)
        if( !rooms[roomCode] ){
            return socket.disconnect();
        }

        if( rooms[roomCode].players === 4 ){
            return socket.disconnect();
        }        
    }
    else{
        roomCode = makeID( 6 );

        rooms[ roomCode ] = {
            admin: id,
            board: boardControl( 7 ),
            code: roomCode,
            players: 0,
            turn: 0,
            users: {}
        }
    }

    rooms[ roomCode ].players++;
    num = rooms[ roomCode ].players;

    const rgb = colors[ num - 1 ].color;
    const color = colors[ num - 1 ].name;

    if( !name || name.length < 2){
        name = color;
    }

    user = {
        id,
        nombre: name,
        room: roomCode,
        rgb,
        color
    }

    rooms[ roomCode ].users[ id ] = user;

    socket.join( roomCode );
    socket.emit( 'welcome', { room: roomCode, id, nombre:name, admin: rooms[ roomCode ].admin })
    io.to( roomCode ).emit('usuarios-activos', {
        usuarios: Object.values(rooms[ roomCode ].users),
        admin: rooms[ roomCode ].admin
    });

    // Eventos soportados para sockets

    socket.on( 'iniciar-juego', () => { 
        if( rooms[ roomCode ].admin === id ){
            if( rooms[ roomCode ].players >= 2 ){
                rooms[ roomCode ].status = 1
                io.to( roomCode ).emit( 'iniciar-juego');
                io.to( roomCode ).emit( 'board', rooms[ roomCode ].board.getBoard() );
            }
        }
    });

    socket.on( 'turn', ({ x, y }) => turn(x, y, user, io));

    socket.on( 'message', ({ msg }) => {
        io.to( roomCode ).emit( 'message', { msg, usuario: user } )
    } )

    socket.on('disconnect', () => {
        desconectarUsuario( roomCode, id );
        io.to( roomCode ).emit('usuarios-activos', {
            usuarios: Object.values(rooms[ roomCode ].users),
            admin: rooms[ roomCode ].admin
        });
        /*
        if( usuario.status === 0){
            
        }
        */
    });         
}

module.exports = {
    socketController
}