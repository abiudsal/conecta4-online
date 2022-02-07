// Referencias HTML
const divBoard = document.querySelector('#board');
const divRoomElection = document.querySelector('#room-election');
const divMessage = document.querySelector('#message');
const divChat = document.querySelector('.chat-container');
const chat = document.querySelector('.chat');
const chatButton = document.querySelector('.chat-title');
const divOnlineU = document.querySelector('.online-users');
const divSidebar = document.querySelector('.sidebar');
const divContent = document.querySelector('.content');
const divGameBoard = document.querySelector('.game-board');

const turnContainer = document.querySelector('#turn-indicator');

const txtName = document.querySelector('#txtName');
const txtCode = document.querySelector('#txtCode');
const txtChat = document.querySelector('#txtChat');

const nameText = document.querySelector('#name-text');
const roomText = document.querySelector('#room-text');
const roomTextMsg = document.querySelector('#code');

const btnPlay = document.querySelector('#btnPlay');
const btnJoin = document.querySelector('#btnJoin');
const btnCreate = document.querySelector('#btnCreate');
const btnStart = document.querySelector('#btnStart');

const turnText = document.querySelector('#turn-text');
const canvas = document.querySelector('canvas');
const chatMessages = document.querySelector("#chat-messages");
const listUsers = document.querySelector("#online-users-list");


const getBoard = ( canvas, numCells = 20 ) => {
    const ctx = canvas.getContext('2d');
    const cellSize = Math.floor(canvas.width/numCells);
    const radio = cellSize*(0.46);
    const halfCellSize = cellSize/2;
    const endAngle = 2 * Math.PI;

    const fillCell = ( x, y, color ) => {
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.arc( x*cellSize + halfCellSize, y*cellSize + halfCellSize, radio, 0, endAngle, false );

        ctx.fill();
    }

    const drawGrid = () => {
        ctx.strokeStyle = '#AAA'
        ctx.beginPath();
        for (let i = 0; i< numCells+1; i++){
            ctx.moveTo( i*cellSize, 0 );
            ctx.lineTo( i*cellSize, cellSize*numCells );
            ctx.moveTo( 0, i*cellSize);
            ctx.lineTo( cellSize*numCells, i*cellSize );
        }
        ctx.stroke();
    }

    const clear = () => {
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
    }

    const renderBoard = ( board = [] ) => {
        board.forEach( (row, y) => {
            row.forEach( (color, x) => {
                color && fillCell(x, y, color);
            })
        })
    }

    const reset = (board) => {
        clear();
        drawGrid();
        renderBoard(board);
    }

    const getCellCoordinates = ( x, y ) => {
        return {
            x: Math.floor( x/cellSize ),
            y: Math.floor( y/cellSize )
        }
    }

    return { fillCell, reset, getCellCoordinates };
}

let socket;
let id;
let room;
let nombre;
let size = 7
let blocked = false;

const { fillCell, reset, getCellCoordinates } = getBoard( canvas, size );

const getClickCoordinates = ( element, ev ) => {
    const { top, left } = element.getBoundingClientRect();
    const { clientX, clientY } = ev;

    return {
        x: clientX - left,
        y: clientY - top
    }
}

const onClick = (e) => {
    if( !blocked ){
        const { x, y } = getClickCoordinates(canvas, e);    
        socket.emit('turn', getCellCoordinates(x, y));
    }
}

const turn = (x, y, color) => {
    //console.log('Pintando ', x, y, color);
    fillCell(x, y, color);
}

const establecerTurnoActual = ( { turn, usuarios } ) => {
    let nombre = '';
    if( turn === id ){
        nombre = `<span style="color: ${usuarios[turn].rgb};font-weight: bold">${usuarios[turn].nombre}(Tú)</span>`;
    }
    else{
        nombre = `<span style="color: ${usuarios[turn].rgb};font-weight: bold">${usuarios[turn].nombre}</span>`;
    }

    turnText.innerHTML = nombre;
}

const setBlocked = ({ timeout }) => {
    blocked = timeout;  
    if( blocked ){
        turnContainer.style.display = 'none';
    }  
    else{
        turnContainer.style.display = '';
    }
}

