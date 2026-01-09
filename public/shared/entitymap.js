// just some constants... doesn't really belong here.
export const TPS = {
    clientReal: 0,
    clientCapped: 75,
    server: 20
}

export const entityMap = {
    PLAYERS: {
        baseRadius: 30,
        baseMovementSpeed: 15,
        baseAttackCooldown: 750, // in milliseconds
        levels: {
            1: 0, // default
            2: 100, // warrior
            3: 250, // hitman
        },
        imgs: {
            '1': {
                name: 'player-default',
                src: './images/player/player-default.png'
            },
            '2': {
                name: 'player-warrior',
                src: './images/player/player-bushman.png'
            },
            '3': {
                name: 'player-hitman',
                src: './images/player/player-hitman.png'
            }
        }
    },
    SWORDS: {
        'imgs': {
            '1': {
                name: 'swords-sword1',
                src: './images/swords/sword1.png',
                swordLength: 125
            },
            '2': {
                name: 'swords-sword2',
                src: './images/swords/sword2.png',
                swordLength: 150
            },
            '3': {
                name: 'swords-sword3',
                src: './images/swords/sword3.png',
                swordLength: 175
            }
        }
            
    },
    MOBS: {
        '1': {
            radius: 25,
            speed: 10,
            baseHealth: 15,
            score: 10,
            imgProportions: [2, 2],
            imgSrc: './images/chick.png',
            imgName: 'mobs-chick'
        },
        '2': {
            radius: 40,
            speed: 7,
            baseHealth: 50,
            score: 25,
            alarmDuration: 5000, // in ms
            imgProportions: [3, 2], // pigs needs to wider than tall
            imgSrc: './images/pig.png',
            imgName: 'mobs-pig'
        },
        '3': {
            radius: 50,
            speed: 10,
            baseHealth: 150,
            score: 75,
            isHostile: true,
            alarmDuration: Number.MAX_SAFE_INTEGER, // hunt player until it dies, basically infinitely
            damage: 15,
            imgProportions: [3, 2], // cows needs to be wider than wall
            imgSrc: './images/cow.png',
            imgName: 'mobs-cow'
        }
    },
    PROJECTILES: {
        '1': {
            radius: 10,
            speed: 30,
            damage: 10,
            maxDistance: 100,
            knockbackStrength: 100,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash1.png',
            imgName: 'projectiles-airslash1'
        },
        '2': {
            radius: 10,
            speed: 30,
            damage: 15,
            maxDistance: 150,
            knockbackStrength: 100,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash2.png',
            imgName: 'projectiles-airslash2'
        },
        '3': {
            radius: 10,
            speed: 60,
            damage: 20,
            maxDistance: 175,
            knockbackStrength: 50,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash3.png',
            imgName: 'projectiles-airslash3'
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
        },
        '3': {
            radius: 120,
            noCollisions: true,
            imgSrc: './images/bush1.png',
            imgName: 'structures-bush1'
        }
    }
};