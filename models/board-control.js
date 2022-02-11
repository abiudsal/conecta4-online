const boardControl = ( size ) => {
    let board;
    const max = size*size;
    let contador = 0;

    const clear = () => {
        contador = 0;
        board = Array( size ).fill().map(() => Array(size).fill(null));
    }

    const getBoard = () => board;

    const getNewY = (x, y) => {
        let s = board[0].length-1;  
        //console.log( s )   
        while( size >= 0 ){
            if( board[s][x] === null ){
                return s;
            }
            s--;            
        }
        return -1;
    }

    const makeTurn = (x, y, color) => {        
        board[y][x] = color;
        contador++;
        return isWinningTurn(x, y);
    }

    const inBounds = ( x, y ) => {
        return y >= 0 && y < board.length && x >= 0 && x < board[y].length;
    }

    const numMatches = ( x, y, dx, dy ) => {
        let i = 1;
        while( inBounds( x + i*dx, y + i*dy) && board[y +i*dy][x + i*dx] === board[y][x] ){
            i++;            
        }
        return i - 1;
    }

    const isWinningTurn = (x, y) => {
        for(let dx = -1; dx < 2; dx++){
            for(let dy = -1; dy < 2; dy++){
                if(dx === 0 && dy === 0){
                    continue;
                }
                const count = numMatches(x, y, dx, dy) + numMatches(x, y, -dx, -dy) + 1;

                if( count >= 4){
                    return 1;
                }
            }
        }
        if( contador === max){
            return 2;
        }
        return 0;
    }

    clear();

    return {
        clear, getBoard, makeTurn, getNewY
    }
}


module.exports = boardControl;