export const entityMap = {
    PLAYERS: {
        baseRadius: 30,
        baseSpeed: 20,
        imgs: {
            'player-default': {
                name: 'player-default',
                src: './images/player-default.png'
            }
        }
    },
    MOBS: {
        '1': {
            radius: 15,
            speed: 10,
            imgSrc: './images/chick.png',
            imgName: 'mobs-chick'
        }
    },
    STRUCTURES: {
        '1': {
            radius: 500,
            imgSrc: './images/spawn-zone.png',
            imgName: 'structures-spawn-zone'
        },
        '2': {
            radius: 150,
            imgSrc: './images/rock1.png',
            imgName: 'structures-rock1'
        }
    }
};