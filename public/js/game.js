// Referencias HTML
const divBoard = document.querySelector('#board');
const divRoomElection = document.querySelector('#room-election');
const divWaitingRoom = document.querySelector('#waiting-room');
const divMessage = document.querySelector('#message');
const divChat = document.querySelector('.chat-container');
const chat = document.querySelector('.chat');
const chatButton = document.querySelector('.chat-title');
const divOnlineU = document.querySelector('.online-users');
const divSidebar = document.querySelector('.sidebar');
const divContent = document.querySelector('.content');
const divGameBoard = document.querySelector('.game-board');
const divMainTitle = document.querySelector('.main-screen');

const turnContainer = document.querySelector('#turn');
const gameStateContainer = document.querySelector('#game-state-msg');
const gameStateText = document.querySelector('#game-state-text');
const roomContainer = document.querySelector('.room-container');
const nameContainer = document.querySelector('.name-container');

const txtName = document.querySelector('#txtName');
const txtCode = document.querySelector('#txtCode');
const txtChat = document.querySelector('#txtChat');

const nameText = document.querySelector('#name-text');
const roomText = document.querySelector('#room-text');
const roomTextMsg = document.querySelector('#code');

const messageText = document.querySelector('.message-text');

const btnPlay = document.querySelector('#btnPlay');
const btnJoin = document.querySelector('#btnJoin');
const btnCreate = document.querySelector('#btnCreate');
const btnStart = document.querySelector('#btnStart');
const btnMessage = document.querySelector('#btnMessage');

const turnText = document.querySelector('#turn-text');
const numPlayers = document.querySelector('#num-players');
const canvas = document.querySelector('canvas');
const chatMessages = document.querySelector("#chat-messages");
const newMessageIndicator = document.querySelector("#new-message-indicator");
const listUsers = document.querySelector("#online-users-list");

const btnsCopy = document.getElementsByClassName('copy');


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
let playing = false;

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
        nombre = `<span style="color: ${usuarios[turn].rgb};font-weight: bold">${usuarios[turn].nombre} (Tú)</span>`;
    }
    else{
        nombre = `<span style="color: ${usuarios[turn].rgb};font-weight: bold">${usuarios[turn].nombre}</span>`;
    }

    turnText.innerHTML = nombre;
}

const setBlocked = ({ timeout }) => {
    blocked = timeout;  
    if( blocked ){
        turnContainer.classList.remove('show');
        gameStateContainer.classList.add('show');        
    }  
    else{
        turnContainer.classList.add('show');
        gameStateContainer.classList.remove('show');
    }
}

