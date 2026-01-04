// just some constants... doesn't really belong here.
export const TPS = {
    client: 60,
    server: 20
}

export const entityMap = {
    PLAYERS: {
        baseRadius: 30,
        baseMovementSpeed: 20,
        baseAttackCooldown: 250, // in milliseconds
        imgs: {
            'player-default': {
                name: 'player-default',
                src: './images/player-default.png'
            }
        }
    },
    MOBS: {
        '1': {
            radius: 25,
            speed: 10,
            imgProportions: [2, 2],
            imgSrc: './images/chick.png',
            imgName: 'mobs-chick'
        },
        '2': {
            radius: 40,
            speed: 7,
            imgProportions: [3, 2], // pigs needs to wider than tall
            imgSrc: './images/pig.png',
            imgName: 'mobs-pig'
        },
        '3': {
            radius: 50,
            speed: 7,
            imgProportions: [3, 2], // cows needs to be wider than wall
            imgSrc: './images/cow.png',
            imgName: 'mobs-cow'
        }
    },
    PROJECTILES: {
        '1': {
            radius: 10,
            speed: 30,
            knockbackStrength: 100,
            imgSrc: './images/projectiles/pebble.png',
            imgName: 'projectiles-pebble'
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