const STORAGE_KEY = 'shred-summit-nickname';
const MIN_LENGTH = 3;
const MAX_LENGTH = 12;
const VALID_PATTERN = /^[A-Za-z0-9_-]+$/;

export class NicknameManager {
  constructor() {
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
    return true;
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
