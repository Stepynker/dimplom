#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include <string>

class Boss {
public:
    enum BossType { BOSS_FIRE, BOSS_SLIME };

    Boss();
    bool init(BossType type, sf::Vector2f spawnPos);
    void update(float deltaTime, sf::Vector2f playerPos);
    void draw(sf::RenderWindow& window);
    void takeDamage(int damage);
    void reset(sf::Vector2f spawnPos);

    // Геттеры
    bool isAlive() const { return alive; }
    int getHP() const { return currentHP; }
    int getMaxHP() const { return maxHP; }
    sf::FloatRect getBounds() const { return sprite.getGlobalBounds(); }
    sf::Vector2f getPosition() const { return sprite.getPosition(); }
    int getXPReward() const { return xpReward; }
    bool isDead() const { return !alive && !respawning; } // Мёртв и не в процессе респавна

private:
    sf::Sprite sprite;
    BossType type;

    int maxHP;
    int currentHP;
    bool alive;
    bool respawning;  // <-- НОВОЕ: флаг респавна
    int xpReward;

    // Анимация
    std::vector<sf::Texture> stayTextures;
    int currentFrame;
    float animTimer;
    float animSpeed;

    float moveSpeed;
    float damageCooldown;

    // === РЕСПАВН ===
    float respawnTimer;      // Текущий таймер
    float respawnDelay;      // Задержка до респавна (секунды)
    sf::Vector2f spawnPos;   // Точка спавна

    void loadTextures(BossType type);
};
