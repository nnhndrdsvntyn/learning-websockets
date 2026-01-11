// just some constants... doesn't really belong here.
export const TPS = {
    clientReal: 0,
    clientCapped: 75,
    server: 20
}

export const entityMap = {
    otherImgs: {},
    PLAYERS: {
        baseRadius: 30,
        baseMovementSpeed: 15,
        baseAttackCooldown: 750, // in milliseconds
        levels: {
            1: 0, // default
            2: 100, // warrior
            3: 250, // hitman
            4: 400, // alien man
            5: 700, // pirate
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
            },
            '4': {
                name: 'player-alienman',
                src: './images/player/player-alienman.png'
            },
            '5': {
                name: 'player-pirate',
                src: './images/player/player-pirate.png'
            }
        }
    },
    SWORDS: {
        'imgs': {
            '0': {
                name: 'swords-wipsword',
                src: './images/swords/wipsword.png',
                swordLength: 205
            },
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
            },
            '4': {
                name: 'swords-sword4',
                src: './images/swords/sword4.png',
                swordLength: 190
            }
        }
            
    },
    MOBS: {
        '1': {
            radius: 25,
            speed: 7,
            baseHealth: 15,
            score: 10,
            alarmDuration: 5000, // in ms
            deathAction: (killer) => { killer.addScore(10) }, // has to match with score.
            imgProportions: [2, 2],
            imgSrc: './images/mobs/chick.png',
            imgName: 'mobs-chick'
        },
        '2': {
            radius: 40,
            speed: 7,
            baseHealth: 50,
            score: 25,
            alarmDuration: 5000, // in ms
            deathAction: (killer) => { killer.addScore(25) }, // has to match with score.
            imgProportions: [3, 2], // pigs needs to wider than tall
            imgSrc: './images/mobs/pig.png',
            imgName: 'mobs-pig'
        },
        '3': {
            radius: 50,
            speed: 7,
            baseHealth: 150,
            score: 75,
            isNeutral: true,
            alarmDuration: Number.MAX_SAFE_INTEGER, // hunt player until it dies, basically infinitely
            deathAction: (killer) => { killer.addScore(75) }, // has to match with score.
            damage: 15,
            imgProportions: [3, 2], // cows needs to be wider than wall
            imgSrc: './images/mobs/cow.png',
            imgName: 'mobs-cow'
        },
        '4': {
            radius: 50,
            speed: 7,
            baseHealth: 20,
            score: 10,
            alarmDuration: 10000,
            deathAction: (killer) => {
                killer.addScore(10) // has to match with score
                killer.health = Math.min(killer.health + 20, killer.maxHealth) // 20 because it has to match with this mobs baseHealth
            },
            imgProportions: [2, 2],
            imgSrc: './images/mobs/hearty.png',
            imgName: 'mobs-hearty'
        },
    },
    PROJECTILES: {
        '1': {
            radius: 10,
            speed: 30,
            damage: 10,
            maxDistance: 125,
            knockbackStrength: 100,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash1.png',
            imgName: 'projectiles-airslash1'
        },
        '2': {
            radius: 10,
            speed: 35,
            damage: 15,
            maxDistance: 150,
            knockbackStrength: 100,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash2.png',
            imgName: 'projectiles-airslash2'
        },
        '3': {
            radius: 10,
            speed: 40,
            damage: 20,
            maxDistance: 175,
            knockbackStrength: 50,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash3.png',
            imgName: 'projectiles-airslash3'
        },
        '4': {
            radius: 10,
            speed: 40,
            damage: 20,
            maxDistance: 190,
            knockbackStrength: 50,
            imgProportions: [1, 10],
            imgSrc: './images/projectiles/airslash4.png',
            imgName: 'projectiles-airslash4'
        }
    },
    STRUCTURES: {
        '1': {
            radius: 500,
            isSafeZone: true,
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