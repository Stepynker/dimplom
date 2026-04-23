#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class Enemy {
public:
    Enemy(float x, float y, float speed);
    void update(float deltaTime, const sf::Vector2f& playerPos);
    void draw(sf::RenderWindow& window);
    sf::FloatRect getBounds() const;
    sf::Vector2f getPosition() const;

    bool takeDamage(int damage);
    int getCurrentHP() const { return currentHP; }
    int getMaxHP() const { return maxHP; }

    // === НОВОЕ: Для респавна ===
    bool isDead() const { return isDeadFlag; }
    void respawn(float x, float y);

private:
    sf::Sprite sprite;
    sf::Vector2f position;
    sf::Vector2f originalPos;  // Запоминаем где заспавнился
    float moveSpeed;

    int currentFrame;
    float animationTimer;
    float animationSpeed;

    static sf::Texture texIdle;
    static sf::Texture texJump;
    static bool texturesLoaded;

    int maxHP;
    int currentHP;

    // === НОВОЕ ===
    bool isDeadFlag;
    float respawnTimer;
    float respawnDelay;  // 10 секунд
};
class EnemyManager {
public:
    void spawnRandomEnemies(int count, float enemySpeed);
    void updateAll(float deltaTime, const sf::Vector2f& playerPos); // Новая функция
    void drawAll(sf::RenderWindow& window);
    const std::vector<Enemy>& getEnemies() const { return enemies; }

private:
    std::vector<Enemy> enemies;
};
