const rooms = {};

const desconectarUsuario = ( room, id ) => {
    if(rooms[room].users){
        delete rooms[room].users[id];
    }
}

const existeUsuario = ( room, id ) => {
    return rooms[room].users[id];
}

const usuariosConectadosEnSala = ( room ) => {
    return Object.keys(rooms[room].users).length;
}

const turnoActual = ( room ) => {
    const keys = Object.values( rooms[room].users );
    return keys[rooms[room].turn].id;
}

const siguienteTurno = ( room ) => {
    const keys = Object.values( rooms[room].users );
    rooms[room].turn++;
    if( rooms[room].turn >= keys.length ){
        rooms[room].turn = 0;
    }
}

const buscarNuevoAdmin = ( room ) => {
    const keys = Object.keys( rooms[room].users );
    return keys[0];
}

module.exports = {
    buscarNuevoAdmin,
    desconectarUsuario,
    existeUsuario,
    rooms,
    siguienteTurno,
    turnoActual,
    usuariosConectadosEnSala,
}