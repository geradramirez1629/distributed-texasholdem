// server-side game logic for a texas hold 'em game
const Deck = require('./deck.js');
const Player = require('./player.js');
const Card = require('./card.js');

const Game = function (name, host) {
	this.deck = new Deck();
	this.host = host;
	this.players = [];
	this.status = 0;
	this.cardsPerPlayer = 2;
	this.currentlyPlayed = 0;
	this.gameWinner = null;
	this.gameName = name;
	this.roundNum = 0;
	this.roundData = { 'bigBlind': '', 'smallBlind': '', 'turn': '', 'bets': [] };
	this.community = [];

	const constructor = function () {
	}(this);

	this.startNewRound = () => {
		let bigBlindIndex, smallBlindIndex;
		this.roundData.bets = [];
		if (this.roundNum == 0) {
			bigBlindIndex = Math.floor(Math.random() * this.players.length);
			smallBlindIndex = (bigBlindIndex + 1 >= this.players.length) ? 0 : bigBlindIndex + 1;
			console.log(bigBlindIndex);
			console.log(smallBlindIndex);
			for (let i = 0; i < this.players.length; i++) {
				if (i === bigBlindIndex) {
					this.players[i].setBlind('Big Blind');
				} else if (i === smallBlindIndex) {
					this.players[i].setBlind('Small Blind');
				} else {
					this.players[i].setBlind('');
				}
			}
			const goFirstIndex = (bigBlindIndex - 1 < 0) ? (this.players.length - 1) : bigBlindIndex - 1;
			this.roundData.bigBlind = this.players[bigBlindIndex].getUsername();
			this.roundData.smallBlind = this.players[smallBlindIndex].getUsername();
			this.roundData.turn = this.players[goFirstIndex].getUsername();
			this.players[goFirstIndex].setStatus('Their Turn');
			//preflop left of big blind and then other stages are small blind
			//then positions move to the left
		} else {
			bigBlindIndex = (roundData.bigBlind - 1 < 0) ? (this.players.length - 1) : roundData.bigBlind - 1;
			smallBlindIndex = (roundData.smallBlind - 1 < 0) ? (this.players.length - 1) : roundData.smallBlind - 1;
			for (let i = 0; i < this.players.length; i++) {
				if (i === bigBlindIndex) {
					this.players[i].setBlind('Big Blind');
				} else if (i === smallBlindIndex) {
					this.players[i].setBlind('Small Blind');
				} else {
					this.players[i].setBlind('');
				}
			}
			this.roundData.bigBlind = this.players[bigBlindIndex].getUsername();
			this.roundData.smallBlind = this.players[smallBlindIndex].getUsername();
			this.roundData.turn = this.players[smallBlindIndex].getUsername();
			this.players[smallBlindIndex].setStatus('Their Turn');

		}
		// handle big and small blind initial forced bets
		if (this.players[bigBlindIndex].money == 0) {
			this.players[bigBlindIndex].setStatus('Bankrupt');
			this.roundData.bets.push([{ player: this.players[bigBlindIndex].getUsername(), bet: 'Buy-in' }]);
		} else {
			if (this.players[bigBlindIndex].money < 2) {
				this.players[bigBlindIndex].money = 0;
				this.players[bigBlindIndex].setStatus('All-In');
				this.roundData.bets.push([{ player: this.players[bigBlindIndex].getUsername(), bet: 1 }]);
			} else {
				this.players[bigBlindIndex].money = this.players[bigBlindIndex].money - 2;
				this.roundData.bets.push([{ player: this.players[bigBlindIndex].getUsername(), bet: 2 }]);
			}
		}
		if (this.players[smallBlindIndex].money == 0) {
			this.players[smallBlindIndex].setStatus('Bankrupt');
		} else if (this.players[smallBlindIndex].money == 1) {
			this.players[smallBlindIndex].money = 0;
			this.roundData.bets[0].push({ player: this.players[smallBlindIndex].getUsername(), bet: 1 });
			this.players[smallBlindIndex].setStatus('All-In');
		} else {
			this.players[smallBlindIndex].money = this.players[smallBlindIndex].money - 1;
			this.roundData.bets[0].push({ player: this.players[smallBlindIndex].getUsername(), bet: 1 });
		}

		this.roundNum++;
		this.roundData.stageName = 'Pre-Flop';

		this.rerender();
	};

	this.rerender = () => {
		let playersData = [];
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			playersData.push({ 'username': this.players[pn].getUsername(), 'status': this.players[pn].getStatus(), 'blind': this.players[pn].getBlind(), 'money': this.players[pn].getMoney() })
		}
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			this.players[pn].emit('rerender', { 'bets': this.roundData.bets, 'username': this.players[pn].getUsername(), 'round': this.roundNum, 'stage': this.getStageName(), 'pot': this.getCurrentPot(), 'players': playersData, 'myMoney': this.players[pn].getMoney(), 'myStatus': this.players[pn].getStatus(), 'myBlind': this.players[pn].getBlind() });
		}
	}

	this.getCurrentPot = () => {
		if (this.roundData.bets == undefined || this.roundData.bets.length == 0) return 0;
		else return this.roundData.bets[this.roundData.bets.length - 1].reduce((acc, curr) => (curr.bet != 'Buy-in' || curr.bet == 'Fold') ? acc + curr.bet : acc + 0, 0);
	}

	this.getStageName = () => {
		if (this.roundData.bets.length == 1) {
			return 'Pre-Flop';
		} else if (this.roundData.bets.length == 2) {
			return 'Flop';
		} else if (this.roundData.bets.length == 3) {
			return 'Turn';
		} else if (this.roundData.bets.length == 4) {
			return 'River';
		} else {
			return 'Error';
		}
	}

	this.moveOntoNextPlayer = () => {
		if (this.status == 0) {
			this.status = 1;

		} else {
			this.status = 0;
			this.startNewRound();
		}
	}

	this.setCardsPerPlayer = (numCards) => {
		this.cardsPerPlayer = numCards;
	};

	this.getHostName = () => { return this.host; };

	this.getPlayersArray = () => { return this.players.map(p => { return p.getUsername(); }) };

	this.getCode = () => { return this.gameName; };

	this.addPlayer = (playerName, socket) => {
		this.players.push(new Player(playerName, socket));
	};

	this.getNumPlayers = () => {
		return this.players.length;
	};

	this.startGame = () => {
		this.dealCards();
		this.emitPlayers('startGame', { 'players': this.players.map(p => { return p.username; }) });
		this.startNewRound();
		this.printPretty();
	};

	this.dealCards = () => {
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			for (let i = 0; i < this.cardsPerPlayer; i++) {
				this.players[pn].addCard(this.deck.dealRandomCard());
			}
		}

		this.refreshCards();
	};

	this.refreshCards = function () {
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			this.players[pn].cards.sort((a, b) => {
				return a.compare(b);
			});

			this.players[pn].emit("dealt", { 'username': this.players[pn].getUsername(), 'cards': this.players[pn].cards, 'players': this.players.map((p) => { return p.username; }) });
		}
	};

	this.emitPlayers = (eventName, payload) => {
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			this.players[pn].emit(eventName, payload);
		}
	};

	this.findPlayer = (socketId) => {
		for (let pn = 0; pn < this.getNumPlayers(); pn++) {
			if (this.players[pn].socket.id === socketId) {
				return this.players[pn];
			}
		}
		return { socket: { id: 0 } };
	};

	this.printPretty = () => {
		console.log('----------------- GAME');
		console.log('Status', this.status);
		console.log('Players:');
		this.players.map(p => p.printPretty());
		console.log('----------------- GAME');
	};

};

module.exports = Game;