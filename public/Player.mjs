class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score || 0;
    this.id = id;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  collision(item) {
    const size = 20;
    return (
      this.x < item.x + size &&
      this.x + size > item.x &&
      this.y < item.y + size &&
      this.y + size > item.y
    );
  }

  calculateRank(arr) {
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((p) => p.id === this.id) + 1;
    return `Rank: ${rank}/${arr.length}`;
  }
}

export default Player;