const mostrarMensaje = ({ msg, usuario }) => {
    let mensaje = ''
    let mostrar = '';
    if( usuario ){
        if (usuario.id === id){
            mensaje = `<span style="color: ${usuario.rgb};font-weight: bold">Tú:</span> ${msg}`;
            //newMessages.style.display = 'none';
            mostrar = 'none';
        }
        else{
            mensaje = `<span style="color: ${usuario.rgb};font-weight: bold">${usuario.nombre}:</span> ${msg}`;
            //newMessages.style.display = '';
        }
    }
    else{
        mensaje = `<i>${msg}</i>`;
    }    
    newMessageIndicator.style.display = mostrar;
    //console.log( mensaje );
    const msgLi = document.createElement('li');
    
    msgLi.innerHTML = mensaje;
    chatMessages.appendChild( msgLi );
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const mostrarMensajeEstado = ({ victory, msg }) => {
    if( msg){
        location.reload();
    }
    else{
        let mensaje;
        if( victory ){
            mensaje = `
                <b style="color: ${victory.rgb}">${victory.nombre}</b> ganó
                <br>
            `;
        }
        else{
            mensaje = `
                Empate
                <br>
            `
        }   
        gameStateText.innerHTML = mensaje
    }
}

const enviarMensaje = ({ keyCode }) => {    
    //newMessages.style.display = 'none';
    const mensaje = txtChat.value;
    if( keyCode === 13 && mensaje.length > 0){

        socket.emit( 'message', {msg: mensaje} )

        txtChat.value = '';
    }

    newMessageIndicator.style.display = 'none';
}

const setNombre = () => {
    nombre = txtName.value;
    nameText.innerHTML = `<b>${nombre}</b>`;
    
    divRoomElection.classList.add('show');

    roomContainer.classList.remove('show');

    if(nombre.length < 2){
        nameContainer.classList.remove('show');
    }
    else{
        nameContainer.classList.add('show');
    }
    //divRoomElection.style.display = 'block';
    //divRoomElection.style.opacity = '1';

    divGameBoard.classList.add('show');
    divSidebar.classList.add('show');
    divMainTitle.classList.remove('show');

    //divContent.classList.remove('full');
}

const mostrarTablero = () => {
    playing = true;
    divWaitingRoom.classList.remove('show');
    divBoard.classList.add('show');
    turnContainer.classList.add('show');
}

const dibujarUsuarios = ({ usuarios, admin }) => {
    numPlayers.innerHTML = usuarios.length;
    listUsers.innerHTML = '';
    usuarios.forEach( element => {
        const msgLi = document.createElement('li');
        msgLi.innerHTML = `${element.id === admin ? "<i class='bx bxs-crown'></i>" : ""} <span style="color: ${element.rgb}">${element.nombre}`;
        listUsers.appendChild( msgLi );
    } );   

    if (id !== admin){
        btnStart.style.display = 'none';
    }
    else{
        btnStart.style.display = '';
    }
}

const errorMessage = ( msg ) => {
    divWaitingRoom.classList.remove('show');
    divRoomElection.classList.remove('show');
    divBoard.classList.remove('show');
    divMessage.classList.add('show');

    messageText.innerHTML = `Error: ${msg}`;
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
        roomText.innerHTML = `<b>${room}</b>`;;
        roomTextMsg.innerHTML = room;

        //divRoomElection.style.display = 'none';
        //divMessage.style.display = 'block';
        divRoomElection.classList.remove('show');
        divWaitingRoom.classList.add('show')
        roomContainer.classList.add('show');
        nameContainer.classList.add('show');        

        nombre = payload.nombre;
        nameText.innerHTML = `<b>${nombre}</b>`;


        divChat.classList.add('show');
        divOnlineU.classList.add('show');        
    });

    socket.on( 'board', reset);
    socket.on( 'current-turn', establecerTurnoActual);
    socket.on( 'error-full-room', () => errorMessage('sala llena'));
    socket.on( 'error-no-room', () => errorMessage('la sala no existe'));
    socket.on( 'error-not-enough-players', () => errorMessage('No hay suficientes jugadores'));
    socket.on( 'iniciar-juego', mostrarTablero);
    socket.on( 'message', mostrarMensaje);
    socket.on( 'game-status-message', mostrarMensajeEstado);
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

const regresar = () => {
    divMessage.classList.remove('show');

    if( playing === true ){
        divWaitingRoom.classList.add('show');                
        playing = false;
    }
    else{
        divRoomElection.classList.add('show');        
    }
}

const init = () => {
    //divChat.style.display = 'none';
    //divOnlineU.style.display = 'none';
    //divRoomElection.style.display = 'none';
    //divRoomElection.style.opacity = '0';

    //divMessage.style.display = 'none'

    //divSidebar.classList.add('full');
    //divContent.classList.add('full');
}


init();

canvas.addEventListener( 'click', onClick );
txtChat.addEventListener('keyup', enviarMensaje);
btnPlay.addEventListener( 'click', setNombre);
btnJoin.addEventListener( 'click', conectarseSala);
btnCreate.addEventListener( 'click', crearSala);
btnStart.addEventListener( 'click', iniciarJuego);
btnMessage.addEventListener( 'click', regresar);
chatButton.addEventListener( 'click', () => {
    chat.classList.toggle('minimized');
    if( !chat.classList.contains( 'minimized' ) ){
        newMessageIndicator.style.display = 'none';
    }
    
});
Array.from( btnsCopy )
.forEach( element => {
    element.addEventListener( 'click', () => {
        console.log(room);
        navigator.clipboard.writeText(room);
    })
});