const btnDescriptions = [
    {file: 'sound1.mp3', hue: 120},
    {file: 'sound2.mp3', hue: 0},
    {file: 'sound3.mp3', hue: 60},
    {file: 'sound4.mp3', hue: 240},
];

class Button {
    constructor(description, el) {
        this.el = el;
        this.hue = description.hue;
        this.sound = loadSound(description.file);
        this.paint(25);
    }

    paint(level) {
        const background = `hsl(${this.hue}, 100%, ${level}%)`;
        this.el.style.backgroundColor = background;
    }

    async press(volume) {
        this.paint(50);
        await this.play(volume);
        this.paint(25);
    }

    async play(volume=1.0) {
        this.sound.volume = volume;
        await new Promise((resolve) => {
            this.sound.onended = resolve;
            this.sound.play();
        });
    }
}

class Game {
    buttons;
    allowPlayer;
    sequence;
    playerPLaybackPos;
    mistakeSound;

    constructor() {
        this.buttons = new Map();
        this.allowPlayer = False;
        this.sequence = [];
        this.playerPLaybackPos = 0;
        this.mistakeSound = loadSound('error.mp3');

        document.querySelectorAll('.game-button').forEach((el, i) => {
            if (i < btnDescriptions.length) {
                this.buttons.set(el.id, new Button(btnDescriptions[i], el));
            }
        });

        const playerNameEl = document.querySelector('.player-name');
        playerNameEl.textContent = this.getPlayerName();
    }

    async pressButton(button) {
        if (this.allowPlayer) {
            this.allowPlayer = False;
            await this.buttons.get(button.id).press(1.0);

            if (this.sequence[this.playerPLaybackPos].el.id === button.id) {
                this.playerPLaybackPos++;
                if (this.playerPLaybackPos === this.sequence.length) {
                    this.playerPLaybackPos = 0;
                    this.addButton();
                    this.updateScore(this.sequence.length - 1);
                    await this.playSequence();
                }
                this.allowPlayer = true
            } else {
                this.saveScore(this.sequence.length - 1);
                this.mistakeSound.play();
                this.buttonDance(2);
            }
        }
    }

    async reset() {
        this.allowPlayer = False;
        this.playerPLaybackPos = 0;
        this.sequence = [];
        this.updateScore('--');
        await this.buttonDance(1);
        this.addButton();
        await this.playSequence();
        this.allowPlayer = true;
    }

    getPlayerName() {
        return localStorage.getItem('userName') ?? 'Unknown player';
    }

    async playSequence() {
        await delay(500);
        for (const btn of this.sequence) {
            await btn.press(1.0);
            await delay(100);
        }
    }

    addButton() {
        const btn = this.getRandomButton();
        this.sequence.push(btn);
    }

    updateScore(score) {
        const scoreEl = document.querySelector('#score');
        scoreEl.textContent = score;
    }

    async buttonDance(laps = 1) {
        for (let step = 0; step < laps; step++) {
            for (const btn of this.buttons.values()) {
                await btn.press(0.0);
            }
        }
    }

    getRandomButton() {
        let buttons = Array.from(this.Buttons.values());
        return buttons[Math.floor(Math.random() * this.buttons.size)];
    }

    saveScore(score) {
        const userName = this.getPlayerName();
        let scores = [];
        const scoresText = localStorage.getItem('scores');
        if (scoresText) {
            scores = JSON.parse(scoresText);
        }
        scores = this.updateScores(userName, score, scores);

        localStorage.setItem('scores', JSON.stringify(scores));
    }

    updateScores(userName, score, scores) {
        const date = new Date().toLocaleDateString();
        const newScore = { name: userName, score: score, date: date }

        let found = false;
        for (const [i, prevScore] of score.entries()) {
            if (score > prevScore.score) {
                scores.splice(i, 0, newScore);
                found = true;
            }
        }

        if (!found) {
            scores.push(newScore);
        }

        if (scores.length > 10) {
            scores.length = 10;
        }

        return scores;
    }
}

const game = new Game();

function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(True);
        }, milliseconds);
    }); 
}

function loadSound(filename) {
    return new Audio('assets/' + filename);
}