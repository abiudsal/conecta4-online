const { 
    rooms, 
    desconectarUsuario, 
    existeUsuario, 
    siguienteTurno,
    turnoActual, 
    buscarNuevoAdmin
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

const getColorRBG = ( roomCode ) => {
    const values = Object.values( rooms[ roomCode ].users );
    let color, rgb

    for ( let i = 0; i< colors.length; i++){
        console.log( colors[i] );
        let existe = false;
    
        for ( let j=0; j< values.length; j++ ){
            if( colors[i].name === values[j].color ){
                existe = true;
                break;
            }
        }
    
        if( !existe ){            
            return {
                color: colors[i].name,
                rgb: colors[i].color
            }
        }
    }

    return {}
}

const turn = (x, y, user, io) => {
    const { id, room, rgb, nombre } = user;
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
    
            if( playerWon === 0 ){
                siguienteTurno( room );

                const idT = turnoActual( room );
                io.to( room ).emit('current-turn', {
                    turn: idT,
                    usuarios: rooms[ room ].users
                });                
            }
            else{
                if( playerWon === 1 ){
                    io.to( room ).emit('message', { msg: `Ganó el jugador ${ nombre }`});
                    io.to( room ).emit('game-status-message', { victory: user } );
                }
                else{
                    io.to( room ).emit('message', { msg: `Empate`});
                    io.to( room ).emit('game-status-message', {} );
                }

                io.to( room ).emit('message', { msg: 'Nueva partida iniciará pronto...'} );
                io.to( room ).emit( 'time-out', { timeout: true } );

                let contador = 6;
                const timer = setInterval( () => {
                    contador--;


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

    console.log('Intento de conexión')

    if( roomCode !== 'no-room'){
        console.log('    ',roomCode)
        if( !rooms[roomCode] ){
            socket.emit( 'error-no-room' );
            return socket.disconnect();
        }

        if( rooms[ roomCode ].players === 4 ){
            socket.emit( 'error-full-room' );
            return socket.disconnect();
        }        
    }
    else{
        console.log( '    ', 'Creando sala' );
        roomCode = makeID( 6 );

        rooms[ roomCode ] = {
            admin: id,
            board: boardControl( 7 ),
            code: roomCode,
            players: 0,
            turn: 0,
            users: {},
            status: 0
        }
    }

    rooms[ roomCode ].players++;
    num = rooms[ roomCode ].players;

    const { rgb, color } = getColorRBG( roomCode );

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
    io.to( roomCode ).emit( 'message', { msg: `¡Bienvenido, ${name}! ` } );

    if( rooms[ roomCode ].status === 1 ){
        io.to( roomCode ).emit( 'iniciar-juego');
        io.to( roomCode ).emit( 'board', rooms[ roomCode ].board.getBoard() );
    }

    // Eventos soportados para sockets

    socket.on( 'iniciar-juego', () => { 
        if( rooms[ roomCode ].admin === id ){
            if( rooms[ roomCode ].players >= 2 ){
                rooms[ roomCode ].status = 1

                const idT = turnoActual( roomCode );
                io.to( roomCode ).emit('current-turn', {
                    turn: idT,
                    usuarios: rooms[ roomCode ].users
                });

                io.to( roomCode ).emit( 'iniciar-juego');
                io.to( roomCode ).emit( 'board', rooms[ roomCode ].board.getBoard() );

                rooms[ roomCode ].status = 1;
            }
        }
    });

    socket.on( 'turn', ({ x, y }) => turn(x, y, user, io));

    socket.on( 'message', ({ msg }) => {
        io.to( roomCode ).emit( 'message', { msg, usuario: user } )
    } )

    socket.on('disconnect', () => {
        desconectarUsuario( roomCode, id );
        rooms[ roomCode ].players--;

        if( rooms[ roomCode ].players === 0 ){
            console.log( 'limpiando sala', roomCode )
            delete rooms[ roomCode ];            
            return socket.disconnect();
        }
        
        if( rooms[ roomCode ].admin === id ){
            rooms[ roomCode ].admin = buscarNuevoAdmin( roomCode );
            console.log('Cambio de admin');
        }

        io.to( roomCode ).emit( 'message', { msg: `${name} ha salido de la partida` } );
        io.to( roomCode ).emit('usuarios-activos', {
            usuarios: Object.values(rooms[ roomCode ].users),
            admin: rooms[ roomCode ].admin
        });

        if( rooms[ roomCode ].status === 1 ){
            if( rooms[ roomCode ].players === 1 ){
                console.log( 'Deteniendo juego' );
                io.to( roomCode ).emit( 'error-not-enough-players' );
                io.to( roomCode ).emit('message', { msg: `Esperando por más jugadores`});
                rooms[ roomCode ].board.clear();
                rooms[ roomCode ].turn = 0;
                rooms[ roomCode ].status = 0;
            }
        }

    });         
}

module.exports = {
    socketController
}