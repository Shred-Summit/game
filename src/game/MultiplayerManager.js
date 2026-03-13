import { getRtdb, rtdbRef, rtdbSet, rtdbGet, onValue, onDisconnect, rtdbRemove, rtdbUpdate } from './firebase.js';
import { RemotePlayer } from './RemotePlayer.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PARTY_SIZE = 4;
const SEND_RATE_MS = 100; // 10 Hz

export class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.rtdb = null;
    this.partyCode = null;
    this.isHost = false;
    this.members = {};          // { uid: { nickname, cosmetics } }
    this.remotePlayers = {};    // { uid: RemotePlayer }
    this.listeners = [];        // onValue unsubscribe functions
    this.sendInterval = null;
    this.lastSendTime = 0;
    this.active = false;
    this.terrainSeed = null;
    this._gameStarted = false;  // tracks if we're syncing game state
  }

  init() {
    this.rtdb = getRtdb();
  }

  // ---- PARTY LIFECYCLE ----

  async createParty() {
    if (!this.rtdb || !this.game.currentUser) return null;
    const code = this.generateCode();
    const uid = this.game.currentUser.uid;

    this.partyCode = code;
    this.isHost = true;
    this.terrainSeed = Math.floor(Math.random() * 999999);

    const partyRef = rtdbRef(this.rtdb, `parties/${code}`);
    await rtdbSet(partyRef, {
      host: uid,
      gameMode: 'park',
      chair: null,
      state: 'lobby',
      seed: this.terrainSeed,
    });

    await this.addSelfToParty();
    this.listenToParty();

    // Auto-cleanup on disconnect
    const memberRef = rtdbRef(this.rtdb, `parties/${code}/members/${uid}`);
    onDisconnect(memberRef).remove();

    this.active = true;
    return code;
  }

  async joinParty(code) {
    if (!this.rtdb || !this.game.currentUser) return { error: 'NOT SIGNED IN' };

    // Check if party exists
    const partyRef = rtdbRef(this.rtdb, `parties/${code}`);
    const snap = await rtdbGet(partyRef);
    if (!snap.exists()) return { error: 'PARTY NOT FOUND' };

    const data = snap.val();

    // Check member count
    const memberCount = data.members ? Object.keys(data.members).length : 0;
    if (memberCount >= MAX_PARTY_SIZE) return { error: 'PARTY IS FULL' };

    // Check if game already started
    if (data.state === 'playing') return { error: 'GAME IN PROGRESS' };

    this.partyCode = code;
    this.isHost = false;
    this.terrainSeed = data.seed || 12345;

    await this.addSelfToParty();
    this.listenToParty();

    // Auto-cleanup on disconnect
    const uid = this.game.currentUser.uid;
    const memberRef = rtdbRef(this.rtdb, `parties/${code}/members/${uid}`);
    onDisconnect(memberRef).remove();

    this.active = true;
    return { success: true };
  }

  async leaveParty() {
    if (!this.active || !this.partyCode) return;
    const uid = this.game.currentUser.uid;

    this.stopGameSync();

    // Unsubscribe all listeners
    for (const unsub of this.listeners) unsub();
    this.listeners = [];

    // Remove self from party
    const memberRef = rtdbRef(this.rtdb, `parties/${this.partyCode}/members/${uid}`);
    await rtdbRemove(memberRef);

    // If host, delete the whole party
    if (this.isHost) {
      const partyRef = rtdbRef(this.rtdb, `parties/${this.partyCode}`);
      await rtdbRemove(partyRef);
      // Also clean up game state
      const gameRef = rtdbRef(this.rtdb, `games/${this.partyCode}`);
      await rtdbRemove(gameRef);
    }

    this.partyCode = null;
    this.isHost = false;
    this.active = false;
    this.members = {};
    this.terrainSeed = null;
  }

  async addSelfToParty() {
    const uid = this.game.currentUser.uid;
    const nickname = this.game.nicknameManager.getNickname() || 'Player';
    const cosmetics = this.gatherCosmetics();

    const memberRef = rtdbRef(this.rtdb, `parties/${this.partyCode}/members/${uid}`);
    await rtdbSet(memberRef, { nickname, cosmetics });
  }

  gatherCosmetics() {
    const shop = this.game.shop;
    const player = this.game.player;

    const cosmetics = {
      equipType: this.game.selectedEquipment,
      stance: this.game.selectedStance,
      jacketColor: player.jacketMat.color.getHex(),
      pantsColor: player.pantsMat.color.getHex(),
      helmetColor: player.helmetMat.color.getHex(),
      boardColor: player.boardMat.color.getHex(),
    };

    // Resolve shop items for visual properties
    const jacketItem = shop.getEquippedItem('jacket');
    if (jacketItem) {
      cosmetics.jacketColor = jacketItem.color;
      cosmetics.jacketBrand = jacketItem.brand;
      cosmetics.jacketLegendary = !!jacketItem.legendary;
    }

    const pantsItem = shop.getEquippedItem('pants');
    if (pantsItem) {
      cosmetics.pantsColor = pantsItem.color;
      cosmetics.pantsBaggy = !!pantsItem.baggy;
      cosmetics.pantsLegendary = !!pantsItem.legendary;
    }

    const helmetItem = shop.getEquippedItem('helmet');
    if (helmetItem) {
      cosmetics.helmetColor = helmetItem.color;
      cosmetics.helmetHalo = helmetItem.id === 'legend-halo-helmet';
    }

    const boardItem = shop.getEquippedItem('board');
    if (boardItem) {
      cosmetics.boardColor = boardItem.color;
      cosmetics.boardItemId = boardItem.id;
      cosmetics.boardStats = boardItem.stats;
      cosmetics.bindingColor = boardItem.bindingColor || 0x222222;
    }

    return cosmetics;
  }

  // ---- PARTY LISTENER ----

  listenToParty() {
    const partyRef = rtdbRef(this.rtdb, `parties/${this.partyCode}`);

    const unsub = onValue(partyRef, (snap) => {
      if (!snap.exists()) {
        // Party deleted (host left)
        this.onPartyDissolved();
        return;
      }

      const data = snap.val();
      const uid = this.game.currentUser.uid;

      // Update members
      this.members = data.members || {};
      this.game.updatePartyMembers(this.members, data.host);

      // Non-host: detect game mode changes from host
      if (!this.isHost && data.gameMode) {
        this.game.gameMode = data.gameMode;
        this.game.backcountryChair = data.chair || null;
        if (data.parkId) this.game.parkId = data.parkId;
        this.terrainSeed = data.seed || 12345;
      }

      // Detect game start (state changed to 'playing')
      if (data.state === 'playing' && !this._gameStarted) {
        this.onGameStart();
      }
    });

    this.listeners.push(unsub);
  }

  onPartyDissolved() {
    this.stopGameSync();
    for (const unsub of this.listeners) unsub();
    this.listeners = [];
    this.partyCode = null;
    this.isHost = false;
    this.active = false;
    this.members = {};
    this.game.onPartyDissolved();
  }

  // ---- GAME START ----

  setGameMode(mode, chair, parkId = null) {
    if (!this.isHost || !this.partyCode) return;
    const partyRef = rtdbRef(this.rtdb, `parties/${this.partyCode}`);
    rtdbUpdate(partyRef, { gameMode: mode, chair: chair || null, parkId: parkId || null });
  }

  async startGame() {
    if (!this.isHost || !this.partyCode) return;
    // Write state = 'playing' — all clients detect via listener
    const partyRef = rtdbRef(this.rtdb, `parties/${this.partyCode}`);
    await rtdbUpdate(partyRef, { state: 'playing' });
  }

  onGameStart() {
    this._gameStarted = true;

    // Close lobby for ALL players (host included as a fallback)
    this.game.closeLobby();

    // Create remote players for all other members
    this.createRemotePlayers();

    // Start syncing player state and listen for remote updates
    this.startSendLoop();
    this.listenToGameState();
  }

  onLocalGameStarted() {
    // Called by Game.js after closeLobby() completes
    if (!this._gameStarted && this.isHost) {
      // Host starts the game
      this.startGame();
    }
  }

  // ---- REMOTE PLAYERS ----

  createRemotePlayers() {
    const uid = this.game.currentUser.uid;

    for (const [memberUid, memberData] of Object.entries(this.members)) {
      if (memberUid === uid) continue;
      if (this.remotePlayers[memberUid]) continue;

      const remote = new RemotePlayer(
        this.game.scene,
        memberUid,
        memberData.nickname || 'Player',
        memberData.cosmetics || {}
      );
      this.remotePlayers[memberUid] = remote;
    }
  }

  removeRemotePlayer(uid) {
    if (this.remotePlayers[uid]) {
      this.remotePlayers[uid].dispose();
      delete this.remotePlayers[uid];
    }
  }

  // ---- STATE SYNC ----

  startSendLoop() {
    if (this.sendInterval) return;
    this.sendInterval = setInterval(() => this.sendState(), SEND_RATE_MS);
  }

  stopSendLoop() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }

  sendState() {
    if (!this.rtdb || !this.game.currentUser || !this.partyCode) return;
    // Throttle to 10Hz
    const now = performance.now();
    if (now - this.lastSendTime < SEND_RATE_MS) return;
    this.lastSendTime = now;
    const p = this.game.player;
    const uid = this.game.currentUser.uid;
    const playerRef = rtdbRef(this.rtdb, `games/${this.partyCode}/players/${uid}`);

    rtdbSet(playerRef, {
      x: +p.position.x.toFixed(2),
      y: +p.position.y.toFixed(2),
      z: +p.position.z.toFixed(2),
      h: +p.heading.toFixed(3),
      tx: +p.trickRotation.x.toFixed(3),
      ty: +p.trickRotation.y.toFixed(3),
      tz: +p.trickRotation.z.toFixed(3),
      g: p.grounded ? 1 : 0,
      gr: p.grinding ? 1 : 0,
      gb: p.isGrabbing ? 1 : 0,
      gt: p.grabType || null,
      sw: p.isSwitch ? 1 : 0,
      cr: p.crashed ? 1 : 0,
      tm: p.tomahawking ? 1 : 0,
      el: +p.edgeLeanSmooth.toFixed(2),
      tk: p.isTucking ? 1 : 0,
      bs: p.boardslideType || null,
      ba: +(p.boardslideAngle || 0).toFixed(3),
      trick: this.game.tricks.lastTrickName || null,
    });
  }

  listenToGameState() {
    const uid = this.game.currentUser.uid;
    const playersRef = rtdbRef(this.rtdb, `games/${this.partyCode}/players`);

    const unsub = onValue(playersRef, (snap) => {
      if (!snap.exists()) return;
      const allPlayers = snap.val();

      for (const [playerUid, data] of Object.entries(allPlayers)) {
        if (playerUid === uid) continue;

        // Create remote player if needed (late joiner)
        if (!this.remotePlayers[playerUid] && this.members[playerUid]) {
          const memberData = this.members[playerUid];
          const remote = new RemotePlayer(
            this.game.scene,
            playerUid,
            memberData.nickname || 'Player',
            memberData.cosmetics || {}
          );
          this.remotePlayers[playerUid] = remote;
        }

        if (this.remotePlayers[playerUid]) {
          this.remotePlayers[playerUid].receiveState(data);
        }
      }

      // Remove remote players that are no longer in the game
      for (const existingUid of Object.keys(this.remotePlayers)) {
        if (!allPlayers[existingUid]) {
          this.removeRemotePlayer(existingUid);
        }
      }
    });

    this.listeners.push(unsub);
  }

  updateRemotePlayers(dt, camera) {
    for (const remote of Object.values(this.remotePlayers)) {
      remote.update(dt, camera);
    }
  }

  // ---- CLEANUP ----

  stopGameSync() {
    this.stopSendLoop();
    this._gameStarted = false;

    // Remove all remote players from scene
    for (const uid of Object.keys(this.remotePlayers)) {
      this.removeRemotePlayer(uid);
    }

    // Remove own game state
    if (this.rtdb && this.game.currentUser && this.partyCode) {
      const playerRef = rtdbRef(this.rtdb, `games/${this.partyCode}/players/${this.game.currentUser.uid}`);
      rtdbRemove(playerRef);
    }
  }

  returnToLobby() {
    this.stopGameSync();

    // Reset party state to lobby so others can rejoin
    if (this.isHost && this.partyCode) {
      const partyRef = rtdbRef(this.rtdb, `parties/${this.partyCode}`);
      rtdbUpdate(partyRef, { state: 'lobby', gameMode: 'park', chair: null, parkId: null });
    }
  }

  cleanup() {
    this.stopGameSync();
    for (const unsub of this.listeners) unsub();
    this.listeners = [];
  }

  // ---- UTILITY ----

  generateCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }
}
