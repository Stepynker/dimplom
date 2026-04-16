#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class Enemy {
public:
    // Конструктор теперь принимает скорость
    Enemy(float x, float y, float speed);

    // Обновление логики (вызывать каждый кадр)
    void update(float deltaTime, const sf::Vector2f& playerPos);

    void draw(sf::RenderWindow& window);
    sf::FloatRect getBounds() const;
    sf::Vector2f getPosition() const;

private:
    sf::Sprite sprite;
    sf::Vector2f position;
    float moveSpeed;

    // Анимация
    int currentFrame = 0;       // 0 - idle, 1 - jump
    float animationTimer = 0.f;
    float animationSpeed = 0.3f; // Скорость смены кадров

    // Текстуры (статические, общие для всех)
    static sf::Texture texIdle;
    static sf::Texture texJump;
    static bool texturesLoaded;
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
