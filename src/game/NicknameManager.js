const STORAGE_KEY = 'shred-summit-nickname';
const MIN_LENGTH = 3;
const MAX_LENGTH = 12;
const VALID_PATTERN = /^[A-Za-z0-9_-]+$/;

export class NicknameManager {
  constructor() {
    this.onSave = null; // cloud save callback
    this.nickname = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && this.validate(stored)) return stored;
    } catch (e) { /* ignore */ }
    return null;
  }

  save(name) {
    const cleaned = name.trim();
    if (!this.validate(cleaned)) return false;
    this.nickname = cleaned;
    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } catch (e) { /* ignore */ }
    if (this.onSave) this.onSave();
    return true;
  }

  setData(nickname) {
    if (nickname && this.validate(nickname)) {
      this.nickname = nickname;
      try { localStorage.setItem(STORAGE_KEY, nickname); } catch (e) { /* ignore */ }
    }
  }

  validate(name) {
    if (!name || name.length < MIN_LENGTH || name.length > MAX_LENGTH) return false;
    if (!VALID_PATTERN.test(name)) return false;
    return true;
  }

  hasNickname() {
    return this.nickname !== null;
  }

  getNickname() {
    return this.nickname;
  }
}