const mostrarMensaje = ({ msg, usuario }) => {
    let mensaje = ''
    if( usuario ){
        if (usuario.id === id){
            mensaje = `<span style="color: ${usuario.rgb};font-weight: bold">Tú:</span> ${msg}`;
            //newMessages.style.display = 'none';
        }
        else{
            mensaje = `<span style="color: ${usuario.rgb};font-weight: bold">${usuario.nombre}:</span> ${msg}`;
            //newMessages.style.display = '';
        }
    }
    else{
        mensaje = msg;
    }    
    //console.log( mensaje );
    const msgLi = document.createElement('li');
    
    msgLi.innerHTML = mensaje;
    chatMessages.appendChild( msgLi );
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const enviarMensaje = ({ keyCode }) => {
    //newMessages.style.display = 'none';
    const mensaje = txtChat.value;
    if( keyCode === 13 && mensaje.length > 0){

        socket.emit( 'message', {msg: mensaje} )

        txtChat.value = '';
    }
}

const setNombre = () => {
    nombre = txtName.value;
    nameText.innerHTML = nombre;
    
    divRoomElection.classList.add('show');
    //divRoomElection.style.display = 'block';
    //divRoomElection.style.opacity = '1';
    divGameBoard.classList.add('show');
    divSidebar.classList.remove('full');
    divContent.classList.remove('full');
}

const mostrarTablero = () => {
    divMessage.classList.remove('show');
    divBoard.classList.add('show');
}

const dibujarUsuarios = ({ usuarios }) => {
    listUsers.innerHTML = '';
    usuarios.forEach( element => {
        const msgLi = document.createElement('li');
        msgLi.innerHTML = element.nombre;
        listUsers.appendChild( msgLi );
    } )   
    
    //chatMessages.scrollTop = chatMessages.scrollHeight;

    //newMessages.style.display = (usuario.id === id) ? 'none' : '';
}

const comunicacionSockets = () => {
    socket = io({
        'extraHeaders': {
            'name': nombre,
            'room': room,
        }
    });

    // Conexiones de sockets
    socket.on( 'connect', () => {
        console.log('Socket online');
    });

    socket.on( 'welcome', ( payload ) => {
        room = payload.room;
        id = payload.id;
        roomText.innerHTML = room;
        roomTextMsg.innerHTML = room;

        //divRoomElection.style.display = 'none';
        //divMessage.style.display = 'block';
        divRoomElection.classList.remove('show');
        divMessage.classList.add('show')
        setTimeout(() => {
            //divRoomElection.style.display = 'none';
            //divMessage.style.display = 'block';
        }, 1000); 
        divChat.style.display = 'block';
        divOnlineU.style.display = 'block';

        if (id !== payload.admin){
            btnStart.style.display = 'none';
        }
    });

    socket.on( 'board', reset);
    socket.on( 'current-turn', establecerTurnoActual);
    socket.on( 'iniciar-juego', mostrarTablero);
    socket.on( 'message', mostrarMensaje);
    socket.on( 'time-out', setBlocked);
    socket.on( 'turn', ({ x, y, color }) => {
        turn(x, y, color);
        console.log(x, y, color)
    });
    socket.on( 'usuarios-activos', dibujarUsuarios);

    socket.on('disconnect', () => {
        console.log('Socket offline');
    }); 
}

const crearSala = () => {
    room = 'no-room';
    comunicacionSockets();
}

const conectarseSala = () => {
    room = txtCode.value;
    comunicacionSockets();
}

const iniciarJuego = () => {
    socket.emit( 'iniciar-juego');
}

const init = () => {
    divChat.style.display = 'none';
    divOnlineU.style.display = 'none';
    //divRoomElection.style.display = 'none';
    //divRoomElection.style.opacity = '0';

    //divMessage.style.display = 'none'

    divSidebar.classList.add('full');
    divContent.classList.add('full');
}


init();

canvas.addEventListener( 'click', onClick );
txtChat.addEventListener('keyup', enviarMensaje);
btnPlay.addEventListener( 'click', setNombre);
btnJoin.addEventListener( 'click', conectarseSala);
btnCreate.addEventListener( 'click', crearSala);
btnStart.addEventListener( 'click', iniciarJuego);
chatButton.addEventListener( 'click', () => {
    chat.classList.toggle('minimized');
})